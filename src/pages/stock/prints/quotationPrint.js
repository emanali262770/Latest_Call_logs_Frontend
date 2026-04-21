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

function normalizeCompany(company) {
  return {
    name: v(company?.company_name || company?.name, 'Company'),
  };
}

function normalizeItem(item) {
  const rate = Number(item?.rate ?? item?.price ?? item?.salePrice ?? item?.sale_price ?? 0);
  const qty = Number(item?.qty ?? 0);
  const amount = Number(item?.total ?? item?.amount ?? rate * qty);
  const gstPercent = Number(item?.gstPercent ?? item?.gst_percent ?? 0);
  const gstAmount = Number(item?.gstAmount ?? item?.gst_amount ?? 0);
  const rateWithGst = Number(item?.rateWithGst ?? item?.rate_with_gst ?? rate);
  const totalWithGst = Number(item?.totalWithGst ?? item?.total_with_gst ?? amount);

  return {
    description: v(item?.description || item?.itemName || item?.item_name || item?.item),
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
    color: #0f172a;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9pt;
    line-height: 1.35;
    width: 210mm;
    min-height: 297mm;
  }
  .sheet {
    width: 210mm;
    min-height: 297mm;
    padding: 24mm 14mm 14mm;
    background: #ffffff;
  }
  .brand-eyebrow {
    color: #4f46e5;
    font-size: 6.8pt;
    font-weight: 800;
    letter-spacing: 0.34em;
    text-transform: uppercase;
  }
  .brand-name {
    margin-top: 2pt;
    color: #111827;
    font-size: 16pt;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .top-rule {
    height: 2pt;
    margin: 29pt 0 14pt;
    background: #4f46e5;
  }
  .title-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 58mm;
    gap: 16mm;
    align-items: start;
    padding-bottom: 16pt;
    border-bottom: 0.75pt solid #e2e8f0;
  }
  .doc-title {
    color: #111827;
    font-size: 18pt;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .prepared {
    margin-top: 3pt;
    color: #334155;
    font-size: 8pt;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.2pt;
  }
  .meta-table td {
    padding: 0 0 6pt;
    vertical-align: top;
  }
  .meta-label {
    color: #64748b;
    font-weight: 800;
    text-align: right;
    width: 52%;
  }
  .meta-value {
    color: #111827;
    font-weight: 800;
    text-align: right;
  }
  .details-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16mm;
    margin-top: 17pt;
  }
  .section-title {
    padding-bottom: 7pt;
    border-bottom: 0.75pt solid #94a3b8;
    color: #0f172a;
    font-size: 7.6pt;
    font-weight: 900;
    letter-spacing: 0.28em;
    text-transform: uppercase;
  }
  .detail-field { margin-top: 11pt; }
  .detail-label {
    color: #64748b;
    font-size: 6.4pt;
    font-weight: 900;
    letter-spacing: 0.34em;
    text-transform: uppercase;
  }
  .detail-value {
    margin-top: 3pt;
    color: #020617;
    font-size: 8.6pt;
    font-weight: 600;
  }
  .line-items-title {
    margin-top: 11pt;
    color: #0f172a;
    font-size: 7.6pt;
    font-weight: 900;
    letter-spacing: 0.28em;
    text-transform: uppercase;
  }
  .items-table {
    width: 100%;
    margin-top: 9pt;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .items-table thead th {
    background: #0f172a;
    color: #ffffff;
    font-size: 7.2pt;
    font-weight: 900;
    letter-spacing: 0.16em;
    padding: 8.5pt 10pt;
    text-align: left;
    text-transform: uppercase;
  }
  .items-table thead th.num {
    text-align: right;
  }
  .items-table tbody td {
    border-bottom: 0.75pt solid #e2e8f0;
    color: #0f172a;
    font-size: 8pt;
    padding: 10pt;
    vertical-align: middle;
  }
  .items-table tbody tr:nth-child(even) td { background: #f8fafc; }
  .items-table .sr { width: 8mm; }
  .items-table .desc { }
  .items-table .rate { width: 22mm; }
  .items-table .qty { width: 14mm; }
  .items-table .gst-amt { width: 20mm; }
  .items-table .rate-gst { width: 22mm; }
  .items-table .amount { width: 22mm; }
  .bold { font-weight: 600; }
  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .summary {
    width: 68mm;
    margin: 20pt 0 0 auto;
  }
  .summary-line {
    display: flex;
    justify-content: space-between;
    gap: 14pt;
    border-top: 0.75pt solid #94a3b8;
    padding: 10pt 0;
    color: #0f172a;
    font-size: 8pt;
    font-weight: 800;
  }
  .summary-total {
    display: flex;
    justify-content: space-between;
    gap: 14pt;
    margin-top: 8pt;
    background: #f1f5f9;
    padding: 11pt 13pt;
    color: #020617;
    font-size: 11pt;
    font-weight: 900;
  }
  .notes {
    margin-top: 23pt;
    width: 88mm;
  }
  .notes-text {
    margin-top: 11pt;
    color: #334155;
    font-size: 7.6pt;
    line-height: 1.55;
  }
  @media print {
    html, body {
      margin: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      margin: 0;
      box-shadow: none;
    }
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

  window.setTimeout(() => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } finally {
      window.setTimeout(() => frame?.remove(), 1500);
    }
  }, 180);
}

function buildQuotationHtml(company, quotation) {
  const printedDate = new Date().toLocaleDateString('en-GB');
  const isWithTax = /^with\s*tax$/i.test(String(quotation.taxMode || '').trim());

  const itemRows = quotation.items.map((item, index) => {
    if (isWithTax) {
      return `
        <tr>
          <td>${index + 1}</td>
          <td class="bold">${escapePrintHtml(item.description)}</td>
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
        <td>${index + 1}</td>
        <td class="bold">${escapePrintHtml(item.description)}</td>
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
    <p class="brand-eyebrow">Quotation Print</p>
    <h1 class="brand-name">${escapePrintHtml(company.name)}</h1>
    <div class="top-rule"></div>

    <section class="title-row">
      <div>
        <h2 class="doc-title">Quotation</h2>
        <p class="prepared">Prepared for ${escapePrintHtml(quotation.customerName)}</p>
      </div>
      <table class="meta-table">
        <tbody>
          <tr><td class="meta-label">Quotation No</td><td class="meta-value">${escapePrintHtml(quotation.quotationNo)}</td></tr>
          <tr><td class="meta-label">Revision Ref</td><td class="meta-value">${escapePrintHtml(quotation.revisionId)}</td></tr>
          <tr><td class="meta-label">Date</td><td class="meta-value">${escapePrintHtml(formatDate(quotation.quotationDate))}</td></tr>
          <tr><td class="meta-label">Printed</td><td class="meta-value">${escapePrintHtml(printedDate)}</td></tr>
        </tbody>
      </table>
    </section>

    <section class="details-grid">
      <div>
        <h3 class="section-title">Client Details</h3>
        <div class="detail-field"><p class="detail-label">Customer</p><p class="detail-value">${escapePrintHtml(quotation.customerName)}</p></div>
        <div class="detail-field"><p class="detail-label">Contact Person</p><p class="detail-value">${escapePrintHtml(quotation.person)}</p></div>
        <div class="detail-field"><p class="detail-label">Designation</p><p class="detail-value">${escapePrintHtml(quotation.designation)}</p></div>
      </div>
      <div>
        <h3 class="section-title">Project Details</h3>
        <div class="detail-field"><p class="detail-label">Service</p><p class="detail-value">${escapePrintHtml(quotation.serviceName)}</p></div>
        <div class="detail-field"><p class="detail-label">Department</p><p class="detail-value">${escapePrintHtml(quotation.department)}</p></div>
        <div class="detail-field"><p class="detail-label">Tax Mode</p><p class="detail-value">${escapePrintHtml(quotation.taxMode)}</p></div>
      </div>
    </section>

    <h3 class="line-items-title">Line Items</h3>
    <table class="items-table">
      <thead>
        <tr>
          <th class="sr">Sr.</th>
          <th class="desc">Description</th>
          <th class="rate num">Rate</th>
          <th class="qty num">Qty</th>
          ${isWithTax ? `
          <th class="gst-amt num">GST</th>
          <th class="rate-gst num">Rate+GST</th>
          <th class="amount num">Amount</th>
          ` : `
          <th class="amount num">Amount</th>
          `}
        </tr>
      </thead>
      <tbody>
        ${itemRows || `<tr><td colspan="${isWithTax ? 7 : 5}" style="text-align:center;color:#64748b;">No line items found.</td></tr>`}
      </tbody>
    </table>

    <section class="summary">
      <div class="summary-line"><span>Total Quantity</span><span>${formatMoney(quotation.totalQty)}</span></div>
      <div class="summary-total"><span>Grand Total</span><span>${formatMoney(quotation.grandTotal)}</span></div>
    </section>

    <section class="notes">
      <h3 class="section-title">Notes</h3>
      <p class="notes-text">This quotation is prepared based on the listed items and quantities.<br/>Prices are subject to confirmation at the time of order placement.</p>
    </section>
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
