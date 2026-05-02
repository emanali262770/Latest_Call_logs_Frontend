import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Calendar,
  ChevronDown,
  Clock,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import TableLoader from '@/src/components/ui/TableLoader';
import TablePagination from '@/src/components/ui/TablePagination';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { hasPermission } from '@/src/lib/auth';
import AccessDenied from '@/src/pages/AccessDenied';
import { meetingDetailService } from '@/src/services/meetingDetail.service';

const STATUS_OPTIONS = [
  { value: 'Follow Up Required', className: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'Not Interested', className: 'border-rose-100 bg-rose-50 text-rose-600' },
  { value: 'Already Installed', className: 'border-blue-100 bg-blue-50 text-blue-600' },
  { value: 'Phone Not Responding', className: 'border-amber-100 bg-amber-50 text-amber-600' },
];
const REMARK_STATUSES = ['Not Interested', 'Already Installed', 'Phone Not Responding'];

const ACTION_OPTIONS = ['Send Profile', 'Send Quotation', 'Product Information', 'Require Visit/Meeting'];
const CONTACT_METHODS = [
  { value: 'By Visit', icon: MapPin },
  { value: 'By Phone', icon: Phone },
  { value: 'By Email', icon: Mail },
];

const STATUS_UI_TO_API = {
  'Follow Up Required': 'follow_up_required',
  'Not Interested': 'not_interested',
  'Already Installed': 'already_installed',
  'Phone Not Responding': 'phone_not_responding',
};

const STATUS_API_TO_UI = {
  follow_up_required: 'Follow Up Required',
  not_interested: 'Not Interested',
  already_installed: 'Already Installed',
  phone_not_responding: 'Phone Not Responding',
};

const ACTION_UI_TO_API = {
  'Send Profile': 'send_profile',
  'Send Quotation': 'send_quotation',
  'Product Information': 'product_information',
  'Require Visit/Meeting': 'require_visit_meeting',
};

const ACTION_API_TO_UI = {
  send_profile: 'Send Profile',
  send_quotation: 'Send Quotation',
  product_information: 'Product Information',
  require_visit_meeting: 'Require Visit/Meeting',
};

const CONTACT_UI_TO_API = {
  'By Visit': 'by_visit',
  'By Phone': 'by_phone',
  'By Email': 'by_email',
};

const CONTACT_API_TO_UI = {
  by_visit: 'By Visit',
  by_phone: 'By Phone',
  by_email: 'By Email',
};

function apiToForm(data) {
  return {
    id: data.id,
    companyName: data.customerName || '',
    person: data.person || '',
    designation: data.designation || '',
    serviceId: data.serviceId || null,
    product: data.forProduct || '',
    status: STATUS_API_TO_UI[data.status] || 'Follow Up Required',
    nextFollowUpDate: data.nextFollowupDate || '',
    time: data.nextFollowupTime ? data.nextFollowupTime.slice(0, 5) : '',
    nextVisitDetails: data.nextVisitDetails || '',
    action: ACTION_API_TO_UI[data.action] || '',
    referenceProvidedBy: data.referenceProvidedBy || '',
    referToStaffId: data.referToStaffId || null,
    referToStaff: data.referToStaffName || '',
    contactMethod: CONTACT_API_TO_UI[data.contactMethod] || '',
    remarks: data.remarks || '',
  };
}

function buildPayload(form) {
  const status = STATUS_UI_TO_API[form.status] || 'follow_up_required';
  const base = { status, service_id: form.serviceId || null };
  if (form.status === 'Follow Up Required') {
    return {
      ...base,
      next_followup_date: form.nextFollowUpDate || null,
      next_followup_time: form.time || null,
      next_visit_details: form.nextVisitDetails || null,
      action: ACTION_UI_TO_API[form.action] || null,
      reference_provided_by: form.referenceProvidedBy || null,
      refer_to_staff_id: form.referToStaffId || null,
      contact_method: CONTACT_UI_TO_API[form.contactMethod] || null,
    };
  }
  return { ...base, remarks: form.remarks || null };
}

const INPUT_CLASS =
  'mt-[2px] h-9 w-full rounded-xl border border-slate-300/80 bg-white px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70';
const READONLY_CLASS =
  'mt-[2px] h-9 w-full rounded-xl border border-slate-300/80 bg-slate-100 px-4 text-sm text-slate-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none';
const SECTION_PANEL_CLASS = 'rounded-[1.4rem] border border-slate-300/80 bg-slate-50/50';
const SECTION_HEADER_CLASS = 'flex items-center justify-between border-b border-slate-300/80 px-6 py-4';

function FieldLabel({ children }) {
  return <label className="ml-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{children}</label>;
}

function displayValue(value) {
  const normalized = String(value ?? '').trim();
  return !normalized || normalized === '?' ? '-' : normalized;
}

function formatDateTime(value) {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(parsed);
}

function displayDateTime(meeting) {
  const nextFollowupDate = String(meeting?.nextFollowupDate || '').trim();
  const nextFollowupTime = String(meeting?.nextFollowupTime || '').trim();

  if (nextFollowupDate) {
    const isoLikeValue = nextFollowupTime
      ? `${nextFollowupDate}T${nextFollowupTime}`
      : `${nextFollowupDate}T00:00:00`;
    const formattedFollowup = formatDateTime(isoLikeValue);
    if (formattedFollowup !== '-') return formattedFollowup;
  }

  return formatDateTime(meeting?.createdAt);
}

function StatusBadge({ status }) {
  const option = STATUS_OPTIONS.find((item) => item.value === status) || STATUS_OPTIONS[0];
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${option.className}`}>
      {status}
    </span>
  );
}

function IconInput({ icon: Icon, children }) {
  return (
    <div className="relative">
      {createElement(Icon, {
        className: 'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400',
      })}
      {children}
    </div>
  );
}

function SearchableSelect({ selectId, label, value, options, placeholder, searchablePlaceholder, isOpen, onToggle, onClose, onChange }) {
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        onClose();
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.toLowerCase().includes(normalized));
  }, [options, query]);

  return (
    <div className={`space-y-2 ${isOpen ? 'relative z-40' : 'relative z-0'}`} ref={containerRef}>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <button
          type="button"
          onClick={() => onToggle(selectId)}
          className="mt-[2px] flex h-9 w-full items-center justify-between rounded-xl border border-slate-300/80 bg-white px-4 text-left text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70"
        >
          <span className={value ? 'text-slate-900' : 'text-gray-400'}>{value || placeholder}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60">
            <div className="border-b border-gray-100 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setQuery('');
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-all ${
                      value === option ? 'bg-brand-light text-brand' : 'text-slate-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{option}</span>
                    {value === option ? <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">Selected</span> : null}
                  </button>
                ))
              ) : (
                <p className="px-4 py-6 text-center text-sm text-gray-400">No results found.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MeetingEditForm({ meeting, services, staff, onClose, onSave }) {
  const [form, setForm] = useState(meeting);
  const [openSelect, setOpenSelect] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!meeting) return null;

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const shouldShowFollowUpDetails = form.status === 'Follow Up Required';
  const shouldShowRemarks = REMARK_STATUSES.includes(form.status);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSave(form);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-300/80 bg-white">
        <div className="border-b border-slate-300/80 bg-slate-100/30 px-8 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300/80 bg-white text-brand shadow-sm">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-gray-700">Edit Meeting</h2>
                <p className="mt-1 text-sm text-slate-600">Update meeting follow-up details and next action.</p>
              </div>
            </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close edit meeting"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          </div>
        </div>

        <div className="px-8 py-8">
          <div className="space-y-6">
            <section className={SECTION_PANEL_CLASS}>
              <div className={SECTION_HEADER_CLASS}>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Meeting Info</h3>
                  <p className="mt-1 text-xs text-slate-500">Customer, person, designation, and product information.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-12">
                <div className="space-y-2 xl:col-span-5">
                  <FieldLabel>Customer Name</FieldLabel>
                  <IconInput icon={Building2}>
                    <input value={displayValue(form.companyName)} readOnly className={`${READONLY_CLASS} pl-10`} />
                  </IconInput>
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel>Person</FieldLabel>
                  <IconInput icon={User}>
                    <input value={displayValue(form.person)} readOnly className={`${READONLY_CLASS} pl-10`} />
                  </IconInput>
                </div>
                <div className="space-y-2 xl:col-span-4">
                  <FieldLabel>Designation</FieldLabel>
                  <IconInput icon={BriefcaseBusiness}>
                    <input value={displayValue(form.designation)} readOnly className={`${READONLY_CLASS} pl-10`} />
                  </IconInput>
                </div>
                <div className="space-y-2 xl:col-span-5">
                  <SearchableSelect
                    selectId="product"
                    label="For Product"
                    value={form.product}
                    options={services.map((s) => s.name)}
                    placeholder="Select product"
                    searchablePlaceholder="Search products..."
                    isOpen={openSelect === 'product'}
                    onToggle={(selectId) => setOpenSelect((current) => (current === selectId ? null : selectId))}
                    onClose={() => setOpenSelect(null)}
                    onChange={(value) => {
                      const svc = services.find((s) => s.name === value);
                      setForm((prev) => ({ ...prev, product: svc?.name || value, serviceId: svc?.id || null }));
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="flex flex-wrap gap-3">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField('status', option.value)}
                  className={`flex h-11 min-w-[190px] items-center gap-2 rounded-xl border px-4 text-left text-sm font-semibold transition-all ${
                    form.status === option.value
                      ? `${option.className} ring-2 ring-emerald-200`
                      : `${option.className} opacity-80 hover:opacity-100`
                  }`}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current">
                    {form.status === option.value ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
                  </span>
                  {option.value}
                </button>
              ))}
            </section>

            {shouldShowRemarks ? (
              <section className={SECTION_PANEL_CLASS}>
                <div className={SECTION_HEADER_CLASS}>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Remarks</h3>
                    <p className="mt-1 text-xs text-slate-500">Add a short note for this meeting outcome.</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                    <Edit2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="p-6">
                  <textarea
                    value={form.remarks || ''}
                    onChange={(event) => updateField('remarks', event.target.value)}
                    placeholder="Write remarks here..."
                    className="mt-0.5 min-h-24 w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
                  />
                </div>
              </section>
            ) : null}

            {shouldShowFollowUpDetails ? (
              <>
                <section className={SECTION_PANEL_CLASS}>
                  <div className={SECTION_HEADER_CLASS}>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Follow Up Schedule</h3>
                      <p className="mt-1 text-xs text-slate-500">Next date, time, and visit notes.</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-12">
                    <div className="space-y-2 xl:col-span-4">
                      <FieldLabel>Next Follow-up Date</FieldLabel>
                      <IconInput icon={Calendar}>
                        <input
                          type="date"
                          value={form.nextFollowUpDate}
                          onChange={(event) => updateField('nextFollowUpDate', event.target.value)}
                          className={`${INPUT_CLASS} pl-10`}
                        />
                      </IconInput>
                    </div>
                    <div className="space-y-2 xl:col-span-3">
                      <FieldLabel>Time</FieldLabel>
                      <IconInput icon={Clock}>
                        <input
                          type="time"
                          value={form.time}
                          onChange={(event) => updateField('time', event.target.value)}
                          className={`${INPUT_CLASS} pl-10`}
                        />
                      </IconInput>
                    </div>
                    <div className="space-y-2 xl:col-span-12">
                      <FieldLabel>Next Visit Details</FieldLabel>
                      <textarea
                        value={form.nextVisitDetails}
                        onChange={(event) => updateField('nextVisitDetails', event.target.value)}
                        placeholder="Write here..."
                        className="mt-[2px] min-h-24 w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
                      />
                    </div>
                  </div>
                </section>

                <section className={SECTION_PANEL_CLASS}>
                  <div className={SECTION_HEADER_CLASS}>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Actions</h3>
                      <p className="mt-1 text-xs text-slate-500">Select the action required for this meeting.</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                      <Send className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 p-6 xl:grid-cols-12">
                    {ACTION_OPTIONS.map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => updateField('action', action)}
                        className="flex h-11 items-center gap-3 rounded-xl border border-slate-300/80 bg-white px-4 text-sm font-semibold text-slate-900 transition-all hover:border-brand/30 hover:bg-brand-light/30 xl:col-span-4"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-400">
                          {form.action === action ? <span className="h-2 w-2 rounded-full bg-brand" /> : null}
                        </span>
                        {action}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                  <div className="space-y-2 xl:col-span-5">
                    <FieldLabel>Reference Provided By</FieldLabel>
                    <input
                      value={form.referenceProvidedBy}
                      onChange={(event) => updateField('referenceProvidedBy', event.target.value)}
                      placeholder="Enter reference name"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-2 xl:col-span-4">
                    <SearchableSelect
                      selectId="referToStaff"
                      label="Refer To Staff"
                      value={form.referToStaff}
                      options={staff.map((s) => s.name)}
                      placeholder="Select Staff"
                      searchablePlaceholder="Search staff..."
                      isOpen={openSelect === 'referToStaff'}
                      onToggle={(selectId) => setOpenSelect((current) => (current === selectId ? null : selectId))}
                      onClose={() => setOpenSelect(null)}
                      onChange={(value) => {
                        const member = staff.find((s) => s.name === value);
                        setForm((prev) => ({ ...prev, referToStaff: member?.name || value, referToStaffId: member?.id || null }));
                      }}
                    />
                  </div>
                </div>

                <section className={SECTION_PANEL_CLASS}>
                  <div className={SECTION_HEADER_CLASS}>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Contact Method</h3>
                      <p className="mt-1 text-xs text-slate-500">How the next communication should be handled.</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                      <Phone className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 p-6">
                    {CONTACT_METHODS.map(({ value, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateField('contactMethod', value)}
                        className="flex h-11 items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-4 text-sm font-semibold text-slate-900 transition-all hover:border-brand/30 hover:bg-brand-light/30"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-400">
                          {form.contactMethod === value ? <span className="h-2 w-2 rounded-full bg-brand" /> : null}
                        </span>
                        {createElement(icon, { className: 'h-4 w-4 text-slate-500' })}
                        {value}
                      </button>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-7 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className={`inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover ${isSubmitting ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Update Meeting'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeetingDetail() {
  const canRead = hasPermission('MEETINGS.MEETING_DETAIL.READ');
  const canEdit = hasPermission('MEETINGS.MEETING_DETAIL.UPDATE');
  const canDelete = hasPermission('MEETINGS.MEETING_DETAIL.DELETE');
  const hasRowActions = canEdit || canDelete;

  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toasts, toast, removeToast } = useThemeToast();
  const showForm = !!editingMeeting;

  const loadMeetings = useCallback(async (query = '') => {
    if (!canRead) {
      setMeetings([]);
      setListError('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setListError('');
    try {
      const response = await meetingDetailService.list(query);
      setMeetings(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setListError(requestError.message || 'Could not load meetings.');
    } finally {
      setIsLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadMeetings(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, loadMeetings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    let isActive = true;

    if (!canRead) {
      setStaff([]);
      setServices([]);
      return undefined;
    }

    Promise.all([
      meetingDetailService.listStaff(),
      meetingDetailService.listServices(),
    ]).then(([staffRes, servicesRes]) => {
      if (!isActive) return;
      setStaff(Array.isArray(staffRes?.data) ? staffRes.data : []);
      setServices(Array.isArray(servicesRes?.data) ? servicesRes.data : []);
    }).catch(() => {});
    return () => { isActive = false; };
  }, [canRead]);
 
  

  const paginatedMeetings = useMemo(
    () => meetings.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, meetings, pageSize],
  );

  const totalPages = Math.max(1, Math.ceil(meetings.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleEdit = async (meetingId) => {
    setEditLoading(true);
    try {
      const response = await meetingDetailService.getById(meetingId);
      setEditingMeeting(apiToForm(response.data));
    } catch (requestError) {
      toast.error('Could not load meeting', requestError.message || 'Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSave = async (form) => {
    const payload = buildPayload(form);
    try {
      const response = await meetingDetailService.update(form.id, payload);
      toast.success('Meeting updated', response?.message || 'Meeting details have been saved successfully.');
      setEditingMeeting(null);
      await loadMeetings(searchQuery.trim());
    } catch (requestError) {
      toast.error('Update failed', requestError.message || 'Could not update meeting.');
      throw requestError;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await meetingDetailService.remove(deleteTarget.id);
      toast.success('Meeting deleted', 'Meeting has been removed.');
      setDeleteTarget(null);
      await loadMeetings(searchQuery.trim());
    } catch (requestError) {
      toast.error('Delete failed', requestError.message || 'Could not delete meeting.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!canRead) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        {showForm ? null : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Meeting Detail
            </h1>
            <p className="mt-1 text-gray-500">Book your meetings</p>
          </div>
        )}
      </div>

      {showForm ? (
        <MeetingEditForm meeting={editingMeeting} services={services} staff={staff} onClose={() => setEditingMeeting(null)} onSave={handleSave} />
      ) : (
      <Card className="border-none p-0 shadow-xl shadow-gray-200/50">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search meetings..."
              className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <p className="text-sm font-medium text-gray-400">
            <span className="font-bold text-gray-900">{meetings.length}</span> Records
          </p>
        </div>
        <div className="mx-6 border-b border-gray-50" />

        <div className="mx-6 mb-6 mt-6 w-auto overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white/90  backdrop-blur-xl">
          {isLoading ? (
            <TableLoader label="Loading meetings..." />
          ) : listError ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <p className="text-sm font-medium text-rose-600">{listError}</p>
              <button type="button" onClick={() => loadMeetings(searchQuery.trim())} className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50">Retry</button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                  <th className="w-px whitespace-nowrap border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Sr</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Customer Name</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Person</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">For Product</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Status</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Assigned Staff</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Date & Time</th>
                  {hasRowActions ? <th className="border-b border-gray-100/60 px-6 py-6 text-right text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {paginatedMeetings.map((meeting, index) => (
                  <tr key={meeting.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-bold text-gray-500 whitespace-nowrap">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="max-w-[280px] truncate border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {displayValue(meeting.customerName)}
                    </td>
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{displayValue(meeting.person)}</td>
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{displayValue(meeting.forProduct)}</td>
                    <td className="border-b border-gray-50/30 px-6 py-6 whitespace-nowrap">
                      <StatusBadge status={STATUS_API_TO_UI[meeting.status] || meeting.status} />
                    </td>
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{displayValue(meeting.referToStaffName)}</td>
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">
                      {displayDateTime(meeting)}
                    </td>
                    {hasRowActions ? (
                      <td className="border-b border-gray-50/30 px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              disabled={editLoading}
                              onClick={() => handleEdit(meeting.id)}
                              className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95 disabled:opacity-50"
                              title="Edit meeting"
                            >
                              <Edit2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => setDeleteTarget(meeting)}
                              className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50 active:scale-95 disabled:opacity-50"
                              title="Delete meeting"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!paginatedMeetings.length ? (
                  <tr>
                    <td colSpan={hasRowActions ? 8 : 7} className="px-8 py-20 text-center text-sm font-medium text-gray-400">
                      No meetings found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          )}
          {!isLoading && !listError && meetings.length > pageSize ? (
            <div className="px-6 pb-6">
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={meetings.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                itemLabel="records"
              />
            </div>
          ) : null}
        </div>
      </Card>
      )}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Meeting"
        message={`Are you sure you want to delete this meeting for "${deleteTarget?.customerName || ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        isLoading={isSaving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}
