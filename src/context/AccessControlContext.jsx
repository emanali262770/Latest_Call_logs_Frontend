/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { groupService } from '@/src/services/group.service';
import { permissionService } from '@/src/services/permission.service';
import { userService } from '@/src/services/user.service';

const AccessControlContext = createContext(null);

const initialGroups = [];

const initialUsers = [];
const initialPermissionTree = [];
const initialPermissionItems = [];
const initialGroupPermissionState = {
  availableItems: [],
  assignedItems: [],
  savedAssignedIds: [],
};

const ACTION_SEQUENCE = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'ASSIGN'];
const MODULE_SEQUENCE = ['INVENTORY', 'SERVICES', 'EMPLOYEE', 'ACCESS', 'REPORTS'];
const MODULE_LABEL_MAP = {
  SERVICES: 'Services & Products',
};
const SUBMODULE_SEQUENCE = {
  EMPLOYEE: ['EMPLOYEE', 'DEPARTMENT', 'DESIGNATION', 'EMPLOYEE_TYPE', 'DUTY_SHIFT', 'BANK'],
  ACCESS: ['USERS', 'GROUPS', 'PERMISSIONS'],
};

function toGroupCode(groupName = '') {
  return groupName.trim().toUpperCase().replace(/\s+/g, ' ');
}

function normalizeEntityId(value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') return value;

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
}

function normalizeGroupIds(groups) {
  if (!Array.isArray(groups)) return [];

  return Array.from(
    new Set(
      groups
        .map((group) => {
          if (group && typeof group === 'object') {
            return normalizeEntityId(
              group.group_id ?? group.id ?? group.group?.id ?? group.groupId ?? group.group_id_fk,
            );
          }

          return normalizeEntityId(group);
        })
        .filter((groupId) => groupId !== null),
    ),
  );
}

function normalizePermissionIds(permissions) {
  if (!Array.isArray(permissions)) return [];

  return Array.from(
    new Set(
      permissions
        .map((permission) => {
          if (permission && typeof permission === 'object') {
            return permission.id ?? permission.permission_id ?? null;
          }

          return permission;
        })
        .filter((permissionId) => permissionId !== null && permissionId !== undefined),
    ),
  );
}

function buildGroupPermissionSnapshot(items) {
  return items.reduce((snapshot, group) => {
    snapshot[group.id] = [...group.permissions];
    return snapshot;
  }, {});
}

function getSequenceIndex(sequence, value) {
  const index = sequence.indexOf(String(value || '').toUpperCase());
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function comparePermissionDisplayOrder(left, right) {
  const moduleIndexDiff =
    getSequenceIndex(MODULE_SEQUENCE, left.module) - getSequenceIndex(MODULE_SEQUENCE, right.module);
  if (moduleIndexDiff !== 0) return moduleIndexDiff;

  const moduleLabelDiff = String(left.module || '').localeCompare(String(right.module || ''));
  if (moduleLabelDiff !== 0 && getSequenceIndex(MODULE_SEQUENCE, left.module) === Number.MAX_SAFE_INTEGER) {
    return moduleLabelDiff;
  }

  const submoduleSequence = SUBMODULE_SEQUENCE[String(left.module || '').toUpperCase()] || [];
  const submoduleIndexDiff =
    getSequenceIndex(submoduleSequence, left.subModule) - getSequenceIndex(submoduleSequence, right.subModule);
  if (submoduleIndexDiff !== 0) return submoduleIndexDiff;

  const submoduleLabelDiff = String(left.subModule || '').localeCompare(String(right.subModule || ''));
  if (submoduleLabelDiff !== 0 && getSequenceIndex(submoduleSequence, left.subModule) === Number.MAX_SAFE_INTEGER) {
    return submoduleLabelDiff;
  }

  const actionIndexDiff =
    getSequenceIndex(ACTION_SEQUENCE, left.action) - getSequenceIndex(ACTION_SEQUENCE, right.action);
  if (actionIndexDiff !== 0) return actionIndexDiff;

  const actionLabelDiff = String(left.action || '').localeCompare(String(right.action || ''));
  if (actionLabelDiff !== 0) return actionLabelDiff;

  return String(left.id || '').localeCompare(String(right.id || ''));
}

function sortPermissionItems(items) {
  return [...items].sort(comparePermissionDisplayOrder);
}

function mapApiGroup(group) {
  const groupName = group.group_name || group.name || '';

  return {
    id: group.id,
    name: groupName,
    code: group.group_code || group.code || toGroupCode(groupName),
    description: group.description || '',
    status: group.status || 'inactive',
    createdAt: group.created_at || group.createdAt || '',
    updatedAt: group.updated_at || group.updatedAt || '',
    permissions: normalizePermissionIds(group.permissions),
  };
}

function mapApiUser(user) {
  const mappedGroupIds = normalizeGroupIds(
    user.groupIds ??
      user.group_ids ??
      user.groups ??
      user.user_groups ??
      user.assigned_groups ??
      (user.group_id !== undefined && user.group_id !== null ? [user.group_id] : []),
  );

  return {
    id: user.id,
    userId: user.user_id || user.userId || '',
    fullName:
      user.employee_name ||
      [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
      user.UserName ||
      '',
    username: user.UserName || user.username || '',
    createdAt: user.createdAt || user.created_at || '',
    status: user.status || 'inactive',
    designation: user.designation || '',
    employeeName: user.employee_name || '',
    employeeId: user.employee_id ?? null,
    groupIds: mappedGroupIds,
  };
}

function getPermissionActionLabel(permission) {
  const action = (permission.action || '').trim();
  if (action) return action.toUpperCase().replace(/_/g, ' ');

  const keyName = (permission.key_name || '').trim();
  if (!keyName) return 'UNKNOWN';

  return keyName.split('.').pop().replace(/_/g, ' ').toUpperCase();
}

function mapApiPermission(permission) {
  const moduleName = (permission.module || 'GENERAL').trim().toUpperCase();
  const subModuleName = (permission.sub_module || 'GENERAL').trim().toUpperCase();
  const actionLabel = getPermissionActionLabel(permission);

  return {
    id: permission.id ?? permission.permission_id,
    module: moduleName,
    subModule: subModuleName,
    action: actionLabel,
    key: permission.key_name || '',
    description: permission.description || '',
    createdAt: permission.created_at || permission.createdAt || '',
    updatedAt: permission.updated_at || permission.updatedAt || '',
  };
}

function isVisiblePermission(permission) {
  return permission.action !== 'ASSIGN';
}

function buildPermissionTree(items) {
  const moduleMap = new Map();

  items.forEach((permission) => {
    if (!moduleMap.has(permission.module)) {
      moduleMap.set(permission.module, {
        id: permission.module.toLowerCase(),
        label: MODULE_LABEL_MAP[permission.module] || permission.module,
        children: [],
        subModuleMap: new Map(),
      });
    }

    const moduleNode = moduleMap.get(permission.module);

    if (!moduleNode.subModuleMap.has(permission.subModule)) {
      const subModuleNode = {
        id: `${permission.module.toLowerCase()}-${permission.subModule.toLowerCase()}`,
        label: permission.subModule,
        children: [],
      };

      moduleNode.subModuleMap.set(permission.subModule, subModuleNode);
      moduleNode.children.push(subModuleNode);
    }

    const subModuleNode = moduleNode.subModuleMap.get(permission.subModule);
    subModuleNode.children.push({
      id: permission.id,
      label: permission.action,
      key: permission.key,
      description: permission.description,
    });
  });

  return Array.from(moduleMap.values())
    .sort((left, right) => comparePermissionDisplayOrder(
      { module: left.label, subModule: '', action: '', id: left.id },
      { module: right.label, subModule: '', action: '', id: right.id },
    ))
    .map(({ subModuleMap, ...moduleNode }) => ({
      ...moduleNode,
      children: moduleNode.children
        .sort((left, right) => comparePermissionDisplayOrder(
          { module: moduleNode.label, subModule: left.label, action: '', id: left.id },
          { module: moduleNode.label, subModule: right.label, action: '', id: right.id },
        ))
        .map((subModuleNode) => ({
          ...subModuleNode,
          children: subModuleNode.children.sort((left, right) =>
            comparePermissionDisplayOrder(
              { module: moduleNode.label, subModule: subModuleNode.label, action: left.label, id: left.id },
              { module: moduleNode.label, subModule: subModuleNode.label, action: right.label, id: right.id },
            ),
          ),
        })),
    }));
}

function flattenPermissionLeaves(nodes) {
  return nodes.flatMap((node) => {
    if (node.children?.length) return flattenPermissionLeaves(node.children);
    return [{ id: node.id, label: node.label }];
  });
}

function catalogFromTree(nodes) {
  return nodes.flatMap((node) => {
    if (!node.children?.length) return [];

    const leaves = flattenPermissionLeaves(node.children);
    return [
      {
        id: node.id,
        title: node.label,
        permissions: leaves.map((item) => ({
          id: item.id,
          subject: item.id.split('.').slice(0, -1).join(' ').replaceAll('.', ' ').toUpperCase(),
          action: item.label,
          key: item.id.toUpperCase(),
        })),
      },
    ];
  });
}

export function AccessControlProvider({ children }) {
  const [groups, setGroups] = useState(initialGroups);
  const [savedGroupPermissions, setSavedGroupPermissions] = useState({});
  const [groupPermissionsByGroup, setGroupPermissionsByGroup] = useState({});
  const [groupPermissionsLoadingByGroup, setGroupPermissionsLoadingByGroup] = useState({});
  const [groupPermissionsErrorByGroup, setGroupPermissionsErrorByGroup] = useState({});
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState('');
  const [permissionTree, setPermissionTree] = useState(initialPermissionTree);
  const [permissionItems, setPermissionItems] = useState(initialPermissionItems);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState('');
  const [users, setUsers] = useState(initialUsers);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  const permissionCatalog = useMemo(() => {
    if (permissionItems.length) {
      const sectionMap = new Map();

      permissionItems.forEach((permission) => {
        if (!sectionMap.has(permission.module)) {
          sectionMap.set(permission.module, {
            id: permission.module.toLowerCase(),
            title: permission.module,
            permissions: [],
          });
        }

        sectionMap.get(permission.module).permissions.push({
          id: permission.id,
          subject: `${permission.module} ${permission.subModule}`,
          action: permission.action,
          key: permission.key,
        });
      });

      return Array.from(sectionMap.values()).map((section) => ({
        ...section,
        permissions: [...section.permissions].sort((left, right) =>
          comparePermissionDisplayOrder(
            {
              module: section.title,
              subModule: left.subject.replace(`${section.title} `, ''),
              action: left.action,
              id: left.id,
            },
            {
              module: section.title,
              subModule: right.subject.replace(`${section.title} `, ''),
              action: right.action,
              id: right.id,
            },
          ),
        ),
      }));
    }

    return catalogFromTree(permissionTree);
  }, [permissionItems, permissionTree]);

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    setGroupsError('');

    try {
      const response = await groupService.list();
      const nextGroups = Array.isArray(response?.data) ? response.data.map(mapApiGroup) : [];
      setGroups(nextGroups);
      setSavedGroupPermissions(buildGroupPermissionSnapshot(nextGroups));
    } catch (requestError) {
      setGroupsError(requestError.message || 'Failed to load groups.');
      setGroups([]);
      setSavedGroupPermissions({});
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');

    try {
      const response = await userService.list();
      const nextUsers = Array.isArray(response?.data) ? response.data.map(mapApiUser) : [];
      setUsers(nextUsers);
    } catch (requestError) {
      setUsersError(requestError.message || 'Failed to load users.');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    setPermissionsError('');

    try {
      const response = await permissionService.list();
      const nextPermissions = Array.isArray(response?.data)
        ? response.data.map(mapApiPermission).filter(isVisiblePermission)
        : [];
      setPermissionItems(nextPermissions);
      setPermissionTree(buildPermissionTree(nextPermissions));
    } catch (requestError) {
      setPermissionsError(requestError.message || 'Failed to load permissions.');
      setPermissionItems([]);
      setPermissionTree([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const createGroup = (payload) => {
    return groupService.create({
      group_name: payload.name.trim(),
      description: payload.description.trim(),
    });
  };

  const deleteGroup = async (groupId) => {
    const response = await groupService.remove(groupId);

    setGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSavedGroupPermissions((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    setGroupPermissionsByGroup((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    setGroupPermissionsLoadingByGroup((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    setGroupPermissionsErrorByGroup((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });

    return response;
  };

  const removePermissionFromGroup = (groupId, permissionId) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, permissions: group.permissions.filter((item) => item !== permissionId) }
          : group,
      ),
    );
    setGroupPermissionsByGroup((prev) => {
      const current = prev[groupId];
      if (!current) return prev;

      const permissionToRestore = current.assignedItems.find((item) => item.id === permissionId);
      if (!permissionToRestore) return prev;

      return {
        ...prev,
        [groupId]: {
          ...current,
          availableItems: sortPermissionItems([...current.availableItems, permissionToRestore]),
          assignedItems: current.assignedItems.filter((item) => item.id !== permissionId),
        },
      };
    });
  };

  const loadGroupPermissions = useCallback(async (groupId) => {
    if (!groupId) return initialGroupPermissionState;

    setGroupPermissionsLoadingByGroup((prev) => ({ ...prev, [groupId]: true }));
    setGroupPermissionsErrorByGroup((prev) => ({ ...prev, [groupId]: '' }));

    try {
      const [availableResponse, assignedResponse] = await Promise.all([
        groupService.listAvailablePermissions(groupId),
        groupService.listAssignedPermissions(groupId),
      ]);

      const availablePermissions = Array.isArray(availableResponse?.data?.permissions)
        ? availableResponse.data.permissions
        : Array.isArray(availableResponse?.data)
          ? availableResponse.data
          : [];
      const assignedPermissions = Array.isArray(assignedResponse?.data?.permissions)
        ? assignedResponse.data.permissions
        : Array.isArray(assignedResponse?.data)
          ? assignedResponse.data
          : [];

      const availableItems = availablePermissions.length
        ? sortPermissionItems(availablePermissions.map(mapApiPermission).filter(isVisiblePermission))
        : [];
      const assignedItems = assignedPermissions.length
        ? sortPermissionItems(assignedPermissions.map(mapApiPermission).filter(isVisiblePermission))
        : [];
      const assignedIds = assignedItems.map((permission) => permission.id);

      setGroupPermissionsByGroup((prev) => ({
        ...prev,
        [groupId]: {
          availableItems,
          assignedItems,
          savedAssignedIds: assignedIds,
        },
      }));
      setGroups((prev) =>
        prev.map((group) => (group.id === groupId ? { ...group, permissions: assignedIds } : group)),
      );
      setSavedGroupPermissions((prev) => ({
        ...prev,
        [groupId]: assignedIds,
      }));

      return {
        availableItems,
        assignedItems,
        savedAssignedIds: assignedIds,
      };
    } catch (requestError) {
      setGroupPermissionsErrorByGroup((prev) => ({
        ...prev,
        [groupId]: requestError.message || 'Failed to load group permissions.',
      }));
      throw requestError;
    } finally {
      setGroupPermissionsLoadingByGroup((prev) => ({ ...prev, [groupId]: false }));
    }
  }, []);

  const assignPermissionToGroup = (groupId, permissionId) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId && !group.permissions.includes(permissionId)
          ? { ...group, permissions: [...group.permissions, permissionId] }
          : group,
      ),
    );
    setGroupPermissionsByGroup((prev) => {
      const current = prev[groupId];
      if (!current) return prev;

      const permissionToAssign = current.availableItems.find((item) => item.id === permissionId);
      if (!permissionToAssign) return prev;

      return {
        ...prev,
        [groupId]: {
          ...current,
          availableItems: current.availableItems.filter((item) => item.id !== permissionId),
          assignedItems: sortPermissionItems([...current.assignedItems, permissionToAssign]),
        },
      };
    });
  };

  const saveGroupPermissions = async (groupId) => {
    const currentPermissions = groupPermissionsByGroup[groupId]?.assignedItems || [];
    const normalizedPermissionIds = normalizePermissionIds(currentPermissions.map((item) => item.id));
    const response = await groupService.assignPermissions({
      group_id: groupId,
      permission_ids: normalizedPermissionIds,
    });

    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, permissions: normalizedPermissionIds } : group,
      ),
    );
    setSavedGroupPermissions((prev) => ({
      ...prev,
      [groupId]: normalizedPermissionIds,
    }));
    setGroupPermissionsByGroup((prev) => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || initialGroupPermissionState),
        savedAssignedIds: normalizedPermissionIds,
      },
    }));

    return response;
  };

  const createUser = (payload) => {
    const nextUser = {
      id: `usr-${Date.now()}`,
      fullName: payload.fullName.trim(),
      username: payload.username.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      groupIds: [],
    };

    setUsers((prev) => [nextUser, ...prev]);
  };

  const assignGroupsToUser = async (userId, groupIds) => {
    const currentUser = users.find((user) => user.id === userId);
    const currentGroupIds = Array.isArray(currentUser?.groupIds) ? currentUser.groupIds : [];
    const nextGroupIds = Array.from(new Set(groupIds));
    const groupIdsToAssign = nextGroupIds.filter((groupId) => !currentGroupIds.includes(groupId));

    for (const groupId of groupIdsToAssign) {
      await userService.assignGroup({
        user_id: userId,
        group_id: groupId,
      });
    }

    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, groupIds: nextGroupIds } : user)),
    );

    return { assignedCount: groupIdsToAssign.length };
  };

  const loadUserGroups = useCallback(async (userId) => {
    const response = await userService.listUserGroups(userId);
    const responseGroups = Array.isArray(response?.data?.groups)
      ? response.data.groups
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
    const groupIds = normalizeGroupIds(responseGroups);

    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, groupIds } : user)),
    );

    return groupIds;
  }, []);

  const resetPassword = async (userId, password) => {
    return userService.changePassword(userId, { password });
  };

  const toggleUserStatus = async (userId, lock) => {
    const response = await userService.updateLock(userId, { lock });

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: lock ? 'inactive' : 'active',
            }
          : user,
      ),
    );

    return response;
  };

  const deleteUser = (userId) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const value = {
    groups,
    groupsLoading,
    groupsError,
    savedGroupPermissions,
    groupPermissionsByGroup,
    groupPermissionsLoadingByGroup,
    groupPermissionsErrorByGroup,
    permissionsLoading,
    permissionsError,
    users,
    usersLoading,
    usersError,
    permissionTree,
    permissionCatalog,
    loadGroups,
    loadGroupPermissions,
    loadPermissions,
    loadUsers,
    createGroup,
    deleteGroup,
    assignPermissionToGroup,
    removePermissionFromGroup,
    saveGroupPermissions,
    createUser,
    loadUserGroups,
    assignGroupsToUser,
    resetPassword,
    toggleUserStatus,
    deleteUser,
  };

  return <AccessControlContext.Provider value={value}>{children}</AccessControlContext.Provider>;
}

export function useAccessControl() {
  const context = useContext(AccessControlContext);

  if (!context) {
    throw new Error('useAccessControl must be used within AccessControlProvider');
  }

  return context;
}
