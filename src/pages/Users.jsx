import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Eye, EyeOff, KeyRound, Plus, Search, Search as SearchIcon, Shield, Trash2, User, UserCog, Users as UsersIcon, X } from 'lucide-react';
import { AccessControlShell, Modal } from '@/src/components/access-control/AccessControlShell';
import { Button } from '@/src/components/ui/Card';
import TableLoader from '@/src/components/ui/TableLoader';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useAccessControl } from '@/src/context/AccessControlContext';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { employeeService } from '@/src/services/employee.service';
import { userService } from '@/src/services/user.service';

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

function getNextUserId(users) {
  const ids = (users || [])
    .map((item) => String(item?.userId || '').trim())
    .filter(Boolean);

  if (!ids.length) return 'USR-00001';

  let best = { prefix: 'USR-', number: 0, width: 5 };

  ids.forEach((id) => {
    const match = id.match(/^(.*?)(\d+)$/);
    if (!match) return;

    const prefix = match[1] || 'USR-';
    const numericText = match[2];
    const number = Number.parseInt(numericText, 10);
    if (Number.isNaN(number)) return;

    if (number > best.number) {
      best = {
        prefix,
        number,
        width: numericText.length,
      };
    }
  });

  const nextNumber = best.number + 1;
  return `${best.prefix}${String(nextNumber).padStart(best.width, '0')}`;
}

const EMPTY_CREATE_FORM = {
  employeeId: '',
  department: '',
  username: '',
  designation: '',
  password: '',
  confirmPassword: '',
  locked: false,
  description: '',
};

function SearchableSelect({
  label,
  required = false,
  value,
  options,
  placeholder,
  searchablePlaceholder,
  onChange,
  error,
  isOpen,
  onToggle,
  onClose,
}) {
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query]);

  return (
    <div className={`space-y-2 ${isOpen ? 'relative z-40' : 'relative z-0'}`} ref={containerRef}>
      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left text-sm text-gray-900 outline-none transition-all ${
            error ? 'border-rose-300' : 'border-gray-200'
          }`}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/60">
            <div className="border-b border-gray-100 p-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchablePlaceholder}
                  className="h-10 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto p-2">
              {filteredOptions.length ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition-all ${
                      option.label === value
                        ? 'bg-brand-light text-brand'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                    {option.label === value ? <span className="text-[10px] font-bold text-emerald-600">Selected</span> : null}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-400">No matching records found.</div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

function FormSection({ icon: Icon, title, children }) {
  return (
    <section className="rounded-[28px] border border-brand/15 bg-linear-to-br from-brand-light/80 via-white to-brand-light/35 px-6 py-6">
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brand/12 bg-white/90 px-4 py-3">
        <div className="h-7 w-1.5 rounded-full bg-linear-to-b from-brand to-brand-hover"></div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand/10 bg-linear-to-br from-brand-light to-white text-brand">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-brand">{title}</h3>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function readOnlyFieldClassName() {
  return 'w-full cursor-not-allowed rounded-xl border border-brand/20 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 outline-none';
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
    toggleUserStatus,
    deleteUser,
    loadUsers,
  } = useAccessControl();
  const [search, setSearch] = useState('');
  const [assigningUserId, setAssigningUserId] = useState(null);
  const [resetUserId, setResetUserId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState('');
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [isAssigningGroups, setIsAssigningGroups] = useState(false);
  const [isLoadingAssignedGroups, setIsLoadingAssignedGroups] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [openSelectId, setOpenSelectId] = useState(null);
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

  const availableEmployees = useMemo(
    () =>
      employees.filter(
        (employee) => !employee.raw?.linked_user_id && !employee.raw?.linked_user,
      ),
    [employees],
  );

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(
          availableEmployees
            .map((employee) => employee.department)
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [availableEmployees],
  );

  const filteredEmployees = useMemo(() => {
    if (!createForm.department) return availableEmployees;
    return availableEmployees.filter((employee) => employee.department === createForm.department);
  }, [availableEmployees, createForm.department]);

  const employeeOptions = useMemo(
    () =>
      filteredEmployees.map((employee) => ({
        value: employee.id,
        label: employee.employee_name,
      })),
    [filteredEmployees],
  );

  const selectedEmployeeLabel = useMemo(
    () => employeeOptions.find((option) => String(option.value) === String(createForm.employeeId))?.label || '',
    [createForm.employeeId, employeeOptions],
  );

  const previewUserId = useMemo(() => getNextUserId(users), [users]);

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

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateErrors({});
    setOpenSelectId(null);
  };

  const updateCreateFormField = (field, value) => {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCreateErrors((prev) => ({
      ...prev,
      [field]: '',
      form: '',
    }));
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

  useEffect(() => {
    if (!isCreateModalOpen || employees.length > 0) return;

    let isActive = true;

    const loadEmployees = async () => {
      setEmployeesLoading(true);
      setEmployeesError('');

      try {
        const response = await employeeService.list('');
        if (!isActive) return;
        setEmployees(Array.isArray(response?.data) ? response.data : []);
      } catch (requestError) {
        if (!isActive) return;
        setEmployeesError(requestError.message || 'Could not load employees.');
        setEmployees([]);
      } finally {
        if (isActive) {
          setEmployeesLoading(false);
        }
      }
    };

    loadEmployees();

    return () => {
      isActive = false;
    };
  }, [employees.length, isCreateModalOpen]);

  const handleDepartmentChange = (value) => {
    setCreateForm((prev) => ({
      ...prev,
      employeeId: '',
      department: value,
      designation: '',
    }));
    setOpenSelectId(null);
    setCreateErrors((prev) => ({
      ...prev,
      department: '',
      employeeId: '',
      form: '',
    }));
  };

  const handleEmployeeChange = (employeeId) => {
    const selectedEmployee =
      availableEmployees.find((employee) => String(employee.id) === String(employeeId)) || null;

    setOpenSelectId(null);
    setCreateForm((prev) => ({
      ...prev,
      employeeId,
      department: selectedEmployee?.department || prev.department,
      designation: selectedEmployee?.designation || '',
      description:
        selectedEmployee?.department || selectedEmployee?.designation
          ? `${selectedEmployee.department || 'Department not set'}${selectedEmployee.designation ? ` | ${selectedEmployee.designation}` : ''}`
          : prev.description,
    }));
    setCreateErrors((prev) => ({
      ...prev,
      employeeId: '',
      name: '',
      designation: '',
      form: '',
    }));
  };

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

  const handleCreateUser = async () => {
    const nextErrors = {};

    if (!createForm.employeeId) nextErrors.employeeId = 'Employee is required.';
    if (!createForm.department) nextErrors.department = 'Department is required.';
    if (!createForm.username.trim()) nextErrors.username = 'Username is required.';
    if (!createForm.designation.trim()) nextErrors.designation = 'Designation is required.';
    if (!createForm.password.trim()) nextErrors.password = 'Password is required.';
    if (!createForm.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Confirm password is required.';
    } else if (createForm.password !== createForm.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm password must match password.';
    }

    if (Object.keys(nextErrors).length) {
      setCreateErrors(nextErrors);
      return;
    }

    setCreateErrors({});
    setIsCreatingUser(true);

    try {
      const payload = {
        employee_id: Number(createForm.employeeId),
        username: createForm.username.trim(),
        password: createForm.password,
        status: createForm.locked ? 'inactive' : 'active',
        lock: createForm.locked,
      };

      const response = await userService.create(payload);
      toast.success('User created', response?.message || 'New user created successfully.');
      const employeesResponse = await employeeService.list('');
      setEmployees(Array.isArray(employeesResponse?.data) ? employeesResponse.data : []);
      await loadUsers();
      closeCreateModal();
    } catch (requestError) {
      const message = requestError.message || 'Could not create user.';
      setCreateErrors({ form: message });
      toast.error('Create user failed', message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    const nextLock = user.status === 'active';
    setTogglingUserId(user.id);

    try {
      const response = await toggleUserStatus(user.id, nextLock);
      toast.success(
        'Status updated',
        response?.message || `User marked as ${nextLock ? 'inactive' : 'active'}.`,
      );
    } catch (requestError) {
      const message = requestError.message || 'Could not update user status.';
      toast.error('Status update failed', message);
    } finally {
      setTogglingUserId(null);
    }
  };

  const createInputClassName = (field) =>
    `w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10 ${
      createErrors[field] ? 'border-rose-300' : 'border-gray-200'
    }`;

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
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-brand px-4 py-2.5 text-[13px] hover:bg-brand-hover"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New User
            </span>
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
                <th className="px-6 py-4 font-bold">Toggle</th>
                <th className="px-6 py-4 font-bold">Created</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <TableLoader label="Loading users..." />
                  </td>
                </tr>
              ) : usersError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8">
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {usersError}
                    </div>
                  </td>
                </tr>
              ) : visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm font-medium text-gray-400">
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
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(user)}
                        disabled={togglingUserId === user.id}
                        className={`relative inline-flex h-7 w-[52px] items-center rounded-full border transition-all ${
                          user.status === 'active'
                            ? 'border-brand/30 bg-brand'
                            : 'border-gray-200 bg-gray-300'
                        } ${togglingUserId === user.id ? 'opacity-60' : ''}`}
                        title={`Set ${user.username || 'user'} as ${user.status === 'active' ? 'inactive' : 'active'}`}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            user.status === 'active' ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
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

      {isCreateModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-70 overflow-y-auto p-4 sm:p-6">
            <button type="button" className="absolute inset-0 bg-slate-950/48" onClick={closeCreateModal} aria-label="Close modal"></button>

            <div className="relative z-10 mx-auto my-8 w-full max-w-[860px] overflow-hidden rounded-3xl border-l-[6px] border-brand bg-white shadow-2xl shadow-brand/10">
              <div className="flex items-start justify-between gap-4 p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <UserCog className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-gray-900">New User</h2>
                    <p className="mt-1 text-sm text-gray-500">Create a new application user from an employee profile.</p>
                  </div>
                </div>
                <button
                  onClick={closeCreateModal}
                  className="w-10 h-10 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 mx-auto" />
                </button>
              </div>

              <div className="max-h-[calc(100vh-11rem)] space-y-6 overflow-y-auto px-6 pb-6">
                <FormSection icon={User} title="Employee Info">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <SearchableSelect
                        label="Employee"
                        required
                        value={selectedEmployeeLabel}
                        options={employeeOptions}
                        placeholder="Select employee"
                        searchablePlaceholder="Search employee..."
                        onChange={handleEmployeeChange}
                        error={createErrors.employeeId}
                        isOpen={openSelectId === 'employee'}
                        onToggle={() => setOpenSelectId((prev) => (prev === 'employee' ? null : 'employee'))}
                        onClose={() => setOpenSelectId(null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={createForm.department}
                        readOnly
                        disabled
                        className={readOnlyFieldClassName()}
                        placeholder="Department"
                      />
                      {createErrors.department ? <p className="text-xs text-rose-600">{createErrors.department}</p> : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={createForm.designation}
                        readOnly
                        disabled
                        className={readOnlyFieldClassName()}
                        placeholder="Designation"
                      />
                      {createErrors.designation ? <p className="text-xs text-rose-600">{createErrors.designation}</p> : null}
                    </div>
                  </div>
                </FormSection>

                <FormSection icon={UserCog} title="User Info">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">User ID</label>
                      <input
                        type="text"
                        value={previewUserId}
                        readOnly
                        disabled
                        className={readOnlyFieldClassName()}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={createForm.username}
                        onChange={(event) => updateCreateFormField('username', event.target.value)}
                        className={createInputClassName('username')}
                        placeholder="Enter username"
                      />
                      {createErrors.username ? <p className="text-xs text-rose-600">{createErrors.username}</p> : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={createForm.password}
                        onChange={(event) => updateCreateFormField('password', event.target.value)}
                        className={createInputClassName('password')}
                        placeholder="Enter password"
                      />
                      {createErrors.password ? <p className="text-xs text-rose-600">{createErrors.password}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={createForm.confirmPassword}
                        onChange={(event) => updateCreateFormField('confirmPassword', event.target.value)}
                        className={createInputClassName('confirmPassword')}
                        placeholder="Confirm password"
                      />
                      {createErrors.confirmPassword ? <p className="text-xs text-rose-600">{createErrors.confirmPassword}</p> : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Lock</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700">
                        <input
                          type="radio"
                          name="user-lock-status"
                          checked={createForm.locked === true}
                          onChange={() => updateCreateFormField('locked', true)}
                          className="h-4 w-4 accent-[var(--color-brand)]"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700">
                        <input
                          type="radio"
                          name="user-lock-status"
                          checked={createForm.locked === false}
                          onChange={() => updateCreateFormField('locked', false)}
                          className="h-4 w-4 accent-[var(--color-brand)]"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Description</label>
                    <textarea
                      value={createForm.description}
                      onChange={(event) => updateCreateFormField('description', event.target.value)}
                      rows={5}
                      className={`${createInputClassName('description')} resize-none`}
                      placeholder="Add notes or description"
                    />
                  </div>
                </FormSection>

                {employeesError ? (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {employeesError}
                  </div>
                ) : null}

                {createErrors.form ? (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {createErrors.form}
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                  <button
                    onClick={closeCreateModal}
                    disabled={isCreatingUser}
                    className="rounded-xl border border-gray-200 bg-white px-8 py-3 font-bold text-gray-500 transition-all hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={isCreatingUser || employeesLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3 font-bold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover disabled:opacity-70"
                  >
                    <Plus className="h-4 w-4" />
                    {isCreatingUser ? 'Saving...' : 'Save User'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

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
