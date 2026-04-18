import { useMemo, useRef, useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Edit2, FileText, Package, Plus, Save, Search as SearchIcon, Trash2 } from 'lucide-react';
import { Button, Card } from '@/src/components/ui/Card';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { getStoredUser } from '@/src/lib/auth';

const EMPTY_FORM = {
  quotationNo: 'AIT/QUT/04001',
  day: '14',
  month: 'April',
  year: '2026',
  docId: '001',
  department: '',
  company: '',
  person: '',
  designation: '',
  letterType: 'Quotation',
  forProduct: '',
  createdBy: '',
  item: '',
  price: '',
  qty: '',
  total: '',
  description: '',
};

const INPUT_CLASS_NAME =
  'h-9 w-full rounded-xl border border-slate-300/80 bg-white px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus:border-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-200/70';
const READ_ONLY_INPUT_CLASS_NAME =
  'h-9 w-full cursor-not-allowed rounded-xl border border-slate-300/80 bg-slate-100 px-4 text-sm text-slate-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none';
const SECTION_PANEL_CLASS_NAME = 'rounded-[1.4rem] border border-slate-300/80 bg-slate-50/50';
const COMPACT_FIELD_WRAPPER_CLASS_NAME = 'w-full xl:max-w-[540px]';
const COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME = 'w-full xl:max-w-[245px]';
const COMPACT_MEDIUM_FIELD_WRAPPER_CLASS_NAME = 'w-full xl:max-w-[360px]';

function FieldLabel({ children }) {
  return <label className="ml-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">{children}</label>;
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
  const storedUser = useMemo(() => getStoredUser(), []);
  const loggedInUserName = storedUser?.fullName || storedUser?.username || 'admin';
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [rows, setRows] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [openSelectId, setOpenSelectId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toasts, toast, removeToast } = useThemeToast();

  const departmentOptions = ['Sales', 'Projects', 'Support', 'Accounts'];
  const companyOptions = ['Sony', 'Samsung', 'Afaq Technologies', 'ABC Traders'];
  const letterTypeOptions = ['Quotation', 'Proposal', 'Offer Letter'];
  const productOptions = ['CCTV', 'Networking', 'Solar', 'Access Control'];
  const itemOptions = ['IP CCTV Camera 4MP Night Vision', 'HikVision 8 Channel NVR', 'Samsung TV', 'DVR 4 Channel'];

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.qty += Number(row.qty || 0);
          acc.total += Number(row.total || 0);
          return acc;
        },
        { qty: 0, total: 0 },
      ),
    [rows],
  );

  const filteredQuotations = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return quotations;
    return quotations.filter((row) =>
      `${row.quotationNo} ${row.company} ${row.forProduct} ${row.createdBy} ${row.docId}`.toLowerCase().includes(normalized),
    );
  }, [quotations, searchQuery]);

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

  const updateField = (field, value) => {
    const normalizedValue = ['price', 'qty'].includes(field) ? sanitizeNumericInput(value) : value;
    setFormData((prev) => ({ ...prev, [field]: normalizedValue }));
  };

  const handleCompanyChange = (value) => {
    const contacts = {
      Sony: { person: 'Farman', designation: 'Salesman' },
      Samsung: { person: 'Ali', designation: 'Manager' },
      'Afaq Technologies': { person: 'Usman', designation: 'Coordinator' },
      'ABC Traders': { person: 'Hamza', designation: 'Executive' },
    };
    setFormData((prev) => ({
      ...prev,
      company: value,
      person: contacts[value]?.person || '',
      designation: contacts[value]?.designation || '',
    }));
  };

  const quotationDateValue = useMemo(() => {
    const monthMap = {
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

    const day = String(formData.day || '').padStart(2, '0');
    const month = monthMap[formData.month] || '01';
    const year = formData.year || new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }, [formData.day, formData.month, formData.year]);

  const handleAddItem = () => {
    if (!formData.item) {
      toast.error('Item required', 'Please select item before adding.');
      return;
    }
    if (!Number(formData.qty || 0)) {
      toast.error('Qty required', 'Please enter qty before adding.');
      return;
    }

    const nextRow = {
      id: editingRowId || crypto.randomUUID(),
      item: formData.item,
      price: formData.price,
      qty: formData.qty,
      total: formData.total,
      description: formData.description,
    };

    setRows((prev) => (editingRowId ? prev.map((row) => (row.id === editingRowId ? nextRow : row)) : [...prev, nextRow]));
    setEditingRowId(null);
    setFormData((prev) => ({
      ...prev,
      item: '',
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
      price: row.price,
      qty: row.qty,
      total: row.total,
      description: row.description,
    }));
  };

  const handleDeleteRow = (rowId) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
    if (editingRowId === rowId) {
      setEditingRowId(null);
    }
  };

  const openCreateForm = () => {
    setEditingQuotationId(null);
    setEditingRowId(null);
    setRows([]);
    setFormData({ ...EMPTY_FORM, createdBy: loggedInUserName });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingQuotationId(null);
    setEditingRowId(null);
    setRows([]);
    setFormData({ ...EMPTY_FORM, createdBy: loggedInUserName });
  };

  const handleSaveQuotation = () => {
    const payload = {
      id: editingQuotationId || crypto.randomUUID(),
      quotationNo: formData.quotationNo,
      day: formData.day,
      month: formData.month,
      year: formData.year,
      docId: formData.docId,
      department: formData.department,
      company: formData.company,
      person: formData.person,
      designation: formData.designation,
      letterType: formData.letterType,
      forProduct: formData.forProduct,
      createdBy: formData.createdBy,
      items: rows,
      itemsTotal: totals.total.toFixed(2),
    };

    setQuotations((prev) => (editingQuotationId ? prev.map((item) => (item.id === editingQuotationId ? payload : item)) : [payload, ...prev]));
    toast.success(editingQuotationId ? 'Quotation updated' : 'Quotation saved', editingQuotationId ? 'Quotation updated locally.' : 'Quotation saved locally.');
    closeForm();
  };

  const handleEditQuotation = (quotation) => {
    setEditingQuotationId(quotation.id);
    setEditingRowId(null);
    setRows(quotation.items || []);
    setFormData({
      quotationNo: quotation.quotationNo || '',
      day: quotation.day || '',
      month: quotation.month || '',
      year: quotation.year || '',
      docId: quotation.docId || '',
      department: quotation.department || '',
      company: quotation.company || '',
      person: quotation.person || '',
      designation: quotation.designation || '',
      letterType: quotation.letterType || 'Quotation',
      forProduct: quotation.forProduct || '',
      createdBy: quotation.createdBy || loggedInUserName,
      item: '',
      price: '',
      qty: '',
      total: '',
      description: '',
    });
    setShowForm(true);
  };

  const handleDeleteQuotation = (quotationId) => {
    setQuotations((prev) => prev.filter((row) => row.id !== quotationId));
  };

  return (
    <div className="space-y-8">
      {!showForm ? (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quotation</h1>
              <p className="mt-1 text-gray-500">Manage quotation records with the same table flow as estimation.</p>
            </div>
            <Button onClick={openCreateForm} icon={<Plus className="h-4 w-4" />} className="bg-brand hover:bg-brand-hover shadow-brand/20">
              Add Quotation
            </Button>
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
                        <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Doc ID</th>
                        <th className="border-b border-gray-100/60 px-5 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Items Total</th>
                        <th className="border-b border-gray-100/60 px-5 py-6 text-right text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 last:rounded-tr-4xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/50">
                      {filteredQuotations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-20 text-center text-sm font-medium text-gray-400">No quotation records found.</td>
                        </tr>
                      ) : (
                        filteredQuotations.map((row, index) => (
                          <tr key={row.id} className="group transition-all duration-300 hover:bg-brand-light/40">
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{index + 1}</td>
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-900 whitespace-nowrap">{row.quotationNo}</td>
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{row.company || '-'}</td>
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{row.forProduct || '-'}</td>
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-gray-700 whitespace-nowrap">{row.docId || '-'}</td>
                            <td className="border-b border-gray-50/30 px-5 py-6 text-sm font-semibold text-brand whitespace-nowrap">{row.itemsTotal || '0.00'}</td>
                            <td className="border-b border-gray-50/30 px-5 py-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
                                <button type="button" onClick={() => handleEditQuotation(row)} className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-brand hover:shadow-xl hover:shadow-brand/20 active:scale-95">
                                  <Edit2 className="h-4.5 w-4.5" />
                                </button>
                                <button type="button" onClick={() => handleDeleteQuotation(row.id)} className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-400 transition-all duration-300 hover:bg-white hover:text-rose-600 hover:shadow-xl hover:shadow-rose-100/50 active:scale-95">
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
                  <p className="mt-1 text-xs text-slate-500">Quotation no, date, doc id, department, customer, and related contact details.</p>
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
                      <input type="text" value={formData.quotationNo} onChange={(event) => updateField('quotationNo', event.target.value)} className={INPUT_CLASS_NAME} />
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
                            {
                              '01': 'January',
                              '02': 'February',
                              '03': 'March',
                              '04': 'April',
                              '05': 'May',
                              '06': 'June',
                              '07': 'July',
                              '08': 'August',
                              '09': 'September',
                              '10': 'October',
                              '11': 'November',
                              '12': 'December',
                            }[month] || '',
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
                  </div>
                </div>

                <div className="xl:col-span-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:pt-0">
                    <div className={COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME}>
                      <FieldLabel>Doc ID</FieldLabel>
                      <input type="text" value={formData.docId} onChange={(event) => updateField('docId', event.target.value)} className={INPUT_CLASS_NAME} />
                    </div>
                    <div className={`md:col-span-2 ${COMPACT_FIELD_WRAPPER_CLASS_NAME}`}>
                      <SearchableSelect selectId="forProduct" label="For Product" value={formData.forProduct} options={productOptions} placeholder="Select product" searchablePlaceholder="Search product" onChange={(value) => updateField('forProduct', value)} isOpen={openSelectId === 'forProduct'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                    </div>
                    <div className={COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME}>
                      <SearchableSelect selectId="department" label="Department" value={formData.department} options={departmentOptions} placeholder="Select department" searchablePlaceholder="Search department" onChange={(value) => updateField('department', value)} isOpen={openSelectId === 'department'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                    </div>
                    <div className={COMPACT_SMALL_FIELD_WRAPPER_CLASS_NAME}>
                      <SearchableSelect selectId="letterType" label="Letter Type" value={formData.letterType} options={letterTypeOptions} placeholder="Select letter type" searchablePlaceholder="Search letter type" onChange={(value) => updateField('letterType', value)} isOpen={openSelectId === 'letterType'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                    </div>
                    <div className={COMPACT_MEDIUM_FIELD_WRAPPER_CLASS_NAME}>
                      <ReadOnlyField label="Created By" value={formData.createdBy} placeholder="Logged in user" />
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
                  <div className="md:col-span-5">
                    <SearchableSelect selectId="item" label="Item" value={formData.item} options={itemOptions} placeholder="Select product" searchablePlaceholder="Search item" onChange={(value) => updateField('item', value)} isOpen={openSelectId === 'item'} onToggle={(id) => setOpenSelectId((prev) => (prev === id ? null : id))} onClose={() => setOpenSelectId(null)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <FieldLabel>Price</FieldLabel>
                    <input type="text" value={formData.price} onChange={(event) => updateField('price', event.target.value)} placeholder="0.00" className={INPUT_CLASS_NAME} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <FieldLabel>Qty</FieldLabel>
                    <input type="text" value={formData.qty} onChange={(event) => updateField('qty', event.target.value)} placeholder="0" className={INPUT_CLASS_NAME} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <FieldLabel>Total</FieldLabel>
                    <input type="text" value={formData.total} readOnly className={READ_ONLY_INPUT_CLASS_NAME} />
                  </div>
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
                        <tr className="bg-slate-100/80">
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Sr.</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Item</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Price</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Qty</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Total</th>
                          <th className="border-b border-slate-200/80 px-4 py-3 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={row.id} className="odd:bg-white even:bg-slate-50/45 transition-colors hover:bg-brand-light/30">
                            <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-600">{index + 1}</td>
                            <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-900">{row.item}</td>
                            <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700">{row.price || '-'}</td>
                            <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-700">{row.qty || '-'}</td>
                            <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-brand">{row.total || '-'}</td>
                            <td className="border-b border-slate-100 px-4 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={() => handleEditRow(row)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-brand/20 hover:bg-brand-light hover:text-brand">
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => handleDeleteRow(row.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
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
                      <p>Items Total: <span className="ml-2 tabular-nums text-brand">{totals.total.toFixed(2)}</span></p>
                    </div>
                  </div>
                  </section>
                ) : null}
              </div>
            </section>

            <div className="flex items-center justify-end rounded-2xl border border-slate-300/80 bg-slate-50/95 px-6 py-4">
              <button type="button" onClick={handleSaveQuotation} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand-hover">
                <Save className="h-4.5 w-4.5" />
                {editingQuotationId ? 'Update Quotation' : 'Save Quotation'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>
  );
}
