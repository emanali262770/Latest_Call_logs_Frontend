import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Save,
  FileText,
  Upload,
  Building2,
  User,
  BadgeCheck,
  Globe,
  Phone,
  Calendar,
  Edit2,
  Mail,
  Download,
  X,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Card';
import TableLoader from '@/src/components/ui/TableLoader';
import ThemeToastViewport from '@/src/components/ui/ThemeToastViewport';
import { useThemeToast } from '@/src/hooks/useThemeToast';
import { required, validateEmail, validateForm } from '@/src/lib/validation';
import { hasPermission } from '@/src/lib/auth';
import { companyService } from '@/src/services/company.service';

const EMPTY_FORM = {
  company_name: '',
  address: '',
  phone: '',
  website: '',
  email: '',
  company_logo: null,
  representative: '',
  department: '',
  designation: '',
  mobile_no: '',
  ntn: '',
  ntn_document: null,
  strn: '',
  strn_document: null,
  year_of_establishment: '',
};

const FORM_RULES = {
  company_name: [(value) => required(value, 'Company name')],
  address: [(value) => required(value, 'Address')],
  phone: [(value) => required(value, 'Phone')],
  email: [(value) => required(value, 'Email'), (value) => validateEmail(value)],
  representative: [(value) => required(value, 'Representative')],
  department: [(value) => required(value, 'Department')],
  designation: [(value) => required(value, 'Designation')],
  mobile_no: [(value) => required(value, 'Mobile number')],
  ntn: [(value) => required(value, 'NTN')],
  strn: [(value) => required(value, 'STRN')],
  year_of_establishment: [(value) => required(value, 'Year of establishment')],
};

function hasMeaningfulCompanyData(item) {
  if (!item) return false;

  return [
    item.company_name,
    item.address,
    item.phone,
    item.email,
    item.website,
    item.representative,
    item.department,
    item.designation,
    item.mobile_no,
    item.ntn,
    item.strn,
    item.year_of_establishment,
    item.logo_url,
    item.ntn_document_url,
    item.strn_document_url,
  ].some((value) => String(value || '').trim() !== '');
}

function getFileLabel(file, fallbackUrl) {
  if (file?.name) return file.name;
  if (!fallbackUrl) return 'No file selected';

  try {
    const path = String(fallbackUrl).split('?')[0];
    return decodeURIComponent(path.split('/').pop() || 'Uploaded file');
  } catch {
    return 'Uploaded file';
  }
}

function hasDocument(file, fallbackUrl) {
  return Boolean(file?.name || fallbackUrl);
}

function isPdfUrl(url) {
  return /\.pdf($|\?)/i.test(String(url || ''));
}

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)($|\?)/i.test(String(url || ''));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function FieldLabel({ children, required: isRequired = false }) {
  return (
    <label className="ml-1 text-xs font-bold text-gray-600">
      {children}
      {isRequired ? <span className="ml-1 text-rose-500">*</span> : null}
    </label>
  );
}

function FormSection({ icon: Icon, title, children, className = '' }) {
  return (
    <section className={`rounded-[28px] border border-brand/15 bg-linear-to-br from-brand-light/80 via-white to-brand-light/35 px-6 py-6 ${className}`}>
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brand/12 bg-white/90 px-4 py-3">
        <div className="h-7 w-1.5 rounded-full bg-linear-to-b from-brand to-brand-hover"></div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand/10 bg-linear-to-br from-brand-light to-white text-brand">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-brand">{title}</h3>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function normalizePhoneInput(value) {
  return String(value || '').replace(/[^\d+\-()\s]/g, '');
}

function publishCompanyProfileUpdate(company) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('company-profile-updated', { detail: company || null }));
}

export default function CompanySetup() {
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMode, setFormMode] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [pageError, setPageError] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [documentPreview, setDocumentPreview] = useState(null);
  const [removedDocuments, setRemovedDocuments] = useState({
    ntn_document: false,
    strn_document: false,
  });
  const logoInputRef = useRef(null);
  const ntnInputRef = useRef(null);
  const strnInputRef = useRef(null);
  const { toasts, toast, removeToast } = useThemeToast();

  const showForm = formMode !== null || !company;
  const canEditCompany = hasPermission('company.update');

  const loadCompany = useCallback(async () => {
    setIsLoading(true);
    setPageError('');

    try {
      const response = await companyService.get();
      const nextCompany = response?.data;
      const hasData = hasMeaningfulCompanyData(nextCompany);
      const normalizedCompany = hasData ? nextCompany : null;
      setCompany(normalizedCompany);
      publishCompanyProfileUpdate(normalizedCompany);
    } catch (requestError) {
      const status = requestError?.response?.status;
      if (status !== 404) {
        setPageError(requestError.message || 'Could not load company profile.');
      }
      setCompany(null);
      publishCompanyProfileUpdate(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const hydrateFormFromCompany = (item) => {
    setFormData({
      ...EMPTY_FORM,
      ...item,
      company_logo: null,
      ntn_document: null,
      strn_document: null,
    });
    setLogoPreview(item?.logo_url || '');
    setRemovedDocuments({
      ntn_document: false,
      strn_document: false,
    });
    setFormErrors({});
    setApiError('');
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setFormData(EMPTY_FORM);
    setLogoPreview('');
    setRemovedDocuments({
      ntn_document: false,
      strn_document: false,
    });
    setFormErrors({});
    setApiError('');
  };

  const handleOpenEdit = () => {
    setFormMode('edit');
    hydrateFormFromCompany(company);
  };

  const closeForm = () => {
    setFormMode(null);
    setFormData(EMPTY_FORM);
    setLogoPreview('');
    setRemovedDocuments({
      ntn_document: false,
      strn_document: false,
    });
    setFormErrors({});
    setApiError('');
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updateFormField('company_logo', file);
    setLogoPreview(await fileToDataUrl(file));
  };

  const handleDocumentUpload = (field) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setRemovedDocuments((prev) => ({ ...prev, [field]: false }));
    updateFormField(field, file);
  };

  const clearDocumentUpload = (field, inputRef) => {
    updateFormField(field, null);
    setRemovedDocuments((prev) => ({ ...prev, [field]: true }));
    if (inputRef?.current) {
      inputRef.current.value = '';
    }
  };

  const isDocumentVisible = (field, fallbackUrl) => {
    if (removedDocuments[field]) return false;
    return hasDocument(formData[field], fallbackUrl);
  };

  const handleSubmit = async () => {
    const errors = validateForm(formData, FORM_RULES);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      setApiError('Please complete all required fields before saving the company.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFormErrors({});
    setApiError('');
    setIsSubmitting(true);

    try {
      const response = await companyService.update(formData);
      toast.success(
        formMode === 'edit' ? 'Company updated' : 'Company saved',
        response?.message || 'Company profile saved successfully.',
      );
      await loadCompany();
      closeForm();
    } catch (requestError) {
      const message = requestError.message || 'Could not save company profile.';
      setApiError(message);
      toast.error('Save failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = (field) =>
    `h-9 w-full rounded-[10px] border mt-[2px] bg-white px-3.5 text-[15px] text-gray-900 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all outline-none ${
      formErrors[field] ? 'border-rose-400' : 'border-gray-200'
    }`;

  const openDocumentPreview = (title, url) => {
    if (!url) return;
    setDocumentPreview({ title, url });
  };

  return (
    <>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Company</h1>
          <p className="mt-1 text-gray-500">Manage company profile, representatives, and tax registration details.</p>
        </div>
        {!showForm && company && canEditCompany ? (
          <Button onClick={handleOpenEdit} icon={<Edit2 className="h-4 w-4" />} className="bg-brand hover:bg-brand-hover shadow-brand/20">
            Edit Company
          </Button>
        ) : !company && canEditCompany ? (
          <Button onClick={handleOpenCreate} icon={<Edit2 className="h-4 w-4" />} className="bg-brand hover:bg-brand-hover shadow-brand/20">
            Create Company
          </Button>
        ) : null}
      </div>

      {pageError ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {pageError}
        </div>
      ) : null}

      {!showForm ? (
        <div className="space-y-6">
        {!showForm && isLoading ? (
          <div className="max-w-5xl rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/50">
            <TableLoader label="Loading company profile..." />
          </div>
        ) : !showForm && company ? (
          <div className="max-w-5xl">
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
              <div className="flex items-start justify-between gap-6 border-b border-gray-100 px-8 py-7">
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-brand/10 bg-brand-light text-brand">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.company_name} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand/70">Company Profile</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{company.company_name}</h2>
                    <p className="mt-1 text-sm text-gray-500">{company.address}</p>
                  </div>
                </div>
                <BadgeCheck className="h-6 w-6 text-brand" />
              </div>

              <div className="grid gap-6 px-8 py-8 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Contact</p>
                  <div className="mt-4 space-y-3">
                    <p className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                      <Phone className="h-4 w-4 text-brand" />
                      {company.phone || '-'}
                    </p>
                    <p className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                      <Mail className="h-4 w-4 text-brand" />
                      {company.email || '-'}
                    </p>
                    <p className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                      <Globe className="h-4 w-4 text-brand" />
                      {company.website || '-'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Representative</p>
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-900">{company.representative || '-'}</p>
                    <p className="text-sm text-gray-600">{company.department || '-'}</p>
                    <p className="text-sm text-gray-600">{company.designation || '-'}</p>
                    <p className="text-sm text-gray-600">{company.mobile_no || '-'}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Registration</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-700">
                        <span className="text-gray-400">NTN:</span> {company.ntn || '-'}
                      </p>
                      {company.ntn_document_url ? (
                        <button
                          type="button"
                          onClick={() => openDocumentPreview('NTN Document', company.ntn_document_url)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-brand/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-brand transition-all hover:bg-brand-light/40"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View
                        </button>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-700">
                        <span className="text-gray-400">STRN:</span> {company.strn || '-'}
                      </p>
                      {company.strn_document_url ? (
                        <button
                          type="button"
                          onClick={() => openDocumentPreview('STRN Document', company.strn_document_url)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-brand/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-brand transition-all hover:bg-brand-light/40"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View
                        </button>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-gray-700"><span className="text-gray-400">Established:</span> {company.year_of_establishment || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        </div>
      ) : null}

      {showForm ? (
      <div className="max-w-5xl">
        <div className="overflow-hidden rounded-3xl border-l-[6px] border-brand bg-white shadow-2xl shadow-brand/10">
          <div className="flex items-start justify-between gap-6 p-8 pb-6">
            <div className="flex items-start gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand shadow-inner">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                  {company ? 'Edit Company' : 'Create Company'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Maintain company profile, representative, and registration details.
                </p>
              </div>
            </div>
            {company ? (
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
              >
                Cancel
              </button>
            ) : <div></div>}
          </div>

          <div className="space-y-10 px-8 pb-8">
            {apiError ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {apiError}
              </div>
            ) : null}

            <FormSection icon={Building2} title="Company Profile">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold text-gray-600">Company Logo</label>
                <div className="flex items-center gap-5">
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 transition-all hover:border-brand/40 hover:bg-brand-light/20"
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Company logo" className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <Upload className="mb-1 h-5 w-5 text-gray-300" />
                        <span className="text-[10px] font-bold text-gray-400">Upload</span>
                      </>
                    )}
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                  <p className="text-xs leading-relaxed text-gray-400">
                    Upload company logo.
                    <br />
                    <span className="text-gray-300">PNG/JPG supported.</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel required><Building2 className="mr-1 inline h-3 w-3 -mt-0.5" /> Company Name</FieldLabel>
                  <input type="text" value={formData.company_name} onChange={(event) => updateFormField('company_name', event.target.value)} placeholder="Company name" className={inputClassName('company_name')} />
                  {formErrors.company_name ? <p className="ml-1 text-xs text-rose-600">{formErrors.company_name}</p> : null}
                </div>
                <div className="space-y-2">
                  <FieldLabel required><Phone className="mr-1 inline h-3 w-3 -mt-0.5" /> Phone</FieldLabel>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formData.phone}
                    onChange={(event) => updateFormField('phone', normalizePhoneInput(event.target.value))}
                    placeholder="Phone number"
                    className={inputClassName('phone')}
                  />
                  {formErrors.phone ? <p className="ml-1 text-xs text-rose-600">{formErrors.phone}</p> : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <FieldLabel required>Email</FieldLabel>
                  <input type="email" value={formData.email} onChange={(event) => updateFormField('email', event.target.value)} placeholder="name@company.com" className={inputClassName('email')} />
                  {formErrors.email ? <p className="ml-1 text-xs text-rose-600">{formErrors.email}</p> : null}
                </div>
                <div className="space-y-2 md:col-span-1">
                  <FieldLabel><Globe className="mr-1 inline h-3 w-3 -mt-0.5" /> Website</FieldLabel>
                  <input type="text" value={formData.website} onChange={(event) => updateFormField('website', event.target.value)} placeholder="https://yourcompany.com" className={inputClassName('website')} />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <FieldLabel required>Address</FieldLabel>
                  <input type="text" value={formData.address} onChange={(event) => updateFormField('address', event.target.value)} placeholder="Address" className={inputClassName('address')} />
                  {formErrors.address ? <p className="ml-1 text-xs text-rose-600">{formErrors.address}</p> : null}
                </div>
              </div>
            </FormSection>

            <FormSection icon={User} title="Representative Info">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel required>Representative</FieldLabel>
                  <input type="text" value={formData.representative} onChange={(event) => updateFormField('representative', event.target.value)} placeholder="Representative name" className={inputClassName('representative')} />
                  {formErrors.representative ? <p className="ml-1 text-xs text-rose-600">{formErrors.representative}</p> : null}
                </div>
                <div className="space-y-2">
                  <FieldLabel required>Department</FieldLabel>
                  <input type="text" value={formData.department} onChange={(event) => updateFormField('department', event.target.value)} placeholder="Department" className={inputClassName('department')} />
                  {formErrors.department ? <p className="ml-1 text-xs text-rose-600">{formErrors.department}</p> : null}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel required>Designation</FieldLabel>
                  <input type="text" value={formData.designation} onChange={(event) => updateFormField('designation', event.target.value)} placeholder="Designation" className={inputClassName('designation')} />
                  {formErrors.designation ? <p className="ml-1 text-xs text-rose-600">{formErrors.designation}</p> : null}
                </div>
                <div className="space-y-2">
                  <FieldLabel required>Mobile No</FieldLabel>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formData.mobile_no}
                    onChange={(event) => updateFormField('mobile_no', normalizePhoneInput(event.target.value))}
                    placeholder="Mobile number"
                    className={inputClassName('mobile_no')}
                  />
                  {formErrors.mobile_no ? <p className="ml-1 text-xs text-rose-600">{formErrors.mobile_no}</p> : null}
                </div>
              </div>
            </FormSection>

            <FormSection icon={BadgeCheck} title="Registration">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel required>NTN</FieldLabel>
                  <input type="text" value={formData.ntn} onChange={(event) => updateFormField('ntn', event.target.value)} placeholder="NTN number" className={inputClassName('ntn')} />
                  {formErrors.ntn ? <p className="ml-1 text-xs text-rose-600">{formErrors.ntn}</p> : null}
                </div>
                <div className="space-y-2">
                  <FieldLabel>NTN Document</FieldLabel>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => ntnInputRef.current?.click()} className="inline-flex whitespace-nowrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-brand/20 hover:bg-brand-light/30 hover:text-brand">
                      <Upload className="h-4 w-4" />
                      Upload Document
                    </button>
                    {isDocumentVisible('ntn_document', company?.ntn_document_url || company?.raw?.ntn_document) ? (
                      <>
                        <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                          <FileText className="h-4 w-4 text-rose-500" />
                          {getFileLabel(formData.ntn_document, company?.ntn_document_url || company?.raw?.ntn_document)}
                        </span>
                        <button
                          type="button"
                          onClick={() => clearDocumentUpload('ntn_document', ntnInputRef)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-500 transition-all hover:bg-rose-100"
                          title="Remove document"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No file selected</span>
                    )}
                  </div>
                  <input ref={ntnInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleDocumentUpload('ntn_document')} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel required>STRN</FieldLabel>
                  <input type="text" value={formData.strn} onChange={(event) => updateFormField('strn', event.target.value)} placeholder="STRN number" className={inputClassName('strn')} />
                  {formErrors.strn ? <p className="ml-1 text-xs text-rose-600">{formErrors.strn}</p> : null}
                </div>
                <div className="space-y-2">
                  <FieldLabel>STRN Document</FieldLabel>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => strnInputRef.current?.click()} className="inline-flex whitespace-nowrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-brand/20 hover:bg-brand-light/30 hover:text-brand">
                      <Upload className="h-4 w-4" />
                      Upload Document
                    </button>
                    {isDocumentVisible('strn_document', company?.strn_document_url || company?.raw?.strn_document) ? (
                      <>
                        <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                          <FileText className="h-4 w-4 text-rose-500" />
                          {getFileLabel(formData.strn_document, company?.strn_document_url || company?.raw?.strn_document)}
                        </span>
                        <button
                          type="button"
                          onClick={() => clearDocumentUpload('strn_document', strnInputRef)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-500 transition-all hover:bg-rose-100"
                          title="Remove document"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">No file selected</span>
                    )}
                  </div>
                  <input ref={strnInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleDocumentUpload('strn_document')} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel required><Calendar className="mr-1 inline h-3 w-3 -mt-0.5" /> Year of Establishment</FieldLabel>
                  <input type="date" value={formData.year_of_establishment} onChange={(event) => updateFormField('year_of_establishment', event.target.value)} className={inputClassName('year_of_establishment')} />
                  {formErrors.year_of_establishment ? <p className="ml-1 text-xs text-rose-600">{formErrors.year_of_establishment}</p> : null}
                </div>
              </div>
            </FormSection>

            <div className="flex justify-end gap-4 pt-2">
              {company ? (
                <button
                  onClick={closeForm}
                  className="rounded-2xl border-2 border-gray-100 bg-white px-10 py-4 font-bold text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700"
                >
                  Cancel
                </button>
              ) : null}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex cursor-pointer items-center gap-3 rounded-2xl bg-brand px-10 py-4 font-bold text-white shadow-xl shadow-brand/20 transition-all hover:bg-brand-hover disabled:opacity-70"
              >
                <Save className="h-5 w-5" />
                {isSubmitting ? 'Saving...' : company ? 'Update Company' : 'Save Company'}
              </button>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      <ThemeToastViewport toasts={toasts} onClose={removeToast} />
    </div>

    {documentPreview
      ? createPortal(
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/55"
              onClick={() => setDocumentPreview(null)}
              aria-label="Close preview"
            ></button>

            <div className="relative z-10 flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-l-[6px] border-brand bg-white shadow-2xl shadow-brand/10">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-light text-brand">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-gray-900">{documentPreview.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">Preview or download the uploaded document.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={documentPreview.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-hover"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => setDocumentPreview(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="min-h-[420px] flex-1 bg-gray-50 p-6">
                {isPdfUrl(documentPreview.url) ? (
                  <iframe
                    src={documentPreview.url}
                    title={documentPreview.title}
                    className="h-[68vh] w-full rounded-2xl border border-gray-200 bg-white"
                  />
                ) : isImageUrl(documentPreview.url) ? (
                  <div className="flex h-[68vh] items-center justify-center rounded-2xl border border-gray-200 bg-white p-4">
                    <img src={documentPreview.url} alt={documentPreview.title} className="max-h-full max-w-full rounded-xl object-contain" />
                  </div>
                ) : (
                  <div className="flex h-[68vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
                    <FileText className="mb-3 h-10 w-10 text-brand" />
                    <p className="text-sm font-semibold text-gray-700">Preview is not available for this file type.</p>
                    <a
                      href={documentPreview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand/15 bg-brand-light px-4 py-2 text-sm font-semibold text-brand"
                    >
                      <Download className="h-4 w-4" />
                      Open Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null}
    </>
  );
}
