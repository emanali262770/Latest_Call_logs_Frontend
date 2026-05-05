import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, Calendar, ChevronDown, Clock, Edit2, Phone, Search, Send, Trash2, User } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import TableLoader from '@/src/components/ui/TableLoader';
import TablePagination from '@/src/components/ui/TablePagination';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { hasPermission } from '@/src/lib/auth';
import AccessDenied from '@/src/pages/AccessDenied';
import { followUpService } from '@/src/services/followUp.service';

const STATUS_OPTIONS = ['Active', 'Hold', 'Complete'];

const STATUS_CLASSES = {
  Active: 'bg-amber-100 text-amber-700',
  Hold: 'bg-rose-100 text-rose-600',
  Complete: 'bg-emerald-100 text-emerald-700',
};


const readonlyInputClass =
  'mt-[2px] h-9 w-full rounded-xl border border-slate-300/80 bg-slate-100 px-4 text-sm text-slate-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none';
const inputClass =
  'mt-[2px] h-9 w-full rounded-xl border border-slate-300/80 bg-white px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70';
const SECTION_PANEL_CLASS = 'rounded-[1.4rem] border border-slate-300/80 bg-slate-50/50';
const SECTION_HEADER_CLASS = 'flex items-center justify-between border-b border-slate-300/80 px-6 py-4';

function FieldLabel({ children }) {
  return <label className="ml-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{children}</label>;
}

function displayValue(value) {
  const normalized = String(value ?? '').trim();
  return !normalized || normalized.toLowerCase() === 'n/a' || normalized === '?' ? '-' : normalized;
}

function normalizeStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'hold') return 'Hold';
  if (normalized === 'complete') return 'Complete';
  return 'Active';
}

function normalizeTimeValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';

  const timeMatch = normalized.match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  if (timeMatch) return timeMatch[1];

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;

  return parsed.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDate(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '-';

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function displayFollowUpDate(followUp) {
  return formatDate(followUp?.meetingDate || followUp?.createdAt);
}

function formatTime(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '-';

  const timeMatch = normalized.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (timeMatch) {
    const parsed = new Date(`2000-01-01T${timeMatch[1]}:${timeMatch[2]}:00`);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(parsed);
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed);
}

function apiToForm(data) {
  return {
    id: data.id,
    customerName: data.customerName || '',
    whatsappNumber: data.whatsappNumber || '',
    customerRemarks: data.customerRemarks || '',
    status: normalizeStatus(data.status),
    meetingDate: data.meetingDate || '',
    meetingTime: normalizeTimeValue(data.meetingTime),
    nextFollowupDate: data.nextFollowupDate || '',
    nextFollowupTime: normalizeTimeValue(data.nextFollowupTime),
    createdAt: data.createdAt || '',
  };
}

function buildPayload(form) {
  return {
    nextFollowupDate: form.nextFollowupDate || null,
    nextFollowupTime: form.nextFollowupTime || null,
    customerRemarks: form.customerRemarks || '',
    status: normalizeStatus(form.status).toLowerCase(),
  };
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex min-w-[58px] justify-center rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_CLASSES[status] || STATUS_CLASSES.Active}`}>
      {status}
    </span>
  );
}

function IconText({ icon: Icon, children }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {createElement(Icon, { className: 'h-4 w-4 text-slate-400' })}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

function FieldShell({ icon: Icon, children }) {
  return (
    <div className="relative">
      {createElement(Icon, {
        className: 'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400',
      })}
      {children}
    </div>
  );
}

function SelectField({ value, options, placeholder, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="mt-[2px] flex h-9 w-full items-center justify-between rounded-xl border border-slate-300/80 bg-white px-4 text-left text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70"
      >
        <span className={value ? 'text-slate-900' : 'text-gray-400'}>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60">
          <div className="max-h-56 overflow-y-auto p-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-all ${
                  value === option ? 'bg-brand-light text-brand' : 'text-slate-700 hover:bg-gray-50'
                }`}
              >
                <span>{option}</span>
                {value === option ? <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">Selected</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FollowUpEditForm({ followUp, onClose, onSave }) {
  const [form, setForm] = useState(followUp);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!followUp) return null;

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

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
      <div className="rounded-[1.75rem] border border-slate-300/80 bg-white">
        <div className="border-b border-slate-300/80 bg-slate-100/30 px-8 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300/80 bg-white text-brand shadow-sm">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-gray-700">Edit Follow Up</h2>
                <p className="mt-1 text-sm text-slate-600">Update customer follow-up details and next action.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close edit follow up"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          </div>
        </div>

        <div className="px-8 py-8">
          <div className="space-y-6">
            <section className={`${SECTION_PANEL_CLASS} relative z-30`}>
              <div className={SECTION_HEADER_CLASS}>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Follow Up Info</h3>
                  <p className="mt-1 text-xs text-slate-500">Current customer, number, date, and time information.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-12">
                <div className="space-y-2 xl:col-span-4">
                  <FieldLabel>Date</FieldLabel>
                  <FieldShell icon={Calendar}>
                    <input value={displayFollowUpDate(form)} readOnly className={`${readonlyInputClass} pl-10`} />
                  </FieldShell>
                </div>
                <div className="space-y-2 xl:col-span-4">
                  <FieldLabel>Time</FieldLabel>
                  <FieldShell icon={Clock}>
                    <input value={formatTime(form.meetingTime)} readOnly className={`${readonlyInputClass} pl-10`} />
                  </FieldShell>
                </div>
                <div className="space-y-2 xl:col-span-6">
                  <FieldLabel>Customer Name</FieldLabel>
                  <FieldShell icon={User}>
                    <input value={form.customerName} readOnly className={`${readonlyInputClass} pl-10`} />
                  </FieldShell>
                </div>
                <div className="space-y-2 xl:col-span-6">
                  <FieldLabel>Customer Number</FieldLabel>
                  <FieldShell icon={Phone}>
                    <input value={form.whatsappNumber} readOnly className={`${readonlyInputClass} pl-10`} />
                  </FieldShell>
                </div>
              </div>
            </section>

            <section className={SECTION_PANEL_CLASS}>
              <div className={SECTION_HEADER_CLASS}>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Next Follow Up</h3>
                  <p className="mt-1 text-xs text-slate-500">Next date, time, remarks, and follow-up status.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-12">
                <div className="space-y-2 xl:col-span-4">
                  <FieldLabel>Date</FieldLabel>
                  <FieldShell icon={Calendar}>
                    <input type="date" value={form.nextFollowupDate || ''} onChange={(event) => updateField('nextFollowupDate', event.target.value)} className={`${inputClass} pl-10`} />
                  </FieldShell>
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel>Time</FieldLabel>
                  <FieldShell icon={Clock}>
                    <input type="time" value={form.nextFollowupTime || ''} onChange={(event) => updateField('nextFollowupTime', event.target.value)} className={`${inputClass} pl-10`} />
                  </FieldShell>
                </div>
                <div className="space-y-2 xl:col-span-12">
                  <FieldLabel>Customer Remarks</FieldLabel>
                  <textarea
                    value={form.customerRemarks}
                    onChange={(event) => updateField('customerRemarks', event.target.value)}
                    className="mt-[2px] min-h-24 w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
                  />
                </div>
                <div className="space-y-2 xl:col-span-5">
                  <FieldLabel>Status</FieldLabel>
                  <SelectField
                    value={form.status}
                    options={STATUS_OPTIONS}
                    placeholder="Select status"
                    onChange={(value) => updateField('status', value)}
                  />
                </div>
              </div>
            </section>

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
                {isSubmitting ? 'Saving...' : 'Update Follow Up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FollowUp() {
  const canRead = hasPermission('MEETINGS.FOLLOW_UP.READ');
  const canEdit = hasPermission('MEETINGS.FOLLOW_UP.UPDATE');
  const canDelete = hasPermission('MEETINGS.FOLLOW_UP.DELETE');
  const hasRowActions = canEdit || canDelete;
  const [followUps, setFollowUps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toasts, toast, removeToast } = useThemeToast();
  const showForm = !!editingFollowUp;

  const loadFollowUps = useCallback(async (query = '') => {
    if (!canRead) {
      setFollowUps([]);
      setListError('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setListError('');
    try {
      const response = await followUpService.list(query);
      setFollowUps(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setListError(requestError.message || 'Could not load follow-ups.');
    } finally {
      setIsLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadFollowUps(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [loadFollowUps, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(followUps.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedFollowUps = useMemo(
    () => followUps.slice((visiblePage - 1) * pageSize, visiblePage * pageSize),
    [followUps, pageSize, visiblePage],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleEdit = async (followUpId) => {
    if (!canEdit) return;

    setEditLoading(true);
    try {
      const response = await followUpService.getById(followUpId);
      setEditingFollowUp(apiToForm(response.data));
    } catch (requestError) {
      toast.error('Could not load follow-up', requestError.message || 'Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSave = async (form) => {
    const payload = buildPayload(form);
    try {
      const response = await followUpService.update(form.id, payload);
      toast.success('Follow-up updated', response?.message || 'Follow-up details have been saved successfully.');
      setEditingFollowUp(null);
      await loadFollowUps(searchQuery.trim());
    } catch (requestError) {
      toast.error('Update failed', requestError.message || 'Could not update follow-up.');
      throw requestError;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !canDelete) return;

    setIsSaving(true);
    try {
      await followUpService.remove(deleteTarget.id);
      toast.success('Follow-up deleted', 'Follow-up has been removed.');
      setDeleteTarget(null);
      await loadFollowUps(searchQuery.trim());
    } catch (requestError) {
      toast.error('Delete failed', requestError.message || 'Could not delete follow-up.');
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Follow Up</h1>
            <p className="mt-1 text-gray-500">Manage your customer follow-ups</p>
          </div>
        )}
      </div>

      {showForm ? (
        <FollowUpEditForm followUp={editingFollowUp} onClose={() => setEditingFollowUp(null)} onSave={handleSave} />
      ) : (
      <Card className="border-none p-0 shadow-xl shadow-gray-200/50">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search follow-ups..."
              className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <p className="text-sm font-medium text-gray-400">
            <span className="font-bold text-gray-900">{followUps.length}</span> Records
          </p>
        </div>
        <div className="mx-6 border-b border-gray-50" />

        <div className="mx-6 mb-6 mt-6 w-auto overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white/90  backdrop-blur-xl">
          {isLoading ? (
            <TableLoader label="Loading follow-ups..." />
          ) : listError ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <p className="text-sm font-medium text-rose-600">{listError}</p>
              <button
                type="button"
                onClick={() => loadFollowUps(searchQuery.trim())}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                Retry
              </button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] table-fixed border-separate border-spacing-0 text-left">
              <colgroup>
                <col className="w-[70px]" />
                <col className="w-[250px]" />
                <col className="w-[210px]" />
                <col className="w-[210px]" />
                <col className="w-[190px]" />
                <col className="w-[170px]" />
                <col className="w-[160px]" />
                {hasRowActions ? <col className="w-[150px]" /> : null}
              </colgroup>
              <thead>
                <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                  <th className="w-px whitespace-nowrap border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Sr</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Company Name</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Number</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Description</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Date</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Time</th>
                  <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Status</th>
                  {hasRowActions ? <th className="border-b border-gray-100/60 px-6 py-6 text-right text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
              {paginatedFollowUps.map((followUp, index) => (
                <tr key={followUp.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                  <td className="whitespace-nowrap border-b border-gray-50/30 px-6 py-6 text-sm font-bold text-gray-500">
                    {(visiblePage - 1) * pageSize + index + 1}
                  </td>
                  <td className="truncate whitespace-nowrap border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-900">
                    <IconText icon={User}>{displayValue(followUp.customerName)}</IconText>
                  </td>
                  <td className="whitespace-nowrap border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">
                    <IconText icon={Phone}>{displayValue(followUp.whatsappNumber)}</IconText>
                  </td>
                  <td className="truncate whitespace-nowrap border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">{displayValue(followUp.customerRemarks)}</td>
                  <td className="whitespace-nowrap border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">
                    <IconText icon={Calendar}>{displayValue(formatDate(followUp.nextFollowupDate))}</IconText>
                  </td>
                  <td className="whitespace-nowrap border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">
                    <IconText icon={Clock}>{displayValue(formatTime(followUp.nextFollowupTime))}</IconText>
                  </td>
                  <td className="whitespace-nowrap border-b border-gray-50/30 px-6 py-6">
                    <StatusBadge status={normalizeStatus(followUp.status)} />
                  </td>
                  {hasRowActions ? (
                    <td className="border-b border-gray-50/30 px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit ? (
                          <button
                            type="button"
                            disabled={editLoading}
                            onClick={() => handleEdit(followUp.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95 disabled:opacity-50"
                            title="Edit follow up"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => setDeleteTarget(followUp)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50 active:scale-95 disabled:opacity-50"
                            title="Delete follow up"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}

              {!paginatedFollowUps.length ? (
                <tr>
                  <td colSpan={hasRowActions ? 8 : 7} className="px-8 py-20 text-center text-sm font-medium text-gray-400">
                    No follow-ups found.
                  </td>
                </tr>
              ) : null}
              </tbody>
            </table>
          </div>
          )}
          {!isLoading && !listError && followUps.length > pageSize ? (
            <div className="px-6 pb-6">
              <TablePagination
                currentPage={visiblePage}
                pageSize={pageSize}
                totalItems={followUps.length}
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
        isOpen={canDelete && !!deleteTarget}
        title="Delete Follow-up"
        description={`Are you sure you want to delete this follow-up for "${deleteTarget?.customerName || ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={isSaving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}
