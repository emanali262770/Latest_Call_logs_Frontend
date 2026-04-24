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
  @page { size: A4 portrait; margin: 0; }
  html, body {
    background: #ffffff;
    color: #1a1a1a;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    line-height: 1.5;
    width: 210mm;
    min-height: 297mm;
  }
  .sheet {
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    background: #ffffff;
  }
  .top-accent {
    height: 3.5pt;
    background: #1a1a1a;
  }
  .header {
    padding: 7mm 16mm 6mm;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1pt solid #cccccc;
  }
  .company-name {
    color: #1a1a1a;
    font-size: 18pt;
    font-weight: 900;
    letter-spacing: 0.01em;
    line-height: 1.05;
    text-transform: uppercase;
  }
  .company-tagline {
    margin-top: 2.5pt;
    color: #888888;
    font-size: 7pt;
    letter-spacing: 0.26em;
    text-transform: uppercase;
  }
  .company-address {
    margin-top: 4pt;
    color: #555555;
    font-size: 8pt;
    line-height: 1.5;
  }
  .doc-meta {
    text-align: right;
    flex-shrink: 0;
    padding-left: 14mm;
  }
  .doc-meta-label {
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.30em;
    text-transform: uppercase;
    color: #aaaaaa;
  }
  .doc-meta-no {
    margin-top: 4pt;
    font-size: 13pt;
    font-weight: 900;
    color: #1a1a1a;
    letter-spacing: 0.05em;
    font-family: "Courier New", monospace;
  }
  .doc-meta-date {
    margin-top: 3pt;
    font-size: 8pt;
    color: #555555;
  }
  .body-pad { padding: 5mm 16mm 10mm; }
  .subj-attn-row {
    display: flex;
    gap: 10pt;
    margin-bottom: 8pt;
    padding: 6pt 0;
  }
  .subject-block {
    flex: 1;
    padding: 0 10pt 0 0;
    border-right: 0.75pt solid #cccccc;
  }
  .attn-block {
    flex: 1;
    padding: 0 0 0 10pt;
  }
  .subject-label {
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #888888;
    margin-bottom: 3pt;
  }
  .subject-text {
    color: #1a1a1a;
    font-size: 9.5pt;
    font-weight: 700;
  }
  .attn-name {
    color: #1a1a1a;
    font-size: 8.5pt;
  }
  .attn-detail {
    color: #555555;
    font-size: 8pt;
  }
  .section-header {
    display: flex;
    align-items: center;
    gap: 8pt;
    margin-bottom: 4pt;
    margin-top: 0;
  }
  .section-header-text {
    font-size: 6.5pt;
    font-weight: 900;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #1a1a1a;
    white-space: nowrap;
  }
  .section-header-line {
    flex: 1;
    height: 0.75pt;
    background: #cccccc;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border: 0.75pt solid #cccccc;
  }
  .items-table thead th {
    background: #f2f2f2;
    color: #1a1a1a;
    font-size: 6.8pt;
    font-weight: 900;
    letter-spacing: 0.12em;
    padding: 6pt 8pt;
    text-align: left;
    text-transform: uppercase;
    border-bottom: 1.5pt solid #1a1a1a;
    border-right: 0.75pt solid #dddddd;
  }
  .items-table thead th:last-child { border-right: none; }
  .items-table thead th.num { text-align: right; }
  .items-table tbody tr:nth-child(even) td { background: #fafafa; }
  .items-table tbody td {
    border-bottom: 0.5pt solid #e8e8e8;
    border-right: 0.75pt solid #e8e8e8;
    color: #1a1a1a;
    font-size: 8.5pt;
    font-weight: 600;
    padding: 6.5pt 8pt;
    vertical-align: middle;
  }
  .items-table tbody td:last-child { border-right: none; }
  .items-table tbody tr:last-child td { border-bottom: none; }
  .items-table .sr { width: 8mm; text-align: center; color: #999999; font-size: 8pt; }
  .items-table .qty { width: 13mm; }
  .items-table .disc { width: 16mm; }
  .items-table .amount { width: 27mm; }
  .bold { font-weight: 700; }
  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-family: "Courier New", monospace;
    font-size: 8.2pt;
  }
  .total-section {
    display: flex;
    justify-content: flex-end;
    margin-top: 5pt;
    margin-bottom: 5pt;
  }
  .total-table {
    min-width: 72mm;
    border-collapse: collapse;
    border: 0.75pt solid #cccccc;
  }
  .total-table tr td {
    padding: 4.5pt 9pt;
    font-size: 8.3pt;
    border-bottom: 0.5pt solid #e8e8e8;
  }
  .total-table tr:last-child td { border-bottom: none; }
  .total-label {
    font-size: 7pt;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: #888888;
    text-align: left;
  }
  .total-value {
    text-align: right;
    font-family: "Courier New", monospace;
    font-variant-numeric: tabular-nums;
    color: #1a1a1a;
    font-size: 8.5pt;
  }
  .total-table tr.grand-total td {
    background: #f2f2f2;
    border-top: 1.5pt solid #1a1a1a;
    padding: 6pt 9pt;
  }
  .total-table tr.grand-total .total-label {
    color: #1a1a1a;
    font-size: 7.5pt;
    font-weight: 900;
    letter-spacing: 0.14em;
  }
  .total-table tr.grand-total .total-value {
    color: #1a1a1a;
    font-size: 10pt;
    font-weight: 900;
  }
  .footer {
    margin-top: 8pt;
    padding: 6pt 16mm 14pt;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .footer-note {
    color: #888888;
    font-size: 7.5pt;
    font-style: italic;
    max-width: 95mm;
    line-height: 1.55;
  }
  .signature-block { text-align: center; min-width: 55mm; }
  .signature-line {
    width: 55mm;
    height: 0.75pt;
    background: #1a1a1a;
    margin: 0 auto 4pt;
  }
  .signature-name {
    font-size: 7.5pt;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .signature-title {
    margin-top: 1.5pt;
    font-size: 6.5pt;
    color: #888888;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  @media print {
    html, body {
      background: #ffffff !important;
      margin: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet { margin: 0; box-shadow: none; }
  }
  /* legacy classes kept for compat — not used in new layout */
  .doc-header__eyebrow,
  .doc-header__company,
  .doc-header__meta,
  .doc-header__right,
  .logo-shell,
  .logo-placeholder,
  .doc-title-bar,
  .doc-title,
  .doc-title-sub,
  .doc-meta-right,
  .summary-grid,
  .summary-chip,
  .summary-chip--indigo,
  .summary-chip--amber,
  .summary-chip--emerald,
  .summary-chip__label,
  .summary-chip__value,
  .table-wrap,
  .est-table,
  .status-badge,
  .status-active,
  .status-inactive,
  .detail-card,
  .detail-card__header,
  .detail-card__title {
    /* unused */
  }
  /* placeholder to satisfy old string match */
  .detail-card__title_compat {
    font-size: 7.2pt;
    font-weight: 800;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: #1f3b63;
  }
`;

const STATIC_ESTIMATION_PROFILE = {
  name: 'Infinity Byte Solution',
  address: 'Abid Majeed Road, Lahore Cantt, Lahore',
};

function buildPrintSingleHtml(company, estimation) {
  const itemRows = (estimation.items || []).map((row, index) => `
    <tr>
      <td class="sr">${index + 1}</td>
      <td class="bold">${escapePrintHtml(row.itemName)}</td>
      <td class="num">${escapePrintHtml(row.qty)}</td>
      <td class="num">${escapePrintHtml(row.discountPercent)}%</td>
      <td class="num">${escapePrintHtml(row.salePrice)}</td>
      <td class="num">${escapePrintHtml(row.discountAmount)}</td>
      <td class="num bold">${escapePrintHtml(row.finalTotal)}</td>
    </tr>
  `).join('');

  const summary = estimation.summary;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Estimation ${escapePrintHtml(estimation.estimateId)}</title>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <main class="sheet">

    <div class="top-accent"></div>

    <!-- HEADER -->
    <div class="header">
      <div>
        <div class="company-name">${escapePrintHtml(STATIC_ESTIMATION_PROFILE.name)}</div>
        <div class="company-tagline">IT Solutions &amp; Services</div>
        <div class="company-address">${escapePrintHtml(STATIC_ESTIMATION_PROFILE.address)}</div>
      </div>
      <div class="doc-meta">
        <div class="doc-meta-label">Estimation</div>
        <div class="doc-meta-no">${escapePrintHtml(estimation.estimateId)}</div>
        <div class="doc-meta-date">${escapePrintHtml(estimation.estimateDate)}</div>
      </div>
    </div>

    <!-- BODY -->
    <div class="body-pad">

      <!-- SUBJECT + ATTENTION ROW -->
      <div class="subj-attn-row">
        <div class="subject-block">
          <div class="subject-label">Subject</div>
          <div class="subject-text">Estimation for ${escapePrintHtml(estimation.serviceName)}</div>
        </div>
        <div class="attn-block">
          <div class="subject-label">Attention</div>
          ${estimation.customerName !== '-' ? `<div class="attn-name"><strong>${escapePrintHtml(estimation.customerName)}</strong></div>` : ''}
          ${estimation.person !== '-' ? `<div class="attn-detail">${escapePrintHtml(estimation.person)}${estimation.designation !== '-' ? ' &mdash; ' + escapePrintHtml(estimation.designation) : ''}</div>` : ''}
        </div>
      </div>

      <!-- ITEMS -->
      <div class="section-header">
        <span class="section-header-text">Items</span>
        <div class="section-header-line"></div>
      </div>
      <table class="items-table">
        <thead>
          <tr>
            <th class="sr">#</th>
            <th>Item / Description</th>
            <th class="qty num">Qty</th>
            <th class="disc num">Disc %</th>
            <th class="amount num">Sale Price</th>
            <th class="amount num">Disc Amt</th>
            <th class="amount num">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `<tr><td colspan="7" style="text-align:center;color:#999;padding:12pt;font-size:8pt;">No items found.</td></tr>`}
        </tbody>
      </table>

      <!-- TOTALS -->
      <div class="total-section">
        <table class="total-table">
          <tr>
            <td class="total-label">Sub-Total (PKR)</td>
            <td class="total-value">${estimation.items.reduce((s, i) => s + Number(i.saleTotal || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td class="total-label">Total Discount (PKR)</td>
            <td class="total-value">${summary.totalDiscount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr class="grand-total">
            <td class="total-label">Grand Total (PKR)</td>
            <td class="total-value">${summary.totalFinal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </div>

    </div>

    <!-- FOOTER -->
    <div class="footer">
      <p class="footer-note">
        This estimation is prepared for review purposes only and is subject to change.<br>
        <em>Thank you for considering Infinity Byte Solution.</em>
      </p>
      <div class="signature-block">
        <div class="signature-line"></div>
        <p class="signature-name">Authorized Signatory</p>
        <p class="signature-title">Infinity Byte Solution</p>
      </div>
    </div>

  </main>
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
