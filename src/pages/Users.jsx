import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Eye, EyeOff, KeyRound, Plus, Search, Search as SearchIcon, Shield, Trash2, User, UserCog, Users as UsersIcon, X } from 'lucide-react';
import { AccessControlShell, Modal } from '@/src/components/access-control/AccessControlShell';
import { Card, Button, Badge } from '@/src/components/ui/Card';
import TablePagination from '@/src/components/ui/TablePagination';
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

const FIELD_LABEL_CLASS_NAME = 'ml-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600';
const INPUT_BASE_CLASS_NAME =
  'mt-[2px] h-9 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:outline-none focus:ring-4';
const VALID_INPUT_CLASS_NAME = 'border-slate-300/80 focus:border-slate-500 focus:ring-slate-200/70';
const ERROR_INPUT_CLASS_NAME = 'border-rose-400 focus:border-rose-400 focus:ring-rose-100';
const SECTION_PANEL_CLASS_NAME =
  'rounded-[1.4rem] border border-slate-300/80 bg-slate-50/95 shadow-[0_12px_30px_rgba(15,23,42,0.06)]';

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
      <label className={FIELD_LABEL_CLASS_NAME}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className={`flex ${INPUT_BASE_CLASS_NAME} items-center justify-between text-left ${
            error ? ERROR_INPUT_CLASS_NAME : VALID_INPUT_CLASS_NAME
          }`}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || placeholder}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60">
            <div className="border-b border-gray-100 p-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchablePlaceholder}
                  className="h-10 w-full rounded-xl border border-slate-300/80 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
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
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
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

function FormSection({ icon: Icon, title, subtitle, children }) {
  return (
    <section className={SECTION_PANEL_CLASS_NAME}>
      <div className="flex items-center justify-between border-b border-slate-300/80 px-6 py-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function readOnlyFieldClassName() {
  return 'mt-[2px] h-9 w-full cursor-not-allowed rounded-xl border border-slate-300/80 bg-slate-100 px-4 text-sm text-slate-500 outline-none';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const paginatedUsers = useMemo(
    () => visibleUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize, visibleUsers],
  );

  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
    `${INPUT_BASE_CLASS_NAME} ${
      createErrors[field] ? ERROR_INPUT_CLASS_NAME : VALID_INPUT_CLASS_NAME
    }`;

  return (
    <AccessControlShell
      title="Access Control"
      subtitle="Manage groups, permissions, and user assignments."
    >
      <Card className="border-none p-0 shadow-xl shadow-gray-200/50">
        <div className="flex flex-col gap-4 border-b border-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-gray-400"><span className="font-bold text-gray-900">{visibleUsers.length}</span> Records</p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="h-4 w-4" />}
              className="bg-brand shadow-brand/20 hover:bg-brand-hover"
            >
              New User
            </Button>
          </div>
        </div>

        <div className="w-full overflow-hidden rounded-4xl border border-gray-100 bg-white/80 shadow-2xl shadow-gray-200/30 backdrop-blur-xl">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 first:rounded-tl-4xl">Full Name</th>
                <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Username</th>
                <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Designation</th>
                <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Status</th>
                <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Toggle</th>
                <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Created</th>
                <th className="border-b border-gray-100/60 px-6 py-6 text-right text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 last:rounded-tr-4xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {usersLoading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-6 text-center">
                    <TableLoader label="Loading users..." />
                  </td>
                </tr>
              ) : usersError ? (
                <tr>
                  <td colSpan={7} className="px-8 py-6">
                    <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {usersError}
                    </div>
                  </td>
                </tr>
              ) : visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-sm font-medium text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                    <td className="border-b border-gray-50/30 px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/10 bg-brand-light text-brand">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{user.fullName || '-'}</span>
                      </div>
                    </td>
                    <td className="border-b border-gray-50/30 px-6 py-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-[12px] font-bold text-brand">
                          {(user.username?.[0] || '?').toUpperCase()}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">{user.username || '-'}</span>
                      </div>
                    </td>
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">{user.designation || '-'}</td>
                    <td className="border-b border-gray-50/30 px-6 py-6">
                      <Badge variant={user.status === 'active' ? 'green' : 'gray'}>{user.status}</Badge>
                    </td>
                    <td className="border-b border-gray-50/30 px-6 py-6">
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
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="border-b border-gray-50/30 px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setAssigningUserId(user.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95"
                          title="Groups"
                        >
                          <Shield className="h-4.5 w-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetUserId(user.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95"
                          title="Reset Password"
                        >
                          <KeyRound className="h-4.5 w-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(user.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50 active:scale-95"
                          title="Delete"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
        {visibleUsers.length > 10 ? (
          <div className="px-6 pb-6">
            <TablePagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={visibleUsers.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemLabel="records"
            />
          </div>
        ) : null}
      </Card>

      {isCreateModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-70 overflow-y-auto p-4 sm:p-6">
            <button type="button" className="absolute inset-0 bg-slate-950/48" onClick={closeCreateModal} aria-label="Close modal"></button>

            <div className="relative z-10 mx-auto my-8 w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-slate-300/80 bg-white">
              <div className="border-b border-slate-300/80 bg-slate-100/30 px-8 py-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300/80 bg-white text-brand shadow-sm">
                      <UserCog className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[20px] font-bold text-gray-700">User Form</p>
                      <p className="mt-1 text-sm text-slate-600">Create a new application user from an employee profile.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X className="h-3.5 w-3.5" />
                    Close
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(100vh-11rem)] space-y-6 overflow-y-auto px-8 py-8">
                <FormSection icon={User} title="Employee Info" subtitle="Select employee and view department details.">
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="space-y-2 xl:col-span-4">
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

                    <div className="space-y-2 xl:col-span-4">
                      <label className={FIELD_LABEL_CLASS_NAME}>
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

                    <div className="space-y-2 xl:col-span-4">
                      <label className={FIELD_LABEL_CLASS_NAME}>
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

                <FormSection icon={UserCog} title="User Info" subtitle="Credentials, lock status, and description.">
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="space-y-2 xl:col-span-3">
                      <label className={FIELD_LABEL_CLASS_NAME}>User ID</label>
                      <input
                        type="text"
                        value={previewUserId}
                        readOnly
                        disabled
                        className={readOnlyFieldClassName()}
                      />
                    </div>

                    <div className="space-y-2 xl:col-span-3">
                      <label className={FIELD_LABEL_CLASS_NAME}>
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
                    <div className="space-y-2 xl:col-span-3">
                      <label className={FIELD_LABEL_CLASS_NAME}>
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

                    <div className="space-y-2 xl:col-span-3">
                      <label className={FIELD_LABEL_CLASS_NAME}>
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
                  <div className="space-y-2 xl:col-span-3">
                    <label className={FIELD_LABEL_CLASS_NAME}>Lock</label>
                    <button
                      type="button"
                      onClick={() => updateCreateFormField('locked', !createForm.locked)}
                      className={`group/toggle mt-[2px] flex h-9 w-full items-center justify-between rounded-xl border px-4 transition-all duration-300 ${createForm.locked ? 'border-rose-200 bg-rose-50/50 shadow-sm shadow-rose-100/30' : 'border-slate-300/80 bg-white hover:border-slate-400 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-300 ${createForm.locked ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={createForm.locked ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M5 13l4 4L19 7'} /></svg>
                        </div>
                        <span className={`text-sm font-semibold transition-colors duration-300 ${createForm.locked ? 'text-rose-600' : 'text-slate-600'}`}>{createForm.locked ? 'Locked' : 'Unlocked'}</span>
                      </div>
                      <div className={`relative h-6 w-11 rounded-full transition-all duration-300 ${createForm.locked ? 'bg-rose-500 shadow-inner shadow-rose-600/20' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${createForm.locked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </button>
                  </div>

                  <div className="space-y-2 xl:col-span-8">
                    <label className={FIELD_LABEL_CLASS_NAME}>Description</label>
                    <textarea
                      value={createForm.description}
                      onChange={(event) => updateCreateFormField('description', event.target.value)}
                      rows={5}
                      className={`mt-[2px] min-h-[96px] w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:outline-none focus:ring-4 ${createErrors.description ? ERROR_INPUT_CLASS_NAME : VALID_INPUT_CLASS_NAME}`}
                      placeholder="Add notes or description"
                    />
                  </div>
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

                <div className="flex items-center justify-between rounded-2xl border border-slate-300/80 bg-slate-50/95 px-6 py-4">
                  <p className="text-xs leading-6 text-slate-600">Review all fields before saving the user.</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={closeCreateModal}
                      disabled={isCreatingUser}
                      className="rounded-xl border border-slate-300/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateUser}
                      disabled={isCreatingUser || employeesLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover disabled:opacity-70"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {isCreatingUser ? 'Saving...' : 'Save User'}
                    </button>
                  </div>
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
