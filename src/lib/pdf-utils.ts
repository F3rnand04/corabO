
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Transaction } from './types';

const generateInvoiceHTML = (tx: Transaction): string => {
  // Basic styling for the invoice
  const styles = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; }
    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 16px; line-height: 24px; }
    .invoice-box table { width: 100%; line-height: inherit; text-align: left; }
    .invoice-box table td { padding: 5px; vertical-align: top; }
    .invoice-box table tr td:nth-child(2) { text-align: right; }
    .invoice-box table tr.top table td { padding-bottom: 20px; }
    .invoice-box table tr.top table td.title { font-size: 45px; line-height: 45px; color: #333; }
    .invoice-box table tr.information table td { padding-bottom: 40px; }
    .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
    .invoice-box table tr.details td { padding-bottom: 20px; }
    .invoice-box table tr.item td{ border-bottom: 1px solid #eee; }
    .invoice-box table tr.item.last td { border-bottom: none; }
    .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #eee; font-weight: bold; }
    .text-right { text-align: right; }
    .font-mono { font-family: monospace; }
  `;

  // Details extraction with fallbacks
  const clientName = (tx.details as any).clientName || 'N/A';
  const providerName = (tx.details as any).providerName || 'Sistema';
  const itemDescription = (tx.details as any).serviceName || (tx.details as any).system || 'Servicio/Producto';
  const date = new Date(tx.date).toLocaleDateString('es-VE');

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <style>${styles}</style>
      </head>
      <body>
        <div class="invoice-box">
          <table cellpadding="0" cellspacing="0">
            <tr class="top">
              <td colspan="2">
                <table>
                  <tr>
                    <td class="title">
                        Corabo
                    </td>
                    <td>
                      Factura #: ${tx.id.substring(0, 8)}...<br>
                      Creada: ${date}<br>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr class="information">
              <td colspan="2">
                <table>
                  <tr>
                    <td>
                      Proveedor:<br>
                      ${providerName}<br>
                    </td>
                    <td>
                      Cliente:<br>
                      ${clientName}<br>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr class="heading">
              <td>Descripción</td>
              <td>Precio</td>
            </tr>
            <tr class="item">
              <td>${itemDescription}</td>
              <td class="font-mono">$${tx.amount.toFixed(2)}</td>
            </tr>
            <tr class="total">
              <td></td>
              <td class="text-right font-mono">Total: $${tx.amount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
};

export const downloadTransactionsPDF = async (transactions: Transaction[]) => {
  if (transactions.length === 0) return;

  // For now, we'll just download the first transaction in the list.
  const tx = transactions[0];
  const invoiceHTML = generateInvoiceHTML(tx);

  // Create a temporary element to render the HTML
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px'; // Position off-screen
  container.innerHTML = invoiceHTML;
  document.body.appendChild(container);

  const invoiceElement = container.querySelector('.invoice-box') as HTMLElement;

  if (!invoiceElement) {
    console.error("Could not find the invoice element to render.");
    document.body.removeChild(container);
    return;
  }

  try {
    // @ts-ignore
    const canvas = await html2canvas(invoiceElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    // A4 size in points: 595.28 x 841.89
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    
    // Calculate the dimensions to fit the image in the PDF
    let imgWidth = pdfWidth - 40; // With some margin
    let imgHeight = imgWidth / canvasAspectRatio;

    if (imgHeight > pdfHeight - 40) {
        imgHeight = pdfHeight - 40;
        imgWidth = imgHeight * canvasAspectRatio;
    }

    const x = (pdfWidth - imgWidth) / 2;
    const y = 20; // Top margin

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(`factura-${tx.id}.pdf`);

  } catch (error) {
    console.error("Error generating PDF:", error);
  } finally {
    // Clean up the temporary element
    document.body.removeChild(container);
  }
};
