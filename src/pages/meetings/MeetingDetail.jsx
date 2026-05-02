import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
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
import TablePagination from '@/src/components/ui/TablePagination';

const STATUS_OPTIONS = [
  { value: 'Follow Up Required', className: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'Not Interested', className: 'border-rose-100 bg-rose-50 text-rose-600' },
  { value: 'Already Installed', className: 'border-blue-100 bg-blue-50 text-blue-600' },
  { value: 'Phone Responding', className: 'border-amber-100 bg-amber-50 text-amber-600' },
];

const ACTION_OPTIONS = ['Send Profile', 'Send Quotation', 'Product Information', 'Require Visit/Meeting'];
const CONTACT_METHODS = [
  { value: 'By Visit', icon: MapPin },
  { value: 'By Phone', icon: Phone },
  { value: 'By Email', icon: Mail },
];

const STAFF_OPTIONS = ['Aimen Khan', 'Ali Raza', 'Sana Ahmed', 'Usman Tariq'];
const PRODUCT_OPTIONS = ['shoes', 'Biometric', 'CCTV Camera', 'IP CCTV Camera 4MP Night Vision', 'HikVision 8 Channel NVR'];

const CUSTOMER_OPTIONS = [
  {
    customerName: 'Burning Brownie Lahore DHA',
    person: 'Hammad',
    designation: 'Manager',
  },
  {
    customerName: 'Extraction Coffee DHA',
    person: 'Usman',
    designation: 'Operations Lead',
  },
  {
    customerName: 'Test Solutions 25',
    person: 'Ali',
    designation: 'Director',
  },
];

const MOCK_MEETINGS = [
  {
    id: 1,
    companyName: 'Burning Brownie Lahore DHA',
    person: '',
    designation: '',
    product: 'shoes',
    status: 'Follow Up Required',
    assignedStaff: 'Aimen Khan',
    nextFollowUpDate: '',
    time: '',
    nextVisitDetails: '',
    action: 'Send Profile',
    referenceProvidedBy: '',
    referToStaff: '',
    contactMethod: 'By Visit',
  },
  {
    id: 2,
    companyName: 'Extraction Coffee DHA',
    person: '',
    designation: '',
    product: 'Biometric',
    status: 'Follow Up Required',
    assignedStaff: 'Aimen Khan',
    nextFollowUpDate: '',
    time: '',
    nextVisitDetails: '',
    action: 'Send Quotation',
    referenceProvidedBy: '',
    referToStaff: '',
    contactMethod: 'By Phone',
  },
  {
    id: 3,
    companyName: 'Test Solutions 25',
    person: 'Ali',
    designation: '',
    product: '',
    status: 'Follow Up Required',
    assignedStaff: '',
    nextFollowUpDate: '',
    time: '',
    nextVisitDetails: '',
    action: 'Product Information',
    referenceProvidedBy: '',
    referToStaff: '',
    contactMethod: 'By Email',
  },
];

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

function displayDateTime(meeting) {
  const date = displayValue(meeting?.nextFollowUpDate);
  const time = displayValue(meeting?.time);
  const hasDate = date !== '-';
  const hasTime = time !== '-';
  if (!hasDate && !hasTime) return '-';
  return [hasDate ? date : '', hasTime ? time : ''].filter(Boolean).join(' ');
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

function MeetingEditForm({ meeting, onClose, onSave }) {
  const [form, setForm] = useState(meeting);
  const [openSelect, setOpenSelect] = useState(null);

  if (!meeting) return null;

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const shouldShowFollowUpDetails = form.status === 'Follow Up Required';
  const handleCustomerChange = (customerName) => {
    const selectedCustomer = CUSTOMER_OPTIONS.find((customer) => customer.customerName === customerName);

    setForm((prev) => ({
      ...prev,
      companyName: customerName,
      person: selectedCustomer?.person || '',
      designation: selectedCustomer?.designation || '',
    }));
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
                  <SearchableSelect
                    selectId="companyName"
                    label="Customer Name"
                    value={form.companyName}
                    options={CUSTOMER_OPTIONS.map((item) => item.customerName)}
                    placeholder="Select customer"
                    searchablePlaceholder="Search customers..."
                    isOpen={openSelect === 'companyName'}
                    onToggle={(selectId) => setOpenSelect((current) => (current === selectId ? null : selectId))}
                    onClose={() => setOpenSelect(null)}
                    onChange={handleCustomerChange}
                  />
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
                    options={PRODUCT_OPTIONS}
                    placeholder="Select product"
                    searchablePlaceholder="Search products..."
                    isOpen={openSelect === 'product'}
                    onToggle={(selectId) => setOpenSelect((current) => (current === selectId ? null : selectId))}
                    onClose={() => setOpenSelect(null)}
                    onChange={(value) => updateField('product', value)}
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
                      options={STAFF_OPTIONS}
                      placeholder="Select Staff"
                      searchablePlaceholder="Search staff..."
                      isOpen={openSelect === 'referToStaff'}
                      onToggle={(selectId) => setOpenSelect((current) => (current === selectId ? null : selectId))}
                      onClose={() => setOpenSelect(null)}
                      onChange={(value) => updateField('referToStaff', value)}
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
                onClick={() => onSave(form)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover"
              >
                <Send className="h-4 w-4" />
                Update Meeting
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeetingDetail() {
  const [meetings, setMeetings] = useState(MOCK_MEETINGS);
  const [query, setQuery] = useState('');
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const showForm = !!editingMeeting;

  const filteredMeetings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return meetings;
    return meetings.filter((meeting) =>
      [meeting.companyName, meeting.person, meeting.product, meeting.status, meeting.assignedStaff]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [meetings, query]);

    const paginatedMeetings = useMemo(
      () => filteredMeetings.slice((currentPage - 1) * pageSize, currentPage * pageSize),
      [currentPage, filteredMeetings, pageSize],
    );

    const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / pageSize));

    useEffect(() => {
      setCurrentPage(1);
    }, [query]);

    useEffect(() => {
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }, [currentPage, totalPages]);

  const handleSave = (updatedMeeting) => {
    setMeetings((prev) => prev.map((meeting) => (meeting.id === updatedMeeting.id ? updatedMeeting : meeting)));
    setEditingMeeting(null);
  };

  const handleDelete = (meetingId) => {
    setMeetings((prev) => prev.filter((meeting) => meeting.id !== meetingId));
  };

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
        <MeetingEditForm meeting={editingMeeting} onClose={() => setEditingMeeting(null)} onSave={handleSave} />
      ) : (
      <Card className="border-none p-0 shadow-xl shadow-gray-200/50">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search meetings..."
              className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <p className="text-sm font-medium text-gray-400">
            <span className="font-bold text-gray-900">{filteredMeetings.length}</span> Records
          </p>
        </div>
        <div className="mx-6 border-b border-gray-50" />

        <div className="mx-6 mb-6 mt-6 w-auto overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white/90  backdrop-blur-xl">
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
                  <th className="border-b border-gray-100/60 px-6 py-6 text-right text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {paginatedMeetings.map((meeting, index) => (
                  <tr key={meeting.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-bold text-gray-500 whitespace-nowrap">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="max-w-[280px] truncate border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {meeting.companyName}
                    </td>
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{displayValue(meeting.person)}</td>
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{displayValue(meeting.product)}</td>
                    <td className="border-b border-gray-50/30 px-6 py-6 whitespace-nowrap">
                      <StatusBadge status={meeting.status} />
                    </td>
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{displayValue(meeting.assignedStaff)}</td>
                    <td className="border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">
                      {displayDateTime(meeting)}
                    </td>
                    <td className="border-b border-gray-50/30 px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingMeeting(meeting)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95"
                          title="Edit meeting"
                        >
                          <Edit2 className="h-4.5 w-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(meeting.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50 active:scale-95"
                          title="Delete meeting"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredMeetings.length ? (
                  <tr>
                    <td colSpan={8} className="px-8 py-20 text-center text-sm font-medium text-gray-400">
                      No meetings found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {filteredMeetings.length > pageSize ? (
            <div className="px-6 pb-6">
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredMeetings.length}
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
    </div>
  );
}
