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

function formatNumber(value) {
  const normalized = String(value ?? '').trim();
  return normalized || '-';
}

function formatMoney(value) {
  const normalized = String(value ?? '').trim();
  return normalized || '-';
}

function escapePrintHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeItemReportPrintItem(item) {
  return {
    id: item.id || item._id || item.item_definition_id || crypto.randomUUID(),
    code: item.item_code || item.code || '',
    itemName: item.item_name || item.name || '',
    itemType: item.item_type_name || item.itemType || '',
    category: item.category_name || item.category || '',
    subCategory: item.sub_category_name || item.subCategory || '',
    salePrice: item.sale_price ?? item.salePrice ?? '',
    stock: item.stock ?? item.unit_qty ?? item.unitQty ?? '',
    reorderLevel: item.reorder_level ?? item.reorderLevel ?? '',
    unitName: item.unit_name || item.unit || '',
    unitShortName: item.unit_short_name || item.unitShortName || '',
    unitQty: item.unit_qty ?? item.unitQty ?? '',
    boxes: item.boxes ?? '',
    purchasePrice: item.purchase_price ?? item.purchasePrice ?? '',
    primaryBarcode: item.primary_barcode || item.primaryBarcode || '',
    secondaryBarcode: item.secondary_barcode || item.secondaryBarcode || '',
    manufacturer: item.manufacturer_name || item.manufacturer || '',
    supplier: item.supplier_name || item.supplier || '',
    location: item.location_name || item.location || '',
    expiryDays: item.expiry_days ?? item.expiryDays ?? '',
    expirable:
      item.is_expirable === 1 ||
      item.is_expirable === '1' ||
      item.is_expirable === true ||
      String(item.expirable || '').toLowerCase() === 'yes'
        ? 'Yes'
        : 'No',
    costItem:
      item.is_cost_item === 1 ||
      item.is_cost_item === '1' ||
      item.is_cost_item === true ||
      String(item.costItem || '').toLowerCase() === 'yes'
        ? 'Yes'
        : 'No',
    stopSale:
      item.stop_sale === 1 ||
      item.stop_sale === '1' ||
      item.stop_sale === true ||
      String(item.stopSale || '').toLowerCase() === 'yes'
        ? 'Yes'
        : 'No',
    status: item.status || '',
    imagePreview: resolveAssetUrl(item.image || item.image_url || item.image_path || ''),
  };
}

function buildItemReportPrintHtml({ title, subtitle, rows, variant = 'all' }) {
  if (variant === 'single') {
    const item = rows[0] || {};
    const detailRows = [
      ['Item Code', formatNumber(item.code)],
      ['Item Name', formatNumber(item.itemName)],
      ['Item Type', formatNumber(item.itemType)],
      ['Category', formatNumber(item.category)],
      ['Sub Category', formatNumber(item.subCategory)],
      ['Unit', item.unitShortName || formatNumber(item.unitName)],
      ['Unit Qty', formatNumber(item.unitQty)],
      ['Boxes', formatNumber(item.boxes)],
      ['Stock', formatNumber(item.stock)],
      ['Reorder Level', formatNumber(item.reorderLevel)],
      ['Sale Price', formatMoney(item.salePrice)],
      ['Status', formatNumber(item.status)],
    ];

    const detailRowsMarkup = detailRows
      .map(
        ([label, value]) => `
          <div class="detail-row">
            <div class="detail-label">${escapePrintHtml(label)}</div>
            <div class="detail-value">${escapePrintHtml(value)}</div>
          </div>`,
      )
      .join('');

    const imageMarkup = item.imagePreview
      ? `<img src="${escapePrintHtml(item.imagePreview)}" alt="${escapePrintHtml(formatNumber(item.itemName))}" class="item-photo" />`
      : `<div class="item-photo item-photo--empty">No Image</div>`;

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapePrintHtml(title)}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            @page { size: A4; margin: 16mm 16mm; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              background: #fff;
              color: #111827;
              font-size: 10pt;
              line-height: 1.5;
            }
            .sheet { width: 100%; }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              padding-bottom: 10pt;
              border-bottom: 2.5pt solid #4f46e5;
              margin-bottom: 18pt;
            }
            .org-label {
              font-size: 7.5pt;
              font-weight: 700;
              letter-spacing: 0.22em;
              text-transform: uppercase;
              color: #6b7280;
              margin-bottom: 4pt;
            }
            .doc-title {
              font-size: 21pt;
              font-weight: 700;
              letter-spacing: -0.02em;
              color: #111827;
              line-height: 1;
            }
            .doc-subtitle {
              margin-top: 5pt;
              font-size: 9pt;
              color: #6b7280;
            }
            .header-meta {
              text-align: right;
              font-size: 8pt;
              color: #6b7280;
              line-height: 1.6;
            }
            .header-meta strong {
              display: block;
              font-size: 8pt;
              font-weight: 700;
              color: #374151;
              margin-bottom: 2pt;
            }
            .hero {
              display: grid;
              grid-template-columns: minmax(0, 1fr) 150pt;
              gap: 14pt;
              margin-bottom: 12pt;
              align-items: stretch;
            }
            .hero-body {
              border: 0.75pt solid #d1d5db;
              border-top: 2.5pt solid #111827;
              padding: 12pt 14pt 14pt;
            }
            .hero-eyebrow {
              font-size: 7.5pt;
              font-weight: 700;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: #9ca3af;
              margin-bottom: 7pt;
            }
            .hero-name {
              font-size: 17pt;
              font-weight: 700;
              color: #111827;
              letter-spacing: -0.01em;
              line-height: 1.15;
            }
            .hero-code {
              margin-top: 4pt;
              margin-bottom: 10pt;
              font-size: 9pt;
              color: #6b7280;
              font-family: 'Courier New', monospace;
            }
            .hero-metrics {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 7pt;
              border-top: 0.75pt solid #e5e7eb;
              padding-top: 10pt;
            }
            .metric {
              padding: 9pt 10pt;
              background: #f9fafb;
              border: 0.75pt solid #e5e7eb;
            }
            .metric-label {
              font-size: 7.5pt;
              font-weight: 700;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: #9ca3af;
              margin-bottom: 3pt;
            }
            .metric-value {
              font-size: 14pt;
              font-weight: 700;
              color: #111827;
              letter-spacing: -0.01em;
            }
            .item-photo {
              width: 150pt;
              height: 150pt;
              object-fit: cover;
              border: 0.75pt solid #d1d5db;
              border-top: 2.5pt solid #111827;
              display: block;
              background: #f9fafb;
            }
            .item-photo--empty {
              width: 150pt;
              height: 150pt;
              border: 0.75pt solid #d1d5db;
              border-top: 2.5pt solid #111827;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 7.5pt;
              font-weight: 700;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: #d1d5db;
              background: #f9fafb;
            }
            .detail-card {
              border: 0.75pt solid #d1d5db;
            }
            .detail-card-head {
              background: #f9fafb;
              border-bottom: 0.75pt solid #d1d5db;
              padding: 8pt 14pt;
            }
            .detail-card-title {
              font-size: 8pt;
              font-weight: 700;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: #374151;
            }
            .detail-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              padding: 0 14pt 2pt;
            }
            .detail-row {
              padding: 7pt 0;
              border-bottom: 0.75pt solid #f3f4f6;
              break-inside: avoid;
            }
            .detail-label {
              font-size: 7.5pt;
              font-weight: 700;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              color: #9ca3af;
              margin-bottom: 2pt;
            }
            .detail-value {
              font-size: 9pt;
              font-weight: 700;
              color: #111827;
              line-height: 1.3;
              word-break: break-word;
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <div>
                <div class="org-label">Inventory</div>
                <div class="doc-title">${escapePrintHtml(title)}</div>
                <div class="doc-subtitle">${escapePrintHtml(subtitle)}</div>
              </div>
              <div class="header-meta">
                <strong>Date Printed</strong>
                ${escapePrintHtml(new Date().toLocaleString())}
              </div>
            </div>
            <section class="hero">
              <div class="hero-body">
                <div class="hero-eyebrow">Item Summary</div>
                <div class="hero-name">${escapePrintHtml(formatNumber(item.itemName))}</div>
                <div class="hero-code">Code: ${escapePrintHtml(formatNumber(item.code))}</div>
                <div class="hero-metrics">
                  <div class="metric">
                    <div class="metric-label">Stock</div>
                    <div class="metric-value">${escapePrintHtml(formatNumber(item.stock))}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Reorder</div>
                    <div class="metric-value">${escapePrintHtml(formatNumber(item.reorderLevel))}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Sale Price</div>
                    <div class="metric-value">${escapePrintHtml(formatMoney(item.salePrice))}</div>
                  </div>
                </div>
              </div>
              <div>${imageMarkup}</div>
            </section>
            <section class="detail-card">
              <div class="detail-card-head">
                <div class="detail-card-title">Item Details</div>
              </div>
              <div class="detail-grid">${detailRowsMarkup}</div>
            </section>
          </div>
        </body>
      </html>`;
  }

  const tableRowsMarkup = rows
    .map(
      (item, index) => `
        <tr>
          <td class="col-sr">${index + 1}</td>
          <td class="col-code">${escapePrintHtml(formatNumber(item.code))}</td>
          <td class="col-type">${escapePrintHtml(formatNumber(item.itemType))}</td>
          <td class="col-category">${escapePrintHtml(formatNumber(item.category))}</td>
          <td class="col-subcategory">${escapePrintHtml(formatNumber(item.subCategory))}</td>
          <td class="col-name">${escapePrintHtml(formatNumber(item.itemName))}</td>
          <td class="col-unit">${escapePrintHtml(item.unitShortName || formatNumber(item.unitName))}</td>
          <td class="col-price">${escapePrintHtml(formatMoney(item.salePrice))}</td>
          <td class="col-stock">${escapePrintHtml(formatNumber(item.stock))}</td>
          <td class="col-reorder">${escapePrintHtml(formatNumber(item.reorderLevel))}</td>
        </tr>`,
    )
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapePrintHtml(title)}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @page { size: A4 landscape; margin: 16mm 14mm; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            background: #fff;
            color: #111827;
            font-size: 8.5pt;
            line-height: 1.45;
          }
          .sheet { width: 100%; }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 9pt;
            border-bottom: 2.5pt solid #4f46e5;
            margin-bottom: 14pt;
          }
          .org-label {
            font-size: 7pt;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 3pt;
          }
          .doc-title {
            font-size: 17pt;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #111827;
            line-height: 1;
          }
          .doc-subtitle {
            margin-top: 4pt;
            font-size: 8pt;
            color: #6b7280;
          }
          .header-meta {
            text-align: right;
            font-size: 7.5pt;
            color: #6b7280;
            line-height: 1.6;
          }
          .header-meta strong {
            display: block;
            font-size: 7.5pt;
            font-weight: 700;
            color: #374151;
            margin-bottom: 2pt;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .data-table thead tr {
            background: #f9fafb;
            border-bottom: 1.5pt solid #111827;
          }
          .data-table th {
            padding: 7pt 5pt;
            text-align: left;
            font-size: 7pt;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #374151;
          }
          .data-table td {
            padding: 6pt 5pt;
            font-size: 8pt;
            color: #374151;
            border-bottom: 0.5pt solid #e5e7eb;
            word-break: break-word;
          }
          .data-table tbody tr:last-child td { border-bottom: none; }
          .data-table tbody tr:nth-child(even) td { background: #f9fafb; }
          .col-sr { width: 4%; }
          .col-code { width: 9%; }
          .col-type { width: 9%; }
          .col-category { width: 10%; }
          .col-subcategory { width: 10%; }
          .col-name { width: 20%; }
          .col-unit { width: 6%; }
          .col-price { width: 10%; }
          .col-stock { width: 11%; text-align: center; }
          .col-reorder { width: 11%; text-align: center; }
          td.col-stock, td.col-reorder { text-align: center; }
          .empty-state {
            text-align: center;
            padding: 24pt;
            color: #9ca3af;
            border: 0.75pt solid #e5e7eb;
            font-size: 9pt;
          }
          .footer {
            margin-top: 12pt;
            padding-top: 7pt;
            border-top: 0.75pt solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            font-size: 7pt;
            color: #9ca3af;
            letter-spacing: 0.04em;
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <div class="org-label">Inventory</div>
              <div class="doc-title">${escapePrintHtml(title)}</div>
              <div class="doc-subtitle">${escapePrintHtml(subtitle)}</div>
            </div>
            <div class="header-meta">
              <strong>Date Printed</strong>
              ${escapePrintHtml(new Date().toLocaleString())}
            </div>
          </div>
          ${
            rows.length
              ? `<table class="data-table">
                  <thead>
                    <tr>
                      <th class="col-sr">#</th>
                      <th class="col-code">Code</th>
                      <th class="col-type">Type</th>
                      <th class="col-category">Category</th>
                      <th class="col-subcategory">Sub-Category</th>
                      <th class="col-name">Item Name</th>
                      <th class="col-unit">Unit</th>
                      <th class="col-price">Sale Price</th>
                      <th class="col-stock">Stock</th>
                      <th class="col-reorder">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody>${tableRowsMarkup}</tbody>
                </table>`
              : `<div class="empty-state">No items match the selected criteria.</div>`
          }
          <div class="footer">
            <span>Item Stock Report &nbsp;&middot;&nbsp; ${rows.length} item(s)</span>
            <span>CONFIDENTIAL</span>
          </div>
        </div>
      </body>
    </html>`;
}

export function printItemReportDocument({ rows, title, subtitle, variant = 'all' }) {
  let printFrame = document.getElementById('item-report-print-frame');
  if (printFrame) printFrame.remove();
  printFrame = document.createElement('iframe');
  printFrame.id = 'item-report-print-frame';
  printFrame.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none;';
  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (!frameDoc || !printFrame.contentWindow) {
    throw new Error('Unable to prepare the print document.');
  }

  frameDoc.open();
  frameDoc.write(buildItemReportPrintHtml({ title, subtitle, rows, variant }));
  frameDoc.close();

  window.setTimeout(() => {
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();
    window.setTimeout(() => printFrame.remove(), 1200);
  }, 250);
}
