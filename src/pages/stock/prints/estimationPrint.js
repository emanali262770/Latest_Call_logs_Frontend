function escapePrintHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function v(value, fallback = '-') {
  const s = String(value ?? '').trim();
  return s || fallback;
}

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return v(value);
  return n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  const s = String(value || '').trim();
  if (!s) return '-';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function resolveAssetUrl(value) {
  const assetPath = String(value || '').trim();
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath) || /^blob:/i.test(assetPath)) return assetPath;
  const baseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();
  if (!baseUrl) {
    if (typeof window === 'undefined') return assetPath;
    try {
      return new URL(assetPath, window.location.origin).toString();
    } catch {
      return assetPath;
    }
  }
  try {
    const apiUrl = new URL(baseUrl);
    return new URL(assetPath, apiUrl.origin).toString();
  } catch {
    return assetPath;
  }
}

function normalizeCompany(company) {
  return {
    name: v(company?.company_name || company?.name, 'Company'),
    address: v(company?.address),
    phone: v(company?.phone),
    email: v(company?.email),
    website: v(company?.website),
    ntn: v(company?.ntn),
    strn: v(company?.strn),
    logoUrl: resolveAssetUrl(company?.logo_url || company?.company_logo || ''),
  };
}

function normalizeRow(item) {
  return {
    estimateId: v(item?.estimate_id || item?.estimateId),
    estimateDate: formatDate(item?.estimate_date || item?.estimateDate),
    customerName: v(item?.customerCompany || item?.customer_name || item?.customerName || item?.customer?.company),
    serviceName: v(item?.service || item?.service_name || item?.serviceName),
    itemName: v(item?.item_name || item?.itemName || item?.itemRate?.item || item?.item),
    qty: v(item?.qty),
    description: v(item?.description),
    discountPercent: v(item?.discount_percent ?? item?.discountPercent),
    purchasePrice: v(item?.purchase_price ?? item?.purchasePrice),
    purchaseTotal: v(item?.purchase_total ?? item?.purchaseTotal),
    salePrice: v(item?.sale_price ?? item?.salePrice),
    saleTotal: v(item?.sale_total ?? item?.saleTotal),
    salePriceWithTax: v(item?.sale_price_with_tax ?? item?.salePriceWithTax),
    saleTotalWithTax: v(item?.sale_total_with_tax ?? item?.saleTotalWithTax),
    discountAmount: v(item?.discount_amount ?? item?.discountAmount),
    finalPrice: v(item?.final_price ?? item?.finalPrice),
    finalTotal: v(item?.final_total ?? item?.finalTotal),
    status: v(item?.status, 'active'),
  };
}

function normalizeSummary(summary) {
  return {
    totalPurchases: Number(summary?.totalPurchases ?? summary?.purchaseTotal ?? 0),
    totalDiscount: Number(summary?.totalDiscount ?? summary?.discountTotal ?? 0),
    totalFinal: Number(summary?.totalFinal ?? summary?.finalTotal ?? 0),
    totalSale: Number(summary?.saleTotal ?? 0),
    profit: Number(summary?.profit ?? 0),
  };
}

function normalizeSingleEstimation(estimation) {
  const base = normalizeRow(estimation || {});
  const items = Array.isArray(estimation?.items)
    ? estimation.items.map((item) => ({
        ...normalizeRow(item),
        estimateId: base.estimateId,
        estimateDate: base.estimateDate,
        customerName: base.customerName,
        serviceName: base.serviceName,
        status: base.status,
      }))
    : [];

  return {
    ...base,
    person: v(estimation?.person),
    designation: v(estimation?.designation),
    createdBy: v(estimation?.createdBy),
    items,
    summary: normalizeSummary(estimation?.summary || estimation),
  };
}

const SHARED_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4 portrait; margin: 12mm 14mm; }
  html, body {
    background: #ffffff;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    color: #0f172a;
    line-height: 1.45;
  }
  .doc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18pt;
    padding-bottom: 5pt;
    border-bottom: 2.5pt solid #4f46e5;
    margin-bottom: 10pt;
  }
  .doc-header__left { flex: 1; min-width: 0; }
  .doc-header__eyebrow {
    font-size: 7pt;
    font-weight: 800;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #6366f1;
    margin-bottom: 4pt;
  }
  .doc-header__company {
    font-size: 17pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
    line-height: 1.1;
  }
  .doc-header__meta {
    margin-top: 5pt;
    font-size: 8pt;
    color: #64748b;
    line-height: 1.7;
  }
  .doc-header__right { text-align: right; flex-shrink: 0; }
  .logo-shell {
    width: 80pt;
    height: 80pt;
   
    overflow: hidden;
   
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo-shell img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .logo-placeholder {
    font-size: 9pt;
    font-weight: 800;
    color: #6366f1;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-align: center;
    padding: 4pt;
  }
  .doc-title-bar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 10pt;
    gap: 12pt;
  }
  .doc-title {
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
  }
  .doc-title-sub {
    margin-top: 2pt;
    font-size: 8pt;
    color: #64748b;
  }
  .doc-meta-right {
    text-align: right;
    font-size: 8pt;
    color: #64748b;
    line-height: 1.7;
  }
  .doc-meta-right strong { color: #0f172a; font-weight: 700; }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8pt;
    margin-bottom: 14pt;
  }
  .summary-chip {
    border: 1pt solid #e2e8f0;
    border-radius: 10pt;
    padding: 9pt 11pt;
    background: #f8fafc;
  }
  .summary-chip--indigo { border-color: #c7d2fe; background: #eef2ff; }
  .summary-chip--amber  { border-color: #fde68a; background: #fffbeb; }
  .summary-chip--emerald{ border-color: #a7f3d0; background: #ecfdf5; }
  .summary-chip__label {
    font-size: 7pt;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 4pt;
  }
  .summary-chip__value {
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }
  .table-wrap { width: 100%; margin-bottom: 14pt; }
  .est-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    table-layout: auto;
  }
  .col-sr { width: 26pt; }
  .col-id { width: 52pt; }
  .col-date { width: 52pt; }
  .col-cust { width: 82pt; }
  .col-prod { width: 68pt; }
  .col-item { width: 74pt; }
  .col-qty { width: 28pt; }
  .col-disc { width: 34pt; }
  .col-purch { width: 68pt; }
  .col-final { width: 68pt; }
  .col-stat { width: 44pt; }
  .est-table thead th {
    padding: 5pt 7pt;
    text-align: left;
    font-size: 8.5pt;
    font-weight: 800;
    color: #0f172a;
    white-space: nowrap;
    border: 0.75pt solid #94a3b8;
  }
  .est-table tbody td {
    padding: 5pt 7pt;
    border: 0.75pt solid #94a3b8;
    color: #0f172a;
    font-size: 8.5pt;
    vertical-align: top;
    white-space: nowrap;
  }
  .est-table .num { text-align: right; font-variant-numeric: tabular-nums; }
  .est-table .center { text-align: center; }
  .est-table .bold { font-weight: 700; }
  .status-badge {
    display: inline-block;
    white-space: nowrap;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
  }
  .status-active { color: #166534; }
  .status-inactive { color: #64748b; }
  .detail-card {
    margin-bottom: 14pt;
    break-inside: avoid;
    background: #fff;
    border: 1pt solid #cfd8e3;
    border-radius: 10pt;
    overflow: hidden;
    width: 100%;
  }
  .detail-card__header {
    padding: 12pt 18pt 10pt;
    background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%);
    border-bottom: 1pt solid #d6dee8;
  }
  .detail-card__title {
    font-size: 7.2pt;
    font-weight: 800;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: #1f3b63;
  }
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    padding: 0;
    width: 100%;
  }
  .detail-field {
    padding: 9pt 18pt 8pt;
    border-bottom: 0.75pt solid #dde5ee;
    min-height: 44pt;
  }
  .detail-field:nth-last-child(-n+2) { border-bottom: none; }
  .detail-field:nth-child(odd) { border-right: 0.75pt solid #dde5ee; }
  .detail-field__label {
    font-size: 6.4pt;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #6b7f95;
    margin-bottom: 7pt;
  }
  .detail-field__value {
    font-size: 10.5pt;
    font-weight: 700;
    color: #0f172a;
    word-break: break-word;
    line-height: 1.25;
    max-width: 100%;
  }
  .doc-footer {
    margin-top: 14pt;
    padding-top: 9pt;
    border-top: 1pt solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.5pt;
    color: #94a3b8;
  }
  .doc-footer strong { color: #475569; }
  @media print {
    .doc-footer { position: fixed; bottom: 0; width: 100%; }
  }
`;

function buildHeaderHtml(company, docTitle, docSubtitle, extraMeta = '') {
  const logoMarkup = company.logoUrl
    ? `<img src="${escapePrintHtml(company.logoUrl)}" alt="${escapePrintHtml(company.name)}" />`
    : `<div class="logo-placeholder">${escapePrintHtml(company.name.slice(0, 2).toUpperCase())}</div>`;
  const companyMeta = [
    company.address !== '-' ? escapePrintHtml(company.address) : '',
    [company.phone !== '-' ? escapePrintHtml(company.phone) : '', company.email !== '-' ? escapePrintHtml(company.email) : '']
      .filter(Boolean)
      .join(' · '),
  ].filter(Boolean);

  return `
    <div class="doc-header">
      <div class="doc-header__left">
        <p class="doc-header__eyebrow">Estimation Print</p>
        <h1 class="doc-header__company">${escapePrintHtml(company.name)}</h1>
        ${companyMeta.length ? `<p class="doc-header__meta">${companyMeta.join('<br/>')}</p>` : ''}
      </div>
      <div class="doc-header__right">
        <div class="logo-shell">${logoMarkup}</div>
      </div>
    </div>
    <div class="doc-title-bar">
      <div>
        <h2 class="doc-title">${escapePrintHtml(docTitle)}</h2>
        <p class="doc-title-sub">${docSubtitle}</p>
      </div>
      <div class="doc-meta-right">
        <strong>Printed</strong><br/>
        ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })},
        ${new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
        ${extraMeta}
      </div>
    </div>
  `;
}

function buildPrintSingleHtml(company, estimation) {
  const itemRows = (estimation.items || []).map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td class="bold">${escapePrintHtml(row.estimateId)}</td>
      <td>${escapePrintHtml(row.estimateDate)}</td>
      <td>${escapePrintHtml(row.customerName)}</td>
      <td>${escapePrintHtml(row.serviceName)}</td>
      <td>${escapePrintHtml(row.itemName)}</td>
      <td class="num">${escapePrintHtml(row.qty)}</td>
      <td class="num">${escapePrintHtml(row.discountPercent)}%</td>
      <td class="num">${escapePrintHtml(row.purchaseTotal)}</td>
      <td class="num bold" style="color:#1d4ed8">${escapePrintHtml(row.finalTotal)}</td>
      <td><span class="status-badge ${row.status === 'active' ? 'status-active' : 'status-inactive'}">${escapePrintHtml(row.status)}</span></td>
    </tr>
  `).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Estimation ${escapePrintHtml(estimation.estimateId)} - ${escapePrintHtml(company.name)}</title>
  <style>${SHARED_CSS}@page { size: A4 landscape; margin: 10mm 12mm; }</style>
</head>
<body>
  <div class="sheet">
    ${buildHeaderHtml(company, `Estimation - ${estimation.estimateId}`, `${escapePrintHtml(estimation.customerName)} - ${escapePrintHtml(estimation.estimateDate)}`, `<br/><strong>Ref:</strong> ${escapePrintHtml(estimation.estimateId)}`)}
    <div class="detail-card">
      <div class="detail-card__header">
        <p class="detail-card__title">Estimation Details</p>
      </div>
      <div class="detail-grid">
        <div class="detail-field">
          <p class="detail-field__label">Customer</p>
          <p class="detail-field__value">${escapePrintHtml(estimation.customerName)}</p>
        </div>
        <div class="detail-field">
          <p class="detail-field__label">Service</p>
          <p class="detail-field__value">${escapePrintHtml(estimation.serviceName)}</p>
        </div>
        <div class="detail-field">
          <p class="detail-field__label">Person</p>
          <p class="detail-field__value">${escapePrintHtml(estimation.person)}</p>
        </div>
        <div class="detail-field">
          <p class="detail-field__label">Designation</p>
          <p class="detail-field__value">${escapePrintHtml(estimation.designation)}</p>
        </div>
      </div>
    </div>
    <div class="table-wrap">
      <table class="est-table">
        <thead>
          <tr>
            <th>Sr.</th>
            <th>Est ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Item</th>
            <th class="num">Qty</th>
            <th class="num">Disc</th>
            <th class="num">Purchase</th>
            <th class="num bold">Final</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `<tr><td colspan="11" style="text-align:center;padding:12pt 0;color:#94a3b8;">No items found.</td></tr>`}
        </tbody>
      </table>
    </div>
    <div class="doc-footer">
      <span>Single Estimation Record - ${escapePrintHtml(company.name)}</span>
      <strong>${escapePrintHtml(estimation.estimateId)}</strong>
    </div>
  </div>
</body>
</html>`;
}

function runPrint(frameId, html) {
  let frame = document.getElementById(frameId);
  if (frame) frame.remove();

  frame = document.createElement('iframe');
  frame.id = frameId;
  frame.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none;';
  document.body.appendChild(frame);

  const printDoc = frame.contentDocument || frame.contentWindow?.document;
  if (!printDoc || !frame.contentWindow) throw new Error('Unable to prepare print document.');

  printDoc.open();
  printDoc.write(html);
  printDoc.close();

  const cleanup = () => window.setTimeout(() => { try { frame?.remove(); } catch {} }, 1500);
  const trigger = () => {
    window.setTimeout(() => {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } finally {
        cleanup();
      }
    }, 180);
  };

  const images = Array.from(printDoc.images || []);
  if (!images.length) {
    trigger();
    return;
  }

  let pending = images.length;
  const done = () => {
    pending -= 1;
    if (pending <= 0) trigger();
  };

  images.forEach((img) => {
    if (img.complete) done();
    else {
      img.addEventListener('load', done);
      img.addEventListener('error', done);
    }
  });
}

export function printSingleEstimation(payload) {
  const company = normalizeCompany(payload?.company);
  const estimation = normalizeSingleEstimation(payload?.estimation || {});
  const html = buildPrintSingleHtml(company, estimation);
  runPrint('estimation-print-single-frame', html);
}
