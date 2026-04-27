import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Edit2, Package, Plus, Printer, ReceiptText, Save, Search as SearchIcon, Trash2, TrendingUp, TrendingDown, BadgeDollarSign, ShoppingCart, Tag } from 'lucide-react';
import { Button, Card } from '@/src/components/ui/Card';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog';
import TableLoader from '@/src/components/ui/TableLoader';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { getStoredUser, hasPermission } from '@/src/lib/auth';
import AccessDenied from '@/src/pages/AccessDenied';
import { customerService } from '@/src/services/customer.service';
import { itemRateService } from '@/src/services/itemRate.service';
import { servicesService } from '@/src/services/services.service';
import { estimationService } from '@/src/services/estimation.service';
import { printSingleEstimation } from '@/src/pages/stock/prints/estimationPrint';

const EMPTY_FORM = {
  estimateId: '',
  date: new Date().toISOString().slice(0, 10),
  customerId: '',
  customer: '',
  serviceId: '',
  forProduct: '',
  person: '',
  createdBy: '',
  designation: '',
  taxMode: 'withoutTax',
  itemRateId: '',
  item: '',
  qty: '',
  description: '',
  purchasePrice: '',
  purchaseTotal: '',
  salePrice: '',
  saleTotal: '',
  salePriceWithTax: '',
  saleTotalWithTax: '',
  discountPercentage: '',
  discountAmount: '',
  finalPrice: '',
  finalTotal: '',
  sendEmail: true,
  sendWhatsapp: true,
};

function sanitizeNumericInput(value) {
  const normalized = String(value || '').replace(/[^\d.]/g, '');
  const firstDotIndex = normalized.indexOf('.');
  if (firstDotIndex === -1) return normalized;
  return `${normalized.slice(0, firstDotIndex + 1)}${normalized.slice(firstDotIndex + 1).replace(/\./g, '')}`;
}

function FieldLabel({ children }) {
  return <label className="ml-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{children}</label>;
}

const INPUT_CLASS_NAME =
  'h-9 w-full rounded-xl border border-slate-300/80 bg-white px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70';

const READ_ONLY_INPUT_CLASS_NAME =
  'h-9 w-full cursor-not-allowed rounded-xl border border-slate-300/80 bg-slate-100 px-4 text-sm text-slate-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none';

const SECTION_PANEL_CLASS_NAME = 'rounded-[1.4rem] border border-slate-300/80 bg-slate-50/50';
const COMPACT_FIELD_WRAPPER_CLASS_NAME = 'w-full xl:max-w-[540px]';
const COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME = 'w-full xl:max-w-[245px]';
const COMPACT_MEDIUM_FIELD_WRAPPER_CLASS_NAME = 'w-full xl:max-w-[360px]';

function ReadOnlyField({ label, value, placeholder }) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <input type="text" value={value || ''} readOnly disabled placeholder={placeholder} className={READ_ONLY_INPUT_CLASS_NAME} />
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, colorClass, bgClass, borderClass }) {
  return (
    <div className={`flex flex-1 min-w-[180px] items-center gap-4 rounded-2xl border ${borderClass} ${bgClass} px-5 py-4 shadow-sm`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorClass} bg-white/70 shadow-inner`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 truncate">{label}</p>
        <p className={`mt-0.5 text-[17px] font-extrabold tabular-nums leading-tight ${colorClass}`}>{value}</p>
      </div>
    </div>
  );
}

function SearchableSelect({ selectId, label, value, options, placeholder, searchablePlaceholder, onChange, isOpen, onToggle, onClose }) {
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
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
        <button type="button" onClick={() => onToggle(selectId)} className={`mt-[2px] flex ${INPUT_CLASS_NAME} items-center justify-between text-left`}>
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
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                      option === value ? 'bg-brand-light text-brand' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                    {option === value ? <span className="text-[10px] font-bold text-emerald-600">Selected</span> : null}
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

function formatCurrency(value) {
  const amount = Number(value || 0);
  return amount ? amount.toFixed(2) : '0.00';
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatCellValue(value) {
  return String(value ?? '').trim() || '-';
}

function formatIntegerOrDash(value) {
  const normalized = String(value ?? '').trim();
  return normalized || '-';
}

function buildNextEstimateId(items) {
  const estimateIds = items
    .map((item) => String(item?.estimateId || '').trim())
    .filter(Boolean);

  if (!estimateIds.length) return 'EST-0001';

  const bestMatch = estimateIds.reduce(
    (best, estimateId) => {
      const match = estimateId.match(/^(.*?)(\d+)$/);
      if (!match) return best;

      const [, prefix, numericPart] = match;
      const numericValue = Number.parseInt(numericPart, 10);
      if (Number.isNaN(numericValue)) return best;

      if (!best || numericValue > best.numericValue) {
        return {
          prefix,
          numericValue,
          width: numericPart.length,
        };
      }

      return best;
    },
    null,
  );

  if (!bestMatch) return 'EST-0001';

  const nextNumericValue = String(bestMatch.numericValue + 1).padStart(bestMatch.width, '0');
  return `${bestMatch.prefix}${nextNumericValue}`;
}

export default function Estimation() {
  const canRead = hasPermission('INVENTORY.ESTIMATION.READ');
  const canCreate = hasPermission('INVENTORY.ESTIMATION.CREATE');
  const canEdit = hasPermission('INVENTORY.ESTIMATION.UPDATE');
  const canDelete = hasPermission('INVENTORY.ESTIMATION.DELETE');
  const canPrint = hasPermission('INVENTORY.ESTIMATION.PRINT');
  const hasRowActions = canEdit || canDelete || canPrint;

  const storedUser = useMemo(() => getStoredUser(), []);
  const loggedInUserName = storedUser?.fullName || storedUser?.username || '';
  const [formData, setFormData] = useState(() => ({ ...EMPTY_FORM, createdBy: loggedInUserName }));
  const [rows, setRows] = useState([]);
  const [estimations, setEstimations] = useState([]);
  const [apiSummary, setApiSummary] = useState({ totalPurchases: 0, totalDiscount: 0, totalFinal: 0, profit: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [openSelectId, setOpenSelectId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [setupError, setSetupError] = useState('');
  const [setupOptions, setSetupOptions] = useState({ customers: [], services: [], itemRates: [] });
  const { toasts, toast, removeToast } = useThemeToast();

  const customerOptions = useMemo(() => setupOptions.customers.map((c) => c.company), [setupOptions.customers]);
  const serviceOptions = useMemo(() => setupOptions.services.map((s) => s.serviceName), [setupOptions.services]);
  const itemOptions = useMemo(() => setupOptions.itemRates.map((r) => r.item), [setupOptions.itemRates]);
  const nextEstimateId = useMemo(() => buildNextEstimateId(estimations), [estimations]);

  const loadSetupOptions = useCallback(async () => {
    setIsLoadingSetup(true);
    setSetupError('');

    try {
      const [customersResult, servicesResult, itemRatesResult] = await Promise.allSettled([
        customerService.list(),
        servicesService.list(),
        itemRateService.list(),
      ]);

      const customersData = customersResult.status === 'fulfilled' ? (customersResult.value.data ?? []) : [];
      const servicesData = servicesResult.status === 'fulfilled' ? (servicesResult.value.data ?? []) : [];
      const itemRatesData = itemRatesResult.status === 'fulfilled' ? (itemRatesResult.value.data ?? []) : [];

      setSetupOptions({
        customers: customersData.map((c) => ({
          id: c.id,
          company: c.company || c.name || '',
          person: c.person || '',
          designation: c.designation || '',
        })),
        services: servicesData.map((s) => ({
          id: s.id,
          serviceName: s.serviceName || '',
        })),
        itemRates: itemRatesData.map((r) => ({
          id: r.id,
          item: r.item || '',
          itemSpecification: r.raw?.item_specification ?? r.raw?.itemSpecification ?? r.itemSpecification ?? '',
          resellerPrice: r.raw?.reseller_price ?? r.raw?.resellerPrice ?? r.reseller ?? '',
          salePrice: r.raw?.sale_price ?? r.raw?.salePrice ?? '',
          salePriceWithTax: r.raw?.sale_price_with_tax ?? r.raw?.salePriceWithTax ?? r.sale ?? '',
        })),
      });

      if (customersResult.status === 'rejected') {
        setSetupError(customersResult.reason?.message || 'Failed to load customers.');
      }
    } catch (requestError) {
      setSetupError(requestError.message || 'Failed to load estimation form setup options.');
    } finally {
      setIsLoadingSetup(false);
    }
  }, []);

  

  const loadEstimations = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const response = await estimationService.list();
      setEstimations(response.data);
      setApiSummary(response.summary ?? { totalPurchases: 0, totalDiscount: 0, totalFinal: 0, profit: 0 });
    } catch {
      setEstimations([]);
      setApiSummary({ totalPurchases: 0, totalDiscount: 0, totalFinal: 0, profit: 0 });
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadSetupOptions();
    loadEstimations();
  }, [loadSetupOptions, loadEstimations]);

  useEffect(() => {
    const qty = Number(formData.qty || 0);
    const purchasePrice = Number(formData.purchasePrice || 0);
    const salePrice = Number(formData.salePrice || 0);
    const salePriceWithTax = Number(formData.salePriceWithTax || 0);
    const discountPercentage = Number(formData.discountPercentage || 0);
    const purchaseTotal = qty * purchasePrice;
    const saleTotal = qty * salePrice;
    const saleTotalWithTax = qty * salePriceWithTax;
    const basePrice = formData.taxMode === 'withoutTax' ? salePrice : salePriceWithTax;
    const discountPerUnit = discountPercentage ? (basePrice * discountPercentage) / 100 : 0;
    const discountAmount = discountPerUnit * qty;
    const finalPrice = Math.max(basePrice - discountPerUnit, 0);
    const finalTotal = finalPrice * qty;

    setFormData((prev) => {
      const nextState = {
        ...prev,
        purchaseTotal: purchaseTotal ? purchaseTotal.toFixed(2) : '',
        saleTotal: saleTotal ? saleTotal.toFixed(2) : '',
        saleTotalWithTax: saleTotalWithTax ? saleTotalWithTax.toFixed(2) : '',
        discountAmount: discountAmount ? discountAmount.toFixed(2) : '',
        finalTotal: finalTotal ? finalTotal.toFixed(2) : '',
        finalPrice: finalPrice ? finalPrice.toFixed(2) : '',
      };

      if (
        nextState.purchaseTotal === prev.purchaseTotal &&
        nextState.saleTotal === prev.saleTotal &&
        nextState.saleTotalWithTax === prev.saleTotalWithTax &&
        nextState.discountAmount === prev.discountAmount &&
        nextState.finalTotal === prev.finalTotal &&
        nextState.finalPrice === prev.finalPrice
      ) {
        return prev;
      }

      return nextState;
    });
  }, [formData.qty, formData.purchasePrice, formData.salePrice, formData.salePriceWithTax, formData.discountPercentage, formData.taxMode]);

  // Recalculate all queued rows when taxMode changes
  useEffect(() => {
    if (!rows.length) return;
    setRows((prev) =>
      prev.map((row) => {
        const qty = Number(row.qty || 0);
        const salePrice = Number(row.salePrice || 0);
        const salePriceWithTax = Number(row.salePriceWithTax || 0);
        const discountPercentage = Number(row.discountPercentage || 0);
        const basePrice = formData.taxMode === 'withoutTax' ? salePrice : salePriceWithTax;
        const discountPerUnit = discountPercentage ? (basePrice * discountPercentage) / 100 : 0;
        const discountAmount = discountPerUnit * qty;
        const finalPrice = Math.max(basePrice - discountPerUnit, 0);
        const finalTotal = finalPrice * qty;
        return {
          ...row,
          taxMode: formData.taxMode,
          discountAmount: discountAmount ? discountAmount.toFixed(2) : '',
          finalPrice: finalPrice ? finalPrice.toFixed(2) : '',
          finalTotal: finalTotal ? finalTotal.toFixed(2) : '',
        };
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.taxMode]);

  const handleCustomerChange = (company) => {
    const found = setupOptions.customers.find((c) => c.company === company);
    setFormData((prev) => ({
      ...prev,
      customer: company,
      customerId: found?.id || '',
      person: found?.person || '',
      designation: found?.designation || '',
    }));
  };

  const handleForProductChange = (serviceName) => {
    const found = setupOptions.services.find((s) => s.serviceName === serviceName);
    setFormData((prev) => ({
      ...prev,
      forProduct: serviceName,
      serviceId: found?.id || '',
    }));
  };

  const handleItemChange = (itemName) => {
    const found = setupOptions.itemRates.find((r) => r.item === itemName);
    setFormData((prev) => ({
      ...prev,
      item: itemName,
      itemRateId: found?.id || '',
      description: found?.itemSpecification || '',
      purchasePrice: found ? String(found.resellerPrice ?? '') : '',
      salePrice: found ? String(found.salePrice ?? '') : '',
      salePriceWithTax: found ? String(found.salePriceWithTax ?? '') : '',
    }));
  };

  const updateField = (field, value) => {
    const normalizedValue = ['qty', 'discountPercentage'].includes(field)
      ? sanitizeNumericInput(value)
      : value;

    setFormData((prev) => ({ ...prev, [field]: normalizedValue }));
  };

  const closeForm = () => {
    setShowForm(false);
    setOpenSelectId(null);
    setRows([]);
    setEditingItem(null);
    setEditingRowId(null);
    setFormData({ ...EMPTY_FORM, createdBy: loggedInUserName });
  };

  const openCreateForm = useCallback(() => {
    setRows([]);
    setEditingItem(null);
    setEditingRowId(null);
    setOpenSelectId(null);
    setFormData({
      ...EMPTY_FORM,
      estimateId: nextEstimateId,
      createdBy: loggedInUserName,
    });
    setShowForm(true);
  }, [loggedInUserName, nextEstimateId]);

  const handleAddItem = () => {
    if (!formData.item) {
      toast.error('Item required', 'Please select item.');
      return;
    }
    if (!Number(formData.qty || 0)) {
      toast.error('Quantity required', 'Please enter qty before adding item.');
      return;
    }

    const nextRow = { id: editingRowId || crypto.randomUUID(), ...formData };

    setRows((prev) => {
      if (editingRowId) {
        return prev.map((row) => (row.id === editingRowId ? nextRow : row));
      }
      return [nextRow, ...prev];
    });

    setEditingRowId(null);
    setFormData((prev) => ({
      ...EMPTY_FORM,
      estimateId: prev.estimateId,
      date: prev.date,
      customer: prev.customer,
      customerId: prev.customerId,
      forProduct: prev.forProduct,
      serviceId: prev.serviceId,
      person: prev.person,
      createdBy: prev.createdBy,
      designation: prev.designation,
      taxMode: prev.taxMode,
    }));
    toast.success(editingRowId ? 'Item updated' : 'Item added', editingRowId ? 'Queued estimation item updated successfully.' : 'Estimation item has been added to the preview list.');
  };

  const handleRemoveRow = (rowId) => {
    const removedRow = rows.find((row) => row.id === rowId);
    setRows((prev) => prev.filter((row) => row.id !== rowId));

    if (editingRowId === rowId) {
      setEditingRowId(null);
      setFormData((prev) => ({
        ...EMPTY_FORM,
        estimateId: prev.estimateId,
        date: prev.date,
        customer: prev.customer,
        customerId: prev.customerId,
        forProduct: prev.forProduct,
        serviceId: prev.serviceId,
        person: prev.person,
        createdBy: prev.createdBy,
        designation: prev.designation,
      }));
    }

    toast.success('Item removed', removedRow?.item ? `${removedRow.item} removed from the queued list.` : 'Queued item removed successfully.');
  };

  const handleEditQueuedRow = (row) => {
    setEditingRowId(row.id);
    setFormData({
      ...EMPTY_FORM,
      estimateId: row.estimateId || '',
      date: row.date || new Date().toISOString().slice(0, 10),
      customerId: row.customerId || '',
      customer: row.customer || '',
      serviceId: row.serviceId || '',
      forProduct: row.forProduct || '',
      person: row.person || '',
      createdBy: row.createdBy || loggedInUserName,
      designation: row.designation || '',
      itemRateId: row.itemRateId || '',
      item: row.item || row.itemName || '',
      qty: String(row.qty || ''),
      description: row.description || '',
      purchasePrice: String(row.purchasePrice || ''),
      purchaseTotal: String(row.purchaseTotal || ''),
      salePrice: String(row.salePrice || ''),
      saleTotal: String(row.saleTotal || ''),
      salePriceWithTax: String(row.salePriceWithTax || ''),
      saleTotalWithTax: String(row.saleTotalWithTax || ''),
      discountPercentage: String(row.discountPercentage || row.discountPercent || ''),
      discountAmount: String(row.discountAmount || ''),
      finalPrice: String(row.finalPrice || ''),
      finalTotal: String(row.finalTotal || ''),
      taxMode: row.taxMode || formData.taxMode || 'withoutTax',
    });
  };

  const openEditForm = async (row) => {
    setIsSaving(true);
    try {
      const response = await estimationService.get(row.id);
      const estimation = response.data || {};
      const detailRows = Array.isArray(estimation.items)
        ? estimation.items.map((item) => ({
            id: item.id || crypto.randomUUID(),
            estimateId: estimation.estimateId || '',
            date: estimation.estimateDate ? String(estimation.estimateDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
            customerId: estimation.customerId || '',
            customer: estimation.customerName || '',
            serviceId: estimation.serviceId || '',
            forProduct: estimation.serviceName || '',
            person: estimation.person || '',
            designation: estimation.designation || '',
            createdBy: estimation.createdBy || loggedInUserName,
            itemRateId: item.itemRateId || '',
            item: item.itemName || '',
            qty: String(item.qty || ''),
            description: item.description || '',
            purchasePrice: String(item.purchasePrice || ''),
            purchaseTotal: String(item.purchaseTotal || ''),
            salePrice: String(item.salePrice || ''),
            saleTotal: String(item.saleTotal || ''),
            salePriceWithTax: String(item.salePriceWithTax || ''),
            saleTotalWithTax: String(item.saleTotalWithTax || ''),
            discountPercentage: String(item.discountPercent || ''),
            discountAmount: String(item.discountAmount || ''),
            finalPrice: String(item.finalPrice || ''),
            finalTotal: String(item.finalTotal || ''),
            taxMode: estimation.taxMode || 'withoutTax',
          }))
        : [];

      setEditingItem({ ...row, ...estimation });
      setEditingRowId(null);
      setRows(detailRows);

      setFormData({
        ...EMPTY_FORM,
        estimateId: estimation.estimateId || '',
        date: estimation.estimateDate ? String(estimation.estimateDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
        customerId: estimation.customerId || '',
        customer: estimation.customerName || '',
        serviceId: estimation.serviceId || '',
        forProduct: estimation.serviceName || '',
        person: estimation.person || '',
        designation: estimation.designation || '',
        createdBy: estimation.createdBy || loggedInUserName,
        taxMode: estimation.taxMode || 'withoutTax',
      });
      setShowForm(true);
    } catch (requestError) {
      toast.error('Load failed', requestError?.response?.data?.message || requestError.message || 'Failed to load estimation details.');
    } finally {
      setIsSaving(false);
    }
  };

  const getDeliveryFailureMessage = (channelName, delivery) => {
    if (channelName === 'WhatsApp') return 'WhatsApp send unsuccessful';
    const detail = delivery?.message || delivery?.reason || delivery?.error || 'not sent';
    return `${channelName} not sent${detail ? `: ${detail}` : ''}`;
  };

  const handleSaveEstimation = async () => {
    const hasCurrentFormEntry = formData.item && formData.itemRateId;
    const rowsToSave = rows.length ? rows : hasCurrentFormEntry ? [{ id: crypto.randomUUID(), ...formData }] : [];

    if (!rowsToSave.length) {
      toast.error('No estimation items', 'Add at least one item before saving the estimation.');
      return;
    }
    // Edit mode — PUT single record
    if (editingItem) {
      setIsSaving(true);
      try {
        const payload = {
          estimate_date: formData.date,
          customer_id: formData.customerId ? Number(formData.customerId) : null,
          service_id: formData.serviceId ? Number(formData.serviceId) : null,
          tax_mode: formData.taxMode,
          status: 'active',
          sendEmail: formData.sendEmail,
          sendWhatsapp: formData.sendWhatsapp,
          items: rowsToSave.map((row) => ({
            item_rate_id: Number(row.itemRateId),
            qty: Number(row.qty || 0),
            description: row.description || '',
            discount_percent: Number(row.discountPercentage || row.discountPercent || 0),
          })),
        };
        const response = await estimationService.update(editingItem.id, payload);
        const saved = response?.data || {};
        const emailDelivery = saved.delivery?.email;
        const whatsappDelivery = saved.delivery?.whatsapp;
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
          toast.error('Estimation updated with delivery issue', `${successMessage}${failedDeliveries.join(' | ')}.`);
        } else if (successfulDeliveries.length) {
          toast.success('Estimation updated', `${successfulDeliveries.join(' | ')}.`);
        } else {
          toast.success('Estimation updated', 'Estimation updated successfully.');
        }

        setEditingItem(null);
        setEditingRowId(null);
        setShowForm(false);
        setFormData({ ...EMPTY_FORM, createdBy: loggedInUserName });
        await loadEstimations();
      } catch (requestError) {
        toast.error('Update failed', requestError?.response?.data?.message || requestError.message || 'Failed to update estimation.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Create mode — POST one row per queued item (or current form if no rows queued)
    setIsSaving(true);
    try {
      const payload = {
        estimate_date: formData.date,
        customer_id: formData.customerId ? Number(formData.customerId) : null,
        service_id: formData.serviceId ? Number(formData.serviceId) : null,
        tax_mode: formData.taxMode,
        status: 'active',
        sendEmail: formData.sendEmail,
        sendWhatsapp: formData.sendWhatsapp,
        items: rowsToSave.map((row) => ({
          item_rate_id: Number(row.itemRateId),
          qty: Number(row.qty || 0),
          description: row.description || '',
          discount_percent: Number(row.discountPercentage || row.discountPercent || 0),
        })),
      };
      const lastResponse = await estimationService.create(payload);

      const savedEstimateId =
        lastResponse?.data?.data?.estimate_id ||
        lastResponse?.data?.data?.estimateId ||
        lastResponse?.data?.estimate_id ||
        lastResponse?.data?.estimateId ||
        '';

      const saved = lastResponse?.data?.data || lastResponse?.data || {};
      const emailDelivery = saved.delivery?.email;
      const whatsappDelivery = saved.delivery?.whatsapp;
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

      await loadEstimations();
      setRows([]);
      closeForm();

      if (failedDeliveries.length) {
        const successMessage = successfulDeliveries.length ? `${successfulDeliveries.join(' | ')}. ` : '';
        const savedMessage = savedEstimateId ? `Saved as ${savedEstimateId}. ` : '';
        toast.error('Estimation saved with delivery issue', `${savedMessage}${successMessage}${failedDeliveries.join(' | ')}.`);
      } else if (successfulDeliveries.length) {
        const savedMessage = savedEstimateId ? `Saved as ${savedEstimateId}. ` : '';
        toast.success('Estimation saved', `${savedMessage}${successfulDeliveries.join(' | ')}.`);
      } else {
        toast.success('Estimation saved', savedEstimateId ? `Saved as ${savedEstimateId}.` : 'Estimation saved successfully.');
      }
    } catch (requestError) {
      toast.error('Save failed', requestError?.response?.data?.message || requestError.message || 'Failed to save estimation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintSingle = useCallback(async (row) => {
    try {
      const payload = await estimationService.printSingle(row.id);
      printSingleEstimation(payload);
    } catch (requestError) {
      toast.error('Print failed', requestError?.response?.data?.message || requestError.message || 'Could not load print data.');
    }
  }, [toast]);

  const handleDeleteEstimation = async () => {
    if (!deleteTarget?.id) return;

    setIsSaving(true);
    try {
      await estimationService.remove(deleteTarget.id);
      await loadEstimations();
      setDeleteTarget(null);
      toast.success('Estimation deleted', 'Estimation record has been deleted successfully.');
    } catch (requestError) {
      toast.error('Delete failed', requestError?.response?.data?.message || requestError.message || 'Failed to delete estimation.');
    } finally {
      setIsSaving(false);
    }
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.purchase += Number(row.purchaseTotal || 0);
        acc.sale += Number(row.saleTotal || 0);
        acc.discount += Number(row.discountAmount || 0);
        acc.final += Number(row.finalTotal || 0);
        return acc;
      },
      { purchase: 0, sale: 0, discount: 0, final: 0 },
    );
  }, [rows]);

  const totalProfit = useMemo(() => Math.max(totals.final - totals.purchase, 0), [totals.final, totals.purchase]);
  const filteredEstimations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return estimations;

    return estimations.filter((row) =>
      `${row.estimateId} ${row.customerName} ${row.serviceName} ${row.estimateDate} ${row.status}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [estimations, searchQuery]);
  const tableColumnCount = hasRowActions ? 8 : 7;

  return (
    <div className="space-y-8">
      {!canRead ? <AccessDenied /> : null}
      {canRead ? (
      <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        {!showForm ? (
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Estimation</h1>
            <p className="mt-1 text-gray-500">Create estimation entries with the same form styling language used in item definition.</p>
          </div>
        ) : null}

        {!showForm && canCreate ? (
          <Button onClick={openCreateForm} icon={<Plus className="h-4 w-4" />} className="bg-brand hover:bg-brand-hover shadow-brand/20">
            Add Estimation
          </Button>
        ) : null}
      </div>

      {!showForm ? (
        <Card className="border-none p-0 shadow-xl shadow-gray-200/50">
          <div className="px-6 pb-6 pt-5">
            <div className="mb-5 flex flex-col gap-4 border-b border-gray-50 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-96">
                <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search estimation..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                />
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-gray-400">
                  <span className="font-bold text-gray-900">{filteredEstimations.length}</span> Records
                </p>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
          
              <SummaryCard label="Total Purchases" value={formatCurrency(apiSummary.totalPurchases)} icon={BadgeDollarSign} colorClass="text-slate-700" bgClass="bg-slate-50/80" borderClass="border-slate-200" />
              <SummaryCard label="Total Discount" value={formatCurrency(apiSummary.totalDiscount)} icon={Tag} colorClass="text-amber-600" bgClass="bg-amber-50/60" borderClass="border-amber-100" />
              <SummaryCard label="Final Revenue" value={formatCurrency(apiSummary.totalFinal)} icon={TrendingUp} colorClass="text-brand" bgClass="bg-brand-light/50" borderClass="border-brand/10" />
              <SummaryCard label="Net Profit" value={formatCurrency(apiSummary.profit)} icon={apiSummary.profit >= 0 ? TrendingUp : TrendingDown} colorClass={apiSummary.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'} bgClass={apiSummary.profit >= 0 ? 'bg-emerald-50/60' : 'bg-rose-50/60'} borderClass={apiSummary.profit >= 0 ? 'border-emerald-100' : 'border-rose-100'} />
            </div>

            <div className="w-full overflow-hidden rounded-4xl border border-gray-100 bg-white/80 shadow-2xl shadow-gray-200/30 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 first:rounded-tl-4xl">Sr.#</th>
                     
                     
                     
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Estimate ID</th>
                      <th className="border-b border-gray-100/60 whitespace-nowrap px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Date</th>
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Customer</th>
                      <th className="border-b border-gray-100/60 px-5 whitespace-nowrap py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Service</th>
                      <th className="border-b border-gray-100/60 whitespace-nowrap px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Discount Total</th>
                      <th className="border-b border-gray-100/60 px-5 whitespace-nowrap py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Final Total</th>
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Status</th>
                      {hasRowActions ? <th className="border-b border-gray-100/60 px-5 py-6 text-right text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 last:rounded-tr-4xl">Actions</th> : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {isLoadingList ? (
                      <tr>
                        <td colSpan={tableColumnCount} className="px-5 py-6 text-center">
                          <TableLoader label="Loading estimations..." />
                        </td>
                      </tr>
                    ) : filteredEstimations.length === 0 ? (
                      <tr>
                        <td colSpan={tableColumnCount} className="px-5 py-20 text-center text-sm font-medium text-gray-400">No estimation records found.</td>
                      </tr>
                    ) : (
                      filteredEstimations.map((row, index) => (
                        <tr key={row.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{index + 1}</td>
                          
                          
                      
                          
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCellValue(row.estimateId)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatDate(row.estimateDate)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.customerName)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.serviceName)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-amber-700 whitespace-nowrap">{formatCellValue(row.discountTotal)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.finalTotal)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 whitespace-nowrap">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${row.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                              {row.status}
                            </span>
                          </td>
                          {hasRowActions ? (
                          <td className="border-b border-gray-50/30 px-5 py-6 text-start whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
                              {canPrint ? (
                                <button
                                  type="button"
                                  title="Print"
                                  onClick={() => handlePrintSingle(row)}
                                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-violet-600 hover:shadow-xl hover:shadow-violet-100/50 active:scale-95"
                                >
                                  <Printer className="h-4.5 w-4.5" />
                                </button>
                              ) : null}
                              {canEdit ? (
                                <button
                                  type="button"
                                  onClick={() => openEditForm(row)}
                                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4.5 w-4.5" />
                                </button>
                              ) : null}
                              {canDelete ? (
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(row)}
                                  disabled={isSaving}
                                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50 active:scale-95"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              ) : null}
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
      ) : (
        <div className="mx-auto w-full max-w-6xl">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-300/80 bg-white">
            <div className="border-b border-slate-300/80 bg-slate-100/30 px-8 py-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300/80 bg-white text-brand shadow-sm">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[20px] font-bold text-gray-700">{editingItem ? 'Edit Estimation' : 'Estimation Form'}</p>
                    <p className="mt-1 text-sm text-slate-600">{editingItem ? `Editing ${editingItem.estimateId || 'record'} — update the fields below and save.` : 'Use the same structured stock form styling while keeping all fields from the estimation layout.'}</p>
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
              {setupError ? <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{setupError}</div> : null}

              <section className={SECTION_PANEL_CLASS_NAME}>
                <div className="flex items-center justify-between border-b border-slate-300/80 px-6 py-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Estimation Setup</h3>
                    <p className="mt-1 text-xs text-slate-500">Estimate id, date, customer, product, employee, and contact information.</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                    <ReceiptText className="h-4 w-4" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-12">
                  <div className="xl:col-span-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,0.95fr)_minmax(0,0.95fr)]">
                      <div className={COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME}>
                        <ReadOnlyField label="Estimate ID" value={formData.estimateId} placeholder="Estimate id" />
                      </div>
                      <div className={`space-y-2 ${COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME}`}>
                        <FieldLabel>Date</FieldLabel>
                        <input type="date" value={formData.date} onChange={(event) => updateField('date', event.target.value)} className={INPUT_CLASS_NAME} />
                      </div>
                      <div className={`md:col-span-2 ${COMPACT_FIELD_WRAPPER_CLASS_NAME}`}>
                        <SearchableSelect selectId="customer" label="Customer" value={formData.customer} options={customerOptions} placeholder="Select customer" searchablePlaceholder="Search customer" onChange={handleCustomerChange} isOpen={openSelectId === 'customer'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
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
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:pt-[73px]">
                      <div className={`md:col-span-2 ${COMPACT_FIELD_WRAPPER_CLASS_NAME}`}>
                        <SearchableSelect selectId="forProduct" label="For Product" value={formData.forProduct} options={serviceOptions} placeholder="Select product" searchablePlaceholder="Search product" onChange={handleForProductChange} isOpen={openSelectId === 'forProduct'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                      </div>
                      <div className={`md:col-span-2 ${COMPACT_MEDIUM_FIELD_WRAPPER_CLASS_NAME}`}>
                        <ReadOnlyField label="Created By" value={formData.createdBy} placeholder="Creator name" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className={SECTION_PANEL_CLASS_NAME}>
                <div className="flex items-center justify-between border-b border-slate-300/80 px-6 py-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Item Details</h3>
                    <p className="mt-1 text-xs text-slate-500">Item, quantity, description, pricing, discount, and final calculation details.</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/70 text-brand">
                    <Package className="h-4 w-4" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-12">
                  <div className="xl:col-span-7">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                      <div className="md:col-span-9">
                        <SearchableSelect selectId="item" label="Item" value={formData.item} options={itemOptions} placeholder="Select item" searchablePlaceholder="Search item" onChange={handleItemChange} isOpen={openSelectId === 'item'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <FieldLabel>Qty</FieldLabel>
                        <input type="text" value={formData.qty} onChange={(event) => updateField('qty', event.target.value)} placeholder="0" className={INPUT_CLASS_NAME} />
                      </div>
                      <div className="space-y-2 md:col-span-12">
                        <FieldLabel>Description</FieldLabel>
                        <textarea
                          value={formData.description}
                          onChange={(event) => updateField('description', event.target.value)}
                          placeholder="Enter description"
                          rows={8}
                          className="min-h-[222px] w-full rounded-xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70"
                        />
                      </div>
                      <div className="md:col-span-12">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Build item list before saving</p>
                            <p className="mt-1 text-xs text-slate-500">Add this item to the queue, then continue with more items if needed.</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover"
                          >
                            <Plus className="h-4.5 w-4.5" />
                            {editingRowId ? 'Update Item' : 'Add Item'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="xl:col-span-5">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <FieldLabel>Purchase Price</FieldLabel>
                            <input type="text" value={formData.purchasePrice} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                          </div>
                          <div className="space-y-2">
                            <FieldLabel>Purchase Total</FieldLabel>
                            <input type="text" value={formData.purchaseTotal} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/60 p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <FieldLabel>Sale Price </FieldLabel>
                            <input type="text" value={formData.salePrice} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                          </div>
                          <div className="space-y-2">
                            <FieldLabel>Sale Total</FieldLabel>
                            <input type="text" value={formData.saleTotal} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                          </div>
                          {formData.taxMode !== 'withoutTax' ? (
                            <>
                              <div className="space-y-2">
                                <FieldLabel>Sale Price With Tax</FieldLabel>
                                <input type="text" value={formData.salePriceWithTax} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                              </div>
                              <div className="space-y-2">
                                <FieldLabel>Sale Total With Tax</FieldLabel>
                                <input type="text" value={formData.saleTotalWithTax} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-yellow-200/80 bg-yellow-50/70 p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <FieldLabel>Discount %Age</FieldLabel>
                            <input type="text" value={formData.discountPercentage} onChange={(event) => updateField('discountPercentage', event.target.value)} placeholder="0" className={INPUT_CLASS_NAME} />
                          </div>
                          <div className="space-y-2">
                            <FieldLabel>Total Discount Amount</FieldLabel>
                            <input type="text" value={formData.discountAmount} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-violet-200/70 bg-violet-50/60 p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <FieldLabel>Final Price</FieldLabel>
                            <input type="text" value={formData.finalPrice} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                          </div>
                          <div className="space-y-2">
                            <FieldLabel>Final Total</FieldLabel>
                            <input type="text" value={formData.finalTotal} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </section>

              {rows.length ? (
                <section className={SECTION_PANEL_CLASS_NAME}>
                  <div className="flex items-center justify-between border-b border-slate-300/80 px-6 py-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Queued Items</h3>
                      <p className="mt-1 text-xs text-slate-500">Review, edit, or remove estimation items before final save.</p>
                    </div>
                    <div className="rounded-xl border border-slate-300/80 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                      {rows.length} {rows.length === 1 ? 'Item' : 'Items'}
                    </div>
                  </div>

                  <div className="overflow-x-auto p-6">
                    <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                      <thead>
                        <tr className="bg-slate-100/80">
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap">Sr.</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap">Item Detail</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap">Qty</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap">{formData.taxMode === 'withTax' ? 'Unit Price (w/ Tax)' : 'Unit Price'}</th>
                          {formData.taxMode === 'withTax' ? (
                            <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap">Tax Amt</th>
                          ) : null}
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap">Discount</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap">Final Total</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={row.id} className="odd:bg-white even:bg-slate-50/45 transition-colors hover:bg-brand-light/30">
                            <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-600">{index + 1}</td>
                            <td className="border-b border-slate-100 px-4 py-4">
                              <div className="min-w-[260px]">
                                <p className="text-sm font-semibold text-slate-900">{formatCellValue(row.item)}</p>
                                
                              </div>
                            </td>
                            <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700">{formatIntegerOrDash(row.qty)}</td>
                            <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700">{formatCellValue(formData.taxMode === 'withTax' ? row.salePriceWithTax : row.salePrice)}</td>
                            {formData.taxMode === 'withTax' ? (
                              <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-indigo-700">{formatCellValue((Number(row.salePriceWithTax || 0) - Number(row.salePrice || 0)).toFixed(2))}</td>
                            ) : null}
                            <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-amber-700">{formatCellValue(row.discountAmount)}</td>
                            <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-brand">{formatCellValue(row.finalTotal)}</td>
                            <td className="border-b border-slate-100 px-4 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleEditQueuedRow(row)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-brand/20 hover:bg-brand-light hover:text-brand"
                                  title="Edit item"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(row.id)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                  title="Delete item"
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
                  <div className="border-t border-slate-200/80 px-6 py-4">
                    <div className="flex flex-col flex-wrap items-end justify-end gap-x-8 gap-y-2 text-sm font-semibold text-slate-700">
                      <p>
                        Item Discount Total:
                        <span className="ml-2 tabular-nums text-amber-700">{formatCurrency(totals.discount)}</span>
                      </p>
                      <p>
                        Item Final Total:
                        <span className="ml-2 tabular-nums text-brand">{formatCurrency(totals.final)}</span>
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              <div className="flex items-center justify-between rounded-2xl border border-slate-300/80 bg-slate-50/95 px-6 py-4">
                <div>
                  <p className="text-xs leading-6 text-slate-600">Select a customer and item to auto-fill prices. Only Qty and Discount % are editable.</p>
                  {editingRowId ? <p className="text-xs font-semibold text-brand">You are editing a queued item. Click update item to apply changes.</p> : null}
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeForm} className="rounded-xl border border-slate-300/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">
                    Cancel
                  </button>
                  <button type="button" onClick={handleSaveEstimation} disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover disabled:opacity-60">
                    <Save className="h-4.5 w-4.5" />
                    {isSaving ? (editingItem ? 'Updating…' : 'Saving…') : (editingItem ? 'Update Estimation' : 'Save Estimation')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </> 
      ) : null}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Estimation"
        description={`Are you sure you want to delete ${deleteTarget?.estimateId || 'this estimation'}? This action cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteEstimation}
        isLoading={isSaving}
      />
      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}
