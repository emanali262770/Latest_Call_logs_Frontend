export function printQuotationPdfBlob(pdfBlob) {
  const blob = pdfBlob instanceof Blob
    ? pdfBlob
    : new Blob([pdfBlob], { type: 'application/pdf' });

  const blobUrl = URL.createObjectURL(blob);

  let frame = document.getElementById('quotation-print-pdf-frame');
  if (frame) frame.remove();

  frame = document.createElement('iframe');
  frame.id = 'quotation-print-pdf-frame';
  frame.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none;';
  frame.src = blobUrl;
  document.body.appendChild(frame);

  frame.onload = () => {
    setTimeout(() => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } finally {
        setTimeout(() => {
          frame.remove();
          URL.revokeObjectURL(blobUrl);
        }, 1500);
      }
    }, 300);
  };
}
