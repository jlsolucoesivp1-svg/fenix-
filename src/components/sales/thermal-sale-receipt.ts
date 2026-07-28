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

export const buildThermalSaleReceipt = (params: {
  sale: Sale;
  company: CompanyInfo;
  customer: Customer | null;
}): string => {
  const { sale, company, customer } = params;
  const customerName = sale.customerName || customer?.name || 'Consumidor Final';
  const companyLines = [company.name, company.document, company.phone, company.address].filter(Boolean);

  const itemRows = sale.items
    .map((item) => {
      const lineTotal = item.price * item.quantity;
      return `<article class="item">
        <p class="item-name">${escapeHtml(item.name)}</p>
        <div class="line"><span>${escapeHtml(item.quantity)} x ${money(item.price)}</span><strong>${money(lineTotal)}</strong></div>
      </article>`;
    })
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Comprovante ${escapeHtml(sale.id)}</title>
    <style>
      @page { size: 80mm auto; margin: 2mm; }
      * { box-sizing: border-box; }
      html, body { width: 76mm; margin: 0; padding: 0; background: #fff; color: #000; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.3; }
      .receipt { width: 76mm; padding: 0; overflow-wrap: anywhere; }
      .center { text-align: center; }
      .company { font-weight: 700; font-size: 12pt; }
      .muted { font-size: 8.5pt; }
      .divider { border: 0; border-top: 1px dashed #000; margin: 3mm 0; }
      .line { display: flex; justify-content: space-between; gap: 3mm; align-items: flex-start; }
      .line > :last-child { text-align: right; white-space: nowrap; }
      .item { padding: 1.5mm 0; border-bottom: 1px dotted #777; }
      .item-name { margin: 0 0 1mm; font-weight: 700; white-space: pre-wrap; }
      .totals { margin-top: 2mm; }
      .total { font-size: 12pt; font-weight: 700; margin-top: 1mm; }
      .notes { white-space: pre-wrap; margin: 0; }
      .print-fallback { width: 76mm; margin: 4mm 0; font: inherit; padding: 2mm; }
      .print-message { margin: 2mm 0; font-size: 8.5pt; }
      @media print {
        html, body { width: 76mm !important; min-width: 76mm !important; }
        .receipt { width: 76mm !important; }
        .print-fallback, .print-message { display: none !important; }
      }
    </style>
  </head>
  <body>
    <main class="receipt">
      <header class="center">
        ${companyLines.map((line, index) => `<div class="${index === 0 ? 'company' : 'muted'}">${escapeHtml(line)}</div>`).join('')}
        <div class="muted">COMPROVANTE DE VENDA</div>
      </header>
      <hr class="divider" />
      <div class="line"><span>Venda</span><strong>#${escapeHtml(sale.id.slice(-6))}</strong></div>
      <div class="line"><span>Data/Hora</span><span>${escapeHtml(formatSaleDate(sale.date))} ${escapeHtml(sale.time)}</span></div>
      <div class="line"><span>Cliente</span><span>${escapeHtml(customerName)}</span></div>
      ${customer?.document ? `<div class="line"><span>CPF/CNPJ</span><span>${escapeHtml(customer.document)}</span></div>` : ''}
      <div class="line"><span>Operador</span><span>${escapeHtml(sale.user)}</span></div>
      <div class="line"><span>Pagamento</span><span>${escapeHtml(sale.paymentMethod)}</span></div>
      <hr class="divider" />
      <section aria-label="Itens vendidos">${itemRows}</section>
      <section class="totals">
        <div class="line"><span>Subtotal</span><span>${money(sale.subtotal)}</span></div>
        <div class="line"><span>Desconto</span><span>- ${money(sale.discount)}</span></div>
        <div class="line total"><span>Total</span><span>${money(sale.total)}</span></div>
      </section>
      ${sale.observations ? `<><hr class="divider" /><strong>Observacoes</strong><p class="notes">${escapeHtml(sale.observations)}</p></>` : ''}
      <hr class="divider" />
      <footer class="center muted">Obrigado pela preferencia!</footer>
    </main>
    <p id="print-message" class="print-message" hidden>A janela de impressao nao abriu automaticamente.</p>
    <button id="print-fallback" class="print-fallback" type="button" hidden>Imprimir agora</button>
    <script>
      (() => {
        const fallbackButton = document.getElementById('print-fallback');
        const fallbackMessage = document.getElementById('print-message');
        let printStarted = false;

        const showFallback = () => {
          fallbackButton.hidden = false;
          fallbackMessage.hidden = false;
        };
        const printNow = () => {
          try {
            window.focus();
            window.print();
          } catch {
            showFallback();
          }
        };

        window.addEventListener('beforeprint', () => { printStarted = true; });
        window.addEventListener('afterprint', () => window.setTimeout(() => window.close(), 150));
        fallbackButton.addEventListener('click', printNow);
        window.requestAnimationFrame(() => window.setTimeout(printNow, 100));
        window.setTimeout(() => {
          if (!printStarted) showFallback();
        }, 1500);
      })();
    </script>
  </body>
</html>`;
};
