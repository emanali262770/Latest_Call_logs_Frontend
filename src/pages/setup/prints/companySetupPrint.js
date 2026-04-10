function getPrintableValue(value, fallback = '-') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function formatPrintDate(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '-';

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return normalized;

  return parsed.toLocaleDateString();
}

function escapePrintHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function buildCompanySetupPrintHtml(company) {
  const contactRows = [
    ['Company Name', getPrintableValue(company.company_name)],
    ['Address', getPrintableValue(company.address)],
    ['Phone', getPrintableValue(company.phone)],
    ['Email', getPrintableValue(company.email)],
    ['Website', getPrintableValue(company.website)],
  ];

  const representativeRows = [
    ['Representative', getPrintableValue(company.representative)],
    ['Department', getPrintableValue(company.department)],
    ['Designation', getPrintableValue(company.designation)],
    ['Mobile No', getPrintableValue(company.mobile_no)],
  ];

  const registrationRows = [
    ['NTN', getPrintableValue(company.ntn)],
    ['STRN', getPrintableValue(company.strn)],
    ['Established', formatPrintDate(company.year_of_establishment)],
  ];

  const detailMarkup = [...contactRows, ...representativeRows, ...registrationRows]
    .map(
      ([label, value]) => `
        <div class="detail-row">
          <div class="detail-label">${escapePrintHtml(label)}</div>
          <div class="detail-value">${escapePrintHtml(value)}</div>
        </div>`,
    )
    .join('');

  const logoUrl = resolveAssetUrl(company.logo_url || company.company_logo || '');
  const logoMarkup = logoUrl
    ? `<img src="${escapePrintHtml(logoUrl)}" alt="${escapePrintHtml(
        company.company_name || 'Company logo',
      )}" class="company-logo" />`
    : `<div class="logo-placeholder">No Logo</div>`;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Company Print</title>
        <style>
          * { box-sizing: border-box; }
          @page { size: A4; margin: 16mm 15mm; }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #0f172a;
            font-family: Arial, sans-serif;
          }
          body { padding: 0; }
          .sheet { width: 100%; }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            padding: 0 0 18px;
            margin-bottom: 20px;
            border-bottom: 3px solid #4f46e5;
          }
          .header-copy { flex: 1; min-width: 0; }
          .eyebrow {
            margin: 0;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #4f46e5;
          }
          .title {
            margin: 8px 0 0;
            font-size: 31px;
            line-height: 1.08;
            font-weight: 800;
            color: #0f172a;
          }
          .subtitle {
            margin: 8px 0 0;
            max-width: 520px;
            font-size: 12px;
            line-height: 1.7;
            color: #475569;
          }
          .logo-shell {
            width: 94px;
            height: 94px;
            border: 1px solid #c7d2fe;
            border-radius: 18px;
            overflow: hidden;
            background: linear-gradient(180deg, #eef2ff 0%, #ffffff 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .company-logo { width: 100%; height: 100%; object-fit: cover; display: block; }
          .logo-placeholder {
            font-size: 11px;
            font-weight: 800;
            color: #6366f1;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          }
          .summary-bar {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 18px;
          }
          .summary-item {
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 12px 14px;
            background: #f8fafc;
          }
          .summary-label {
            margin: 0;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #64748b;
          }
          .summary-value {
            margin: 7px 0 0;
            font-size: 14px;
            line-height: 1.45;
            font-weight: 500;
            color: #0f172a;
            word-break: break-word;
          }
          .main-card {
            border: 1px solid #cbd5e1;
            border-radius: 18px;
            background: #ffffff;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
          }
          .main-card__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 16px 20px;
            background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
            border-bottom: 1px solid #e2e8f0;
          }
          .main-card__title {
            margin: 0;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #334155;
          }
          .main-card__meta {
            margin: 4px 0 0;
            font-size: 11px;
            color: #64748b;
          }
          .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0 28px;
            padding: 8px 20px 18px;
          }
          .detail-row {
            padding: 12px 0;
            border-top: 1px solid #e2e8f0;
            break-inside: avoid;
          }
          .detail-row:first-child { border-top: 0; padding-top: 0; }
          .detail-label {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #475569;
          }
          .detail-value {
            margin-top: 5px;
            font-size: 13px;
            line-height: 1.55;
            font-weight: 500;
            color: #0f172a;
            word-break: break-word;
          }
          .footer {
            margin-top: 18px;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            font-size: 11px;
            line-height: 1.6;
            color: #475569;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .footer strong { color: #0f172a; }
          @media print {
            .main-card { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div class="header-copy">
              <p class="eyebrow">Setup</p>
              <h1 class="title">${escapePrintHtml(getPrintableValue(company.company_name, 'Company'))}</h1>
              <p class="subtitle">Official company profile covering contact information, representative details, and tax registration data.</p>
            </div>
            <div class="logo-shell">${logoMarkup}</div>
          </div>

          <section class="summary-bar">
            <div class="summary-item">
              <p class="summary-label">Representative</p>
              <p class="summary-value">${escapePrintHtml(getPrintableValue(company.representative))}</p>
            </div>
            <div class="summary-item">
              <p class="summary-label">Primary Contact</p>
              <p class="summary-value">${escapePrintHtml(getPrintableValue(company.phone))}</p>
            </div>
            <div class="summary-item">
              <p class="summary-label">Established</p>
              <p class="summary-value">${escapePrintHtml(formatPrintDate(company.year_of_establishment))}</p>
            </div>
          </section>

          <section class="main-card">
            <div class="main-card__header">
              <div>
                <h2 class="main-card__title">Company Details</h2>
                <p class="main-card__meta">Prepared for administrative and record-keeping purposes.</p>
              </div>
            </div>
            <div class="detail-grid">${detailMarkup}</div>
          </section>

          <div class="footer">
            <span>Printed from company setup</span>
            <strong>${escapePrintHtml(getPrintableValue(company.company_name, 'Company'))}</strong>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function printCompanySetupDocument(company) {
  let printFrame = document.getElementById('company-print-frame');
  if (printFrame) {
    printFrame.remove();
  }

  printFrame = document.createElement('iframe');
  printFrame.id = 'company-print-frame';
  printFrame.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none;';
  document.body.appendChild(printFrame);

  const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (!printDocument || !printFrame.contentWindow) {
    throw new Error('Unable to prepare the print document.');
  }

  printDocument.open();
  printDocument.write(buildCompanySetupPrintHtml(company));
  printDocument.close();

  const cleanup = () => window.setTimeout(() => printFrame.remove(), 1200);
  const triggerPrint = () => {
    window.setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } finally {
        cleanup();
      }
    }, 150);
  };

  const frameImages = Array.from(printDocument.images || []);
  if (!frameImages.length) {
    triggerPrint();
    return;
  }

  let pendingImages = frameImages.length;
  const resolveImage = () => {
    pendingImages -= 1;
    if (pendingImages <= 0) {
      triggerPrint();
    }
  };

  frameImages.forEach((image) => {
    if (image.complete) {
      resolveImage();
      return;
    }

    image.addEventListener('load', resolveImage, { once: true });
    image.addEventListener('error', resolveImage, { once: true });
  });
}
