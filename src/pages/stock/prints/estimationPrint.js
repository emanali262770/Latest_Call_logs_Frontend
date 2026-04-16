// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    try { return new URL(assetPath, window.location.origin).toString(); } catch { return assetPath; }
  }
  try {
    const apiUrl = new URL(baseUrl);
    return new URL(assetPath, apiUrl.origin).toString();
  } catch { return assetPath; }
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

// ─── Shared CSS ───────────────────────────────────────────────────────────────

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

  /* ── Header ── */
  .doc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18pt;
    padding-bottom: 11pt;
    border-bottom: 2.5pt solid #4f46e5;
    margin-bottom: 16pt;
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
    border: 1pt solid #c7d2fe;
    border-radius: 14pt;
    overflow: hidden;
    background: linear-gradient(180deg, #eef2ff 0%, #ffffff 100%);
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

  /* ── Doc title bar ── */
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

  /* ── Summary chips (print-all) ── */
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
  .summary-chip--indigo .summary-chip__label  { color: #4338ca; }
  .summary-chip--amber .summary-chip__label   { color: #92400e; }
  .summary-chip--emerald .summary-chip__label { color: #065f46; }
  .summary-chip__value {
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }
  .summary-chip--indigo .summary-chip__value  { color: #4338ca; }
  .summary-chip--amber .summary-chip__value   { color: #92400e; }
  .summary-chip--emerald .summary-chip__value { color: #065f46; }

  /* ── Table wrapper ── */
  .table-wrap {
    width: 100%;
    margin-bottom: 14pt;
  }

  /* ── Table ── */
  .est-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    table-layout: auto;
  }

  /* Column widths — keep everything on one line */
  .col-sr   { width: 26pt; }
  .col-id   { width: 52pt; }
  .col-date { width: 52pt; }
  .col-cust { width: 82pt; }
  .col-prod { width: 68pt; }
  .col-item { width: 74pt; }
  .col-qty  { width: 28pt; }
  .col-disc { width: 34pt; }
  .col-purch{ width: 68pt; }
  .col-final{ width: 68pt; }
  .col-stat { width: 44pt; }

  .est-table thead tr {
    background: #ffffff;
  }
  .est-table thead th {
    padding: 5pt 7pt;
    text-align: left;
    font-size: 8.5pt;
    font-weight: 800;
    color: #0f172a;
    white-space: nowrap;
    border: 0.75pt solid #94a3b8;
  }
  .est-table thead th.num    { text-align: right; }
  .est-table thead th.center { text-align: center; }

  .est-table tbody tr { background: #ffffff; break-inside: avoid; }

  .est-table tbody td {
    padding: 5pt 7pt;
    border: 0.75pt solid #94a3b8;
    color: #0f172a;
    font-size: 8.5pt;
    font-weight: 400;
    vertical-align: top;
    white-space: nowrap;
  }

  .est-table .num    { text-align: right; font-variant-numeric: tabular-nums; }
  .est-table .center { text-align: center; }
  .est-table .bold   { font-weight: 700; }

  .status-badge {
    display: inline-block;
    white-space: nowrap;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
  }
  .status-active   { color: #166534; }
  .status-inactive { color: #64748b; }
  .status-inactive { background: #f1f5f9; color: #64748b; }

  /* ── Single-record detail grid ── */
  .detail-card {
    border: 1pt solid #cbd5e1;
    border-radius: 12pt;
    overflow: hidden;
    margin-bottom: 14pt;
    break-inside: avoid;
  }
  .detail-card__header {
    padding: 9pt 14pt;
    background: #f8fafc;
    border-bottom: 1pt solid #e2e8f0;
  }
  .detail-card__title {
    font-size: 8pt;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #475569;
  }
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
    padding: 6pt 14pt 12pt;
  }
  .detail-field {
    padding: 8pt 0;
    border-top: 0.5pt solid #e2e8f0;
  }
  .detail-field:nth-child(-n+3) { border-top: none; }
  .detail-field__label {
    font-size: 7pt;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 3pt;
  }
  .detail-field__value {
    font-size: 10pt;
    font-weight: 600;
    color: #0f172a;
    word-break: break-word;
  }
  .detail-field__value--highlight {
    color: #4338ca;
    font-size: 12pt;
    font-weight: 800;
  }
  .detail-field__value--money {
    font-variant-numeric: tabular-nums;
  }

  /* ── Footer ── */
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

// ─── Header HTML (shared) ─────────────────────────────────────────────────────

function buildHeaderHtml(company, docTitle, docSubtitle, extraMeta = '') {
  const logoMarkup = company.logoUrl
    ? `<img src="${escapePrintHtml(company.logoUrl)}" alt="${escapePrintHtml(company.name)}" />`
    : `<div class="logo-placeholder">${escapePrintHtml(company.name.slice(0, 2).toUpperCase())}</div>`;

  const metaLines = [
    company.phone !== '-' ? `<span>${escapePrintHtml(company.phone)}</span>` : '',
    company.email !== '-' ? `<span>${escapePrintHtml(company.email)}</span>` : '',
    company.address !== '-' ? `<span>${escapePrintHtml(company.address)}</span>` : '',
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  return `
    <header class="doc-header">
      <div class="doc-header__left">
        <p class="doc-header__eyebrow">Inventory · Estimation</p>
        <h1 class="doc-header__company">${escapePrintHtml(company.name)}</h1>
        ${metaLines ? `<p class="doc-header__meta">${metaLines}</p>` : ''}
        ${company.ntn !== '-' ? `<p class="doc-header__meta"><strong>NTN:</strong> ${escapePrintHtml(company.ntn)}${company.strn !== '-' ? `&nbsp;&nbsp;<strong>STRN:</strong> ${escapePrintHtml(company.strn)}` : ''}</p>` : ''}
      </div>
      <div class="doc-header__right">
        <div class="logo-shell">${logoMarkup}</div>
      </div>
    </header>

    <div class="doc-title-bar">
      <div>
        <h2 class="doc-title">${escapePrintHtml(docTitle)}</h2>
        <p class="doc-title-sub">${escapePrintHtml(docSubtitle)}</p>
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

// ─── Print-All HTML ─────────────────────────────────────────────────────────

function buildPrintAllHtml(company, rows, summary) {
  const tableRows = rows.map((row, i) => `
    <tr>
      <td class="center col-sr">${i + 1}</td>
      <td class="col-id bold">${escapePrintHtml(row.estimateId)}</td>
      <td class="col-date">${escapePrintHtml(row.estimateDate)}</td>
      <td class="col-cust">${escapePrintHtml(row.customerName)}</td>
      <td class="col-prod">${escapePrintHtml(row.serviceName)}</td>
      <td class="col-item">${escapePrintHtml(row.itemName)}</td>
      <td class="num col-qty">${escapePrintHtml(row.qty)}</td>
      <td class="num col-disc">${escapePrintHtml(row.discountPercent)}</td>
      <td class="num col-purch">${escapePrintHtml(row.purchaseTotal)}</td>
      <td class="num col-final bold">${escapePrintHtml(row.finalTotal)}</td>
      <td class="center col-stat"><span class="status-badge ${row.status === 'active' ? 'status-active' : 'status-inactive'}">${escapePrintHtml(row.status)}</span></td>
    </tr>
  `).join('');

  const summaryHtml = `
    <div class="summary-grid">
      <div class="summary-chip">
        <p class="summary-chip__label">Total Purchases</p>
        <p class="summary-chip__value">${formatMoney(summary?.totalPurchases ?? 0)}</p>
      </div>
      <div class="summary-chip summary-chip--amber">
        <p class="summary-chip__label">Total Discount</p>
        <p class="summary-chip__value">${formatMoney(summary?.totalDiscount ?? 0)}</p>
      </div>
      <div class="summary-chip summary-chip--indigo">
        <p class="summary-chip__label">Final Revenue</p>
        <p class="summary-chip__value">${formatMoney(summary?.totalFinal ?? 0)}</p>
      </div>
      <div class="summary-chip summary-chip--emerald">
        <p class="summary-chip__label">Net Profit</p>
        <p class="summary-chip__value">${formatMoney(summary?.profit ?? 0)}</p>
      </div>
    </div>
  `;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Estimations — ${escapePrintHtml(company.name)}</title>
  <style>${SHARED_CSS}
    /* ── Landscape override for print-all ── */
    @page { size: A4 landscape; margin: 10mm 12mm; }
  </style>
</head>
<body>
  <div class="sheet">
    ${buildHeaderHtml(company, 'Estimation Report', `All estimation records — ${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}`)}
    ${summaryHtml}
    <div class="table-wrap">
      <table class="est-table">
        <colgroup>
          <col class="col-sr"/>
          <col class="col-id"/>
          <col class="col-date"/>
          <col class="col-cust"/>
          <col class="col-prod"/>
          <col class="col-item"/>
          <col class="col-qty"/>
          <col class="col-disc"/>
          <col class="col-purch"/>
          <col class="col-final"/>
          <col class="col-stat"/>
        </colgroup>
        <thead>
          <tr>
            <th class="center">Sr.</th>
            <th>Est. ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>For Product</th>
            <th>Item</th>
            <th class="num">Qty</th>
            <th class="num">Disc %</th>
            <th class="num">Purchase Total</th>
            <th class="num">Final Total</th>
            <th class="center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows || `<tr><td colspan="11" style="text-align:center;padding:18pt 0;color:#94a3b8;font-size:8pt;">No records found.</td></tr>`}
        </tbody>
      </table>
    </div>
    <div class="doc-footer">
      <span>Estimation Report &nbsp;·&nbsp; ${escapePrintHtml(company.name)}</span>
      <strong>${rows.length} Record${rows.length !== 1 ? 's' : ''}</strong>
    </div>
  </div>
</body>
</html>`;
}

// ─── Print-Single HTML ───────────────────────────────────────────────────────

function buildPrintSingleHtml(company, row) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Estimation ${escapePrintHtml(row.estimateId)} — ${escapePrintHtml(company.name)}</title>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="sheet">
    ${buildHeaderHtml(company, `Estimation — ${row.estimateId}`, `${row.customerName} &nbsp;·&nbsp; ${row.estimateDate}`, `<br/><strong>Ref:</strong> ${escapePrintHtml(row.estimateId)}`)}
    <div class="table-wrap">
      <table class="est-table">
        <thead>
          <tr>
            <th>Sr.</th>
            <th>Est. ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>For Product</th>
            <th>Item</th>
            <th class="num">Qty</th>
            <th class="num">Disc %</th>
            <th class="num">Purchase Total</th>
            <th class="num bold">Final Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td class="bold">${escapePrintHtml(row.estimateId)}</td>
            <td>${escapePrintHtml(row.estimateDate)}</td>
            <td>${escapePrintHtml(row.customerName)}</td>
            <td>${escapePrintHtml(row.serviceName)}</td>
            <td>${escapePrintHtml(row.itemName)}</td>
            <td class="num">${escapePrintHtml(row.qty)}</td>
            <td class="num">${escapePrintHtml(row.discountPercent)}</td>
            <td class="num">${escapePrintHtml(row.purchaseTotal)}</td>
            <td class="num bold" style="color:#1d4ed8">${escapePrintHtml(row.finalTotal)}</td>
            <td class="status-${row.status === 'active' ? 'active' : 'inactive'}" style="font-weight:700;text-transform:uppercase;font-size:8pt;">${escapePrintHtml(row.status)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="doc-footer">
      <span>Single Estimation Record &nbsp;·&nbsp; ${escapePrintHtml(company.name)}</span>
      <strong>${escapePrintHtml(row.estimateId)}</strong>
    </div>
  </div>
</body>
</html>`;
}

// ─── Print Runner (shared iframe method) ─────────────────────────────────────

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

  const cleanup = () => window.setTimeout(() => { try { frame?.remove(); } catch { /* noop */ } }, 1500);

  const trigger = () => {
    window.setTimeout(() => {
      try { frame.contentWindow.focus(); frame.contentWindow.print(); } finally { cleanup(); }
    }, 180);
  };

  const images = Array.from(printDoc.images || []);
  if (!images.length) { trigger(); return; }

  let pending = images.length;
  const done = () => { pending -= 1; if (pending <= 0) trigger(); };
  images.forEach((img) => {
    if (img.complete) done();
    else { img.addEventListener('load', done); img.addEventListener('error', done); }
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Print all estimations.
 * @param {{ company: object, estimations: object[], summary: object }} payload  — raw API response
 */
export function printAllEstimations(payload) {
  const company = normalizeCompany(payload?.company);
  const rows = (payload?.estimations || []).map(normalizeRow);
  const html = buildPrintAllHtml(company, rows, payload?.summary);
  runPrint('estimation-print-all-frame', html);
}

/**
 * Print a single estimation.
 * @param {{ company: object, estimation: object }} payload  — raw API response
 */
export function printSingleEstimation(payload) {
  const company = normalizeCompany(payload?.company);
  const row = normalizeRow(payload?.estimation || {});
  const html = buildPrintSingleHtml(company, row);
  runPrint('estimation-print-single-frame', html);
}
