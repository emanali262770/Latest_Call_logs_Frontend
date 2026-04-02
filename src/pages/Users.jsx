import { useMemo, useState } from 'react';
import { KeyRound, Search, Shield, Trash2, UserPlus, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/src/components/ui/Card';
import { AccessControlShell, Modal } from '@/src/components/access-control/AccessControlShell';
import { useAccessControl } from '@/src/context/AccessControlContext';

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US');
}

export default function UsersPage() {
  const { users, groups, createUser, assignGroupsToUser, resetPassword, deleteUser } = useAccessControl();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState(null);
  const [resetUserId, setResetUserId] = useState(null);
  const [createForm, setCreateForm] = useState({ fullName: '', username: '', password: '' });
  const [password, setPassword] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      `${user.fullName} ${user.username}`.toLowerCase().includes(query),
    );
  }, [search, users]);

  const assigningUser = users.find((user) => user.id === assigningUserId) || null;
  const resetUser = users.find((user) => user.id === resetUserId) || null;

  return (
    <AccessControlShell
      title="Access Control"
      subtitle="Manage groups, permissions, and user assignments."
    >
      <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-brand-light p-3 text-brand">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">User Management</h2>
              <p className="text-base text-gray-500">Create users, assign security groups, and manage credentials.</p>
            </div>
          </div>

          <Button
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
            className="bg-brand hover:bg-brand-hover"
          >
            New User
          </Button>
        </div>

        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
            </label>
            <p className="text-sm font-medium text-gray-500">{visibleUsers.length} users found</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-gray-50/80 text-sm text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold">Full Name</th>
                <th className="px-6 py-4 font-bold">Username</th>
                <th className="px-6 py-4 font-bold">Created</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="px-6 py-4 text-lg font-semibold text-gray-900">{user.fullName}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand">
                        {user.username[0].toUpperCase()}
                      </span>
                      <span className="text-lg text-gray-700">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningUserId(user.id);
                          setSelectedGroupIds(user.groupIds);
                        }}
                        className="rounded-2xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:border-brand/20 hover:bg-brand-light/40"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Groups
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetUserId(user.id)}
                        className="rounded-2xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:border-brand/20 hover:bg-brand-light/40"
                      >
                        <span className="inline-flex items-center gap-2">
                          <KeyRound className="h-4 w-4" />
                          Reset Pwd
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteUser(user.id)}
                        className="rounded-2xl p-2 text-rose-500 transition-colors hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create User"
        description="Create a new user account. Access control is managed via groups."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Full Name</label>
            <input
              value={createForm.fullName}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Username</label>
            <input
              value={createForm.username}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, username: event.target.value }))}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Initial Password</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-2xl border border-gray-200 px-5 py-3 font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button
              onClick={() => {
                if (!createForm.fullName.trim() || !createForm.username.trim() || !createForm.password.trim()) return;
                createUser(createForm);
                setCreateForm({ fullName: '', username: '', password: '' });
                setIsCreateOpen(false);
              }}
              className="bg-brand hover:bg-brand-hover"
            >
              Create User
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!assigningUser}
        onClose={() => setAssigningUserId(null)}
        title="Assign Groups"
        description={assigningUser ? `Select security groups for ${assigningUser.username}` : ''}
      >
        <div className="space-y-4">
          <div className="max-h-[380px] space-y-3 overflow-auto pr-2">
            {groups.map((group) => (
              <label
                key={group.id}
                className="flex cursor-pointer items-start gap-4 rounded-2xl border border-gray-200 px-4 py-4 hover:border-brand/20 hover:bg-brand-light/30"
              >
                <input
                  type="checkbox"
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={(event) =>
                    setSelectedGroupIds((prev) =>
                      event.target.checked
                        ? [...prev, group.id]
                        : prev.filter((id) => id !== group.id),
                    )
                  }
                  className="mt-1 h-4 w-4 rounded accent-[var(--color-brand)]"
                />
                <div>
                  <p className="text-lg font-semibold text-gray-900">{group.name}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">{group.code}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setAssigningUserId(null)}
              className="rounded-2xl border border-gray-200 px-5 py-3 font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button
              onClick={() => {
                assignGroupsToUser(assigningUser.id, selectedGroupIds);
                setAssigningUserId(null);
              }}
              className="bg-brand hover:bg-brand-hover"
            >
              Save Assignments
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!resetUser}
        onClose={() => setResetUserId(null)}
        title="Reset Password"
        description={resetUser ? `Set a new password for ${resetUser.username}` : ''}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setResetUserId(null)}
              className="rounded-2xl border border-gray-200 px-5 py-3 font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button
              onClick={() => {
                if (!password.trim()) return;
                resetPassword(resetUser.id, password);
                setPassword('');
                setResetUserId(null);
              }}
              className="bg-brand hover:bg-brand-hover"
            >
              Update Password
            </Button>
          </div>
        </div>
      </Modal>
    </AccessControlShell>
  );
}
