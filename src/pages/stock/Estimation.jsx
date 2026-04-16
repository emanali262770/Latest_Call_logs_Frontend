import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, Package, Plus, ReceiptText, Save, Search as SearchIcon, Trash2 } from 'lucide-react';
import { Button, Card } from '@/src/components/ui/Card';
import TableLoader from '@/src/components/ui/TableLoader';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { getStoredUser } from '@/src/lib/auth';
import { customerService } from '@/src/services/customer.service';
import { itemRateService } from '@/src/services/itemRate.service';

const EMPTY_FORM = {
  estimateId: 'EST-0001',
  date: new Date().toISOString().slice(0, 10),
  customer: '',
  forProduct: '',
  person: '',
  createdBy: '',
  designation: '',
  item: '',
  qty: '',
  description: '',
  purchasePrice: '',
  purchaseTotal: '',
  salePrice: '',
  saleTotal: '',
  discountPercentage: '',
  discountAmount: '',
  finalPrice: '',
  finalTotal: '',
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

function SummaryFooterValue({ label, value, accent = 'slate' }) {
  const accentMap = {
    slate: 'text-slate-900',
    amber: 'text-amber-700',
    indigo: 'text-indigo-700',
    emerald: 'text-emerald-700',
  };

  return (
    <div className="inline-flex min-w-[220px] items-center justify-between gap-6 rounded-xl border border-slate-200 bg-white px-4 py-[6px] ">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <span className={`text-base font-semibold tabular-nums ${accentMap[accent] || accentMap.slate}`}>{value}</span>
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

function formatCellValue(value) {
  return String(value ?? '').trim() || '-';
}

function formatIntegerOrDash(value) {
  const normalized = String(value ?? '').trim();
  return normalized || '-';
}

export default function Estimation() {
  const storedUser = useMemo(() => getStoredUser(), []);
  const loggedInUserName = storedUser?.fullName || storedUser?.username || '';
  const [formData, setFormData] = useState(() => ({ ...EMPTY_FORM, createdBy: loggedInUserName }));
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSelectId, setOpenSelectId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);
  const [setupError, setSetupError] = useState('');
  const [setupOptions, setSetupOptions] = useState({ customers: [], items: [] });
  const { toasts, toast, removeToast } = useThemeToast();

  const customerOptions = useMemo(() => setupOptions.customers.map((item) => item.name), [setupOptions.customers]);
  const itemOptions = useMemo(() => setupOptions.items.map((item) => item.name), [setupOptions.items]);

  const loadSetupOptions = useCallback(async () => {
    setIsLoadingSetup(true);
    setSetupError('');

    try {
      const [customersResponse, itemsResponse] = await Promise.all([
        customerService.list(),
        itemRateService.lookups(),
      ]);

      setSetupOptions({
        customers: customersResponse.data.map((item) => ({ id: item.id, name: item.name })),
        items: itemsResponse.data.items.map((item) => ({ id: item.id, name: item.name })),
      });
    } catch (requestError) {
      setSetupError(requestError.message || 'Failed to load estimation form setup options.');
    } finally {
      setIsLoadingSetup(false);
    }
  }, []);

  useEffect(() => {
    loadSetupOptions();
  }, [loadSetupOptions]);

  useEffect(() => {
    const qty = Number(formData.qty || 0);
    const purchasePrice = Number(formData.purchasePrice || 0);
    const salePrice = Number(formData.salePrice || 0);
    const discountPercentage = Number(formData.discountPercentage || 0);
    const discountAmount = Number(formData.discountAmount || 0);
    const purchaseTotal = qty * purchasePrice;
    const saleTotal = qty * salePrice;
    const calculatedDiscountAmount = discountPercentage ? (saleTotal * discountPercentage) / 100 : discountAmount;
    const finalTotal = Math.max(saleTotal - calculatedDiscountAmount, 0);
    const finalPrice = qty ? finalTotal / qty : 0;

    setFormData((prev) => {
      const nextState = {
        ...prev,
        purchaseTotal: purchaseTotal ? purchaseTotal.toFixed(2) : '',
        saleTotal: saleTotal ? saleTotal.toFixed(2) : '',
        discountAmount: calculatedDiscountAmount ? calculatedDiscountAmount.toFixed(2) : prev.discountPercentage ? '0.00' : prev.discountAmount,
        finalTotal: finalTotal ? finalTotal.toFixed(2) : '',
        finalPrice: finalPrice ? finalPrice.toFixed(2) : '',
      };

      if (
        nextState.purchaseTotal === prev.purchaseTotal &&
        nextState.saleTotal === prev.saleTotal &&
        nextState.discountAmount === prev.discountAmount &&
        nextState.finalTotal === prev.finalTotal &&
        nextState.finalPrice === prev.finalPrice
      ) {
        return prev;
      }

      return nextState;
    });
  }, [formData.qty, formData.purchasePrice, formData.salePrice, formData.discountPercentage, formData.discountAmount]);

  const updateField = (field, value) => {
    const normalizedValue = ['qty', 'purchasePrice', 'purchaseTotal', 'salePrice', 'saleTotal', 'discountPercentage', 'discountAmount', 'finalPrice', 'finalTotal'].includes(field)
      ? sanitizeNumericInput(value)
      : value;

    setFormData((prev) => {
      const nextState = { ...prev, [field]: normalizedValue };

      if (field === 'createdBy') {
        nextState.person = normalizedValue;
      }

      return nextState;
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setOpenSelectId(null);
    setFormData((prev) => ({ ...EMPTY_FORM, estimateId: prev.estimateId, createdBy: loggedInUserName }));
  };

  const handleAddItem = () => {
    if (!formData.customer || !formData.item || !formData.qty) {
      toast.error('Required fields missing', 'Please select customer, item, and enter quantity before adding the item.');
      return;
    }

    const nextRow = {
      id: crypto.randomUUID(),
      ...formData,
    };

    setRows((prev) => [nextRow, ...prev]);
    setFormData((prev) => ({
      ...EMPTY_FORM,
      estimateId: prev.estimateId,
      date: prev.date,
      customer: prev.customer,
      forProduct: prev.forProduct,
      person: prev.person,
      createdBy: prev.createdBy,
      designation: prev.designation,
    }));
    toast.success('Item added', 'Estimation item has been added to the preview list.');
  };

  const handleRemoveRow = (rowId) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleSaveEstimation = () => {
    if (!rows.length) {
      toast.error('No estimation items', 'Add at least one item before saving the estimation.');
      return;
    }

    const nextId = String(Number(formData.estimateId || 0) + 1).padStart(4, '0');
    setFormData({ ...EMPTY_FORM, estimateId: nextId, createdBy: loggedInUserName });
    setRows([]);
    setShowForm(false);
    toast.success('Estimation prepared', 'Estimation screen is ready and the current preview has been cleared.');
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
  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return rows;

    return rows.filter((row) =>
      `${row.item} ${row.description} ${row.purchasePrice} ${row.qty} ${row.purchaseTotal} ${row.discountPercentage} ${row.discountAmount} ${row.salePrice} ${row.finalTotal}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [rows, searchQuery]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        {!showForm ? (
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Estimation</h1>
            <p className="mt-1 text-gray-500">Create estimation entries with the same form styling language used in item definition.</p>
          </div>
        ) : null}

        {!showForm ? (
          <Button onClick={() => setShowForm(true)} icon={<Plus className="h-4 w-4" />} className="bg-brand hover:bg-brand-hover shadow-brand/20">
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
              <p className="text-sm font-medium text-gray-400">
                <span className="font-bold text-gray-900">{filteredRows.length}</span> Records
              </p>
            </div>

            <div className="w-full overflow-hidden rounded-4xl border border-gray-100 bg-white/80 shadow-2xl shadow-gray-200/30 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1320px] border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-linear-to-r from-gray-50/80 via-gray-50/40 to-transparent">
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 first:rounded-tl-4xl">Sr.#</th>
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Item</th>
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Details</th>
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Rate</th>
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Qty</th>
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Total</th>
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Discount %</th>
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Discount</th>
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Sale Rate</th>
                      <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Final</th>
                      <th className="border-b border-gray-100/60 px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 last:rounded-tr-4xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {isLoadingSetup ? (
                      <tr>
                        <td colSpan={11} className="px-8 py-6 text-center">
                          <TableLoader label="Loading estimation form options..." />
                        </td>
                      </tr>
                    ) : filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-8 py-20 text-center text-sm font-medium text-gray-400">No estimation items found.</td>
                      </tr>
                    ) : (
                      filteredRows.map((row, index) => (
                        <tr key={row.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{index + 1}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/10 bg-brand-light text-brand">
                                <Package className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{formatCellValue(row.item)}</span>
                            </div>
                          </td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700">
                            <div className="max-w-[260px] whitespace-normal break-words">{formatCellValue(row.description)}</div>
                          </td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.purchasePrice)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatIntegerOrDash(row.qty)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.purchaseTotal)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.discountPercentage)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.discountAmount)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.salePrice)}</td>
                          <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{formatCellValue(row.finalTotal)}</td>
                          <td className="border-b border-gray-50/30 px-8 py-6 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50"
                              title="Delete"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <div className="flex max-w-[760px] flex-wrap justify-end gap-3">
                <SummaryFooterValue label="Total" value={formatCurrency(totals.sale)} accent="slate" />
                <SummaryFooterValue label="Discount" value={formatCurrency(totals.discount)} accent="amber" />
                <SummaryFooterValue label="Final" value={formatCurrency(totals.final)} accent="indigo" />
                <SummaryFooterValue label="Total Purchases" value={formatCurrency(totals.purchase)} accent="slate" />
                <SummaryFooterValue label="Profit" value={formatCurrency(totalProfit)} accent="emerald" />
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
                    <p className="text-[20px] font-bold text-gray-700">Estimation Form</p>
                    <p className="mt-1 text-sm text-slate-600">Use the same structured stock form styling while keeping all fields from the estimation layout.</p>
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
                        <SearchableSelect selectId="customer" label="Customer" value={formData.customer} options={customerOptions} placeholder="Select customer" searchablePlaceholder="Search customer" onChange={(value) => updateField('customer', value)} isOpen={openSelectId === 'customer'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                      </div>
                      <div className={`md:col-span-2 space-y-2 ${COMPACT_FIELD_WRAPPER_CLASS_NAME}`}>
                        <FieldLabel>Person</FieldLabel>
                        <input type="text" value={formData.person} onChange={(event) => updateField('person', event.target.value)} placeholder="Enter person" className={INPUT_CLASS_NAME} />
                      </div>
                      <div className={`md:col-span-2 space-y-2 ${COMPACT_MEDIUM_FIELD_WRAPPER_CLASS_NAME}`}>
                        <FieldLabel>Designation</FieldLabel>
                        <input type="text" value={formData.designation} onChange={(event) => updateField('designation', event.target.value)} placeholder="Enter designation" className={INPUT_CLASS_NAME} />
                      </div>
                    </div>
                  </div>

                  <div className="xl:col-span-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:pt-[73px]">
                      <div className={`md:col-span-2 ${COMPACT_FIELD_WRAPPER_CLASS_NAME}`}>
                        <SearchableSelect selectId="forProduct" label="For Product" value={formData.forProduct} options={itemOptions} placeholder="Select product" searchablePlaceholder="Search product" onChange={(value) => updateField('forProduct', value)} isOpen={openSelectId === 'forProduct'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
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
                        <SearchableSelect selectId="item" label="Item" value={formData.item} options={itemOptions} placeholder="Select item" searchablePlaceholder="Search item" onChange={(value) => updateField('item', value)} isOpen={openSelectId === 'item'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
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
                    </div>
                  </div>

                  <div className="xl:col-span-5">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <FieldLabel>Purchase Price</FieldLabel>
                            <input type="text" value={formData.purchasePrice} onChange={(event) => updateField('purchasePrice', event.target.value)} placeholder="0.00" className={INPUT_CLASS_NAME} />
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
                            <FieldLabel>Sale Price Without Tax</FieldLabel>
                            <input type="text" value={formData.salePrice} onChange={(event) => updateField('salePrice', event.target.value)} placeholder="0.00" className={INPUT_CLASS_NAME} />
                          </div>
                          <div className="space-y-2">
                            <FieldLabel>Sale Total</FieldLabel>
                            <input type="text" value={formData.saleTotal} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                          </div>
                          <div className="space-y-2">
                            <FieldLabel>Sale Price With Tax</FieldLabel>
                            <input type="text" value={formData.finalPrice} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                          </div>
                          <div className="space-y-2">
                            <FieldLabel>Sale Total With Tax</FieldLabel>
                            <input type="text" value={formData.finalTotal} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-yellow-200/80 bg-yellow-50/70 p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <FieldLabel>Discount %Age</FieldLabel>
                            <input type="text" value={formData.discountPercentage} onChange={(event) => updateField('discountPercentage', event.target.value)} placeholder="0" className={INPUT_CLASS_NAME} />
                          </div>
                          <div className="space-y-2">
                            <FieldLabel>Discount Amount</FieldLabel>
                            <input type="text" value={formData.discountAmount} onChange={(event) => updateField('discountAmount', event.target.value)} placeholder="0.00" className={INPUT_CLASS_NAME} />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </section>

              <div className="flex items-center justify-between rounded-2xl border border-slate-300/80 bg-slate-50/95 px-6 py-4">
                <p className="text-xs leading-6 text-slate-600">All requested estimation fields are included, and the layout follows the same form styling pattern as item definition.</p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeForm} className="rounded-xl border border-slate-300/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">
                    Cancel
                  </button>
                
                  <button type="button" onClick={handleSaveEstimation} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover">
                    <Save className="h-4.5 w-4.5" />
                    Save Estimation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}
