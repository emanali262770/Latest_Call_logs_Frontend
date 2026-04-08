import { useEffect, useMemo, useState } from 'react';
import { DragDropProvider, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/react';
import {
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Folder,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Card';
import { AccessControlShell, Modal } from '@/src/components/access-control/AccessControlShell';
import TableLoader from '@/src/components/ui/TableLoader';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useAccessControl } from '@/src/context/AccessControlContext';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { cn } from '@/src/lib/utils';

const ASSIGNED_DROP_ID = 'assigned-group-permissions';
const ACTION_SEQUENCE = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'ASSIGN'];
const TREE_LEVEL_SEQUENCE = {
  ROOT: ['DASHBOARD', 'EMPLOYEES', 'ACCESS CONTROL', 'STOCK', 'SETUP', 'SETTINGS'],
  'ACCESS CONTROL': ['GROUPS', 'USERS', 'PERMISSIONS'],
  STOCK: ['ITEM DEFINITION'],
  SETUP: ['EMPLOYEE SETUP', 'ITEMS'],
  'EMPLOYEE SETUP': ['DEPARTMENTS', 'DESIGNATIONS', 'EMPLOYEE TYPES', 'DUTY SHIFTS', 'BANKS'],
  ITEMS: ['ITEM TYPES', 'CATEGORIES', 'SUB CATEGORIES', 'MANUFACTURERS', 'UNITS', 'LOCATIONS', 'SUPPLIERS'],
  EMPLOYEES: ['EMPLOYEE'],
};
const EMPLOYEE_SETUP_SUBMODULES = new Set(['DEPARTMENT', 'DESIGNATION', 'EMPLOYEE_TYPE', 'DUTY_SHIFT', 'BANK']);
const ITEM_SETUP_SUBMODULES = new Set([
  'ITEM_TYPE',
  'ITEM_TYPES',
  'CATEGORY',
  'CATEGORIES',
  'SUB_CATEGORY',
  'SUB_CATEGORIES',
  'MANUFACTURER',
  'MANUFACTURERS',
  'UNIT',
  'UNITS',
  'LOCATION',
  'LOCATIONS',
  'SUPPLIER',
  'SUPPLIERS',
]);
const LABEL_OVERRIDES = {
  EMPLOYEE: 'Employee',
  EMPLOYEES: 'Employees',
  ACCESS: 'Access',
  USERS: 'Users',
  GROUPS: 'Groups',
  PERMISSIONS: 'Permissions',
  SETUP: 'Setup',
  STOCK: 'Stock',
  SETTINGS: 'Settings',
  DEPARTMENT: 'Departments',
  DESIGNATION: 'Designations',
  EMPLOYEE_TYPE: 'Employee Types',
  DUTY_SHIFT: 'Duty Shifts',
  BANK: 'Banks',
  ITEM_TYPE: 'Item Types',
  ITEM_TYPES: 'Item Types',
  CATEGORY: 'Categories',
  CATEGORIES: 'Categories',
  SUB_CATEGORY: 'Sub Categories',
  SUB_CATEGORIES: 'Sub Categories',
  MANUFACTURER: 'Manufacturers',
  MANUFACTURERS: 'Manufacturers',
  UNIT: 'Units',
  UNITS: 'Units',
  LOCATION: 'Locations',
  LOCATIONS: 'Locations',
  SUPPLIER: 'Suppliers',
  SUPPLIERS: 'Suppliers',
  ITEM_DEFINITION: 'Item Definition',
  ITEM_DEFINITIONS: 'Item Definition',
};

function arePermissionListsEqual(left = [], right = []) {
  if (left.length !== right.length) return false;

  const leftSorted = [...left].sort((a, b) => String(a).localeCompare(String(b)));
  const rightSorted = [...right].sort((a, b) => String(a).localeCompare(String(b)));

  return leftSorted.every((permissionId, index) => permissionId === rightSorted[index]);
}

function countLeaves(node) {
  if (!node.children?.length) return 1;
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

function collectLeafIds(node) {
  if (!node.children?.length) return [node.id];

  return node.children.flatMap((child) => collectLeafIds(child));
}

function filterTree(nodes, query) {
  return nodes
    .map((node) => {
      if (!node.children?.length) {
        return !query || node.label.toLowerCase().includes(query) ? node : null;
      }

      const children = filterTree(node.children, query);
      const matchesSelf = !query || node.label.toLowerCase().includes(query);

      if (matchesSelf || children.length) {
        return { ...node, children };
      }

      return null;
    })
    .filter(Boolean);
}

function getSequenceIndex(sequence, value) {
  const index = sequence.indexOf(String(value || '').toUpperCase());
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function formatTreeLabel(value = '') {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return '';
  if (LABEL_OVERRIDES[normalized]) return LABEL_OVERRIDES[normalized];

  return normalized
    .split('_')
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

function normalizeTreeToken(value = '') {
  return String(value || '').trim().toUpperCase();
}

function getPermissionTreePath(permission) {
  const moduleName = normalizeTreeToken(permission.module);
  const subModuleName = normalizeTreeToken(permission.subModule);

  if (moduleName === 'EMPLOYEE' && subModuleName === 'EMPLOYEE') {
    return ['EMPLOYEES', 'EMPLOYEE'];
  }

  if (moduleName === 'EMPLOYEE' && EMPLOYEE_SETUP_SUBMODULES.has(subModuleName)) {
    return ['SETUP', 'EMPLOYEE SETUP', subModuleName];
  }

  if (moduleName === 'ACCESS') {
    return ['ACCESS CONTROL', subModuleName];
  }

  if (moduleName === 'INVENTORY' && ['ITEM_DEFINITION', 'ITEM_DEFINITIONS'].includes(subModuleName)) {
    return ['STOCK', 'ITEM_DEFINITION'];
  }

  if (ITEM_SETUP_SUBMODULES.has(subModuleName) || moduleName === 'ITEMS' || moduleName === 'STOCK_SETUP') {
    return ['SETUP', 'ITEMS', subModuleName];
  }

  if (moduleName === 'STOCK' && subModuleName) {
    return ['STOCK', subModuleName];
  }

  return subModuleName ? [moduleName, subModuleName] : [moduleName];
}

function compareTreeLabels(left, right, parentLabel = 'ROOT') {
  const sequence = TREE_LEVEL_SEQUENCE[normalizeTreeToken(parentLabel)] || [];
  const leftKey = normalizeTreeToken(left);
  const rightKey = normalizeTreeToken(right);
  const sequenceDiff = getSequenceIndex(sequence, leftKey) - getSequenceIndex(sequence, rightKey);
  if (sequenceDiff !== 0) return sequenceDiff;

  return formatTreeLabel(leftKey).localeCompare(formatTreeLabel(rightKey));
}

function buildPermissionTree(items) {
  const rootMap = new Map();

  const ensureBranchNode = (map, parentPath, rawLabel) => {
    const key = normalizeTreeToken(rawLabel);
    if (!map.has(key)) {
      map.set(key, {
        id: [...parentPath, key.toLowerCase()].join('-'),
        label: formatTreeLabel(key),
        rawLabel: key,
        children: [],
        childMap: new Map(),
      });
    }

    return map.get(key);
  };

  items.forEach((permission) => {
    const path = getPermissionTreePath(permission);
    let currentMap = rootMap;
    const parentPath = [];

    path.forEach((segment) => {
      const node = ensureBranchNode(currentMap, parentPath, segment);
      parentPath.push(normalizeTreeToken(segment));
      currentMap = node.childMap;
    });

    const leafContainer = ensureBranchNode(currentMap, parentPath, '__LEAVES__');
    if (!leafContainer.isLeafBucket) {
      leafContainer.isLeafBucket = true;
      leafContainer.children = [];
    }

    leafContainer.children.push({
      id: permission.id,
      label: permission.action,
      key: permission.key,
      description: permission.description,
    });
  });

  const finalizeNodes = (map, parentLabel = 'ROOT') =>
    Array.from(map.values())
      .filter((node) => node.rawLabel !== '__LEAVES__')
      .sort((left, right) => compareTreeLabels(left.rawLabel, right.rawLabel, parentLabel))
      .map((node) => {
        const leafBucket = node.childMap.get('__LEAVES__');
        const nestedChildren = finalizeNodes(node.childMap, node.rawLabel);
        const leafChildren = leafBucket
          ? [...leafBucket.children].sort((left, right) => {
              const actionDiff =
                getSequenceIndex(ACTION_SEQUENCE, left.label) - getSequenceIndex(ACTION_SEQUENCE, right.label);
              if (actionDiff !== 0) return actionDiff;
              return String(left.label || '').localeCompare(String(right.label || ''));
            })
          : [];

        return {
          id: node.id,
          label: node.label,
          children: [...nestedChildren, ...leafChildren],
        };
      });

  return finalizeNodes(rootMap);
}

function AssignedDropPanel({ children }) {
  const { ref, isDropTarget } = useDroppable({
    id: ASSIGNED_DROP_ID,
    data: { panel: 'assigned' },
  });

  return (
    <div
      ref={ref}
      className={cn(
        'min-h-0 flex-1 overflow-auto rounded-[1.4rem] border bg-white p-3 transition-all duration-200',
        isDropTarget
          ? 'border-brand bg-brand-light/20 shadow-[inset_0_0_0_2px_rgba(79,70,229,0.14)]'
          : 'border-dashed border-brand/25',
      )}
    >
      {children}
    </div>
  );
}

function DraggablePermissionLeaf({ node, isAssigned, onAssign, onRemove, panel, activeId }) {
  const draggableId = `permission:${node.id}`;
  const isAvailablePanel = panel === 'available';
  const { ref, isDragging } = useDraggable({
    id: draggableId,
    disabled: !isAvailablePanel,
    data: {
      type: 'permission',
      permissionId: node.id,
      label: node.label,
      panel,
    },
  });

  return (
    <div
      ref={ref}
      className={cn(
        'flex min-h-8 items-center gap-2 px-1 py-1 text-[11px] transition-all',
        isAvailablePanel
          ? 'cursor-grab'
          : 'border-gray-100 bg-white',
        isDragging || activeId === draggableId ? 'opacity-40' : 'opacity-100'
      )}
    >
      <input
        type="checkbox"
        checked={isAssigned}
        onChange={() => (isAvailablePanel ? onAssign(node.id) : onRemove(node.id))}
        className="h-4 w-4 rounded accent-[var(--color-brand)]"
      />
      <span className="font-semibold tracking-tight text-gray-700">{node.label}</span>
    </div>
  );
}

function TreeLeafRow({ node, isAssigned, onAssign, onRemove, panel, activeId, depth = 0 }) {
  return (
    <li className={cn('relative list-none pl-5', panel === 'assigned' && 'py-1')}>
      <span className="pointer-events-none absolute left-0 top-4 h-px w-3 bg-gray-200/90" />
      <div className={cn(panel === 'assigned' && 'rounded-xl border border-gray-100 px-2')}>
        <DraggablePermissionLeaf
          node={node}
          isAssigned={isAssigned}
          onAssign={onAssign}
          onRemove={onRemove}
          panel={panel}
          activeId={activeId}
          depth={depth}
        />
      </div>
    </li>
  );
}

function TreeNodeCheckbox({ checked, indeterminate, onChange }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(element) => {
        if (element) {
          element.indeterminate = indeterminate;
        }
      }}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        event.stopPropagation();
        onChange(event);
      }}
      className="h-4 w-4 rounded accent-[var(--color-brand)]"
    />
  );
}

function DraggableTreeBranch({
  node,
  isOpen,
  depth,
  count,
  checked,
  indeterminate,
  onToggle,
  onCheckChange,
  panel,
  activeId,
  permissionIds,
}) {
  const draggableId = `permission-group:${node.id}`;
  const isAvailablePanel = panel === 'available';
  const { ref, isDragging } = useDraggable({
    id: draggableId,
    disabled: !isAvailablePanel,
    data: {
      type: 'permission-group',
      permissionIds,
      label: node.label,
      panel,
      count,
    },
  });

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex w-full items-center gap-1.5 rounded-xl py-1 text-left hover:bg-gray-50',
        isAvailablePanel && 'cursor-grab',
        (isDragging || activeId === draggableId) && 'opacity-40',
      )}
      style={{ paddingLeft: depth > 0 ? '20px' : '0px' }}
    >
      {depth > 0 ? (
        <span className="pointer-events-none absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-gray-200/90" />
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle(node.id);
        }}
        className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-gray-400" />
        ) : (
          <ChevronRight className="h-3 w-3 text-gray-400" />
        )}
      </button>
      <TreeNodeCheckbox
        checked={checked}
        indeterminate={indeterminate}
        onChange={onCheckChange}
      />
      <Folder className="h-[14px] w-[14px] text-brand" />
      <span className="text-[11px] font-bold tracking-tight text-gray-800">{node.label}</span>
      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-gray-500">
        {count}
      </span>
    </div>
  );
}

function PermissionTree({
  nodes,
  expanded,
  onToggle,
  assignedSet,
  panel,
  onAssign,
  onRemove,
  activeId,
  depth = 0,
}) {
  return (
    <ul className="m-0 p-0">
      {nodes.map((node) => {
        const isLeaf = !node.children?.length;
        const isOpen = expanded[node.id] ?? true;
        const isAssigned = assignedSet.has(node.id);
        const descendantLeafIds = isLeaf ? [node.id] : collectLeafIds(node);
        const assignedLeafCount = descendantLeafIds.filter((id) => assignedSet.has(id)).length;
        const isNodeChecked = assignedLeafCount > 0 && assignedLeafCount === descendantLeafIds.length;
        const isNodeIndeterminate = assignedLeafCount > 0 && assignedLeafCount < descendantLeafIds.length;

        const handleNodeCheckboxChange = () => {
          const shouldAssign = !isNodeChecked;

          descendantLeafIds.forEach((permissionId) => {
            if (shouldAssign) {
              if (!assignedSet.has(permissionId)) {
                onAssign(permissionId);
              }
              return;
            }

            if (assignedSet.has(permissionId)) {
              onRemove(permissionId);
            }
          });
        };

        if (isLeaf) {
          return (
            <TreeLeafRow
              key={node.id}
                node={node}
                isAssigned={isAssigned}
                onAssign={onAssign}
                onRemove={onRemove}
                panel={panel}
                activeId={activeId}
              depth={depth}
            />
          );
        }

        return (
          <li key={node.id} className="relative list-none">
            <DraggableTreeBranch
              node={node}
              isOpen={isOpen}
              depth={depth}
              count={countLeaves(node)}
              checked={isNodeChecked}
              indeterminate={isNodeIndeterminate}
              onToggle={onToggle}
              onCheckChange={handleNodeCheckboxChange}
              panel={panel}
              activeId={activeId}
              permissionIds={descendantLeafIds}
            />

            {isOpen ? (
              <div className="relative ml-[7px] pl-[13px]">
                <span className="pointer-events-none absolute left-0 top-0 bottom-0 w-px bg-gray-200/90" />
                <PermissionTree
                  nodes={node.children}
                  expanded={expanded}
                  onToggle={onToggle}
                  assignedSet={assignedSet}
                  panel={panel}
                  onAssign={onAssign}
                  onRemove={onRemove}
                  activeId={activeId}
                  depth={depth + 1}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function DragPermissionOverlay({ activeDragItem }) {
  return (
    <DragOverlay dropAnimation={null}>
      {() =>
        activeDragItem ? (
          <div className="min-w-56 rounded-2xl border-2 border-brand bg-white px-5 py-3 text-lg font-bold tracking-tight text-gray-800 shadow-2xl shadow-brand/20">
            {activeDragItem.label}
            {activeDragItem.count > 1 ? ` (${activeDragItem.count})` : ''}
          </div>
        ) : null
      }
    </DragOverlay>
  );
}

export default function Groups() {
  const {
    groups,
    createGroup,
    loadGroups,
    loadGroupPermissions,
    savedGroupPermissions,
    groupPermissionsByGroup,
    groupPermissionsLoadingByGroup,
    groupPermissionsErrorByGroup,
    assignPermissionToGroup,
    removePermissionFromGroup,
    saveGroupPermissions,
  } = useAccessControl();
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [availableExpanded, setAvailableExpanded] = useState({});
  const [assignedExpanded, setAssignedExpanded] = useState({});
  const [availableSearch, setAvailableSearch] = useState('');
  const [assignedSearch, setAssignedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [createError, setCreateError] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);
  const [animatedAssignedCount, setAnimatedAssignedCount] = useState(0);
  const [availableCollapsed, setAvailableCollapsed] = useState(false);
  const [assignedCollapsed, setAssignedCollapsed] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const { toasts, toast, removeToast } = useThemeToast();

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || groups[0];
  const currentGroupPermissions = groupPermissionsByGroup[selectedGroup?.id] || {
    availableItems: [],
    assignedItems: [],
    savedAssignedIds: [],
  };
  const filterHidden = (items) => items.filter((p) => !(p.action === 'CREATE' && p.key === 'ACCESS.PERMISSIONS.CREATE'));
  const availableSourceTree = useMemo(
    () => buildPermissionTree(filterHidden(currentGroupPermissions.availableItems)),
    [currentGroupPermissions.availableItems],
  );
  const assignedSourceTree = useMemo(
    () => buildPermissionTree(filterHidden(currentGroupPermissions.assignedItems)),
    [currentGroupPermissions.assignedItems],
  );
  const assignedSet = useMemo(
    () => new Set(currentGroupPermissions.assignedItems.map((permission) => permission.id)),
    [currentGroupPermissions.assignedItems],
  );
  const savedPermissions = savedGroupPermissions[selectedGroup?.id] || [];
  const groupPermissionsLoading = groupPermissionsLoadingByGroup[selectedGroup?.id] ?? false;
  const groupPermissionsError = groupPermissionsErrorByGroup[selectedGroup?.id] || '';
  const hasUnsavedChanges = useMemo(
    () => !arePermissionListsEqual(currentGroupPermissions.assignedItems.map((item) => item.id), savedPermissions),
    [currentGroupPermissions.assignedItems, savedPermissions],
  );

  const availableTree = useMemo(
    () => filterTree(availableSourceTree, availableSearch.trim().toLowerCase()),
    [availableSearch, availableSourceTree],
  );

  const assignedTree = useMemo(
    () => filterTree(assignedSourceTree, assignedSearch.trim().toLowerCase()),
    [assignedSearch, assignedSourceTree],
  );

  useEffect(() => {
    const nextCount = currentGroupPermissions.assignedItems.length || 0;

    if (animatedAssignedCount === nextCount) return;

    const interval = window.setInterval(() => {
      setAnimatedAssignedCount((current) => {
        if (current === nextCount) {
          window.clearInterval(interval);
          return current;
        }

        if (current < nextCount) {
          const updated = current + 1;
          if (updated >= nextCount) {
            window.clearInterval(interval);
            return nextCount;
          }
          return updated;
        }

        const updated = current - 1;
        if (updated <= nextCount) {
          window.clearInterval(interval);
          return nextCount;
        }
        return updated;
      });
    }, 60);

    return () => window.clearInterval(interval);
  }, [animatedAssignedCount, currentGroupPermissions.assignedItems.length]);

  const handleToggle = (id) => {
    setAvailableExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const handleAssignedToggle = (id) => {
    setAssignedExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const setTreeExpansion = (nodes, collapsed, setState) => {
    const nextState = {};

    const walk = (items) => {
      items.forEach((item) => {
        if (item.children?.length) {
          nextState[item.id] = !collapsed;
          walk(item.children);
        }
      });
    };

    walk(nodes);
    setState((prev) => ({ ...prev, ...nextState }));
  };

  const handleAvailableCollapseToggle = () => {
    const next = !availableCollapsed;
    setAvailableCollapsed(next);
    setTreeExpansion(availableSourceTree, next, setAvailableExpanded);
  };

  const handleAssignedCollapseToggle = () => {
    const next = !assignedCollapsed;
    setAssignedCollapsed(next);
    setTreeExpansion(assignedSourceTree, next, setAssignedExpanded);
  };

  useEffect(() => {
    if (!selectedGroupId && groups[0]?.id) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroup?.id) return;
    loadGroupPermissions(selectedGroup.id).catch(() => {});
  }, [loadGroupPermissions, selectedGroup?.id]);

  const closeCreateModal = () => {
    setIsModalOpen(false);
    setForm({ name: '', description: '' });
    setCreateError('');
  };

  const handleCreateGroup = async () => {
    if (!form.name.trim()) {
      setCreateError('Group name is required.');
      return;
    }

    setCreateError('');
    setIsCreatingGroup(true);

    try {
      const response = await createGroup(form);
      await loadGroups();

      const createdGroupId = response?.data?.id;
      if (createdGroupId) {
        setSelectedGroupId(createdGroupId);
      }

      toast.success('Group created', response?.message || 'Group created successfully.');
      closeCreateModal();
    } catch (requestError) {
      const message = requestError.message || 'Could not create group.';
      setCreateError(message);
      toast.error('Create group failed', message);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedGroup?.id || isSavingPermissions || !hasUnsavedChanges) return;

    setIsSavingPermissions(true);

    try {
      const response = await saveGroupPermissions(selectedGroup.id);
      await loadGroupPermissions(selectedGroup.id);
      toast.success('Permissions saved', response?.message || 'Group permissions updated successfully.');
    } catch (requestError) {
      toast.error('Save failed', requestError.message || 'Could not update group permissions.');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  return (
    <AccessControlShell
      title="Access Control"
      subtitle="Manage groups, permissions, and user assignments."
    >
      <DragDropProvider
        onDragStart={(event) => {
          const permissionId = event.operation.source?.data?.permissionId;
          const permissionIds = event.operation.source?.data?.permissionIds;
          const label = event.operation.source?.data?.label;
          const count =
            Array.isArray(permissionIds) && permissionIds.length
              ? permissionIds.length
              : permissionId
                ? 1
                : 0;

          if (permissionId || count > 0) {
            setActiveDragId(event.operation.source.id);
            setActiveDragItem({
              permissionId,
              permissionIds,
              label,
              count,
            });
          }
        }}
        onDragEnd={(event) => {
          const permissionId = event.operation.source?.data?.permissionId;
          const permissionIds = event.operation.source?.data?.permissionIds;
          const targetId = event.operation.target?.id;

          if (!event.canceled && targetId === ASSIGNED_DROP_ID) {
            if (Array.isArray(permissionIds) && permissionIds.length) {
              permissionIds.forEach((id) => {
                if (!assignedSet.has(id)) {
                  assignPermissionToGroup(selectedGroup.id, id);
                }
              });
            } else if (permissionId) {
              assignPermissionToGroup(selectedGroup.id, permissionId);
            }
          }

          setActiveDragItem(null);
          setActiveDragId(null);
        }}
      >
        <div className="xl:h-[700px]">
        <div className="grid h-full gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-stretch">
          <section className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
              <h2 className="text-[20px] font-bold tracking-tight text-gray-900">Groups</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-2xl p-2 text-gray-500 transition-colors hover:bg-brand-light hover:text-brand"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className={cn(
                    'w-full rounded-[1.4rem] border px-4 py-3.5 text-left transition-all',
                    selectedGroup?.id === group.id
                      ? 'border-brand/30 bg-brand-light/70 shadow-sm'
                      : 'border-transparent hover:border-gray-200 hover:bg-gray-50',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold tracking-tight text-gray-900">{group.name}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-gray-400">
                        {group.code}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-brand" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="min-w-0 h-full overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
            <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4.5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-light p-2.5 text-brand">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[18px] font-bold tracking-tight text-gray-900">{selectedGroup?.name}</h2>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-500 transition-all duration-200">
                      {animatedAssignedCount} permissions assigned
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] text-gray-500">{selectedGroup?.description}</p>
                </div>
              </div>

              <Button
                icon={<Save className="h-4 w-4" />}
                isLoading={isSavingPermissions}
                disabled={!selectedGroup?.id || !hasUnsavedChanges}
                onClick={handleSavePermissions}
                className="bg-brand hover:bg-brand-hover text-[14px]"
              >
                {isSavingPermissions ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            <div className="grid h-[calc(700px-88px)] divide-y divide-gray-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="flex min-h-0 h-full flex-col p-4">
                <div className="mb-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[13px] font-black tracking-tight text-gray-900">AVAILABLE PERMISSIONS</h3>
                      <p className="text-[13px] text-gray-500">Search and drag to assign</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAvailableCollapseToggle}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700"
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5" />
                      {availableCollapsed ? 'Expand' : 'Collapse'}
                    </button>
                  </div>
                </div>
                <label className="relative mb-4 block">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={availableSearch}
                    onChange={(event) => setAvailableSearch(event.target.value)}
                    placeholder="Search permissions..."
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-2.5 pl-11 pr-4 text-[14px] outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                  />
                </label>
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-[1.4rem] border border-gray-100 bg-gray-50/40 p-3">
                  {groupPermissionsLoading ? (
                    <TableLoader label="Loading permissions..." />
                  ) : groupPermissionsError ? (
                    <div className="flex h-full min-h-[320px] items-center justify-center text-center text-sm font-medium text-rose-600">
                      {groupPermissionsError}
                    </div>
                  ) : (
                    <PermissionTree
                      nodes={availableTree}
                      expanded={availableExpanded}
                      onToggle={handleToggle}
                      assignedSet={assignedSet}
                      panel="available"
                      onAssign={(permissionId) => assignPermissionToGroup(selectedGroup.id, permissionId)}
                      onRemove={(permissionId) => removePermissionFromGroup(selectedGroup.id, permissionId)}
                      activeId={activeDragId}
                    />
                  )}
                </div>
              </div>

              <div className="flex min-h-0 h-full flex-col p-4">
                <div className="mb-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[13px] font-black tracking-tight text-gray-900">ASSIGNED TO THIS GROUP</h3>
                      <p className="text-[13px] text-gray-500">Checked items are assigned</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={handleAssignedCollapseToggle}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-700"
                      >
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                        {assignedCollapsed ? 'Expand' : 'Collapse'}
                      </button>
                      {!!currentGroupPermissions.assignedItems.length && (
                        <button
                          type="button"
                          onClick={() =>
                            currentGroupPermissions.assignedItems.forEach((permission) =>
                              removePermissionFromGroup(selectedGroup.id, permission.id),
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <label className="relative mb-4 block">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={assignedSearch}
                    onChange={(event) => setAssignedSearch(event.target.value)}
                    placeholder="Search permissions..."
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-2.5 pl-11 pr-4 text-[14px] outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                  />
                </label>
                <AssignedDropPanel>
                  {groupPermissionsLoading ? (
                    <div className="flex h-full min-h-[320px] items-center justify-center text-center">
                      <TableLoader label="Loading permissions..." />
                    </div>
                  ) : groupPermissionsError ? (
                    <div className="flex h-full min-h-[320px] items-center justify-center text-center text-sm font-medium text-rose-600">
                      {groupPermissionsError}
                    </div>
                  ) : assignedTree.length ? (
                    <PermissionTree
                      nodes={assignedTree}
                      expanded={assignedExpanded}
                      onToggle={handleAssignedToggle}
                      assignedSet={assignedSet}
                      panel="assigned"
                      onAssign={(permissionId) => assignPermissionToGroup(selectedGroup.id, permissionId)}
                      onRemove={(permissionId) => removePermissionFromGroup(selectedGroup.id, permissionId)}
                      activeId={activeDragId}
                    />
                  ) : (
                    <div className="flex h-full min-h-[320px] items-center justify-center text-center text-gray-400">
                      No permissions found.
                    </div>
                  )}
                </AssignedDropPanel>
              </div>
            </div>
          </section>
        </div>
        </div>

        <DragPermissionOverlay activeDragItem={activeDragItem} />
      </DragDropProvider>

      <Modal
        open={isModalOpen}
        onClose={closeCreateModal}
        title="Create New Group"
        description="Add a new role group to the system."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Group Name</label>
            <input
              value={form.name}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, name: event.target.value }));
                if (createError) setCreateError('');
              }}
              placeholder="e.g. Billing Clerk"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <input
              value={form.description}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, description: event.target.value }));
                if (createError) setCreateError('');
              }}
              placeholder="Optional description"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          {createError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {createError}
            </div>
          ) : null}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={isCreatingGroup}
              className="rounded-2xl border border-gray-200 px-5 py-3 font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button onClick={handleCreateGroup} disabled={isCreatingGroup} className="bg-brand hover:bg-brand-hover">
              {isCreatingGroup ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </div>
      </Modal>

      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </AccessControlShell>
  );
}
