import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  Edit2,
  LayoutTemplate,
  MessageSquareText,
  Plus,
  Search,
  Send,
  UsersRound,
  X,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import TableLoader from '@/src/components/ui/TableLoader';
import TablePagination from '@/src/components/ui/TablePagination';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { hasPermission } from '@/src/lib/auth';
import AccessDenied from '@/src/pages/AccessDenied';
import { messageService } from '@/src/services/message.service';

const INPUT_CLASS =
  'mt-0.5 h-9 w-full rounded-xl border border-slate-300/80 bg-white px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70';
const SECTION_PANEL_CLASS = 'rounded-[1.4rem] border border-slate-300/80 bg-slate-50/50';
const SECTION_HEADER_CLASS = 'flex items-center justify-between border-b border-slate-300/80 px-6 py-4';
const HIDE_SCROLLBAR_CLASS = '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';
const LOCKED_TEMPLATE_TOKENS = ['{{customer}}', '{{companyName}}'];

function normalizeSelectOptions(options = []) {
  return options.map((option) => {
    if (typeof option === 'string') {
      return {
        value: option,
        label: option,
        searchText: option,
      };
    }

    return {
      value: String(option.value ?? option.id ?? ''),
      label: option.label || option.name || option.title || '',
      description: option.description || option.subtitle || option.whatsappNo || '',
      searchText: [option.label, option.name, option.title, option.description, option.subtitle, option.whatsappNo].join(' '),
      raw: option.raw || option,
    };
  });
}

function applyCustomerToken(messageText = '', customerName = '') {
  return String(messageText || '').replaceAll('{{customer}}', customerName || 'Customer');
}

function hasAllLockedTokens(messageText = '') {
  return LOCKED_TEMPLATE_TOKENS.every((token) => String(messageText || '').includes(token));
}

function preserveLockedTokens(nextValue = '', previousValue = '') {
  if (!previousValue) return nextValue;
  if (hasAllLockedTokens(nextValue)) return nextValue;
  return previousValue;
}

function formatDateTime(value) {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="ml-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
      {children}
      {required ? <span className="text-rose-500"> *</span> : null}
    </label>
  );
}

function displayValue(value) {
  const normalized = String(value ?? '').trim();
  return !normalized || normalized.toLowerCase() === 'n/a' || normalized === '?' ? '-' : normalized;
}

function statusClass(status) {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'sent' || normalized === 'success' || normalized === 'delivered') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (normalized === 'failed' || normalized === 'error') {
    return 'bg-rose-50 text-rose-700';
  }

  return 'bg-amber-50 text-amber-700';
}

function SearchableSelect({ selectId, label, value, options, placeholder, searchablePlaceholder, isOpen, onToggle, onClose, onChange, disabled = false, required = false }) {
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const normalizedOptions = useMemo(() => normalizeSelectOptions(options), [options]);

  useEffect(() => {
    if (!isOpen) return undefined;

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
    if (!normalized) return normalizedOptions;
    return normalizedOptions.filter((option) => option.searchText.toLowerCase().includes(normalized));
  }, [normalizedOptions, query]);

  const selectedOption = normalizedOptions.find((option) => option.value === value) || null;

  return (
    <div className={`space-y-2 ${isOpen ? 'relative z-40' : 'relative z-0'}`} ref={containerRef}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToggle(selectId)}
          className={`mt-0.5 flex h-9 w-full items-center justify-between rounded-xl border border-slate-300/80 bg-white px-4 text-left text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70 ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
        >
          <span className={selectedOption ? 'text-slate-900' : 'text-gray-400'}>{selectedOption?.label || placeholder}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && !disabled ? (
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
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value, option);
                      setQuery('');
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-all ${
                      value === option.value ? 'bg-brand-light text-brand' : 'text-slate-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{option.label}</span>
                      {option.description ? <span className="mt-0.5 block truncate text-[11px] text-slate-400">{option.description}</span> : null}
                    </span>
                    {value === option.value ? <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">Selected</span> : null}
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

function SearchableMultiSelect({ label, values, options, placeholder, searchablePlaceholder, disabled = false, onChange, required = false }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const normalizedOptions = useMemo(() => normalizeSelectOptions(options), [options]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return normalizedOptions;
    return normalizedOptions.filter((option) => option.searchText.toLowerCase().includes(normalized));
  }, [normalizedOptions, query]);

  const selectedOptions = normalizedOptions.filter((option) => values.includes(option.value));

  const toggleValue = (nextValue) => {
    if (values.includes(nextValue)) {
      onChange(values.filter((value) => value !== nextValue));
      return;
    }

    onChange([...values, nextValue]);
  };

  const removeValue = (valueToRemove) => {
    onChange(values.filter((value) => value !== valueToRemove));
  };

  return (
    <div className={`space-y-2 ${isOpen ? 'relative z-40' : 'relative z-0'}`} ref={containerRef}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
          className={`mt-0.5 flex min-h-9 w-full items-center justify-between gap-3 rounded-xl border border-slate-300/80 bg-white px-4 py-2 text-left text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70 ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
        >
          <span className="min-w-0 flex-1">
            {selectedOptions.length ? (
              <span className="flex flex-wrap gap-2">
                {selectedOptions.map((option) => (
                  <span key={option.value} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand/15 bg-brand-light/60 px-2.5 py-1 text-[11px] font-semibold text-brand shadow-[0_1px_2px_rgba(59,130,246,0.08)]">
                    <span className="truncate">{option.label}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        removeValue(option.value);
                      }}
                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-brand/70 transition-all hover:bg-brand/10 hover:text-brand"
                      aria-label={`Remove ${option.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && !disabled ? (
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
            <div className="max-h-64 overflow-y-auto p-2 space-y-1.5">
              {filteredOptions.length ? (
                filteredOptions.map((option) => {
                  const selected = values.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleValue(option.value)}
                      className={`flex w-full items-start justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all ${
                        selected ? 'border border-brand/15 bg-brand-light/60 text-brand shadow-[0_4px_12px_rgba(59,130,246,0.08)]' : 'border border-transparent text-slate-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{option.label}</span>
                        {option.description ? <span className="mt-0.5 block truncate text-[11px] text-slate-400">{option.description}</span> : null}
                      </span>
                      {selected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : null}
                    </button>
                  );
                })
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

function TemplateTextPreview({ title, description, text, note }) {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-lg font-bold text-slate-900">{title || 'Template Preview'}</p>
        <p className="mt-1 text-xs text-slate-500">{description || 'Preview from selected template'}</p>
      </div>
      <div className="px-7 py-6 text-sm leading-7 text-slate-700 whitespace-pre-wrap">
        {text || 'Select a template to preview message content.'}
      </div>
      {note ? <div className="border-t border-slate-100 px-5 py-3 text-xs text-amber-600">{note}</div> : null}
    </div>
  );
}

function InlineEditActions({ isActive, onEdit, onSave, onCancel }) {
  if (isActive) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 transition-all hover:border-slate-300 hover:text-slate-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand/30 bg-brand px-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-hover"
        >
          <Check className="h-3 w-3" />
          Save
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 transition-all hover:border-brand/20 hover:bg-brand-light hover:text-brand"
    >
      <Edit2 className="h-3 w-3" />
      Edit
    </button>
  );
}

function MessageTemplatePickerModal({ isOpen, templates, selectedTemplateId, onClose, onSelect }) {
  const [activeTemplateId, setActiveTemplateId] = useState(selectedTemplateId || templates[0]?.id || '');
  const [drafts, setDrafts] = useState(() => Object.fromEntries(templates.map((template) => [template.id, { ...template }])));
  const [editingField, setEditingField] = useState(null);
  const [pendingEdits, setPendingEdits] = useState({ title: '', description: '', messageText: '' });
  const activeTemplate = templates.find((template) => template.id === activeTemplateId) || templates[0];
  const activeDraft = drafts[activeTemplate?.id] || activeTemplate;

  useEffect(() => {
    if (!isOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Enter' && activeDraft) onSelect(activeDraft);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDraft, isOpen, onClose, onSelect]);

  if (!isOpen || !activeTemplate || !activeDraft) return null;

  const updateActiveDraft = (field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [activeTemplate.id]: {
        ...prev[activeTemplate.id],
        [field]: value,
      },
    }));
  };

  const beginEdit = (field) => {
    setEditingField(field);
    setPendingEdits((prev) => ({
      ...prev,
      [field]: activeDraft?.[field] || '',
    }));
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const saveEdit = (field) => {
    const nextValue = field === 'messageText'
      ? preserveLockedTokens(pendingEdits[field], activeDraft?.[field] || '')
      : pendingEdits[field];

    updateActiveDraft(field, nextValue);
    setEditingField(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-110 overflow-hidden bg-slate-950/92 text-white">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close message template modal" />
      <div className="relative z-10 flex h-full flex-col px-4 py-5 sm:px-8 sm:py-7">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">Message Template</p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Select, review, and edit template content</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-slate-300 transition-all hover:bg-white/15 hover:text-white" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-cols-1 gap-5 py-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/6 backdrop-blur-md">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-sm font-bold text-white">Available Templates</p>
              <p className="mt-1 text-xs text-slate-400">Choose one template, then edit its content on the right.</p>
            </div>
            <div className={`min-h-0 flex-1 overflow-y-auto p-3 pb-6 ${HIDE_SCROLLBAR_CLASS}`}>
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  setActiveTemplateId(template.id);
                  setEditingField(null);
                }}
                className={`mb-2 flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-all ${
                  activeTemplate.id === template.id
                    ? 'border-white bg-white text-slate-950 shadow-xl shadow-black/20'
                    : 'border-white/10 bg-white/3 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-[0.16em] opacity-70">{drafts[template.id]?.category || template.category}</span>
                  <span className="mt-1 block truncate text-sm font-bold">{drafts[template.id]?.name || template.name}</span>
                  <span className="mt-1 block text-xs leading-5 opacity-75">{drafts[template.id]?.description || template.description}</span>
                </span>
                {activeTemplate.id === template.id ? <Check className="h-4 w-4 shrink-0 text-brand" /> : null}
              </button>
            ))}
            </div>
          </aside>

          <main className={`min-h-0 overflow-y-auto rounded-4xl border border-slate-200/90 bg-linear-to-br from-white via-slate-50 to-slate-100 p-6 text-slate-900 shadow-2xl shadow-black/30 ${HIDE_SCROLLBAR_CLASS}`}>
            <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{activeDraft.category}</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{activeDraft.title || activeDraft.name}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{activeDraft.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  Ready To Customize
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Professional Template
                </span>
              </div>
            </div>

            <div className="mb-5 rounded-3xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Template Editor</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Use the edit buttons to refine title, description, or message copy while keeping protected placeholders intact.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LOCKED_TEMPLATE_TOKENS.map((token) => (
                    <span key={token} className="inline-flex cursor-not-allowed select-none rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                      {token}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="space-y-4 xl:col-span-5">
                <div className={`rounded-3xl border bg-white shadow-sm transition-all ${editingField === 'messageText' ? 'border-brand/30 shadow-lg shadow-brand/10' : 'border-slate-200'}`}>
                  <div className={`border-b border-slate-100 px-5 py-4 ${editingField === 'messageText' ? 'space-y-3' : 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Message Text</p>
                    <p className="mt-1 text-xs text-slate-500">Review the full message and refine the wording professionally.</p>
                  </div>
                  <div className={editingField === 'messageText' ? 'flex justify-end' : ''}>
                    <InlineEditActions
                      isActive={editingField === 'messageText'}
                      onEdit={() => beginEdit('messageText')}
                      onSave={() => saveEdit('messageText')}
                      onCancel={cancelEdit}
                    />
                  </div>
                </div>
                <div className="px-5 py-5">
                  {editingField === 'messageText' ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {LOCKED_TEMPLATE_TOKENS.map((token) => (
                          <span key={token} className="inline-flex cursor-not-allowed select-none rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                            {token}
                          </span>
                        ))}
                      </div>
                      <textarea
                        value={pendingEdits.messageText}
                        onChange={(event) => setPendingEdits((prev) => ({ ...prev, messageText: preserveLockedTokens(event.target.value, activeDraft.messageText || '') }))}
                        className="mt-0.5 min-h-35 w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
                      />
                      <p className="text-xs text-slate-500">{'{{customer}}'} aur {'{{companyName}}'} locked placeholders hain. Inhein remove nahi kiya ja sakta.</p>
                    </div>
                  ) : (
                    <TemplateTextPreview title={activeDraft.title} description={activeDraft.description} text={activeDraft.messageText} />
                  )}
                </div>
              </div>
              </div>

              <div className="xl:col-span-7">
                <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="border-b border-slate-100 px-3 pb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Live Preview</p>
                    <p className="mt-1 text-sm text-slate-500">Recipient-facing view of the current template.</p>
                  </div>
                  <div className="pt-3">
                    <TemplateTextPreview title={activeDraft.title} description={activeDraft.description} text={activeDraft.messageText} />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        <div className="mx-auto flex w-full max-w-7xl justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:bg-white/15">
            Cancel
          </button>
          <button type="button" onClick={() => onSelect(activeDraft)} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-950 shadow-xl shadow-black/20 transition-all hover:scale-[1.01] active:scale-95">
            <Check className="h-4 w-4" />
            Use Template
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MessageForm({ groups, templates, onClose, onSend }) {
  const [form, setForm] = useState({
    groupId: '',
    customerIds: [],
    templateId: '',
    templateTitle: '',
    templateDescription: '',
    templateMessageText: '',
  });
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerLoadError, setCustomerLoadError] = useState('');
  const [preview, setPreview] = useState({ title: '', description: '', messageText: '' });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSelect, setOpenSelect] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const { toasts, toast, removeToast } = useThemeToast();

  const selectedTemplate = templates.find((template) => template.id === form.templateId) || null;
  const selectedCustomers = useMemo(
    () => customers.filter((customer) => form.customerIds.includes(String(customer.id))),
    [customers, form.customerIds],
  );

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleTemplateSelect = (templateDraft) => {
    const template = templateDraft || {};
    setForm((prev) => ({
      ...prev,
      templateId: template.id || '',
      templateTitle: template.title || template.name || '',
      templateDescription: template.description || '',
      templateMessageText: template.messageText || '',
    }));
    setIsTemplateModalOpen(false);
  };

  useEffect(() => {
    let isActive = true;

    if (!form.groupId) {
      setCustomers([]);
      setCustomerLoadError('');
      setForm((prev) => (prev.customerIds.length ? { ...prev, customerIds: [] } : prev));
      return undefined;
    }

    const loadCustomers = async () => {
      setCustomersLoading(true);
      setCustomerLoadError('');

      try {
        const response = await messageService.listCustomers(form.groupId);
        if (!isActive) return;

        setCustomers(response.data);
        setForm((prev) => ({
          ...prev,
          customerIds: prev.customerIds.filter((customerId) => response.data.some((customer) => String(customer.id) === String(customerId))),
        }));
      } catch (error) {
        if (!isActive) return;
        setCustomers([]);
        setCustomerLoadError(error.message || 'Could not load customers for the selected group.');
      } finally {
        if (isActive) {
          setCustomersLoading(false);
        }
      }
    };

    loadCustomers();

    return () => {
      isActive = false;
    };
  }, [form.groupId]);

  useEffect(() => {
    let isActive = true;

    const fallbackPreview = {
      title: form.templateTitle,
      description: form.templateDescription,
      messageText: applyCustomerToken(form.templateMessageText, selectedCustomers[0]?.name),
    };

    if (!form.templateId || !form.templateMessageText.trim()) {
      setPreview({ title: '', description: '', messageText: '' });
      setPreviewError('');
      setPreviewLoading(false);
      return undefined;
    }

    if (!form.groupId || !form.customerIds.length) {
      setPreview(fallbackPreview);
      setPreviewError('');
      setPreviewLoading(false);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError('');

      try {
        const response = await messageService.preview({
          groupId: Number(form.groupId),
          customerIds: form.customerIds.map((customerId) => Number(customerId)),
          templateId: form.templateId,
          content: {
            title: form.templateTitle,
            description: form.templateDescription,
            messageText: form.templateMessageText,
          },
        });

        if (!isActive) return;

        setPreview({
          title: response.data.title || fallbackPreview.title,
          description: response.data.description || fallbackPreview.description,
          messageText: response.data.messageText || fallbackPreview.messageText,
        });
      } catch (error) {
        if (!isActive) return;
        setPreview(fallbackPreview);
        setPreviewError(error.message || 'Preview could not be generated.');
      } finally {
        if (isActive) {
          setPreviewLoading(false);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [form.customerIds, form.groupId, form.templateDescription, form.templateId, form.templateMessageText, form.templateTitle, selectedCustomers]);

  const handleSubmit = async () => {
    if (!form.groupId) {
      toast.error('Group is required', 'Please select a customer group before sending the message.');
      return;
    }

    if (!form.customerIds.length) {
      toast.error('Customers are required', 'Please select at least one customer.');
      return;
    }

    if (!form.templateId) {
      toast.error('Template is required', 'Please choose a message template first.');
      return;
    }

    if (!form.templateMessageText.trim()) {
      toast.error('Message text is required', 'Selected template does not contain message content.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSend({
        groupId: Number(form.groupId),
        customerIds: form.customerIds.map((customerId) => Number(customerId)),
        templateId: form.templateId,
        content: {
          title: form.templateTitle,
          description: form.templateDescription,
          messageText: form.templateMessageText,
        },
      });
    } catch (error) {
      toast.error('Send failed', error.message || 'Message could not be sent.');
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
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold text-gray-700">Send Message</h2>
                <p className="mt-1 text-sm text-slate-600">Select recipients, choose a template, edit content, and send through WhatsApp.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900">
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
                  <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Send Message</h3>
                  <p className="mt-1 text-xs text-slate-500">Group, customer, and message template selection.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                  <UsersRound className="h-4 w-4" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-12">
                <div className="space-y-2 xl:col-span-4">
                  <SearchableSelect selectId="group" label="Group" required value={form.groupId} options={groups.map((group) => ({ value: String(group.id), label: group.name }))} placeholder="Select group" searchablePlaceholder="Search groups..." isOpen={openSelect === 'group'} onToggle={(selectId) => setOpenSelect((current) => (current === selectId ? null : selectId))} onClose={() => setOpenSelect(null)} onChange={(value) => {
                    setOpenSelect(null);
                    setForm((prev) => ({ ...prev, groupId: value, customerIds: [] }));
                  }} />
                </div>
                <div className="space-y-2 xl:col-span-5">
                  <SearchableMultiSelect label="Customers" required values={form.customerIds} options={customers.map((customer) => ({ value: String(customer.id), label: customer.name, whatsappNo: customer.whatsappNo }))} placeholder={customersLoading ? 'Loading customers...' : 'Select customers'} searchablePlaceholder="Search customers..." disabled={!form.groupId || customersLoading} onChange={(value) => updateField('customerIds', value)} />
                  {customerLoadError ? <p className="text-xs text-rose-600">{customerLoadError}</p> : null}
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <FieldLabel required>Select Message Template</FieldLabel>
                  <button
                    type="button"
                    disabled={!templates.length}
                    onClick={() => setIsTemplateModalOpen(true)}
                    className={`group mt-0.5 flex h-9 w-full items-center justify-between gap-3 rounded-xl border border-slate-300/80 bg-white px-4 text-left text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-brand/30 hover:bg-brand-light/30 focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70 ${!templates.length ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand transition-all group-hover:bg-brand group-hover:text-white">
                        <LayoutTemplate className="h-3.5 w-3.5" />
                      </span>
                      <span className="block truncate font-semibold leading-none">{selectedTemplate?.name || 'Select template'}</span>
                    </span>
                    <Edit2 className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-brand" />
                  </button>
                </div>
              </div>
            </section>

            <section className={SECTION_PANEL_CLASS}>
              <div className={SECTION_HEADER_CLASS}>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Template Content</h3>
                  <p className="mt-1 text-xs text-slate-500">Selected event template preview before sending.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-5 p-6">
                {selectedTemplate ? (
                  previewLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white">
                      <TableLoader label="Generating preview..." />
                    </div>
                  ) : (
                    <TemplateTextPreview title={preview.title || form.templateTitle} description={preview.description || form.templateDescription} text={preview.messageText} note={previewError || ''} />
                  )
                ) : (
                  <div className="flex min-h-65 items-center justify-center rounded-2xl border border-dashed border-slate-300/80 bg-white text-center">
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand">
                        <LayoutTemplate className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-sm font-bold text-slate-800">Select a message template</p>
                      <p className="mt-1 text-sm text-slate-500">After selection, the event-related message template will appear here.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-7 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" disabled={isSubmitting} onClick={handleSubmit} className={`inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover ${isSubmitting ? 'cursor-not-allowed opacity-70' : ''}`}>
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isTemplateModalOpen ? (
        <MessageTemplatePickerModal isOpen={isTemplateModalOpen} templates={templates} selectedTemplateId={form.templateId} onClose={() => setIsTemplateModalOpen(false)} onSelect={handleTemplateSelect} />
      ) : null}
      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default function Messages() {
  const canRead = hasPermission('MEETINGS.MESSAGE.READ');
  const canCreate = hasPermission('MEETINGS.MESSAGE.CREATE');
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState('');
  const [groups, setGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [composerLoading, setComposerLoading] = useState(canCreate);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toasts, toast, removeToast } = useThemeToast();

  const loadMessages = async () => {
    if (!canRead) {
      setMessages([]);
      setMessagesLoading(false);
      setMessagesError('');
      return;
    }

    setMessagesLoading(true);
    setMessagesError('');

    try {
      const response = await messageService.list();
      setMessages(response.data);
    } catch (error) {
      setMessagesError(error.message || 'Could not load message history.');
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [canRead]);

  useEffect(() => {
    let isActive = true;

    if (!canCreate) {
      setComposerLoading(false);
      return undefined;
    }

    const loadComposerData = async () => {
      setComposerLoading(true);

      try {
        const [groupsResponse, templatesResponse] = await Promise.all([
          messageService.listGroups(),
          messageService.listTemplates(),
        ]);

        if (!isActive) return;

        setGroups(groupsResponse.data);
        setTemplates(templatesResponse.data);
      } catch (error) {
        if (!isActive) return;
        toast.error('Message setup failed', error.message || 'Could not load groups or templates.');
      } finally {
        if (isActive) {
          setComposerLoading(false);
        }
      }
    };

    loadComposerData();

    return () => {
      isActive = false;
    };
  }, [canCreate, toast]);

  const filteredMessages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return messages;
    return messages.filter((message) => [message.group, message.customer, message.template, message.status, message.sentAt].join(' ').toLowerCase().includes(normalized));
  }, [messages, query]);

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedMessages = useMemo(
    () => filteredMessages.slice((visiblePage - 1) * pageSize, visiblePage * pageSize),
    [filteredMessages, pageSize, visiblePage],
  );

  const handleSend = async (payload) => {
    const response = await messageService.send(payload);
    await loadMessages();
    setShowForm(false);
    setCurrentPage(1);
    toast.success('Message sent', response?.message || 'WhatsApp message sent successfully.');
  };

  if (!canRead) {
    return <AccessDenied />;
  }

  if (showForm) {
    return <MessageForm groups={groups} templates={templates} onClose={() => setShowForm(false)} onSend={handleSend} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Messages</h1>
          <p className="mt-1 text-gray-500">Manage WhatsApp message templates and sending history.</p>
        </div>
        {canCreate ? (
          <button type="button" disabled={composerLoading} onClick={() => setShowForm(true)} className={`inline-flex w-fit items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover ${composerLoading ? 'cursor-not-allowed opacity-70' : ''}`}>
            <Plus className="h-4 w-4" />
            {composerLoading ? 'Loading...' : 'Add Message'}
          </button>
        ) : null}
      </div>

      <Card className="border-none p-0 shadow-xl shadow-gray-200/50">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search messages..."
              className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </div>
          <p className="text-sm font-medium text-gray-400">
            <span className="font-bold text-gray-900">{filteredMessages.length}</span> Records
          </p>
        </div>
        <div className="mx-6 border-b border-gray-50" />

        <div className="mx-6 mb-6 mt-6 w-auto overflow-hidden rounded-3xl border border-gray-100 bg-white/90  backdrop-blur-xl">
          {messagesLoading ? (
            <TableLoader label="Loading message history..." />
          ) : messagesError ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <p className="text-sm font-medium text-rose-600">{messagesError}</p>
              <button type="button" onClick={loadMessages} className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50">
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-215 table-fixed border-separate border-spacing-0 text-left">
                <colgroup>
                  <col className="w-17.5" />
                  <col className="w-55" />
                  <col className="w-60" />
                  <col className="w-55" />
                  <col className="w-55" />
                  <col className="w-37.5" />
                </colgroup>
                <thead>
                  <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                    <th className="w-px whitespace-nowrap border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Sr</th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Group</th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Customer</th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Template</th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Sent At</th>
                    <th className="border-b border-gray-100/60 px-6 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {paginatedMessages.map((message, index) => (
                    <tr key={message.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                      <td className="whitespace-nowrap border-b border-gray-50/30 px-6 py-6 text-sm font-bold text-gray-500">
                        {(visiblePage - 1) * pageSize + index + 1}
                      </td>
                      <td className="truncate whitespace-nowrap border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-900">{displayValue(message.group)}</td>
                      <td className="truncate border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">{displayValue(message.customer)}</td>
                      <td className="truncate whitespace-nowrap border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">{displayValue(message.template)}</td>
                      <td className="whitespace-nowrap border-b border-gray-50/30 px-6 py-6 text-sm font-semibold text-gray-700">
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {displayValue(formatDateTime(message.sentAt))}
                        </span>
                      </td>
                      <td className="whitespace-nowrap border-b border-gray-50/30 px-6 py-6">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(message.status)}`}>{displayValue(message.status)}</span>
                      </td>
                    </tr>
                  ))}
                  {!filteredMessages.length ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-sm font-medium text-gray-400">
                        No messages found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
          {filteredMessages.length > pageSize ? (
            <div className="px-6 pb-6">
              <TablePagination
                currentPage={visiblePage}
                pageSize={pageSize}
                totalItems={filteredMessages.length}
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
      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}
