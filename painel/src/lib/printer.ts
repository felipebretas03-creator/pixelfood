export interface PrintOrderData {
  orderNumber: string;
  customerName: string;
  phone?: string;
  address?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    options?: string;
    observation?: string;
  }>;
  total: number;
  paymentMethod: string;
  createdAt: string;
  storeName: string;
}

export function printOrderReceipt(order: PrintOrderData) {
  // Configuração básica do CSS para impressora térmica 80mm
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pedido ${order.orderNumber}</title>
      <style>
        @page {
          margin: 0;
        }
        body {
          font-family: 'Courier New', Courier, monospace; /* Fonte monosespaçada comum em impressoras térmicas */
          width: 80mm;
          margin: 0 auto;
          padding: 5mm;
          font-size: 14px;
          line-height: 1.2;
          color: #000;
        }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-lg { font-size: 18px; }
        .text-xl { font-size: 24px; }
        .mt-2 { margin-top: 8px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .border-t { border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px; }
        .border-b { border-bottom: 1px dashed #000; margin-bottom: 8px; padding-bottom: 8px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-list { width: 100%; border-collapse: collapse; }
        .items-list td { vertical-align: top; padding: 2px 0; }
        .items-list .qty { width: 15%; font-weight: bold; }
        .items-list .name { width: 60%; }
        .items-list .price { width: 25%; text-align: right; }
        .sub-text { font-size: 12px; margin-left: 15%; margin-bottom: 4px;}
      </style>
    </head>
    <body>
      <div class="text-center font-bold text-xl mb-2">${order.storeName}</div>
      
      <div class="text-center border-t border-b font-bold text-lg">
        PEDIDO ${order.orderNumber}
      </div>

      <div class="mb-2 mt-2">
        <div><span class="font-bold">Cliente:</span> ${order.customerName}</div>
        ${order.phone ? `<div><span class="font-bold">Telefone:</span> ${order.phone}</div>` : ''}
        ${order.address ? `<div><span class="font-bold">Endereço:</span> ${order.address}</div>` : `<div><span class="font-bold">Tipo:</span> Retirada no Balcão</div>`}
        <div><span class="font-bold">Data:</span> ${order.createdAt}</div>
      </div>

      <div class="border-t font-bold mb-2">ITENS DO PEDIDO</div>
      
      <table class="items-list">
        ${order.items.map(item => `
          <tr>
            <td class="qty">${item.quantity}x</td>
            <td class="name">${item.name}</td>
            <td class="price">R$ ${item.price.toFixed(2).replace('.', ',')}</td>
          </tr>
          ${item.options ? `<tr><td colspan="3" class="sub-text">+ ${item.options}</td></tr>` : ''}
          ${item.observation ? `<tr><td colspan="3" class="sub-text">Obs: ${item.observation}</td></tr>` : ''}
        `).join('')}
      </table>

      <div class="border-t border-b mt-2">
        <div class="flex justify-between font-bold text-lg">
          <span>TOTAL</span>
          <span>R$ ${order.total.toFixed(2).replace('.', ',')}</span>
        </div>
        <div class="mt-2">
          <span class="font-bold">Pagamento:</span> ${order.paymentMethod}
        </div>
      </div>

      <div class="text-center mt-2 sub-text" style="margin-left: 0;">
        Impresso por Pixeleats Delivery
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  // Cria um iframe invisível para imprimir o conteúdo sem afetar a tela atual
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  
  document.body.appendChild(iframe);

  iframe.contentWindow?.document.open();
  iframe.contentWindow?.document.write(printContent);
  iframe.contentWindow?.document.close();

  // Limpa o iframe após a impressão ser acionada (com um timeout de segurança)
  setTimeout(() => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }, 5000);
}

export interface PrintFechamentoData {
  storeName: string;
  date: string;
  totalRevenue: number;
  totalOrders: number;
  byMethod: {
    pix: number;
    cash: number;
    card: number;
  };
}

export function printFechamentoReceipt(data: PrintFechamentoData) {
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Fechamento de Caixa</title>
      <style>
        @page {
          margin: 0;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          width: 80mm;
          margin: 0 auto;
          padding: 5mm;
          font-size: 14px;
          line-height: 1.2;
          color: #000;
        }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-lg { font-size: 18px; }
        .text-xl { font-size: 24px; }
        .mt-2 { margin-top: 8px; }
        .mb-2 { margin-bottom: 8px; }
        .border-t { border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px; }
        .border-b { border-bottom: 1px dashed #000; margin-bottom: 8px; padding-bottom: 8px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .sub-text { font-size: 12px; margin-bottom: 4px;}
      </style>
    </head>
    <body>
      <div class="text-center font-bold text-xl mb-2">${data.storeName}</div>
      
      <div class="text-center border-t border-b font-bold text-lg">
        FECHAMENTO DE CAIXA
      </div>

      <div class="mb-2 mt-2">
        <div><span class="font-bold">Data/Hora:</span> ${new Date(data.date).toLocaleString('pt-BR')}</div>
      </div>

      <div class="border-t font-bold mb-2">RESUMO DE VENDAS</div>
      
      <div class="flex justify-between">
        <span>Qtd de Pedidos:</span>
        <span>${data.totalOrders}</span>
      </div>

      <div class="border-t font-bold mb-2">POR MEIO DE PAGAMENTO</div>
      
      <div class="flex justify-between">
        <span>PIX:</span>
        <span>R$ ${data.byMethod.pix.toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="flex justify-between">
        <span>Dinheiro:</span>
        <span>R$ ${data.byMethod.cash.toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="flex justify-between">
        <span>Cartão:</span>
        <span>R$ ${data.byMethod.card.toFixed(2).replace('.', ',')}</span>
      </div>

      <div class="border-t border-b mt-2">
        <div class="flex justify-between font-bold text-lg">
          <span>TOTAL GERAL</span>
          <span>R$ ${data.totalRevenue.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      <div class="text-center mt-2 sub-text">
        Impresso por Pixeleats Delivery
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  
  document.body.appendChild(iframe);

  iframe.contentWindow?.document.open();
  iframe.contentWindow?.document.write(printContent);
  iframe.contentWindow?.document.close();

  setTimeout(() => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }, 5000);
}
