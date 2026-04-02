/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';

const AccessControlContext = createContext(null);

const permissionTree = [
  {
    id: 'access',
    label: 'ACCESS',
    children: [
      {
        id: 'access-groups',
        label: 'GROUPS',
        children: [
          { id: 'access.groups.create', label: 'CREATE' },
          { id: 'access.groups.delete', label: 'DELETE' },
          { id: 'access.groups.read', label: 'READ' },
          { id: 'access.groups.update', label: 'UPDATE' },
        ],
      },
      {
        id: 'access-users',
        label: 'USERS',
        children: [
          { id: 'access.users.create', label: 'CREATE' },
          { id: 'access.users.delete', label: 'DELETE' },
          { id: 'access.users.read', label: 'READ' },
          { id: 'access.users.update', label: 'UPDATE' },
          { id: 'access.users.reset-password', label: 'RESET PASSWORD' },
        ],
      },
      {
        id: 'access-permissions',
        label: 'PERMISSIONS',
        children: [
          { id: 'access.permissions.create', label: 'CREATE' },
          { id: 'access.permissions.delete', label: 'DELETE' },
          { id: 'access.permissions.read', label: 'READ' },
          { id: 'access.permissions.update', label: 'UPDATE' },
        ],
      },
    ],
  },
  {
    id: 'company',
    label: 'COMPANY',
    children: [
      {
        id: 'company-settings',
        label: 'SETTINGS',
        children: [
          { id: 'company.settings.create', label: 'CREATE' },
          { id: 'company.settings.delete', label: 'DELETE' },
          { id: 'company.settings.read', label: 'READ' },
          { id: 'company.settings.update', label: 'UPDATE' },
        ],
      },
    ],
  },
  {
    id: 'employees',
    label: 'EMPLOYEES',
    children: [
      {
        id: 'employees-records',
        label: 'RECORDS',
        children: [
          { id: 'employees.records.create', label: 'CREATE' },
          { id: 'employees.records.delete', label: 'DELETE' },
          { id: 'employees.records.read', label: 'READ' },
          { id: 'employees.records.update', label: 'UPDATE' },
        ],
      },
    ],
  },
  {
    id: 'finance',
    label: 'FINANCE',
    children: [
      {
        id: 'finance-payroll',
        label: 'PAYROLL',
        children: [
          { id: 'finance.payroll.create', label: 'CREATE' },
          { id: 'finance.payroll.delete', label: 'DELETE' },
          { id: 'finance.payroll.read', label: 'READ' },
          { id: 'finance.payroll.update', label: 'UPDATE' },
        ],
      },
      {
        id: 'finance-reports',
        label: 'REPORTS',
        children: [
          { id: 'finance.reports.export', label: 'EXPORT' },
          { id: 'finance.reports.read', label: 'READ' },
        ],
      },
    ],
  },
];

const initialGroups = [
  {
    id: 'grp-1',
    name: 'System Administrator',
    code: 'ADMIN',
    description: 'Full access to security and setup features.',
    permissions: [],
  },
  {
    id: 'grp-2',
    name: 'HR Manager',
    code: 'HR',
    description: 'Employee and user administration for HR staff.',
    permissions: [],
  },
  {
    id: 'grp-3',
    name: 'Accounts',
    code: 'ACCOUNTS',
    description: 'Finance and reporting access.',
    permissions: [],
  },
  {
    id: 'grp-4',
    name: 'Reception',
    code: 'RECEPTION',
    description: 'Front-desk limited visibility.',
    permissions: [],
  },
];

const initialUsers = [
  {
    id: 'usr-1',
    fullName: 'System Administrator',
    username: 'admin',
    createdAt: '2026-02-09',
    groupIds: ['grp-1'],
  },
  {
    id: 'usr-2',
    fullName: 'Tahir',
    username: 'tahir',
    createdAt: '2026-02-19',
    groupIds: ['grp-2'],
  },
  {
    id: 'usr-3',
    fullName: 'Anas',
    username: 'anas',
    createdAt: '2026-03-16',
    groupIds: ['grp-4'],
  },
];

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
  const [users, setUsers] = useState(initialUsers);

  const permissionCatalog = useMemo(() => catalogFromTree(permissionTree), []);

  const createGroup = (payload) => {
    const code = (payload.name || 'GROUP').trim().toUpperCase().replace(/\s+/g, '_');
    const nextGroup = {
      id: `grp-${Date.now()}`,
      name: payload.name.trim(),
      code,
      description: payload.description.trim(),
      permissions: [],
    };

    setGroups((prev) => [nextGroup, ...prev]);
    return nextGroup.id;
  };

  const assignPermissionToGroup = (groupId, permissionId) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId && !group.permissions.includes(permissionId)
          ? { ...group, permissions: [...group.permissions, permissionId] }
          : group,
      ),
    );
  };

  const removePermissionFromGroup = (groupId, permissionId) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, permissions: group.permissions.filter((item) => item !== permissionId) }
          : group,
      ),
    );
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

  const assignGroupsToUser = (userId, groupIds) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, groupIds } : user)),
    );
  };

  const resetPassword = () => true;

  const deleteUser = (userId) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const value = {
    groups,
    users,
    permissionTree,
    permissionCatalog,
    createGroup,
    assignPermissionToGroup,
    removePermissionFromGroup,
    createUser,
    assignGroupsToUser,
    resetPassword,
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
