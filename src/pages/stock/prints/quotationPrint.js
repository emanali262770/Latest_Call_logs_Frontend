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
  if (!Number.isFinite(n)) return v(value);
  return n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  const s = String(value || '').trim();
  if (!s) return '-';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', options);
}

function resolveAssetUrl(value) {
  const assetPath = String(value || '').trim();
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath) || /^blob:/i.test(assetPath) || /^data:/i.test(assetPath)) return assetPath;

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
    name: v(company?.company_name || company?.name, 'Infinity Byte Solution'),
    address: v(company?.address || company?.company_address, ''),
    phone: v(company?.phone || company?.contact_no || company?.mobile, ''),
    email: v(company?.email || company?.company_email, ''),
  };
}

const STATIC_COMPANY_PROFILE = {
  name: 'Infinity Byte Solution',
  address: 'Abid Majeed Road, Lahore Cantt, Lahore',
  contact: 'Attn: M. Anas (IT Dept)',
};

function normalizeItem(item) {
  const rate = Number(item?.rate ?? item?.price ?? item?.salePrice ?? item?.sale_price ?? 0);
  const qty = Number(item?.qty ?? 0);
  const amount = Number(item?.total ?? item?.amount ?? rate * qty);
  const gstPercent = Number(item?.gstPercent ?? item?.gst_percent ?? 0);
  const gstAmount = Number(item?.gstAmount ?? item?.gst_amount ?? 0);
  const rateWithGst = Number(item?.rateWithGst ?? item?.rate_with_gst ?? rate);
  const totalWithGst = Number(item?.totalWithGst ?? item?.total_with_gst ?? amount);

  return {
    itemName: v(item?.itemName || item?.item_name || item?.item),
    description: v(item?.description || item?.itemName || item?.item_name || item?.item),
    imageUrl: resolveAssetUrl(item?.itemImage || item?.item_image || item?.image || item?.image_url || ''),
    rate,
    qty,
    amount,
    gstPercent,
    gstAmount,
    rateWithGst,
    totalWithGst,
  };
}

function normalizeQuotation(quotation) {
  const items = Array.isArray(quotation?.items) ? quotation.items.map(normalizeItem) : [];
  const isWithTax = /^with\s*tax$/i.test(String(quotation?.taxMode || quotation?.tax_mode || '').trim());
  const calculatedQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const calculatedGrandTotal = items.reduce((sum, item) => sum + Number(isWithTax ? item.totalWithGst : item.amount), 0);

  return {
    quotationNo: v(quotation?.quotationNo || quotation?.quotation_no),
    revisionId: v(quotation?.revisionId || quotation?.revision_id),
    quotationDate: quotation?.quotationDate || quotation?.quotation_date || quotation?.date,
    customerName: v(quotation?.company || quotation?.customerName || quotation?.customer_name || quotation?.customer?.company),
    person: v(quotation?.person || quotation?.customerPerson || quotation?.customer_person),
    designation: v(quotation?.designation || quotation?.customerDesignation || quotation?.customer_designation),
    serviceName: v(quotation?.forProduct || quotation?.serviceName || quotation?.service_name || quotation?.service?.serviceName),
    department: v(quotation?.department || quotation?.customerDepartment || quotation?.customer_department),
    taxMode: v(quotation?.taxMode || quotation?.tax_mode),
    items,
    totalQty: Number(quotation?.summary?.totalQty ?? quotation?.totalQty ?? calculatedQty),
    grandTotal: Number(quotation?.summary?.grandTotal ?? quotation?.grandTotal ?? calculatedGrandTotal),
  };
}

const QUOTATION_CSS = `
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

  /* ══ TOP ACCENT ══ */
  .top-accent {
    height: 3.5pt;
    background: #1a1a1a;
  }

  /* ══ HEADER ══ */
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

  /* ══ BODY ══ */
  .body-pad { padding: 5mm 16mm 10mm; }

  /* ══ ADDRESS ══ */
  .address-row {
    display: flex;
    gap: 0;
    padding: 5pt 0 5pt;
    margin-bottom: 6pt;
  }
  .address-col-label {
    display: none;
  }
  .address-col-content { flex: 1; }
  .client-name-inline {
    display: block;
    color: #1a1a1a;
    font-size: 10.5pt;
    font-weight: 700;
    line-height: 1.4;
  }
  .client-detail {
    display: block;
    color: #444444;
    font-size: 8.5pt;
    line-height: 1.5;
  }

  /* ══ SUBJECT + ATTENTION ══ */
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
    background: transparent;
  }
  .attn-block {
    flex: 1;
    padding: 0 0 0 10pt;
    background: transparent;
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

  /* ══ SECTION HEADER ══ */
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

  /* ══ ITEMS TABLE ══ */
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
  .items-table .rate { width: 26mm; }
  .items-table .qty { width: 13mm; }
  .items-table .gst-amt { width: 22mm; }
  .items-table .rate-gst { width: 26mm; }
  .items-table .amount { width: 27mm; }
  .item-cell {
    display: flex;
    align-items: flex-start;
    gap: 7pt;
    min-width: 0;
  }
  .item-photo {
    width: 15mm;
    height: 15mm;
    border: 0.75pt solid #dddddd;
    background: #ffffff;
    object-fit: contain;
    flex-shrink: 0;
  }
  .item-copy {
    min-width: 0;
  }
  .item-name {
    display: block;
    color: #1a1a1a;
    font-size: 8.4pt;
    font-weight: 900;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .item-description {
    display: block;
    margin-top: 2pt;
    color: #222222;
    font-size: 7.7pt;
    font-weight: 600;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .bold { font-weight: 700; }
  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-family: "Courier New", monospace;
    font-size: 8.2pt;
  }

  /* ══ TOTALS ══ */
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

  /* ══ TERMS ══ */
  .terms-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 14pt;
    margin-top: 6pt;
  }
  .terms-item {
    display: flex;
    gap: 6pt;
    align-items: flex-start;
    padding: 2pt 0;
    border-bottom: 0.5pt solid #eeeeee;
    font-size: 7.8pt;
    color: #444444;
    line-height: 1.6;
  }
  .terms-bullet {
    width: 4.5pt;
    height: 4.5pt;
    border: 1.5pt solid #1a1a1a;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 3.5pt;
  }

  /* ══ FOOTER ══ */
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

  /* ══ BOTTOM ══ */
  .bottom-bar {
    display: none;
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
`;

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

  let hasStartedPrint = false;
  const startPrint = () => {
    if (hasStartedPrint) return;
    hasStartedPrint = true;
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } finally {
      window.setTimeout(() => frame?.remove(), 1500);
    }
  };

  const images = Array.from(printDoc.images || []);
  if (!images.length) {
    window.setTimeout(startPrint, 180);
    return;
  }

  let pendingImages = images.length;
  const settleImage = () => {
    pendingImages -= 1;
    if (pendingImages <= 0) {
      window.setTimeout(startPrint, 180);
    }
  };

  window.setTimeout(startPrint, 2500);
  images.forEach((image) => {
    if (image.complete) {
      settleImage();
      return;
    }

    image.onload = settleImage;
    image.onerror = settleImage;
  });
}

function buildItemDescriptionMarkup(item) {
  const imageMarkup = item.imageUrl
    ? `<img src="${escapePrintHtml(item.imageUrl)}" alt="${escapePrintHtml(item.itemName)}" class="item-photo" />`
    : '';

  return `
    <div class="item-cell">
      ${imageMarkup}
      <div class="item-copy">
        <span class="item-name">${escapePrintHtml(item.itemName)}</span>
        ${item.description !== '-' ? `<span class="item-description">${escapePrintHtml(item.description)}</span>` : ''}
      </div>
    </div>
  `;
}

function buildQuotationHtml(company, quotation) {
  const isWithTax = /^with\s*tax$/i.test(String(quotation.taxMode || '').trim());
  const colSpan = isWithTax ? 7 : 5;

  const itemRows = quotation.items.map((item, index) => {
    if (isWithTax) {
      return `
        <tr>
          <td class="sr">${index + 1}</td>
          <td>${buildItemDescriptionMarkup(item)}</td>
          <td class="num">${formatMoney(item.rate)}</td>
          <td class="num">${formatMoney(item.qty)}</td>
          <td class="num">${formatMoney(item.gstAmount)}</td>
          <td class="num">${formatMoney(item.rateWithGst)}</td>
          <td class="num">${formatMoney(item.totalWithGst)}</td>
        </tr>
      `;
    }
    return `
      <tr>
        <td class="sr">${index + 1}</td>
        <td>${buildItemDescriptionMarkup(item)}</td>
        <td class="num">${formatMoney(item.rate)}</td>
        <td class="num">${formatMoney(item.qty)}</td>
        <td class="num">${formatMoney(item.amount)}</td>
      </tr>
    `;
  }).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Quotation ${escapePrintHtml(quotation.quotationNo)}</title>
  <style>${QUOTATION_CSS}</style>
</head>
<body>
  <main class="sheet">

    <div class="top-accent"></div>

    <!-- HEADER -->
    <div class="header">
      <div>
        <div class="company-name">${escapePrintHtml(STATIC_COMPANY_PROFILE.name)}</div>
        <div class="company-tagline">IT Solutions &amp; Services</div>
        <div class="company-address">${escapePrintHtml(STATIC_COMPANY_PROFILE.address)}</div>
      </div>
      <div class="doc-meta">
        <div class="doc-meta-label">Quotation</div>
        <div class="doc-meta-no">${escapePrintHtml(quotation.quotationNo)}</div>
        <div class="doc-meta-date">${escapePrintHtml(formatDate(quotation.quotationDate, { day: '2-digit', month: 'long', year: 'numeric' }))}</div>
      </div>
    </div>

    <!-- BODY -->
    <div class="body-pad">

   

      <!-- SUBJECT + ATTENTION ROW -->
      <div class="subj-attn-row">
        <div class="subject-block">
          <div class="subject-label">Subject</div>
          <div class="subject-text">Quotation for ${escapePrintHtml(quotation.serviceName)}</div>
        </div>
        <div class="attn-block">
          <div class="subject-label">Attention</div>
          ${quotation.person !== '-' ? `<div class="attn-name"><strong>${escapePrintHtml(quotation.person)}</strong>${quotation.designation !== '-' ? ' &mdash; ' + escapePrintHtml(quotation.designation) : ''}</div>` : ''}
          ${quotation.department !== '-' ? `<div class="attn-detail">${escapePrintHtml(quotation.department)}</div>` : ''}
        </div>
      </div>

      <!-- COMMERCIAL OFFER -->
      <div class="section-header">
        <span class="section-header-text">Commercial Offer</span>
        <div class="section-header-line"></div>
      </div>
      <table class="items-table">
        <thead>
          <tr>
            <th class="sr">#</th>
            <th class="desc">Description</th>
            <th class="rate num">Unit Rate</th>
            <th class="qty num">Qty</th>
            ${isWithTax ? `
            <th class="gst-amt num">GST Amt</th>
            <th class="rate-gst num">Rate + GST</th>
            <th class="amount num">Total</th>
            ` : `
            <th class="amount num">Total</th>
            `}
          </tr>
        </thead>
        <tbody>
          ${itemRows || `<tr><td colspan="${colSpan}" style="text-align:center;color:#999;padding:12pt;font-size:8pt;">No line items found.</td></tr>`}
        </tbody>
      </table>

      <!-- TOTALS -->
      <div class="total-section">
        <table class="total-table">
          ${isWithTax ? `
          <tr>
            <td class="total-label">Sub-Total (PKR)</td>
            <td class="total-value">${formatMoney(quotation.items.reduce((s, i) => s + i.amount, 0))}</td>
          </tr>
          <tr>
            <td class="total-label">GST Amount (PKR)</td>
            <td class="total-value">${formatMoney(quotation.items.reduce((s, i) => s + i.gstAmount, 0))}</td>
          </tr>
          ` : ''}
          <tr class="grand-total">
            <td class="total-label">Grand Total (PKR)</td>
            <td class="total-value">${formatMoney(quotation.grandTotal)}</td>
          </tr>
        </table>
      </div>

      <!-- TERMS & CONDITIONS -->
      <div class="section-header" style="margin-top:6pt;">
        <span class="section-header-text">Terms &amp; Conditions</span>
        <div class="section-header-line"></div>
      </div>
      <div class="terms-grid">
        <div class="terms-item"><div class="terms-bullet"></div><span>Quoted prices are valid for <strong>30 days</strong> from the date of this quotation.</span></div>
        <div class="terms-item"><div class="terms-bullet"></div><span>Delivery / execution schedule will be confirmed upon receipt of formal Purchase Order.</span></div>
        <div class="terms-item"><div class="terms-bullet"></div><span>All applicable government taxes (GST, WHT) will be charged as per prevailing laws unless stated above.</span></div>
        <div class="terms-item"><div class="terms-bullet"></div><span>Payment terms: <strong>50% advance</strong> with PO; remaining balance before delivery / handover.</span></div>
        <div class="terms-item"><div class="terms-bullet"></div><span>Installation, cabling, civil works, and consumables not explicitly listed are excluded.</span></div>
        <div class="terms-item"><div class="terms-bullet"></div><span>Warranty as per respective manufacturer's standard policy unless otherwise specified.</span></div>
        <div class="terms-item"><div class="terms-bullet"></div><span>Any change in scope of work may result in a revised quotation before execution.</span></div>
        <div class="terms-item"><div class="terms-bullet"></div><span>This quotation supersedes all previous verbal or written communications on the same subject.</span></div>
        <div class="terms-item"><div class="terms-bullet"></div><span>Force majeure events (natural disasters, strikes, etc.) shall not be the liability of the vendor.</span></div>
        <div class="terms-item"><div class="terms-bullet"></div><span>All disputes, if any, shall be subject to the exclusive jurisdiction of Lahore courts.</span></div>
      </div>

    </div>

    <!-- FOOTER -->
    <div class="footer">
      <p class="footer-note">
        We trust this offer meets your requirements. For clarifications, please feel free to contact us.<br>
        <em>Thank you for considering Infinity Byte Solution.</em>
      </p>
      <div class="signature-block">
        <div class="signature-line"></div>
        <p class="signature-name">Authorized Signatory</p>
        <p class="signature-title">Infinity Byte Solution</p>
      </div>
    </div>

    <div class="bottom-bar"></div>

  </main>
</body>
</html>`;
}

export function printSingleQuotation(payload) {
  const company = normalizeCompany(payload?.company);
  const quotation = normalizeQuotation(payload?.quotation || {});
  runPrint('quotation-print-single-frame', buildQuotationHtml(company, quotation));
}

export function printQuotationPdfBlob(pdfBlob) {
  const blobUrl = URL.createObjectURL(pdfBlob);
  let frame = document.getElementById('quotation-print-pdf-frame');
  if (frame) frame.remove();

  frame = document.createElement('iframe');
  frame.id = 'quotation-print-pdf-frame';
  frame.src = blobUrl;
  frame.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none;';
  document.body.appendChild(frame);

  frame.onload = () => {
    window.setTimeout(() => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } finally {
        window.setTimeout(() => {
          frame?.remove();
          URL.revokeObjectURL(blobUrl);
        }, 1500);
      }
    }, 180);
  };
}
