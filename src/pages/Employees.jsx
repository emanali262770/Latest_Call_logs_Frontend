import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Filter,
  Download,
  Save,
  Calendar,
  ChevronDown,
  Trash2,
  FileText,
  Edit2,
  MoreHorizontal,
  Upload,
  User,
  Building2,
  Landmark,
  Settings,
  Shield,
  Search,
  ArrowLeft,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button, Badge } from '@/src/components/ui/Card';
import TablePagination from '@/src/components/ui/TablePagination';
import TableLoader from '@/src/components/ui/TableLoader';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { revealForm } from '@/src/animations/gsapAnimations';
import { useAccessControl } from '@/src/context/AccessControlContext';
import { employeeService } from '@/src/services/employee.service';
import { bankService } from '@/src/services/bank.service';
import { departmentService } from '@/src/services/department.service';
import { designationService } from '@/src/services/designation.service';
import { dutyShiftService } from '@/src/services/dutyShift.service';
import { employeeTypeService } from '@/src/services/employeeType.service';
import { userService } from '@/src/services/user.service';
import { required, validateEmail, validateForm } from '@/src/lib/validation';
import { clearAuthSession, getStoredUser, hasPermission } from '@/src/lib/auth';

const EMPTY_FORM = {
  emp_id: '',
  employee_name: '',
  profile_image: null,
  father_name: '',
  address: '',
  city: '',
  sex: '',
  email: '',
  phone: '',
  mobile: '',
  cnic_no: '',
  date_of_birth: '',
  qualification: '',
  blood_group: '',
  department: '',
  designation: '',
  employee_type: '',
  hiring_date: '',
  duty_shift: '',
  bank: '',
  account_number: '',
  software_username: '',
  software_password: '',
  software_confirm_password: '',
  enabled: true,
};

const FORM_RULES = {
  employee_name: [(value) => required(value, 'Employee name')],
  address: [(value) => required(value, 'Address')],
  city: [(value) => required(value, 'City')],
  sex: [(value) => required(value, 'Sex')],
  phone: [(value) => required(value, 'Phone number')],
  email: [(value) => required(value, 'Email'), (value) => validateEmail(value)],
  cnic_no: [(value) => required(value, 'CNIC')],
  department: [(value) => required(value, 'Department')],
  designation: [(value) => required(value, 'Designation')],
  employee_type: [(value) => required(value, 'Employee type')],
  duty_shift: [(value) => required(value, 'Duty shift')],
  bank: [(value) => required(value, 'Bank')],
  account_number: [(value) => required(value, 'Account number')],
};

function initialsFromName(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function formatStatusLabel(enabled, status) {
  if (typeof enabled === 'boolean') return enabled ? 'Active' : 'Inactive';
  return String(status || 'inactive').toLowerCase() === 'active' ? 'Active' : 'Inactive';
}

function getNextEmployeeId(employees) {
  const ids = (employees || [])
    .map((item) => String(item?.emp_id || '').trim())
    .filter(Boolean);

  if (!ids.length) return 'EMP-00001';

  let best = { prefix: 'EMP-', number: 0, width: 5 };

  ids.forEach((id) => {
    const match = id.match(/^(.*?)(\d+)$/);
    if (!match) return;

    const prefix = match[1] || 'EMP-';
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

function toComparableSet(values) {
  return new Set(
    values
      .flatMap((value) => {
        if (value === null || value === undefined || value === '') return [];
        return [String(value).trim(), String(value).trim().toLowerCase()];
      })
      .filter(Boolean),
  );
}

function isCurrentUsersEmployee(employee) {
  const storedUser = getStoredUser();
  if (!storedUser || !employee) return false;

  const currentUserKeys = toComparableSet([
    storedUser.id,
    storedUser.employeeId,
    storedUser.username,
    storedUser.fullName,
  ]);

  const employeeKeys = toComparableSet([
    employee.id,
    employee.emp_id,
    employee.employee_name,
    employee.email,
    employee.raw?.id,
    employee.raw?._id,
    employee.raw?.uuid,
    employee.raw?.employee_id,
    employee.raw?.emp_id,
    employee.raw?.linked_user_id,
    employee.raw?.linked_user?.id,
    employee.raw?.linked_user?.employee_id,
    employee.raw?.linked_user?.username,
    employee.raw?.linked_user?.UserName,
    employee.raw?.linked_user?.employee_name,
  ]);

  return Array.from(currentUserKeys).some((key) => employeeKeys.has(key));
}

function FieldLabel({ children, required: isRequired = false }) {
  return (
    <label className="ml-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
      {children}
      {isRequired ? <span className="ml-1 text-rose-500">*</span> : null}
    </label>
  );
}

const INPUT_BASE_CLASS_NAME =
  'mt-[2px] h-9 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:outline-none focus:ring-4';

const SECTION_PANEL_CLASS_NAME =
  'rounded-[1.4rem] border border-slate-300/80 bg-slate-50/95 ';

function FormSection({ icon: Icon, title, subtitle, children, className = '' }) {
  return (
    <section className={`${SECTION_PANEL_CLASS_NAME} ${className}`}>
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

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isSetupLoading, setIsSetupLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [formMode, setFormMode] = useState(null);
  const [activeEmployeeId, setActiveEmployeeId] = useState(null);
  const [createUser, setCreateUser] = useState(false);
  const [enabledEmployee, setEnabledEmployee] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [pageError, setPageError] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [setupOptions, setSetupOptions] = useState({
    departments: [],
    designations: [],
    employeeTypes: [],
    dutyShifts: [],
    banks: [],
  });

  const tableContainerRef = useRef(null);
  const formContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const { toasts, toast, removeToast } = useThemeToast();
  const { loadUsers } = useAccessControl();

  const canCreate = hasPermission('EMPLOYEE.EMPLOYEE.CREATE');
  const canEdit = hasPermission('EMPLOYEE.EMPLOYEE.UPDATE');
  const canDelete = hasPermission('EMPLOYEE.EMPLOYEE.DELETE');

  const showForm = formMode !== null;

  const visibleEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return employees;

    return employees.filter((employee) => {
      const value = [
        employee.employee_name,
        employee.email,
        employee.department,
        employee.designation,
        employee.emp_id,
      ]
        .join(' ')
        .toLowerCase();

      return value.includes(query);
    });
  }, [employees, searchQuery]);

  const paginatedEmployees = useMemo(
    () => visibleEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize, visibleEmployees],
  );

  const totalPages = Math.max(1, Math.ceil(visibleEmployees.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const previewEmpId = useMemo(() => {
    if (formMode === 'create') return getNextEmployeeId(employees);
    return formData.emp_id || '';
  }, [employees, formData.emp_id, formMode]);

  const activeEmployee = useMemo(
    () => employees.find((item) => item.id === activeEmployeeId) || null,
    [employees, activeEmployeeId],
  );

  const showCreateSoftwareUser =
    formMode === 'edit' &&
    activeEmployee &&
    !activeEmployee.raw?.linked_user_id &&
    !activeEmployee.raw?.linked_user;

  const loadEmployees = useCallback(async (query = '') => {
    setIsListLoading(true);
    setPageError('');

    try {
      const response = await employeeService.list(query);
      setEmployees(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setPageError(requestError.message || 'Could not fetch employees.');
    } finally {
      setIsListLoading(false);
    }
  }, []);

  const loadSetupOptions = useCallback(async () => {
    setIsSetupLoading(true);

    try {
      const [departmentRes, designationRes, employeeTypeRes, dutyShiftRes, bankRes] = await Promise.allSettled([
        departmentService.list(''),
        designationService.list(''),
        employeeTypeService.list(''),
        dutyShiftService.list(''),
        bankService.list(''),
      ]);

      setSetupOptions({
        departments: (departmentRes.status === 'fulfilled' ? departmentRes.value?.data || [] : []).map((item) => item.name),
        designations: (designationRes.status === 'fulfilled' ? designationRes.value?.data || [] : []).map((item) => item.name),
        employeeTypes: (employeeTypeRes.status === 'fulfilled' ? employeeTypeRes.value?.data || [] : []).map((item) => item.name),
        dutyShifts: (dutyShiftRes.status === 'fulfilled' ? dutyShiftRes.value?.data || [] : []).map((item) => item.name),
        banks: (bankRes.status === 'fulfilled' ? bankRes.value?.data || [] : []).map((item) => item.name),
      });
    } catch (requestError) {
      setPageError(requestError.message || 'Could not load dropdown options.');
    } finally {
      setIsSetupLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadEmployees(searchQuery.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [loadEmployees, searchQuery]);

  useEffect(() => {
    loadSetupOptions();
  }, [loadSetupOptions]);

  useEffect(() => {
    revealForm(tableContainerRef.current, formContainerRef.current, showForm);
  }, [showForm]);

  const updateFormField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setActiveEmployeeId(null);
    setCreateUser(false);
    setFormData(EMPTY_FORM);
    setEnabledEmployee(true);
    setProfileImagePreview('');
    setFormErrors({});
    setApiError('');
  };

  const handleOpenEdit = async (employeeId) => {
    setFormMode('edit');
    setActiveEmployeeId(employeeId);
    setCreateUser(false);
    setFormErrors({});
    setApiError('');
    setIsSubmitting(true);

    try {
      const response = await employeeService.getById(employeeId);
      const employee = response?.data;

      if (!employee) {
        throw new Error('Employee record not found.');
      }

      setFormData({
        ...EMPTY_FORM,
        ...employee,
        profile_image: null,
        software_username: employee.username || '',
        software_password: '',
        software_confirm_password: '',
      });
      setEnabledEmployee(!!employee.enabled);
      setProfileImagePreview(employee.profile_image || '');
    } catch (requestError) {
      setPageError(requestError.message || 'Could not load employee details.');
      setFormMode(null);
      setActiveEmployeeId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (employee) => {
    setDeleteTarget(employee);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const shouldLogoutAfterDelete = isCurrentUsersEmployee(deleteTarget);
      await employeeService.remove(deleteTarget.id);
      toast.success('Employee deleted', 'The employee record has been removed.');
      setDeleteTarget(null);

      if (shouldLogoutAfterDelete) {
        clearAuthSession();
        window.location.replace('/login');
        return;
      }

      await Promise.all([
        loadEmployees(searchQuery.trim()),
        loadUsers(),
      ]);
    } catch (requestError) {
      toast.error('Delete failed', requestError.message || 'Could not delete employee.');
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    updateFormField('profile_image', file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const closeForm = () => {
    setFormMode(null);
    setActiveEmployeeId(null);
    setCreateUser(false);
    setFormData(EMPTY_FORM);
    setProfileImagePreview('');
    setEnabledEmployee(true);
    setFormErrors({});
    setApiError('');
  };

  const handleSubmit = async () => {
    const preparedValues = {
      ...formData,
      enabled: enabledEmployee,
    };

    delete preparedValues.software_username;
    delete preparedValues.software_password;
    delete preparedValues.software_confirm_password;

    if (formMode === 'create') {
      delete preparedValues.emp_id;
    }

    const errors = validateForm(preparedValues, FORM_RULES);

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      setApiError('Please complete all required fields before saving the employee.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFormErrors({});
    setApiError('');
    setIsSubmitting(true);

    try {
      if (formMode === 'edit' && activeEmployeeId) {
        const response = await employeeService.update(activeEmployeeId, preparedValues);
        toast.success('Employee updated', response?.message || 'Employee updated successfully.');
      } else {
        const response = await employeeService.create(preparedValues);
        const createdEmployeeId =
          response?.data?.emp_id ||
          response?.data?.data?.emp_id ||
          response?.data?.employee?.emp_id ||
          '';

        const createdMessage = createdEmployeeId
          ? `Employee ID: ${createdEmployeeId}`
          : (response?.message || 'Employee created successfully.');

        toast.success('Employee created', createdMessage);
      }

      await Promise.all([
        loadEmployees(searchQuery.trim()),
        loadUsers(),
      ]);
      closeForm();
    } catch (requestError) {
      const message = requestError.message || 'Could not save employee record.';
      setApiError(message);
      toast.error('Save failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

 

  const inputClassName = (field) =>
    `${INPUT_BASE_CLASS_NAME} ${
      formErrors[field]
        ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
        : 'border-slate-300/80 focus:border-slate-500 focus:ring-slate-200/70'
    }`;

  const selectClassName = (field) =>
    `${INPUT_BASE_CLASS_NAME} appearance-none pr-10 ${
      formErrors[field]
        ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
        : 'border-slate-300/80 focus:border-slate-500 focus:ring-slate-200/70'
    }`;

  return (
      <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        {showForm ? null : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Employees</h1>
            <p className="mt-1 text-gray-500">Manage and monitor your organization&apos;s human resources.</p>
          </div>
        )}
        {!showForm && (
          <div className="flex items-center gap-3">
            <Button variant="outline" icon={<Download className="w-4 h-4" />}>Export Data</Button>
            {canCreate && (
              <Button onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />} className="bg-brand hover:bg-brand-hover shadow-brand/20">
                Add New Employee
              </Button>
            )}
          </div>
        )}
      </div>

      {pageError && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700 font-medium">
          {pageError}
        </div>
      )}

      <div ref={tableContainerRef} className="space-y-6">
        <Card className="p-0 border-none shadow-xl shadow-gray-200/50">
          <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, email or department..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" icon={<Filter className="w-4 h-4" />}>Advanced Filter</Button>
              <div className="h-6 w-px bg-gray-200"></div>
              <p className="text-sm text-gray-400 font-medium">
                Showing <span className="text-gray-900 font-bold">{visibleEmployees.length}</span> results
              </p>
            </div>
          </div>
          <div className="w-full overflow-hidden rounded-4xl border border-gray-100 bg-white/80 backdrop-blur-xl shadow-2xl shadow-gray-200/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 first:rounded-tl-4xl">Photo</th>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Employee</th>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Department</th>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Designation</th>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Type</th>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Duty Shift</th>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Bank</th>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60">Status</th>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] border-b border-gray-100/60 text-right last:rounded-tr-4xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {isListLoading ? (
                    <tr>
                      <td colSpan={9} className="px-8 py-6 text-center">
                        <TableLoader label="Loading employees..." />
                      </td>
                    </tr>
                  ) : visibleEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-6">
                          <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 shadow-inner">
                            <MoreHorizontal className="w-10 h-10" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-bold text-gray-900 tracking-tight">No records found</p>
                            <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">We couldn&apos;t find any employees matching your current search or filter criteria.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((item) => (
                      <tr key={item.id} className="hover:bg-indigo-50/40 transition-all duration-500 group relative">
                        <td className="px-6 py-6 border-b border-gray-50/30 group-last:border-none">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-light border border-brand/10 flex items-center justify-center text-brand font-bold text-xs">
                            {item.profile_image ? (
                              <img src={item.profile_image} alt={item.employee_name} className="w-full h-full object-cover" />
                            ) : (
                              initialsFromName(item.employee_name)
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none transition-colors group-hover:text-gray-900">
                          <p className="font-bold text-gray-900 leading-tight">{item.employee_name}</p>
                          <p className="text-[11px] text-gray-400 font-medium mt-0.5 font-mono">{item.emp_id || '-'}</p>
                        </td>
                        <td className="px-6 py-6 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none">{item.department || '-'}</td>
                        <td className="px-6 py-6 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none">{item.designation || '-'}</td>
                        <td className="px-6 py-6 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none">{item.employee_type || '-'}</td>
                        <td className="px-6 py-6 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none">{item.duty_shift || '-'}</td>
                        <td className="px-6 py-6 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none">{item.bank || '-'}</td>
                        <td className="px-6 py-6 text-sm text-gray-600 font-bold border-b border-gray-50/30 group-last:border-none">
                          <Badge variant={formatStatusLabel(item.enabled, item.status) === 'Active' ? 'green' : 'gray'}>
                            {formatStatusLabel(item.enabled, item.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-6 text-right border-b border-gray-50/30 group-last:border-none">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                            {canEdit && (
                              <button
                                onClick={() => handleOpenEdit(item.id)}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-brand hover:bg-white hover:shadow-xl hover:shadow-brand/20 rounded-2xl transition-all duration-300 active:scale-95"
                                title="Edit Record"
                              >
                                <Edit2 className="w-4.5 h-4.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(item)}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-white hover:shadow-xl hover:shadow-rose-100/50 rounded-2xl transition-all duration-300 active:scale-95"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {visibleEmployees.length > 10 ? (
            <div className="px-6 pb-6">
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={visibleEmployees.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                itemLabel="results"
              />
            </div>
          ) : null}
        </Card>
      </div>

      <div ref={formContainerRef} className="hidden mx-auto w-full max-w-6xl">
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-300/80 bg-white">
          <div className="border-b border-slate-300/80 bg-slate-100/30 px-8 py-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300/80 bg-white text-brand shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[20px] font-bold text-gray-700">Employee Form</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formMode === 'create'
                      ? 'Register a new employee into the system database with full details.'
                      : 'Update the employee record in the system.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </div>
          </div>

          <div className="space-y-6 px-8 py-8">
            {apiError && (
              <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700 font-medium">
                {apiError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="space-y-2 xl:col-span-3">
                <FieldLabel># Emp ID</FieldLabel>
                <input
                  type="text"
                  value={previewEmpId}
                  readOnly
                  disabled
                  className="mt-[2px] h-9 w-full cursor-not-allowed rounded-xl border border-slate-300/80 bg-slate-100 px-4 font-mono text-sm text-slate-500 outline-none"
                />
              </div>
            </div>

            <FormSection icon={User} title="Personal Info" subtitle="Basic personal details and contact information.">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="space-y-2 xl:col-span-4">
                <FieldLabel>Profile Image</FieldLabel>
                <div className="flex min-w-0 items-center gap-5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300/80 bg-white transition-all hover:border-brand/40 hover:bg-brand-light/20"
                  >
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-300 mb-1" />
                        <span className="text-[10px] text-gray-400 font-bold">Upload</span>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleImageUpload} />
                  <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-500">
                    PNG/JPG up to 2MB.
                    <br />
                    <span className="text-slate-400">Optional - uploads to Cloudinary through backend.</span>
                  </p>
                </div>
              </div>

                <div className="space-y-2 xl:col-span-4">
                  <FieldLabel required><User className="inline w-3 h-3 mr-1 -mt-0.5" /> Employee Name</FieldLabel>
                  <input type="text" value={formData.employee_name} onChange={(event) => updateFormField('employee_name', event.target.value)} placeholder="Full name" className={inputClassName('employee_name')} />
                  {formErrors.employee_name && <p className="text-xs text-rose-600 ml-1">{formErrors.employee_name}</p>}
                </div>
                <div className="space-y-2 xl:col-span-4">
                  <FieldLabel>Father Name</FieldLabel>
                  <input type="text" value={formData.father_name} onChange={(event) => updateFormField('father_name', event.target.value)} placeholder="Father name" className={inputClassName('father_name')} />
                  {formErrors.father_name && <p className="text-xs text-rose-600 ml-1">{formErrors.father_name}</p>}
                </div>
                <div className="space-y-2 xl:col-span-4">
                  <FieldLabel required>Address</FieldLabel>
                  <input type="text" value={formData.address} onChange={(event) => updateFormField('address', event.target.value)} placeholder="Address" className={inputClassName('address')} />
                  {formErrors.address && <p className="text-xs text-rose-600 ml-1">{formErrors.address}</p>}
                </div>

                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel required>City</FieldLabel>
                  <input type="text" value={formData.city} onChange={(event) => updateFormField('city', event.target.value)} placeholder="City" className={inputClassName('city')} />
                  {formErrors.city && <p className="text-xs text-rose-600 ml-1">{formErrors.city}</p>}
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel required>Gender</FieldLabel>
                  <div className="relative">
                    <select value={formData.sex} onChange={(event) => updateFormField('sex', event.target.value)} className={selectClassName('sex')}>
                      <option value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {formErrors.sex && <p className="text-xs text-rose-600 ml-1">{formErrors.sex}</p>}
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel required>Phone</FieldLabel>
                  <input type="tel" value={formData.phone} onChange={(event) => updateFormField('phone', event.target.value)} placeholder="Phone" className={inputClassName('phone')} />
                  {formErrors.phone && <p className="text-xs text-rose-600 ml-1">{formErrors.phone}</p>}
                </div>

                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel required>Email</FieldLabel>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => updateFormField('email', event.target.value)}
                    placeholder="name@example.com"
                    className={inputClassName('email')}
                  />
                  {formErrors.email && <p className="text-xs text-rose-600 ml-1">{formErrors.email}</p>}
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel>Mobile</FieldLabel>
                  <input type="tel" value={formData.mobile} onChange={(event) => updateFormField('mobile', event.target.value)} placeholder="Mobile" className={inputClassName('mobile')} />
                  {formErrors.mobile && <p className="text-xs text-rose-600 ml-1">{formErrors.mobile}</p>}
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel required>CNIC No</FieldLabel>
                  <input type="text" value={formData.cnic_no} onChange={(event) => updateFormField('cnic_no', event.target.value)} placeholder="XXXXX-XXXXXXX-X" className={`${inputClassName('cnic_no')} font-mono`} />
                  {formErrors.cnic_no && <p className="text-xs text-rose-600 ml-1">{formErrors.cnic_no}</p>}
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel>Date of Birth</FieldLabel>
                  <input type="date" value={formData.date_of_birth} onChange={(event) => updateFormField('date_of_birth', event.target.value)} className={inputClassName('date_of_birth')} />
                  {formErrors.date_of_birth && <p className="text-xs text-rose-600 ml-1">{formErrors.date_of_birth}</p>}
                </div>

                <div className="space-y-2 xl:col-span-6">
                  <FieldLabel>Qualification</FieldLabel>
                  <input type="text" value={formData.qualification} onChange={(event) => updateFormField('qualification', event.target.value)} placeholder="e.g. BS Computer Science" className={inputClassName('qualification')} />
                  {formErrors.qualification && <p className="text-xs text-rose-600 ml-1">{formErrors.qualification}</p>}
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel>Blood Group</FieldLabel>
                  <input type="text" value={formData.blood_group} onChange={(event) => updateFormField('blood_group', event.target.value)} placeholder="e.g. O+" className={inputClassName('blood_group')} />
                  {formErrors.blood_group && <p className="text-xs text-rose-600 ml-1">{formErrors.blood_group}</p>}
                </div>
              </div>
            </FormSection>

            <FormSection icon={Building2} title="Job Info" subtitle="Department, designation, and shift assignment.">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel required>Department</FieldLabel>
                  <div className="relative">
                    <select value={formData.department} onChange={(event) => updateFormField('department', event.target.value)} className={selectClassName('department')}>
                      <option value="">Select department</option>
                      {setupOptions.departments.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {formErrors.department && <p className="text-xs text-rose-600 ml-1">{formErrors.department}</p>}
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel required>Designation</FieldLabel>
                  <div className="relative">
                    <select value={formData.designation} onChange={(event) => updateFormField('designation', event.target.value)} className={selectClassName('designation')}>
                      <option value="">Select designation</option>
                      {setupOptions.designations.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {formErrors.designation && <p className="text-xs text-rose-600 ml-1">{formErrors.designation}</p>}
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel required>Employee Type</FieldLabel>
                  <div className="relative">
                    <select value={formData.employee_type} onChange={(event) => updateFormField('employee_type', event.target.value)} className={selectClassName('employee_type')}>
                      <option value="">Select type</option>
                      {setupOptions.employeeTypes.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {formErrors.employee_type && <p className="text-xs text-rose-600 ml-1">{formErrors.employee_type}</p>}
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel><Calendar className="inline w-3 h-3 mr-1 -mt-0.5" /> Hiring Date</FieldLabel>
                  <input type="date" value={formData.hiring_date} onChange={(event) => updateFormField('hiring_date', event.target.value)} className={inputClassName('hiring_date')} />
                  {formErrors.hiring_date && <p className="text-xs text-rose-600 ml-1">{formErrors.hiring_date}</p>}
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel required>Duty Shift</FieldLabel>
                  <div className="relative">
                    <select value={formData.duty_shift} onChange={(event) => updateFormField('duty_shift', event.target.value)} className={selectClassName('duty_shift')}>
                      <option value="">Select duty shift</option>
                      {setupOptions.dutyShifts.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {formErrors.duty_shift && <p className="text-xs text-rose-600 ml-1">{formErrors.duty_shift}</p>}
                </div>
              </div>
            </FormSection>

            <FormSection icon={Landmark} title="Bank Info" subtitle="Banking details for salary disbursement.">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel required>Bank</FieldLabel>
                  <div className="relative">
                    <select value={formData.bank} onChange={(event) => updateFormField('bank', event.target.value)} className={selectClassName('bank')}>
                      <option value="">Select bank</option>
                      {setupOptions.banks.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {formErrors.bank && <p className="text-xs text-rose-600 ml-1">{formErrors.bank}</p>}
                </div>
                <div className="space-y-2 xl:col-span-4">
                  <FieldLabel required>Account Number</FieldLabel>
                  <input type="text" value={formData.account_number} onChange={(event) => updateFormField('account_number', event.target.value)} placeholder="e.g. 1234-5678-9012" className={`${inputClassName('account_number')} font-mono`} />
                  {formErrors.account_number && <p className="text-xs text-rose-600 ml-1">{formErrors.account_number}</p>}
                </div>
              </div>
            </FormSection>

            <FormSection icon={Settings} title="Settings" subtitle="Status and access configuration.">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="space-y-2 xl:col-span-3">
                <FieldLabel>Enabled</FieldLabel>
                <button
                  type="button"
                  onClick={() => setEnabledEmployee(!enabledEmployee)}
                  className={`group/toggle mt-[2px] flex h-9 w-full items-center justify-between rounded-xl border px-4 transition-all duration-300 ${enabledEmployee ? 'border-brand/20 bg-brand-light/40 shadow-sm shadow-brand/5' : 'border-slate-300/80 bg-white hover:border-slate-400 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-300 ${enabledEmployee ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-500'}`}>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={enabledEmployee ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'} /></svg>
                    </div>
                    <span className={`text-sm font-semibold transition-colors duration-300 ${enabledEmployee ? 'text-brand' : 'text-slate-600'}`}>{enabledEmployee ? 'Yes' : 'No'}</span>
                  </div>
                  <div className={`relative h-6 w-11 rounded-full transition-all duration-300 ${enabledEmployee ? 'bg-brand shadow-inner shadow-brand/20' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${enabledEmployee ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </button>
              </div>
              </div>
            </FormSection>

            <div className="flex items-center justify-between rounded-2xl border border-slate-300/80 bg-slate-50/95 px-6 py-4">
              <p className="text-xs leading-6 text-slate-600">
                Review required fields before saving. All sections must be completed for a valid employee record.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-300/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isSetupLoading}
                  className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover disabled:opacity-70"
                >
                  <Save className="h-4.5 w-4.5" />
                  {isSubmitting ? 'Saving...' : formMode === 'edit' ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Employee"
        description={deleteTarget ? `Are you sure you want to delete ${deleteTarget.employee_name || 'this employee'}?` : ''}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}
