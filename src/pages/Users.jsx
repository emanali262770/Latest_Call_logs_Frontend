import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, Search, Shield, Trash2, Users as UsersIcon } from 'lucide-react';
import { AccessControlShell, Modal } from '@/src/components/access-control/AccessControlShell';
import { Button } from '@/src/components/ui/Card';
import TableLoader from '@/src/components/ui/TableLoader';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useAccessControl } from '@/src/context/AccessControlContext';
import { useThemeToast } from '@/src/hooks/useThemeToast';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function getStatusClasses(status) {
  return status === 'active'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-gray-100 text-gray-600 border-gray-200';
}

function hasGroupId(groupIds, groupId) {
  return groupIds.some((id) => String(id) === String(groupId));
}

export default function UsersPage() {
  const {
    users,
    groups,
    groupsLoading,
    groupsError,
    usersLoading,
    usersError,
    loadUserGroups,
    assignGroupsToUser,
    resetPassword,
    deleteUser,
  } = useAccessControl();
  const [search, setSearch] = useState('');
  const [assigningUserId, setAssigningUserId] = useState(null);
  const [resetUserId, setResetUserId] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [isAssigningGroups, setIsAssigningGroups] = useState(false);
  const [isLoadingAssignedGroups, setIsLoadingAssignedGroups] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const { toasts, toast, removeToast } = useThemeToast();

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      `${user.fullName} ${user.username} ${user.employeeName} ${user.designation} ${user.status}`
        .toLowerCase()
        .includes(query),
    );
  }, [search, users]);

  const assigningUser = users.find((user) => user.id === assigningUserId) || null;
  const resetUser = users.find((user) => user.id === resetUserId) || null;

  const closeResetModal = () => {
    setResetUserId(null);
    setPassword('');
    setShowPassword(false);
    setResetError('');
  };

  const closeAssignModal = () => {
    setAssigningUserId(null);
    setSelectedGroupIds([]);
    setAssignError('');
  };

  useEffect(() => {
    if (!assigningUserId) return;

    let isActive = true;

    const fetchAssignedGroups = async () => {
      setIsLoadingAssignedGroups(true);
      setAssignError('');

      try {
        const groupIds = await loadUserGroups(assigningUserId);
        if (isActive) {
          setSelectedGroupIds(groupIds);
        }
      } catch (requestError) {
        if (isActive) {
          setAssignError(requestError.message || 'Could not load assigned groups.');
          setSelectedGroupIds([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingAssignedGroups(false);
        }
      }
    };

    fetchAssignedGroups();

    return () => {
      isActive = false;
    };
  }, [assigningUserId, loadUserGroups]);

  const handleResetPassword = async () => {
    if (!resetUser || !password.trim()) {
      setResetError('Password is required.');
      return;
    }

    setResetError('');
    setIsResettingPassword(true);

    try {
      const response = await resetPassword(resetUser.id, password.trim());
      toast.success('Password updated', response?.message || 'Password updated successfully.');
      closeResetModal();
    } catch (requestError) {
      const message = requestError.message || 'Could not update password.';
      setResetError(message);
      toast.error('Password update failed', message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleAssignGroups = async () => {
    if (!assigningUser) return;

    setAssignError('');
    setIsAssigningGroups(true);

    try {
      const response = await assignGroupsToUser(assigningUser.id, selectedGroupIds);
      const assignedCount = response?.assignedCount ?? selectedGroupIds.length;
      const successMessage =
        assignedCount > 0
          ? `${assignedCount} group${assignedCount > 1 ? 's' : ''} assigned successfully.`
          : 'No new groups needed to be assigned.';

      toast.success('Groups assigned', successMessage);
      closeAssignModal();
    } catch (requestError) {
      const message = requestError.message || 'Could not assign groups.';
      setAssignError(message);
      toast.error('Group assignment failed', message);
    } finally {
      setIsAssigningGroups(false);
    }
  };

  return (
    <AccessControlShell
      title="Access Control"
      subtitle="Manage groups, permissions, and user assignments."
    >
      <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-brand-light p-3 text-brand">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold tracking-tight text-gray-900">User Management</h2>
              <p className="text-[13px] text-gray-500">Create users, assign security groups, and manage credentials.</p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-[13px] outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
            </label>
            <p className="text-[13px] font-medium text-gray-500">{visibleUsers.length} users found</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-gray-50/80 text-[13px] text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold">Full Name</th>
                <th className="px-6 py-4 font-bold">Username</th>
                <th className="px-6 py-4 font-bold">Designation</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Created</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <TableLoader label="Loading users..." />
                  </td>
                </tr>
              ) : usersError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8">
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {usersError}
                    </div>
                  </td>
                </tr>
              ) : visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm font-medium text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user) => (
                  <tr key={user.id} className="border-t border-gray-100">
                    <td className="px-6 py-4 text-[13px] font-semibold text-gray-900">{user.fullName || '-'}</td>
                    <td className="px-6 py-4 text-[13px]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-[12px] font-bold text-brand">
                          {(user.username?.[0] || '?').toUpperCase()}
                        </span>
                        <span className="text-[13px] text-gray-700">{user.username || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-600">{user.designation || '-'}</td>
                    <td className="px-6 py-4 text-[13px]">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold capitalize ${getStatusClasses(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningUserId(user.id);
                          }}
                          className="rounded-2xl border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-700 transition-colors hover:border-brand/20 hover:bg-brand-light/40"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5" />
                            Groups
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetUserId(user.id)}
                          className="rounded-2xl border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-700 transition-colors hover:border-brand/20 hover:bg-brand-light/40"
                        >
                          <span className="inline-flex items-center gap-2">
                            <KeyRound className="h-3.5 w-3.5" />
                            Reset Pwd
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(user.id)}
                          className="rounded-2xl p-2 text-rose-500 transition-colors hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={!!assigningUser}
        onClose={closeAssignModal}
        title="Assign Groups"
        description={assigningUser ? `Select security groups for ${assigningUser.username}` : ''}
        widthClass="max-w-[426px]"
        titleClassName="text-[18px]"
        descriptionClassName="text-[13px] text-slate-500"
        bodyClassName="pt-4"
      >
        <div className="space-y-4">
          <div className="max-h-[300px] space-y-1.5 overflow-auto pr-2">
            {groupsLoading || isLoadingAssignedGroups ? (
              <div className="rounded-2xl border border-gray-100 px-4 py-6">
                <TableLoader label={isLoadingAssignedGroups ? 'Loading assigned groups...' : 'Loading groups...'} />
              </div>
            ) : groupsError ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {groupsError}
              </div>
            ) : groups.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 px-4 py-6 text-center text-[13px] font-medium text-gray-400">
                No groups found.
              </div>
            ) : (
              groups.map((group) => (
                <label
                  key={group.id}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 px-3.5 py-3 hover:border-brand/20 hover:bg-brand-light/30"
                >
                  <input
                    type="checkbox"
                    checked={hasGroupId(selectedGroupIds, group.id)}
                    onChange={(event) =>
                      setSelectedGroupIds((prev) =>
                        event.target.checked
                          ? hasGroupId(prev, group.id)
                            ? prev
                            : [...prev, group.id]
                          : prev.filter((id) => String(id) !== String(group.id)),
                      )
                    }
                    className="mt-0.5 h-4 w-4 rounded accent-[var(--color-brand)]"
                  />
                  <div>
                    <p className="text-[13px] font-semibold leading-5 text-gray-900">{group.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{group.code}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          {assignError ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {assignError}
              </div>
            ) : null}
          <div className="flex justify-end gap-2.5 pt-4">
            <button
              type="button"
              onClick={closeAssignModal}
              disabled={groupsLoading || isLoadingAssignedGroups || isAssigningGroups}
              className="rounded-2xl border border-gray-200 px-5 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button
              onClick={handleAssignGroups}
              disabled={groupsLoading || isLoadingAssignedGroups || !!groupsError || isAssigningGroups}
              className="bg-brand px-5 py-2.5 text-[13px] hover:bg-brand-hover"
            >
              {isAssigningGroups ? 'Saving...' : 'Save Assignments'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!resetUser}
        onClose={closeResetModal}
        title="Reset Password"
        description={resetUser ? `Set a new password for ${resetUser.username}` : ''}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (resetError) setResetError('');
                }}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 pr-12 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {resetError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {resetError}
            </div>
          ) : null}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={closeResetModal}
              disabled={isResettingPassword}
              className="rounded-2xl border border-gray-200 px-5 py-3 font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className="bg-brand hover:bg-brand-hover"
            >
              {isResettingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </div>
      </Modal>

      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </AccessControlShell>
  );
}
