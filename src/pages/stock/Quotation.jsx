import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion as Motion } from 'motion/react';
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, Edit2, Eye, FileText, LayoutTemplate, Package, Plus, Printer, Save, Search as SearchIcon, Trash2, X } from 'lucide-react';
import { Button, Card } from '@/src/components/ui/Card';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { getStoredUser, hasPermission } from '@/src/lib/auth';
import AccessDenied from '@/src/pages/AccessDenied';
import { printSingleQuotation, printQuotationPdfBlob, printQuotationFromHtml } from '@/src/pages/stock/prints/quotationPrint';
import { customerService } from '@/src/services/customer.service';
import { estimationService } from '@/src/services/estimation.service';
import { itemRateService } from '@/src/services/itemRate.service';
import { quotationService } from '@/src/services/quotation.service';
import { servicesService } from '@/src/services/services.service';

const EMPTY_FORM = {
  quotationNo: '',
  day: String(new Date().getDate()).padStart(2, '0'),
  month: new Date().toLocaleString('en-US', { month: 'long' }),
  year: String(new Date().getFullYear()),
  revisionId: '',
  customerId: '',
  estimationId: '',
  serviceId: '',
  department: '',
  company: '',
  person: '',
  designation: '',
  letterType: 'Quotation',
  taxMode: '',
  forProduct: '',
  createdBy: '',
  printTemplateId: 'executive_letterhead',
  item: '',
  price: '',
  qty: '',
  total: '',
  description: '',
};

const INPUT_CLASS_NAME =
  'h-9 w-full rounded-xl border border-slate-300/80 bg-white px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70';
const SELECT_BUTTON_CLASS_NAME =
  'min-h-9 w-full rounded-xl border border-slate-300/80 bg-white px-4 py-2 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70';
const READ_ONLY_INPUT_CLASS_NAME =
  'h-9 w-full cursor-not-allowed rounded-xl border border-slate-300/80 bg-slate-100 px-4 text-sm text-slate-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none';
const SECTION_PANEL_CLASS_NAME = 'rounded-[1.4rem] border border-slate-300/80 bg-slate-50/50';
const COMPACT_FIELD_WRAPPER_CLASS_NAME = 'w-full xl:max-w-[540px]';
const COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME = 'w-full xl:max-w-[245px]';
const COMPACT_MEDIUM_FIELD_WRAPPER_CLASS_NAME = 'w-full xl:max-w-[360px]';
const FALLBACK_ITEM_OPTIONS = ['IP CCTV Camera 4MP Night Vision', 'HikVision 8 Channel NVR', 'Samsung TV', 'DVR 4 Channel'];
const DEFAULT_PRINT_TEMPLATE_ID = 'executive_letterhead';
const FALLBACK_PRINT_TEMPLATE_OPTIONS = [
  { id: 'executive_letterhead', name: 'Executive Letterhead', category: 'Classic', description: 'Clean company header with strong totals and a formal quotation layout.' },
  { id: 'technical_bid', name: 'Technical Bid', category: 'Detailed', description: 'Built for item-heavy quotations with product details and clear sections.' },
  { id: 'premium_tax', name: 'Premium Tax', category: 'Tax Ready', description: 'Professional tax-focused print view with GST and grand total emphasis.' },
  { id: 'modern_clean', name: 'Modern Clean', category: 'Modern', description: 'Balanced service proposal style with neat contact and item grouping.' },
  { id: 'compact_commercial', name: 'Compact Commercial', category: 'Compact', description: 'Space-efficient quotation layout for quick review and direct printing.' },
];

const MONTH_NAME_TO_NUMBER = {
  January: '01',
  February: '02',
  March: '03',
  April: '04',
  May: '05',
  June: '06',
  July: '07',
  August: '08',
  September: '09',
  October: '10',
  November: '11',
  December: '12',
};

const MONTH_NUMBER_TO_NAME = Object.fromEntries(Object.entries(MONTH_NAME_TO_NUMBER).map(([name, number]) => [number, name]));

function FieldLabel({ children }) {
  return <label className="ml-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{children}</label>;
}

function wrapIndex(min, max, value) {
  const rangeSize = max - min;
  return ((((value - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

const BACKEND_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');

function resolvePreviewPdfUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${BACKEND_BASE_URL}${url}`;
}

function normalizePrintTemplate(template) {
  return {
    id: template.id,
    name: template.name || template.title || template.id,
    category: template.category || template.meta || 'Template',
    description: template.description || '',
    previewPdfUrl: resolvePreviewPdfUrl(template.previewPdfUrl || template.preview_pdf_url || null),
  };
}

function TemplatePreview({ template, className = '' }) {
  if (template.previewPdfUrl) {
    return (
      <div className={`h-full w-full overflow-hidden bg-white ${className}`}>
        <iframe
          src={`${template.previewPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          title={template.name}
          className="h-full w-full border-0"
        />
      </div>
    );
  }
  return (
    <div className={`h-full w-full overflow-hidden bg-white flex items-center justify-center ${className}`}>
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <p style={{ fontSize: '16px' }}>{template.name || 'Template Preview'}</p>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>Preview not available</p>
      </div>
    </div>
  );
}

function PrintTemplatePickerModal({ isOpen, templates, selectedTemplateId, onClose, onSelect }) {
  const initialIndex = Math.max(templates.findIndex((template) => template.id === selectedTemplateId), 0);
  const [active, setActive] = useState(initialIndex);
  const activeIndex = templates.length ? wrapIndex(0, templates.length, active) : 0;
  const activeTemplate = templates[activeIndex] || templates[0];

  useEffect(() => {
    if (!isOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') setActive((prev) => prev - 1);
      if (event.key === 'ArrowRight') setActive((prev) => prev + 1);
      if (event.key === 'Enter' && activeTemplate) onSelect(activeTemplate.id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTemplate, isOpen, onClose, onSelect]);

  if (!isOpen || !activeTemplate) return null;

  const handlePrevious = () => setActive((prev) => prev - 1);
  const handleNext = () => setActive((prev) => prev + 1);

  return createPortal(
    <div className="fixed inset-0 z-[110] overflow-hidden bg-slate-950 text-white">
      <button type="button" className="absolute inset-0 bg-slate-950/96" onClick={onClose} aria-label="Close print template modal" />

      <AnimatePresence mode="wait">
        <Motion.div
          key={activeTemplate.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.32 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
          className="absolute inset-0 pointer-events-none"
        >
          <TemplatePreview template={activeTemplate} className="blur-2xl saturate-150 opacity-80" />
          <div className="absolute inset-0 bg-slate-950/70" />
        </Motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex h-full flex-col px-4 py-5 sm:px-8 sm:py-7">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-xl shadow-black/20">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">Print Template</p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Select quotation print design</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-slate-300 transition-all hover:bg-white/15 hover:text-white" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col justify-center py-6">
          <div className="relative flex h-[330px] w-full items-center justify-center overflow-hidden sm:h-[390px]" style={{ perspective: 1200 }}>
            {[-2, -1, 0, 1, 2].map((offset) => {
              const absoluteIndex = active + offset;
              const index = wrapIndex(0, templates.length, absoluteIndex);
              const template = templates[index];
              const isCenter = offset === 0;
              const distance = Math.abs(offset);

              return (
                <Motion.div
                  key={`${template.id}-${absoluteIndex}`}
                  role="button"
                  tabIndex={0}
                  initial={false}
                  animate={{
                    x: offset * 270,
                    scale: isCenter ? 1 : 0.84,
                    rotateY: offset * -18,
                    opacity: isCenter ? 1 : Math.max(0.16, 1 - distance * 0.42),
                    filter: `blur(${isCenter ? 0 : distance * 3}px) brightness(${isCenter ? 1 : 0.62})`,
                  }}
                  transition={{ type: 'spring', stiffness: 310, damping: isCenter ? 24 : 32, mass: 1 }}
                  style={{ transformStyle: 'preserve-3d', cursor: 'pointer' }}
                  onClick={() => (isCenter ? onSelect(template.id) : setActive((prev) => prev + offset))}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { isCenter ? onSelect(template.id) : setActive((prev) => prev + offset); } }}
                  className={`absolute aspect-[3/4] w-[214px] overflow-hidden rounded-2xl border text-left shadow-2xl transition-shadow sm:w-[270px] ${isCenter ? 'z-20 border-white/25 shadow-brand/25' : 'z-10 border-white/10 shadow-black/40'}`}
                >
                  <div className="pointer-events-none h-full w-full">
                    <TemplatePreview template={template} />
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/92 via-slate-950/12 to-white/5" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-200 backdrop-blur">
                      {template.category}
                    </span>
                    <p className="mt-2 text-lg font-bold leading-tight text-white">{template.name}</p>
                  </div>
                  {selectedTemplateId === template.id ? (
                    <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
                      <Check className="h-4 w-4" />
                    </div>
                  ) : null}
                  {!template.previewPdfUrl ? (
                    <div className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-amber-950/20">
                      Preview missing
                    </div>
                  ) : null}
                </Motion.div>
              );
            })}
          </div>

          <div className="mx-auto mt-7 flex w-full max-w-4xl flex-col items-center justify-between gap-5 rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md sm:flex-row sm:p-5">
            <AnimatePresence mode="wait">
              <Motion.div
                key={activeTemplate.id}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.22 }}
                className="min-w-0 text-center sm:text-left"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-light">{activeTemplate.category}</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{activeTemplate.name}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{activeTemplate.description}</p>
              </Motion.div>
            </AnimatePresence>
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/70 p-1">
                <button type="button" onClick={handlePrevious} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-white/10 hover:text-white" aria-label="Previous template">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-12 text-center text-xs font-bold text-slate-400">{activeIndex + 1} / {templates.length}</span>
                <button type="button" onClick={handleNext} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-white/10 hover:text-white" aria-label="Next template">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <button type="button" onClick={() => onSelect(activeTemplate.id)} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-slate-950 shadow-xl shadow-black/20 transition-all hover:scale-[1.02] active:scale-95">
                <Check className="h-4 w-4" />
                Use Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ReadOnlyField({ label, value, placeholder }) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <input type="text" value={value || ''} readOnly disabled placeholder={placeholder} className={READ_ONLY_INPUT_CLASS_NAME} />
    </div>
  );
}

function sanitizeNumericInput(value) {
  const normalized = String(value || '').replace(/[^\d.]/g, '');
  const firstDotIndex = normalized.indexOf('.');
  if (firstDotIndex === -1) return normalized;
  return `${normalized.slice(0, firstDotIndex + 1)}${normalized.slice(firstDotIndex + 1).replace(/\./g, '')}`;
}

function SearchableSelect({ selectId, label, value, options, placeholder, searchablePlaceholder, onChange, isOpen, onToggle, onClose }) {
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) onClose();
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
        <button type="button" onClick={() => onToggle(selectId)} className={`mt-[2px] flex ${SELECT_BUTTON_CLASS_NAME} items-start justify-between gap-3 text-left`}>
          <span className={`min-w-0 whitespace-normal break-words leading-5 ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value || placeholder}</span>
          <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all ${option === value ? 'bg-brand-light text-brand' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <span className="font-medium">{option}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-400">No matching records found.</div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Quotation() {
  const canRead = hasPermission('INVENTORY.QUOTATION.READ');
  const canCreate = hasPermission('INVENTORY.QUOTATION.CREATE');
  const canEdit = hasPermission('INVENTORY.QUOTATION.UPDATE');
  const canDelete = hasPermission('INVENTORY.QUOTATION.DELETE');
  const canPrint = hasPermission('INVENTORY.QUOTATION.PRINT');
  const hasRowActions = canEdit || canDelete || canPrint;
  const storedUser = useMemo(() => getStoredUser(), []);
  const loggedInUserName = storedUser?.fullName || storedUser?.username || 'admin';
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [rows, setRows] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [estimationOptions, setEstimationOptions] = useState([]);
  const [itemRateOptions, setItemRateOptions] = useState([]);
  const [printTemplateOptions, setPrintTemplateOptions] = useState(() => FALLBACK_PRINT_TEMPLATE_OPTIONS.map(normalizePrintTemplate));
  const [defaultPrintTemplateId, setDefaultPrintTemplateId] = useState(DEFAULT_PRINT_TEMPLATE_ID);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [revisionSourceQuotationId, setRevisionSourceQuotationId] = useState(null);
  const [nextRevisionId, setNextRevisionId] = useState('');
  const [formMode, setFormMode] = useState('create');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [itemDeleteTarget, setItemDeleteTarget] = useState(null);
  const [openSelectId, setOpenSelectId] = useState(null);
  const [isPrintTemplateModalOpen, setIsPrintTemplateModalOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toasts, toast, removeToast } = useThemeToast();

  const letterTypeOptions = ['Letter', 'Quotation', 'Bill', 'Invoice'];
  const companyOptions = useMemo(() => customerOptions.map((customer) => customer.company || customer.name).filter(Boolean), [customerOptions]);
  const productOptions = useMemo(() => serviceOptions.map((service) => service.serviceName).filter(Boolean), [serviceOptions]);
  const itemOptions = useMemo(
    () => itemRateOptions.map((item) => item.name),
    [itemRateOptions],
  );
  const estimationSelectOptions = useMemo(() => estimationOptions.map((estimation) => estimation.estimateId).filter(Boolean), [estimationOptions]);
  const selectedPrintTemplate = useMemo(
    () => printTemplateOptions.find((template) => template.id === formData.printTemplateId) || printTemplateOptions[0],
    [formData.printTemplateId, printTemplateOptions],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.qty += Number(row.qty || 0);
          acc.total += Number(row.total || 0);
          acc.gstTotal += Number(row.gstAmount || row.gst || 0) * Number(row.qty || 0);
          acc.grandTotal += formData.taxMode === 'withTax' ? Number(row.totalWithGst || 0) : Number(row.total || 0);
          return acc;
        },
        { qty: 0, total: 0, gstTotal: 0, grandTotal: 0 },
      ),
    [rows, formData.taxMode],
  );

  const filteredQuotations = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return quotations;
    return quotations.filter((row) =>
      `${row.quotationNo} ${row.company} ${row.forProduct} ${row.createdBy} ${row.revisionId} ${row.estimationId}`.toLowerCase().includes(normalized),
    );
  }, [quotations, searchQuery]);

  const draftItemTaxValues = useMemo(() => {
    const price = Number(formData.price || 0);
    const qty = Number(formData.qty || 0);
    const gstAmount = (price * 18) / 100;
    const rateWithGst = price + gstAmount;
    const totalWithGst = rateWithGst * qty;

    return {
      gstAmount: gstAmount ? gstAmount.toFixed(2) : '',
      rateWithGst: rateWithGst ? rateWithGst.toFixed(2) : '',
      totalWithGst: totalWithGst ? totalWithGst.toFixed(2) : '',
    };
  }, [formData.price, formData.qty]);

  useEffect(() => {
    const qty = Number(formData.qty || 0);
    const price = Number(formData.price || 0);
    const total = qty * price;

    setFormData((prev) => {
      const nextTotal = total ? total.toFixed(2) : '';
      return prev.total === nextTotal ? prev : { ...prev, total: nextTotal };
    });
  }, [formData.qty, formData.price]);

  useEffect(() => {
    setFormData((prev) => (prev.createdBy === loggedInUserName ? prev : { ...prev, createdBy: loggedInUserName }));
  }, [loggedInUserName]);

  useEffect(() => {
    let isActive = true;

    const loadSetupOptions = async () => {
      try {
        const quotationsResponse = await quotationService.list();
        if (!isActive) return;
        setQuotations(Array.isArray(quotationsResponse?.data) ? quotationsResponse.data : []);
      } catch {
        if (isActive) {
          setQuotations([]);
        }
      }

      if (!canCreate && !canEdit) return;

      try {
        const [nextNoResult, nextRevisionResult, customersResult, servicesResult, estimationsResult, ratesResult, printTemplatesResult] = await Promise.allSettled([
          quotationService.getNextQuotationNo('Quotation'),
          quotationService.getNextRevisionId(),
          customerService.list(''),
          servicesService.list(''),
          estimationService.list(),
          itemRateService.list(),
          quotationService.getPrintTemplates(),
        ]);
        if (!isActive) return;

        const customersData = customersResult.status === 'fulfilled' ? (customersResult.value?.data ?? []) : [];
        const servicesData = servicesResult.status === 'fulfilled' ? (servicesResult.value?.data ?? []) : [];
        const estimationsData = estimationsResult.status === 'fulfilled' ? (estimationsResult.value?.data ?? []) : [];
        const ratesData = ratesResult.status === 'fulfilled' ? (ratesResult.value?.data ?? []) : [];
        const nextNo = nextNoResult.status === 'fulfilled' ? nextNoResult.value : null;
        const nextRevision = nextRevisionResult.status === 'fulfilled' ? nextRevisionResult.value : null;
        const printTemplatesData = printTemplatesResult.status === 'fulfilled' ? printTemplatesResult.value?.data : null;
        console.log('print templates:', printTemplatesData);
        const resolvedNextRevisionId = nextRevision?.data?.revisionId || '';
        const resolvedPrintTemplates = Array.isArray(printTemplatesData?.templates) && printTemplatesData.templates.length
          ? printTemplatesData.templates.map(normalizePrintTemplate)
          : FALLBACK_PRINT_TEMPLATE_OPTIONS.map(normalizePrintTemplate);
        const resolvedDefaultPrintTemplate = printTemplatesData?.defaultTemplate || DEFAULT_PRINT_TEMPLATE_ID;

        setCustomerOptions(Array.isArray(customersData) ? customersData : []);
        setServiceOptions(Array.isArray(servicesData) ? servicesData : []);
        setEstimationOptions(Array.isArray(estimationsData) ? estimationsData : []);
        setPrintTemplateOptions(resolvedPrintTemplates);
        setDefaultPrintTemplateId(resolvedDefaultPrintTemplate);
        setItemRateOptions(
          (Array.isArray(ratesData) ? ratesData : [])
            .map((item) => ({
              id: item.id,
              name: item.item,
              rate: item.salePrice || item.sale || item.reseller || '',
              description: item.itemSpecification || item.specification || item.description || '',
            }))
            .filter((item) => item.name),
        );
        setNextRevisionId(resolvedNextRevisionId);
        setFormData((prev) => ({
          ...prev,
          quotationNo: prev.quotationNo || nextNo?.data?.quotationNo || '',
          revisionId: prev.revisionId || resolvedNextRevisionId,
          printTemplateId: prev.printTemplateId && prev.printTemplateId !== DEFAULT_PRINT_TEMPLATE_ID ? prev.printTemplateId : resolvedDefaultPrintTemplate,
        }));
      } catch {
        if (isActive) {
          setCustomerOptions([]);
          setServiceOptions([]);
          setEstimationOptions([]);
          setItemRateOptions([]);
        }
      }
    };

    loadSetupOptions();

    return () => {
      isActive = false;
    };
  }, [canCreate, canEdit]);

  const updateField = (field, value) => {
    const normalizedValue = ['price', 'qty'].includes(field) ? sanitizeNumericInput(value) : value;
    setFormData((prev) => ({ ...prev, [field]: normalizedValue }));
  };

  const handleLetterTypeChange = async (value) => {
    setFormData((prev) => ({ ...prev, letterType: value }));
    try {
      const response = await quotationService.getNextQuotationNo(value);
      setFormData((prev) => ({ ...prev, quotationNo: response?.data?.quotationNo || prev.quotationNo }));
    } catch (requestError) {
      toast.error('Quotation no failed', requestError.message || 'Could not fetch next quotation number.');
    }
  };

  const handleItemChange = (value) => {
    const selectedRate = itemRateOptions.find((item) => item.name === value);
    setFormData((prev) => ({
      ...prev,
      item: value,
      price: selectedRate?.rate ? String(selectedRate.rate) : prev.price,
      itemRateId: selectedRate?.id || '',
      description: selectedRate?.description || prev.description,
    }));
  };

  const handleCompanyChange = async (value) => {
    const selectedCustomer = customerOptions.find((customer) => (customer.company || customer.name) === value);
    if (!selectedCustomer?.id) {
      setFormData((prev) => ({ ...prev, company: value, customerId: '', person: '', designation: '', department: '' }));
      return;
    }

    try {
      const response = await customerService.get(selectedCustomer.id);
      const customer = response.data || selectedCustomer;
      setFormData((prev) => ({
        ...prev,
        customerId: customer.id,
        company: customer.company || customer.name || value,
        person: customer.person || '',
        designation: customer.designation || '',
        department: customer.department || '',
      }));
    } catch (requestError) {
      toast.error('Customer load failed', requestError.message || 'Could not load customer details.');
    }
  };

  const handleServiceChange = (value) => {
    const selectedService = serviceOptions.find((service) => service.serviceName === value);
    setFormData((prev) => ({
      ...prev,
      serviceId: selectedService?.id || '',
      forProduct: selectedService?.serviceName || value,
    }));
  };

  const fillFormFromQuotation = (quotation, nextRevisionId) => {
    setRows(quotation.items || []);
    setEditingRowId(null);
    const [year, month, day] = String(quotation.quotationDate || '').split('-');
    setFormData((prev) => ({
      ...prev,
      quotationNo: quotation.quotationNo || prev.quotationNo,
      day: day || quotation.day || prev.day,
      month: MONTH_NUMBER_TO_NAME[month] || quotation.month || prev.month,
      year: year || quotation.year || prev.year,
      revisionId: nextRevisionId,
      customerId: quotation.customerId || '',
      estimationId: quotation.estimationId || '',
      serviceId: quotation.serviceId || '',
      department: quotation.department || '',
      company: quotation.company || '',
      person: quotation.person || '',
      designation: quotation.designation || '',
      letterType: quotation.letterType || 'Quotation',
      taxMode: quotation.taxMode || '',
      forProduct: quotation.forProduct || '',
      createdBy: quotation.createdBy || loggedInUserName,
      printTemplateId: quotation.printTemplate || quotation.print_template || prev.printTemplateId || DEFAULT_PRINT_TEMPLATE_ID,
      item: '',
      price: '',
      qty: '',
      total: '',
      description: '',
    }));
  };

  const handleRevisionIdChange = (value) => {
    updateField('revisionId', value);
  };

  const handleRevisionSearch = async () => {
    const normalizedValue = String(formData.revisionId || '').trim();
    if (!normalizedValue) return;
    if (!quotations.some((quotation) => String(quotation.revisionId || '').trim() === normalizedValue)) return;
    try {
      const response = await quotationService.getByRevisionId(normalizedValue);
      const quotation = response.data;
      setEditingQuotationId(null);
      setRevisionSourceQuotationId(quotation.id);
      setFormMode('revision');
      fillFormFromQuotation(quotation, quotation.revisionId || normalizedValue);
      toast.success('Revision loaded', 'Previous quotation data loaded. Saving will create a new revision.');
    } catch (requestError) {
      setRevisionSourceQuotationId(null);
      toast.error('Revision not found', requestError.message || 'Could not load quotation by revision id.');
    }
  };

  const quotationDateValue = useMemo(() => {
    const day = String(formData.day || '').padStart(2, '0');
    const month = MONTH_NAME_TO_NUMBER[formData.month] || '01';
    const year = formData.year || new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }, [formData.day, formData.month, formData.year]);

  const handleEstimationChange = async (value) => {
    const selectedEstimation = estimationOptions.find((estimation) => estimation.estimateId === value);
    if (!selectedEstimation?.id) {
      updateField('estimationId', value);
      return;
    }

    try {
      const response = await estimationService.get(selectedEstimation.id);
      const estimation = response.data || {};
      const estimationRows = (estimation.items || []).map((item) => {
        const rate = Number(item.salePrice || item.salePriceWithTax || 0);
        const qty = Number(item.qty || 0);
        const total = rate * qty;
        const gstAmount = (rate * 18) / 100;
        const rateWithGst = rate + gstAmount;
        return {
          id: crypto.randomUUID(),
          itemRateId: item.itemRateId || '',
          item: item.itemName || '',
          price: rate ? String(rate) : '',
          qty: qty ? String(qty) : '',
          total: total ? total.toFixed(2) : '',
          gst: gstAmount,
          gstAmount,
          gstPercent: 18,
          rateWithGst,
          totalWithGst: rateWithGst * qty,
          description: item.description || '',
        };
      });

      setRows(estimationRows);
      setFormData((prev) => ({
        ...prev,
        revisionId: formMode === 'revision' ? nextRevisionId || prev.revisionId : prev.revisionId,
        estimationId: estimation.estimateId || value,
        customerId: estimation.customerId || '',
        company: estimation.customerName || '',
        person: estimation.person || '',
        designation: estimation.designation || '',
        department: estimation.department || '',
        serviceId: estimation.serviceId || '',
        forProduct: estimation.serviceName || '',
        taxMode: prev.taxMode || 'withoutTax',
      }));
    } catch (requestError) {
      toast.error('Estimation load failed', requestError.message || 'Could not load estimation details.');
    }
  };

  const handleAddItem = () => {
    if (!formData.item) {
      toast.error('Item required', 'Please select item before adding.');
      return;
    }
    if (!Number(formData.qty || 0)) {
      toast.error('Qty required', 'Please enter qty before adding.');
      return;
    }

    const price = Number(formData.price || 0);
    const qty = Number(formData.qty || 0);
    const total = price * qty;
    const gstAmount = (price * 18) / 100;
    const rateWithGst = price + gstAmount;

    const nextRow = {
      id: editingRowId || crypto.randomUUID(),
      itemRateId: formData.itemRateId || itemRateOptions.find((item) => item.name === formData.item)?.id || '',
      item: formData.item,
      price: formData.price,
      qty: formData.qty,
      total: total ? total.toFixed(2) : '',
      gst: gstAmount,
      gstAmount,
      gstPercent: 18,
      rateWithGst,
      totalWithGst: rateWithGst * qty,
      description: formData.description,
    };

    setRows((prev) => (editingRowId ? prev.map((row) => (row.id === editingRowId ? nextRow : row)) : [...prev, nextRow]));
    setEditingRowId(null);
    setFormData((prev) => ({
      ...prev,
      taxMode: prev.taxMode || 'withoutTax',
      item: '',
      itemRateId: '',
      price: '',
      qty: '',
      total: '',
      description: '',
    }));
    toast.success(editingRowId ? 'Item updated' : 'Item added', editingRowId ? 'Quotation item updated successfully.' : 'Quotation item added successfully.');
  };

  const handleEditRow = (row) => {
    setEditingRowId(row.id);
    setFormData((prev) => ({
      ...prev,
      item: row.item,
      itemRateId: row.itemRateId || '',
      price: row.price,
      qty: row.qty,
      total: row.total,
      description: row.description,
    }));
  };

  const handleDeleteRow = () => {
    if (!itemDeleteTarget?.id) return;

    setRows((prev) => prev.filter((row) => row.id !== itemDeleteTarget.id));
    if (editingRowId === itemDeleteTarget.id) {
      setEditingRowId(null);
    }
    setItemDeleteTarget(null);
  };

  const openCreateForm = async () => {
    setEditingQuotationId(null);
    setRevisionSourceQuotationId(null);
    setFormMode('create');
    setEditingRowId(null);
    setRows([]);
    setFormData({ ...EMPTY_FORM, createdBy: loggedInUserName, printTemplateId: defaultPrintTemplateId });
    setShowForm(true);
    try {
      const [nextNoResponse, nextRevisionResponse] = await Promise.all([
        quotationService.getNextQuotationNo('Quotation'),
        quotationService.getNextRevisionId(),
      ]);
      const resolvedNextRevisionId = nextRevisionResponse?.data?.revisionId || '';
      setNextRevisionId(resolvedNextRevisionId);
      setFormData((prev) => ({
        ...prev,
        quotationNo: nextNoResponse?.data?.quotationNo || prev.quotationNo,
        revisionId: resolvedNextRevisionId || prev.revisionId,
      }));
    } catch (requestError) {
      toast.error('Form setup failed', requestError.message || 'Could not fetch next quotation numbers.');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingQuotationId(null);
    setRevisionSourceQuotationId(null);
    setEditingRowId(null);
    setItemDeleteTarget(null);
    setIsPrintTemplateModalOpen(false);
    setRows([]);
    setFormMode('create');
    setFormData({ ...EMPTY_FORM, createdBy: loggedInUserName, printTemplateId: defaultPrintTemplateId });
  };

  const buildQuotationPayload = () => ({
      quotationDate: quotationDateValue,
      customerId: formData.customerId || null,
      estimationId: formData.estimationId,
      serviceId: formData.serviceId || null,
      letterType: formData.letterType,
      taxMode: formData.taxMode,
      printTemplate: formData.printTemplateId,
      sendEmail: true,
      status: 'active',
      items: rows.map((row) => ({
        itemRateId: row.itemRateId,
        itemName: row.item,
        rate: Number(row.price || row.rate || 0),
        qty: Number(row.qty || 0),
        description: row.description || '',
      })),
  });

  const validateQuotation = () => {
    if (!quotationDateValue) return 'Quotation date is required.';
    if (!formData.customerId) return 'Customer is required.';
    if (!formData.letterType) return 'Letter type is required.';
    if (!formData.taxMode) return 'Tax mode is required.';
    if (!printTemplateOptions.some((template) => template.id === formData.printTemplateId)) return 'Selected print template is invalid.';
    if (!rows.length) return 'At least one item is required.';
    if (rows.some((row) => !row.itemRateId)) return 'Each item must come from item rate.';
    if (rows.some((row) => Number(row.qty || 0) <= 0)) return 'Each item qty must be greater than 0.';
    return '';
  };

  const refreshQuotations = async () => {
    const response = await quotationService.list();
    setQuotations(Array.isArray(response?.data) ? response.data : []);
  };

  const getDeliveryFailureMessage = (channelName, delivery) => {
    if (channelName === 'WhatsApp') return 'WhatsApp send unsuccessful';
    const detail = delivery?.message || delivery?.reason || delivery?.error || 'not sent';
    return `${channelName} not sent${detail ? `: ${detail}` : ''}`;
  };

  const handleSaveQuotation = async () => {
    const validationMessage = validateQuotation();
    if (validationMessage) {
      toast.error('Validation failed', validationMessage);
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildQuotationPayload();
      let response;
      if (formMode === 'revision' && revisionSourceQuotationId) {
        response = await quotationService.revise(revisionSourceQuotationId, payload);
      } else if (formMode === 'edit' && editingQuotationId) {
        response = await quotationService.update(editingQuotationId, payload);
      } else {
        response = await quotationService.create(payload);
      }

      const saved = response?.data || {};
      const emailDelivery = saved.delivery?.email;
      const whatsappDelivery = saved.delivery?.whatsapp;
      console.log('delivery:', saved.delivery);
      await refreshQuotations();

      const actionLabel = formMode === 'revision' ? 'Revision saved' : formMode === 'edit' ? 'Quotation updated' : 'Quotation saved';
      const successfulDeliveries = [];
      const failedDeliveries = [];

      if (emailDelivery) {
        if (emailDelivery.sent) {
          successfulDeliveries.push(`Email sent to ${emailDelivery.to || 'customer'}`);
        } else {
          failedDeliveries.push(getDeliveryFailureMessage('Email', emailDelivery));
        }
      }

      if (whatsappDelivery) {
        if (whatsappDelivery.sent) {
          successfulDeliveries.push(`WhatsApp sent to ${whatsappDelivery.to || whatsappDelivery.phone || 'customer'}`);
        } else {
          failedDeliveries.push(getDeliveryFailureMessage('WhatsApp', whatsappDelivery));
        }
      }

      if (failedDeliveries.length) {
        const successMessage = successfulDeliveries.length ? `${successfulDeliveries.join(' | ')}. ` : '';
        toast.error(`${actionLabel} with delivery issue`, `${successMessage}${failedDeliveries.join(' | ')}.`);
      } else if (successfulDeliveries.length) {
        toast.success(actionLabel, successfulDeliveries.join(' | ') + '.');
      } else {
        toast.success(actionLabel, 'Quotation saved successfully.');
      }
      closeForm();
    } catch (requestError) {
      toast.error('Save failed', requestError?.response?.data?.message || requestError.message || 'Could not save quotation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditQuotation = async (quotation) => {
    try {
      const response = await quotationService.get(quotation.id);
      const loadedQuotation = response.data || quotation;
      const [year, month, day] = String(loadedQuotation.quotationDate || '').split('-');
      setEditingQuotationId(loadedQuotation.id);
      setRevisionSourceQuotationId(null);
      setFormMode('edit');
      setEditingRowId(null);
      setRows(loadedQuotation.items || []);
      setFormData({
        ...EMPTY_FORM,
        quotationNo: loadedQuotation.quotationNo || '',
        day: day || loadedQuotation.day || EMPTY_FORM.day,
        month: MONTH_NUMBER_TO_NAME[month] || loadedQuotation.month || EMPTY_FORM.month,
        year: year || loadedQuotation.year || EMPTY_FORM.year,
        revisionId: loadedQuotation.revisionId || loadedQuotation.docId || '',
        customerId: loadedQuotation.customerId || '',
        estimationId: loadedQuotation.estimationId || '',
        serviceId: loadedQuotation.serviceId || '',
        department: loadedQuotation.department || '',
        company: loadedQuotation.company || '',
        person: loadedQuotation.person || '',
        designation: loadedQuotation.designation || '',
        letterType: loadedQuotation.letterType || 'Quotation',
        taxMode: loadedQuotation.taxMode || '',
        forProduct: loadedQuotation.forProduct || '',
        createdBy: loadedQuotation.createdBy || loggedInUserName,
        printTemplateId: loadedQuotation.printTemplate || loadedQuotation.print_template || DEFAULT_PRINT_TEMPLATE_ID,
      });
      setShowForm(true);
    } catch (requestError) {
      toast.error('Load failed', requestError.message || 'Could not load quotation details.');
    }
  };

  const handleDeleteQuotation = async () => {
    if (!deleteTarget?.id) return;

    setIsSaving(true);
    try {
      await quotationService.remove(deleteTarget.id);
      await refreshQuotations();
      setDeleteTarget(null);
      toast.success('Quotation deleted', 'Quotation record deleted successfully.');
    } catch (requestError) {
      toast.error('Delete failed', requestError.message || 'Could not delete quotation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintQuotation = useCallback(async (quotation) => {
    try {
      const payload = await quotationService.printSingle(quotation.id);
      printSingleQuotation(payload);
    } catch (requestError) {
      toast.error('Print failed', requestError?.response?.data?.message || requestError.message || 'Could not print quotation.');
    }
  }, [toast]);

  return (
    <div className="space-y-8">
      {!canRead ? <AccessDenied /> : null}
      {canRead ? (
      <>
      {!showForm ? (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quotation</h1>
              <p className="mt-1 text-gray-500">Manage quotation records with the same table flow as estimation.</p>
            </div>
            {canCreate ? (
            <Button onClick={openCreateForm} icon={<Plus className="h-4 w-4" />} className="bg-brand hover:bg-brand-hover shadow-brand/20">
              Add Quotation
            </Button>
            ) : null}
          </div>

          <Card className="border-none p-0 shadow-xl shadow-gray-200/50">
            <div className="px-6 pb-6 pt-5">
              <div className="mb-5 flex flex-col gap-4 border-b border-gray-50 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-96">
                  <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search quotation..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  />
                </div>
                <p className="text-sm font-medium text-gray-400">
                  <span className="font-bold text-gray-900">{filteredQuotations.length}</span> Records
                </p>
              </div>

              <div className="w-full overflow-hidden rounded-4xl border border-gray-100 bg-white/80 shadow-2xl shadow-gray-200/30 backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0 text-left">
                    <thead>
                      <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                        <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 first:rounded-tl-4xl">Sr.#</th>
                        <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Quotation No</th>
                        <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Customer</th>
                        <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">For Product</th>
                        <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Revision ID</th>
                        <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Items Total</th>
                        {hasRowActions ? <th className="border-b border-gray-100/60 px-5 py-6 text-right text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 last:rounded-tr-4xl">Actions</th> : null}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                      {filteredQuotations.length === 0 ? (
                        <tr>
                          <td colSpan={hasRowActions ? 7 : 6} className="px-5 py-20 text-center text-sm font-medium text-gray-400">No quotation records found.</td>
                        </tr>
                      ) : (
                        filteredQuotations.map((row, index) => (
                          <tr key={row.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{index + 1}</td>
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-900 whitespace-nowrap">{row.quotationNo}</td>
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{row.company || '-'}</td>
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{row.forProduct || '-'}</td>
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{row.revisionId || '-'}</td>
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-brand whitespace-nowrap">{row.itemsTotal || '0.00'}</td>
                            {hasRowActions ? (
                            <td className="border-b border-gray-50/30 px-5 py-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {canPrint ? <button type="button" title="Print" onClick={() => handlePrintQuotation(row)} className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-violet-600 hover:shadow-xl hover:shadow-violet-100/50 active:scale-95">
                                  <Printer className="h-4.5 w-4.5" />
                                </button> : null}
                                {canEdit ? <button type="button" onClick={() => handleEditQuotation(row)} className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95">
                                  <Edit2 className="h-4.5 w-4.5" />
                                </button> : null}
                                {canDelete ? <button type="button" onClick={() => setDeleteTarget(row)} className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50 active:scale-95">
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button> : null}
                              </div>
                            </td>
                            ) : null}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : (
      <div className="mx-auto w-full max-w-6xl">
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-300/80 bg-white">
          <div className="border-b border-slate-300/80 bg-slate-100/30 px-8 py-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300/80 bg-white text-brand shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[20px] font-bold text-gray-700">{editingQuotationId ? 'Edit Quotation' : 'Quotation Form'}</p>
                  <p className="mt-1 text-sm text-slate-600">{editingQuotationId ? `Editing ${formData.quotationNo || 'record'} — update the fields below and save.` : 'Use the same structured stock form styling while keeping all quotation fields from the provided layout.'}</p>
                </div>
              </div>
              <button type="button" onClick={closeForm} className="inline-flex items-center gap-2 rounded-xl border border-slate-300/80 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </div>
          </div>

          <div className="space-y-6 px-8 py-8">
            <section className={SECTION_PANEL_CLASS_NAME}>
              <div className="flex items-center justify-between border-b border-slate-300/80 px-6 py-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Quotation Setup</h3>
                  <p className="mt-1 text-xs text-slate-500">Quotation no, date, revision id, employee, department, customer, and related contact details.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                  <FileText className="h-4 w-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-12">
                <div className="xl:col-span-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,0.95fr)_minmax(0,0.95fr)]">
                    <div className={COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME}>
                      <FieldLabel>Quotation No</FieldLabel>
                      <input type="text" value={formData.quotationNo} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                    </div>
                    <div className={`space-y-2 ${COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME}`}>
                      <FieldLabel>Date</FieldLabel>
                      <input
                        type="date"
                        value={quotationDateValue}
                        onChange={(event) => {
                          const [year, month, day] = event.target.value.split('-');
                          updateField('year', year || '');
                          updateField(
                            'month',
                            MONTH_NUMBER_TO_NAME[month] || '',
                          );
                          updateField('day', day || '');
                        }}
                        className={INPUT_CLASS_NAME}
                      />
                    </div>
                    <div className={`md:col-span-2 ${COMPACT_FIELD_WRAPPER_CLASS_NAME}`}>
                      <SearchableSelect selectId="company" label="Customer" value={formData.company} options={companyOptions} placeholder="Select customer" searchablePlaceholder="Search customer" onChange={handleCompanyChange} isOpen={openSelectId === 'company'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                    </div>
                    <div className={`md:col-span-2 ${COMPACT_FIELD_WRAPPER_CLASS_NAME}`}>
                      <ReadOnlyField label="Person" value={formData.person} placeholder="Auto-filled from customer" />
                    </div>
                    <div className={`md:col-span-2 ${COMPACT_MEDIUM_FIELD_WRAPPER_CLASS_NAME}`}>
                      <ReadOnlyField label="Designation" value={formData.designation} placeholder="Auto-filled from customer" />
                    </div>
                    <div className="flex flex-wrap items-center gap-5 md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input type="radio" checked={formData.taxMode === 'withoutTax'} onChange={() => updateField('taxMode', 'withoutTax')} className="h-4 w-4 border-slate-300 text-slate-700 focus:ring-slate-300" />
                        <span>Without Tax</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input type="radio" checked={formData.taxMode === 'withTax'} onChange={() => updateField('taxMode', 'withTax')} className="h-4 w-4 border-slate-300 text-slate-700 focus:ring-slate-300" />
                        <span>With Tax</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:pt-0">
                    <div className={COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME}>
                      <FieldLabel>Revision ID</FieldLabel>
                      <input type="text" value={formData.revisionId} onChange={(event) => handleRevisionIdChange(event.target.value)} onBlur={handleRevisionSearch} className={INPUT_CLASS_NAME} />
                    </div>
                    <div className={COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME}>
                      <SearchableSelect selectId="estimationId" label="Estimation ID" value={formData.estimationId} options={estimationSelectOptions} placeholder="Select estimation" searchablePlaceholder="Search estimation" onChange={handleEstimationChange} isOpen={openSelectId === 'estimationId'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                    </div>
                    <div className={`md:col-span-2 ${COMPACT_FIELD_WRAPPER_CLASS_NAME}`}>
                      <SearchableSelect selectId="forProduct" label="For Product" value={formData.forProduct} options={productOptions} placeholder="Select product" searchablePlaceholder="Search product" onChange={handleServiceChange} isOpen={openSelectId === 'forProduct'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                    </div>
                    <div className={COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME}>
                      <ReadOnlyField label="Department" value={formData.department} placeholder="Auto-filled from customer" />
                    </div>
                    <div className={COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME}>
                      <SearchableSelect selectId="letterType" label="Letter Type" value={formData.letterType} options={letterTypeOptions} placeholder="Select letter type" searchablePlaceholder="Search letter type" onChange={handleLetterTypeChange} isOpen={openSelectId === 'letterType'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                    </div>
                    <div className={COMPACT_MEDIUM_FIELD_WRAPPER_CLASS_NAME}>
                      <ReadOnlyField label="Created By" value={formData.createdBy} placeholder="Logged in user" />
                    </div>
                    <div className={COMPACT_MEDIUM_FIELD_WRAPPER_CLASS_NAME}>
                      <div className="space-y-2">
                        <FieldLabel>Print Template</FieldLabel>
                        <button
                          type="button"
                          onClick={() => setIsPrintTemplateModalOpen(true)}
                          className="group flex h-9 w-full items-center justify-between gap-3 rounded-xl border border-slate-300/80 bg-white px-4 text-left text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-brand/30 hover:bg-brand-light/30 focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand transition-all group-hover:bg-brand group-hover:text-white">
                              <LayoutTemplate className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold leading-none">{selectedPrintTemplate?.name || 'Select template'}</span>
                            </span>
                          </span>
                          <Eye className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-brand" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={SECTION_PANEL_CLASS_NAME}>
              <div className="flex items-center justify-between border-b border-slate-300/80 px-6 py-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Item Details</h3>
                  <p className="mt-1 text-xs text-slate-500">Item, price, qty, total, and description with add-item table flow.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                  <Package className="h-4 w-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className={formData.taxMode === 'withTax' ? 'md:col-span-4' : 'md:col-span-5'}>
                    <SearchableSelect selectId="item" label="Item" value={formData.item} options={itemOptions} placeholder="Select product" searchablePlaceholder="Search item" onChange={handleItemChange} isOpen={openSelectId === 'item'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                  </div>
                  <div className={formData.taxMode === 'withTax' ? 'space-y-2 md:col-span-2' : 'space-y-2 md:col-span-2'}>
                    <FieldLabel>Price</FieldLabel>
                    <input type="text" value={formData.price} onChange={(event) => updateField('price', event.target.value)} placeholder="0.00" className={INPUT_CLASS_NAME} />
                  </div>
                  <div className={formData.taxMode === 'withTax' ? 'space-y-2 md:col-span-2' : 'space-y-2 md:col-span-2'}>
                    <FieldLabel>Qty</FieldLabel>
                    <input type="text" value={formData.qty} onChange={(event) => updateField('qty', event.target.value)} placeholder="0" className={INPUT_CLASS_NAME} />
                  </div>
                  {formData.taxMode === 'withTax' ? (
                    <>
                      <div className="space-y-2 md:col-span-2">
                        <FieldLabel>18% GST</FieldLabel>
                        <input type="text" value={draftItemTaxValues.gstAmount} readOnly placeholder="0.00" className={READ_ONLY_INPUT_CLASS_NAME} />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <FieldLabel>Rate With GST</FieldLabel>
                        <input type="text" value={draftItemTaxValues.rateWithGst} readOnly placeholder="0.00" className={READ_ONLY_INPUT_CLASS_NAME} />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <FieldLabel>Total With GST</FieldLabel>
                        <input type="text" value={draftItemTaxValues.totalWithGst} readOnly placeholder="0.00" className={READ_ONLY_INPUT_CLASS_NAME} />
                      </div>
                    </>
                  ) : null}
                  {formData.taxMode !== 'withTax' ? (
                    <div className="space-y-2 md:col-span-2">
                      <FieldLabel>Total</FieldLabel>
                      <input type="text" value={formData.total} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                    </div>
                  ) : null}
                  <div className="space-y-2 md:col-span-12">
                    <FieldLabel>Description</FieldLabel>
                    <textarea value={formData.description} onChange={(event) => updateField('description', event.target.value)} rows={3} placeholder="Description" className="min-h-[96px] w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70" />
                  </div>
                  <div className="flex justify-end md:col-span-12">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex h-9 min-w-[136px] shrink-0 items-center justify-center rounded-xl border border-slate-300/90 bg-white px-4 text-sm font-semibold leading-none text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.08)] transition-all hover:border-brand/30 hover:bg-slate-50 hover:text-brand"
                    >
                      {editingRowId ? 'Update Item' : 'Add Item'}
                    </button>
                  </div>
                </div>

                {rows.length ? (
                <section className={SECTION_PANEL_CLASS_NAME}>
                  <div className="flex items-center justify-between border-b border-slate-300/80 px-6 py-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Queued Items</h3>
                      <p className="mt-1 text-xs text-slate-500">Review, edit, or remove quotation items before final save.</p>
                    </div>
                    <div className="rounded-xl border border-slate-300/80 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                      {rows.length} {rows.length === 1 ? 'Item' : 'Items'}
                    </div>
                  </div>
                  <div className="overflow-x-auto p-6">
                  <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                    <thead>
                      {formData.taxMode === 'withTax' ? (
                        <tr className="bg-slate-100/80">
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Sr.</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Item</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Rate</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Qty</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">18% GST</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Rate With GST</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Total With GST</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Actions</th>
                        </tr>
                      ) : (
                        <tr className="bg-slate-100/80">
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Sr.</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Item</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Rate</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Qty</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Total</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Actions</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={row.id} className="odd:bg-white even:bg-slate-50/45 transition-colors hover:bg-brand-light/30">
                          <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-600">{index + 1}</td>
                          <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-900">{row.item}</td>
                          <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700">{row.price || '-'}</td>
                          <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700">{row.qty || '-'}</td>
                          {formData.taxMode === 'withTax' ? (
                            <>
                              <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700">{Number(row.gst || 0).toFixed(2)}</td>
                              <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700">{Number(row.rateWithGst || 0).toFixed(2)}</td>
                              <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-brand">{Number(row.totalWithGst || 0).toFixed(2)}</td>
                            </>
                          ) : (
                            <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-brand">{row.total || '-'}</td>
                          )}
                          <td className="border-b border-slate-100 px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={() => handleEditRow(row)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-brand/20 hover:bg-brand-light hover:text-brand">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => setItemDeleteTarget(row)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex flex-wrap items-center justify-end gap-8 border-t border-slate-200/80 px-6 py-4 text-sm font-semibold text-slate-700">
                    <p>Total Qty: <span className="ml-2 tabular-nums text-slate-900">{totals.qty.toFixed(2)}</span></p>
                    <p>Items Total: <span className="ml-2 tabular-nums text-brand">{totals.grandTotal.toFixed(2)}</span></p>
                  </div>
                </div>
                </section>
                ) : null}
              </div>
            </section>

            <div className="flex items-center justify-end rounded-2xl border border-slate-300/80 bg-slate-50/95 px-6 py-4">
              <button type="button" onClick={handleSaveQuotation} disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover disabled:opacity-60">
                <Save className="h-4.5 w-4.5" />
                {isSaving ? 'Updating...' : editingQuotationId ? 'Update Quotation' : formMode === 'revision' ? 'Save Revision' : 'Save Quotation'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
      </>
      ) : null}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Quotation"
        description={deleteTarget ? `Are you sure you want to delete ${deleteTarget.quotationNo || 'this quotation'}?` : ''}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteQuotation}
        isLoading={isSaving}
      />
      <ConfirmDialog
        isOpen={!!itemDeleteTarget}
        title="Delete Quotation Item"
        description={itemDeleteTarget ? `Are you sure you want to delete ${itemDeleteTarget.item || 'this item'}?` : ''}
        confirmLabel="Delete"
        onCancel={() => setItemDeleteTarget(null)}
        onConfirm={handleDeleteRow}
      />
      {isPrintTemplateModalOpen ? (
        <PrintTemplatePickerModal
          isOpen={isPrintTemplateModalOpen}
          templates={printTemplateOptions}
          selectedTemplateId={formData.printTemplateId}
          onClose={() => setIsPrintTemplateModalOpen(false)}
          onSelect={(templateId) => {
            updateField('printTemplateId', templateId);
            setIsPrintTemplateModalOpen(false);
          }}
        />
      ) : null}
      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}
