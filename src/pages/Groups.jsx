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
import { useAccessControl } from '@/src/context/AccessControlContext';
import { cn } from '@/src/lib/utils';

const ASSIGNED_DROP_ID = 'assigned-group-permissions';

function countLeaves(node) {
  if (!node.children?.length) return 1;
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

function filterTree(nodes, query, assignedSet, showAssigned) {
  return nodes
    .map((node) => {
      if (!node.children?.length) {
        const matchesText = !query || node.label.toLowerCase().includes(query);
        const matchesSide = showAssigned ? assignedSet.has(node.id) : !assignedSet.has(node.id);
        return matchesText && matchesSide ? node : null;
      }

      const children = filterTree(node.children, query, assignedSet, showAssigned);
      const matchesSelf = !query || node.label.toLowerCase().includes(query);

      if (showAssigned) {
        if (children.length) {
          return { ...node, children };
        }

        return null;
      }

      if (matchesSelf || children.length) {
        return { ...node, children };
      }

      return null;
    })
    .filter(Boolean);
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
            <button
              type="button"
              onClick={() => onToggle(node.id)}
              className="relative flex w-full items-center gap-1.5 rounded-xl py-1 text-left hover:bg-gray-50"
              style={{ paddingLeft: depth > 0 ? '20px' : '0px' }}
            >
              {depth > 0 ? (
                <span className="pointer-events-none absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-gray-200/90" />
              ) : null}
              <span className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full border border-gray-200 bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.9)]">
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                )}
              </span>
              <input
                type="checkbox"
                checked={isAssigned}
                onChange={() => (panel === 'available' ? onAssign(node.id) : onRemove(node.id))}
                className="h-4 w-4 rounded accent-[var(--color-brand)]"
              />
              <Folder className="h-[14px] w-[14px] text-brand" />
              <span className="text-[11px] font-bold tracking-tight text-gray-800">{node.label}</span>
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-gray-500">
                {countLeaves(node)}
              </span>
            </button>

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
          </div>
        ) : null
      }
    </DragOverlay>
  );
}

export default function Groups() {
  const {
    groups,
    permissionTree,
    createGroup,
    assignPermissionToGroup,
    removePermissionFromGroup,
  } = useAccessControl();
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [availableExpanded, setAvailableExpanded] = useState({});
  const [assignedExpanded, setAssignedExpanded] = useState({});
  const [availableSearch, setAvailableSearch] = useState('');
  const [assignedSearch, setAssignedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);
  const [animatedAssignedCount, setAnimatedAssignedCount] = useState(0);
  const [availableCollapsed, setAvailableCollapsed] = useState(false);
  const [assignedCollapsed, setAssignedCollapsed] = useState(false);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || groups[0];
  const assignedSet = useMemo(() => new Set(selectedGroup?.permissions || []), [selectedGroup]);

  const availableTree = useMemo(
    () => filterTree(permissionTree, availableSearch.trim().toLowerCase(), assignedSet, false),
    [availableSearch, assignedSet, permissionTree],
  );

  const assignedTree = useMemo(
    () => filterTree(permissionTree, assignedSearch.trim().toLowerCase(), assignedSet, true),
    [assignedSearch, assignedSet, permissionTree],
  );

  useEffect(() => {
    const nextCount = selectedGroup?.permissions.length || 0;

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
  }, [animatedAssignedCount, selectedGroup]);

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
    setTreeExpansion(permissionTree, next, setAvailableExpanded);
  };

  const handleAssignedCollapseToggle = () => {
    const next = !assignedCollapsed;
    setAssignedCollapsed(next);
    setTreeExpansion(permissionTree, next, setAssignedExpanded);
  };

  const handleCreateGroup = () => {
    if (!form.name.trim()) return;
    const nextId = createGroup(form);
    setSelectedGroupId(nextId);
    setForm({ name: '', description: '' });
    setIsModalOpen(false);
  };

  return (
    <AccessControlShell
      title="Access Control"
      subtitle="Manage groups, permissions, and user assignments."
    >
      <DragDropProvider
        onDragStart={(event) => {
          const permissionId = event.operation.source?.data?.permissionId;
          const label = event.operation.source?.data?.label;
          if (permissionId) {
            setActiveDragId(event.operation.source.id);
            setActiveDragItem({ permissionId, label });
          }
        }}
        onDragEnd={(event) => {
          const permissionId = event.operation.source?.data?.permissionId;
          const targetId = event.operation.target?.id;

          if (!event.canceled && permissionId && targetId === ASSIGNED_DROP_ID) {
            assignPermissionToGroup(selectedGroup.id, permissionId);
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

              <Button icon={<Save className="h-4 w-4" />} className="bg-brand hover:bg-brand-hover text-[14px]">
                Save Changes
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
                      {!!selectedGroup?.permissions.length && (
                        <button
                          type="button"
                          onClick={() =>
                            selectedGroup.permissions.forEach((permissionId) =>
                              removePermissionFromGroup(selectedGroup.id, permissionId),
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
                  {assignedTree.length ? (
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
        onClose={() => setIsModalOpen(false)}
        title="Create New Group"
        description="Add a new role group to the system."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Group Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="e.g. Billing Clerk"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <input
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Optional description"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-2xl border border-gray-200 px-5 py-3 font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button onClick={handleCreateGroup} className="bg-brand hover:bg-brand-hover">
              Create Group
            </Button>
          </div>
        </div>
      </Modal>
    </AccessControlShell>
  );
}
