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
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button, Badge } from '@/src/components/ui/Card';
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
import { hasPermission } from '@/src/lib/auth';

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
  father_name: [(value) => required(value, 'Father name')],
  address: [(value) => required(value, 'Address')],
  city: [(value) => required(value, 'City')],
  sex: [(value) => required(value, 'Sex')],
  email: [(value) => required(value, 'Email'), (value) => validateEmail(value)],
  mobile: [(value) => required(value, 'Mobile')],
  cnic_no: [(value) => required(value, 'CNIC')],
  date_of_birth: [(value) => required(value, 'Date of birth')],
  qualification: [(value) => required(value, 'Qualification')],
  blood_group: [(value) => required(value, 'Blood group')],
  department: [(value) => required(value, 'Department')],
  designation: [(value) => required(value, 'Designation')],
  employee_type: [(value) => required(value, 'Employee type')],
  hiring_date: [(value) => required(value, 'Hiring date')],
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

  const canCreate = hasPermission('employees.create');
  const canEdit = hasPermission('employees.update');
  const canDelete = hasPermission('employees.delete');

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
      const [departmentRes, designationRes, employeeTypeRes, dutyShiftRes, bankRes] = await Promise.all([
        departmentService.list(''),
        designationService.list(''),
        employeeTypeService.list(''),
        dutyShiftService.list(''),
        bankService.list(''),
      ]);

      setSetupOptions({
        departments: (departmentRes?.data || []).map((item) => item.name),
        designations: (designationRes?.data || []).map((item) => item.name),
        employeeTypes: (employeeTypeRes?.data || []).map((item) => item.name),
        dutyShifts: (dutyShiftRes?.data || []).map((item) => item.name),
        banks: (bankRes?.data || []).map((item) => item.name),
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
      await employeeService.remove(deleteTarget.id);
      toast.success('Employee deleted', 'The employee record has been removed.');
      setDeleteTarget(null);
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

  const handleCreateSoftwareUser = async () => {
    const errors = {};

    if (!formData.software_username.trim()) {
      errors.software_username = 'Username is required.';
    }

    if (!formData.software_password.trim()) {
      errors.software_password = 'Password is required.';
    }

    if (!formData.software_confirm_password.trim()) {
      errors.software_confirm_password = 'Confirm password is required.';
    } else if (formData.software_password !== formData.software_confirm_password) {
      errors.software_confirm_password = 'Confirm password must match password.';
    }

    if (!activeEmployeeId) {
      errors.software_username = errors.software_username || 'Please save the employee first.';
    }

    if (Object.keys(errors).length) {
      setFormErrors((prev) => ({ ...prev, ...errors }));
      setApiError('Please complete the software user fields correctly.');
      return;
    }

    setFormErrors((prev) => ({
      ...prev,
      software_username: '',
      software_password: '',
      software_confirm_password: '',
    }));
    setApiError('');
    setIsCreatingUser(true);

    try {
      const response = await userService.create({
        username: formData.software_username.trim(),
        password: formData.software_password,
        employee_id: activeEmployeeId,
      });

      toast.success('Software user created', response?.message || 'User account created successfully.');
      closeForm();
      await Promise.all([
        loadEmployees(searchQuery.trim()),
        loadUsers(),
      ]);
    } catch (requestError) {
      const message = requestError.message || 'Could not create software user.';
      setApiError(message);
      toast.error('User creation failed', message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const inputClassName = (field) =>
    `w-full px-4 py-3 bg-white border rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none ${
      formErrors[field] ? 'border-rose-400' : 'border-gray-200'
    }`;

  const selectClassName = (field) =>
    `w-full px-4 py-3 bg-white border rounded-xl text-sm text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none appearance-none ${
      formErrors[field] ? 'border-rose-400' : 'border-gray-200'
    }`;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Employees</h1>
          <p className="text-gray-500 mt-1">Manage and monitor your organization&apos;s human resources.</p>
        </div>
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
                    visibleEmployees.map((item) => (
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
        </Card>
      </div>

      <div ref={formContainerRef} className="hidden max-w-5xl">
        <div className="bg-white rounded-3xl border-l-[6px] border-brand shadow-2xl shadow-brand/10 overflow-hidden">
          <div className="p-8 pb-6 flex items-start gap-6">
            <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center text-brand shadow-inner">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {formMode === 'create' ? 'New Employee Entry' : 'Edit Employee'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {formMode === 'create'
                  ? 'Register a new employee into the system database with full details.'
                  : 'Update the employee record in the system.'}
              </p>
            </div>
          </div>

          <div className="px-8 pb-8 space-y-10">
            {apiError && (
              <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700 font-medium">
                {apiError}
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center gap-3 py-2.5 px-5 bg-brand-light/50 rounded-xl border border-brand/10">
                <div className="w-1.5 h-5 bg-brand rounded-full"></div>
                <span className="text-sm font-extrabold text-brand uppercase tracking-wider"># Identity</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 ml-1"># Emp ID</label>
                  <input
                    type="text"
                    value={previewEmpId}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-500 focus:outline-none cursor-not-allowed font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 py-2.5 px-5 bg-brand-light/50 rounded-xl border border-brand/10">
                <div className="w-1.5 h-5 bg-brand rounded-full"></div>
                <span className="text-sm font-extrabold text-brand uppercase tracking-wider">
                  <User className="inline w-4 h-4 mr-1 -mt-0.5" /> Personal Info
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 ml-1">Profile Image</label>
                <div className="flex items-center gap-5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand/40 hover:bg-brand-light/20 transition-all overflow-hidden"
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
                  <p className="text-xs text-gray-400 leading-relaxed">
                    PNG/JPG up to 2MB.
                    <br />
                    <span className="text-gray-300">Optional - uploads to Cloudinary through backend.</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1"><User className="inline w-3 h-3 mr-1 -mt-0.5" /> Employee Name</label>
                  <input type="text" value={formData.employee_name} onChange={(event) => updateFormField('employee_name', event.target.value)} placeholder="Full name" className={inputClassName('employee_name')} />
                  {formErrors.employee_name && <p className="text-xs text-rose-600 ml-1">{formErrors.employee_name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Father Name</label>
                  <input type="text" value={formData.father_name} onChange={(event) => updateFormField('father_name', event.target.value)} placeholder="Father name" className={inputClassName('father_name')} />
                  {formErrors.father_name && <p className="text-xs text-rose-600 ml-1">{formErrors.father_name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Address</label>
                  <input type="text" value={formData.address} onChange={(event) => updateFormField('address', event.target.value)} placeholder="Address" className={inputClassName('address')} />
                  {formErrors.address && <p className="text-xs text-rose-600 ml-1">{formErrors.address}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">City</label>
                  <input type="text" value={formData.city} onChange={(event) => updateFormField('city', event.target.value)} placeholder="City" className={inputClassName('city')} />
                  {formErrors.city && <p className="text-xs text-rose-600 ml-1">{formErrors.city}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Sex</label>
                  <div className="relative">
                    <select value={formData.sex} onChange={(event) => updateFormField('sex', event.target.value)} className={selectClassName('sex')}>
                      <option value="">Select Sex</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {formErrors.sex && <p className="text-xs text-rose-600 ml-1">{formErrors.sex}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(event) => updateFormField('phone', event.target.value)} placeholder="Phone" className={inputClassName('phone')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => updateFormField('email', event.target.value)}
                    placeholder="name@example.com"
                    className={inputClassName('email')}
                  />
                  {formErrors.email && <p className="text-xs text-rose-600 ml-1">{formErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Mobile</label>
                  <input type="tel" value={formData.mobile} onChange={(event) => updateFormField('mobile', event.target.value)} placeholder="Mobile" className={inputClassName('mobile')} />
                  {formErrors.mobile && <p className="text-xs text-rose-600 ml-1">{formErrors.mobile}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">CNIC No</label>
                  <input type="text" value={formData.cnic_no} onChange={(event) => updateFormField('cnic_no', event.target.value)} placeholder="XXXXX-XXXXXXX-X" className={`${inputClassName('cnic_no')} font-mono`} />
                  {formErrors.cnic_no && <p className="text-xs text-rose-600 ml-1">{formErrors.cnic_no}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Date of Birth</label>
                  <input type="date" value={formData.date_of_birth} onChange={(event) => updateFormField('date_of_birth', event.target.value)} className={inputClassName('date_of_birth')} />
                  {formErrors.date_of_birth && <p className="text-xs text-rose-600 ml-1">{formErrors.date_of_birth}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Qualification</label>
                  <input type="text" value={formData.qualification} onChange={(event) => updateFormField('qualification', event.target.value)} placeholder="e.g. BS Computer Science" className={inputClassName('qualification')} />
                  {formErrors.qualification && <p className="text-xs text-rose-600 ml-1">{formErrors.qualification}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Blood Group</label>
                  <input type="text" value={formData.blood_group} onChange={(event) => updateFormField('blood_group', event.target.value)} placeholder="e.g. O+" className={inputClassName('blood_group')} />
                  {formErrors.blood_group && <p className="text-xs text-rose-600 ml-1">{formErrors.blood_group}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 py-2.5 px-5 bg-brand-light/50 rounded-xl border border-brand/10">
                <div className="w-1.5 h-5 bg-brand rounded-full"></div>
                <span className="text-sm font-extrabold text-brand uppercase tracking-wider">
                  <Building2 className="inline w-4 h-4 mr-1 -mt-0.5" /> Job Info
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Department</label>
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
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Designation</label>
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
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Employee Type</label>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1"><Calendar className="inline w-3 h-3 mr-1 -mt-0.5" /> Hiring Date</label>
                  <input type="date" value={formData.hiring_date} onChange={(event) => updateFormField('hiring_date', event.target.value)} className={inputClassName('hiring_date')} />
                  {formErrors.hiring_date && <p className="text-xs text-rose-600 ml-1">{formErrors.hiring_date}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Duty Shift</label>
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
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 py-2.5 px-5 bg-brand-light/50 rounded-xl border border-brand/10">
                <div className="w-1.5 h-5 bg-brand rounded-full"></div>
                <span className="text-sm font-extrabold text-brand uppercase tracking-wider">
                  <Landmark className="inline w-4 h-4 mr-1 -mt-0.5" /> Bank Info
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Bank</label>
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
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 ml-1">Account Number</label>
                  <input type="text" value={formData.account_number} onChange={(event) => updateFormField('account_number', event.target.value)} placeholder="e.g. 1234-5678-9012" className={`${inputClassName('account_number')} font-mono`} />
                  {formErrors.account_number && <p className="text-xs text-rose-600 ml-1">{formErrors.account_number}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 py-2.5 px-5 bg-brand-light/50 rounded-xl border border-brand/10">
                <div className="w-1.5 h-5 bg-brand rounded-full"></div>
                <span className="text-sm font-extrabold text-brand uppercase tracking-wider">
                  <Settings className="inline w-4 h-4 mr-1 -mt-0.5" /> Settings
                </span>
              </div>
              <label className="flex items-center gap-3 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={enabledEmployee}
                  onChange={(event) => setEnabledEmployee(event.target.checked)}
                  className="w-4 h-4 rounded accent-brand"
                />
                <span className="text-sm font-semibold text-gray-700">Enabled Employee</span>
              </label>
            </div>

            {showCreateSoftwareUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 py-2.5 px-5 bg-brand-light/50 rounded-xl border border-brand/10">
                  <div className="w-1.5 h-5 bg-brand rounded-full"></div>
                  <span className="text-sm font-extrabold text-brand uppercase tracking-wider">
                    <Shield className="inline w-4 h-4 mr-1 -mt-0.5" /> Create Software User
                  </span>
                </div>

                <label className="flex items-center gap-3 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={createUser}
                    onChange={(event) => setCreateUser(event.target.checked)}
                    className="w-4 h-4 rounded accent-brand"
                  />
                  <span className="text-sm font-semibold text-gray-700">Create software user for this employee</span>
                </label>

                {createUser && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 ml-1">Username</label>
                      <input
                        type="text"
                        value={formData.software_username}
                        onChange={(event) => updateFormField('software_username', event.target.value)}
                        placeholder="Enter username"
                        className={inputClassName('software_username')}
                      />
                      {formErrors.software_username && <p className="text-xs text-rose-600 ml-1">{formErrors.software_username}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 ml-1">Password</label>
                      <input
                        type="password"
                        value={formData.software_password}
                        onChange={(event) => updateFormField('software_password', event.target.value)}
                        placeholder="Enter password"
                        className={inputClassName('software_password')}
                      />
                      {formErrors.software_password && <p className="text-xs text-rose-600 ml-1">{formErrors.software_password}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-600 ml-1">Confirm Password</label>
                      <input
                        type="password"
                        value={formData.software_confirm_password}
                        onChange={(event) => updateFormField('software_confirm_password', event.target.value)}
                        placeholder="Confirm password"
                        className={inputClassName('software_confirm_password')}
                      />
                      {formErrors.software_confirm_password && <p className="text-xs text-rose-600 ml-1">{formErrors.software_confirm_password}</p>}
                    </div>
                  </div>
                )}

                {createUser && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleCreateSoftwareUser}
                      disabled={isCreatingUser}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover disabled:opacity-70"
                    >
                      <Save className="h-4 w-4" />
                      {isCreatingUser ? 'Saving User...' : 'Save User'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-2">
              <button
                onClick={closeForm}
                className="px-10 py-4 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 hover:text-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isSetupLoading}
                className="flex items-center gap-3 cursor-pointer px-10 py-4 bg-brand text-white rounded-2xl font-bold hover:bg-brand-hover transition-all shadow-xl shadow-brand/20 disabled:opacity-70"
              >
                <Save className="w-5 h-5" />
                {isSubmitting ? 'Saving...' : formMode === 'edit' ? 'Update Employee' : 'Save Employee'}
              </button>
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
