import type { CompanyInfo, Customer, Sale } from '@/types';

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatSaleDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

/**
 * Generates a complete A4 document for a reserved popup window.  Keeping the
 * markup self-contained avoids relying on the browser PDF viewer to execute a
 * jsPDF auto-print action, which is not reliable for data: URLs in popups.
 */
export const buildA4SaleReceipt = (params: {
  sale: Sale;
  company: CompanyInfo;
  customer: Customer | null;
}): string => {
  const { sale, company, customer } = params;
  const customerName = sale.customerName || customer?.name || 'Consumidor Final';
  const companyLines = [company.document, company.address, company.phone, company.emailOrSite].filter(Boolean);
  const itemRows = sale.items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.name)}</td>
        <td class="number">${escapeHtml(item.quantity)}</td>
        <td class="number">${money(item.price)}</td>
        <td class="number">${money(item.price * item.quantity)}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Comprovante de venda ${escapeHtml(sale.id)}</title>
    <style>
      @page { size: A4 portrait; margin: 14mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; color: #111827; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.4; }
      .receipt { max-width: 182mm; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; gap: 12mm; border-bottom: 2px solid #1e293b; padding-bottom: 6mm; }
      .company { flex: 1; }
      .company-logo { display: block; max-width: 38mm; max-height: 24mm; margin-bottom: 3mm; object-fit: contain; object-position: left center; }
      h1, h2, p { margin: 0; }
      h1 { font-size: 18pt; line-height: 1.2; }
      h2 { font-size: 14pt; }
      .muted { color: #475569; font-size: 9pt; }
      .sale-meta { min-width: 52mm; text-align: right; }
      .section { margin-top: 7mm; }
      .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3mm 8mm; padding: 4mm; border: 1px solid #cbd5e1; }
      .label { color: #475569; font-size: 8.5pt; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #cbd5e1; padding: 2.5mm; vertical-align: top; }
      th { background: #1e293b; color: #fff; text-align: left; font-size: 9pt; }
      .number { text-align: right; white-space: nowrap; }
      tfoot td { font-weight: 700; background: #f1f5f9; }
      .total td { font-size: 12pt; background: #e2e8f0; }
      .notes { white-space: pre-wrap; border: 1px solid #cbd5e1; padding: 4mm; }
      .footer { margin-top: 8mm; border-top: 1px solid #cbd5e1; padding-top: 4mm; text-align: center; color: #475569; font-size: 9pt; }
      .print-fallback, .print-message { margin-top: 6mm; }
      @media print {
        .print-fallback, .print-message { display: none !important; }
      }
    </style>
  </head>
  <body>
    <main class="receipt">
      <header class="header">
        <div class="company">
          ${company.logoUrl ? `<img class="company-logo" src="${escapeHtml(company.logoUrl)}" alt="Logo da empresa" />` : ''}
          <h1>${escapeHtml(company.name || 'Empresa')}</h1>
          ${companyLines.map((line) => `<p class="muted">${escapeHtml(line)}</p>`).join('')}
        </div>
        <div class="sale-meta">
          <h2>Comprovante de Venda</h2>
          <p><strong>Venda #${escapeHtml(sale.id.slice(-6))}</strong></p>
          <p class="muted">${escapeHtml(formatSaleDate(sale.date))} às ${escapeHtml(sale.time)}</p>
        </div>
      </header>
      <section class="section">
        <div class="info-grid">
          <div><p class="label">Cliente</p><strong>${escapeHtml(customerName)}</strong></div>
          ${customer?.document ? `<div><p class="label">CPF/CNPJ</p><strong>${escapeHtml(customer.document)}</strong></div>` : ''}
          <div><p class="label">Vendedor</p><strong>${escapeHtml(sale.user)}</strong></div>
          <div><p class="label">Forma de pagamento</p><strong>${escapeHtml(sale.paymentMethod)}</strong></div>
        </div>
      </section>
      <section class="section">
        <table aria-label="Itens vendidos">
          <thead><tr><th>Produto</th><th class="number">Quantidade</th><th class="number">Valor unitário</th><th class="number">Subtotal</th></tr></thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr><td colspan="3" class="number">Subtotal</td><td class="number">${money(sale.subtotal)}</td></tr>
            <tr><td colspan="3" class="number">Desconto</td><td class="number">- ${money(sale.discount)}</td></tr>
            <tr class="total"><td colspan="3" class="number">Total</td><td class="number">${money(sale.total)}</td></tr>
          </tfoot>
        </table>
      </section>
      ${sale.observations ? `<section class="section"><p class="label">Observações</p><p class="notes">${escapeHtml(sale.observations)}</p></section>` : ''}
      <footer class="footer">Obrigado pela preferência!</footer>
    </main>
    <p id="print-message" class="print-message" hidden>A janela de impressão não abriu automaticamente.</p>
    <button id="print-fallback" class="print-fallback" type="button" hidden>Imprimir agora</button>
    <script>
      (() => {
        const fallbackButton = document.getElementById('print-fallback');
        const fallbackMessage = document.getElementById('print-message');
        let printStarted = false;
        const showFallback = () => { fallbackButton.hidden = false; fallbackMessage.hidden = false; };
        const printNow = () => {
          try { window.focus(); window.print(); } catch { showFallback(); }
        };
        window.addEventListener('beforeprint', () => { printStarted = true; });
        window.addEventListener('afterprint', () => window.setTimeout(() => window.close(), 150));
        fallbackButton.addEventListener('click', printNow);
        window.requestAnimationFrame(() => window.setTimeout(printNow, 100));
        window.setTimeout(() => { if (!printStarted) showFallback(); }, 1500);
      })();
    </script>
  </body>
</html>`;
};
