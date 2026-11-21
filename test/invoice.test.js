const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');

test('invoice applies HSN GST slabs and apportions coupon discount before tax', () => {
  const figures = invoice.computeInvoiceFigures({
    items: [
      { id: 1, name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 1 },
      { id: 2, name: 'Tea', sku: 'TEA', hsn: '0902', price: 100, qty: 1 }
    ],
    coupon: 'WELCOME'
  });

  assert.deepEqual(figures, {
    subtotal: 200,
    discount: 10,
    tax: 21.85,
    cgst: 10.93,
    sgst: 10.92,
    total: 211.85,
    rows: [
      { name: 'Rice', sku: 'RICE', hsn: '1006', qty: 1, price: 100, gstPercent: 5, line: 100, lineTax: 4.75 },
      { name: 'Tea', sku: 'TEA', hsn: '0902', qty: 1, price: 100, gstPercent: 18, line: 100, lineTax: 17.1 }
    ]
  });
});

test('invoice accepts fractional gstRate values as decimal rates', () => {
  const figures = invoice.computeInvoiceFigures({
    items: [{ name: 'Rice', price: 100, qty: 1, gstRate: 0.05 }]
  });

  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.tax, 5);
  assert.equal(figures.total, 105);
});

test('rendered invoice reconciles with an order total calculated using the HSN slab', () => {
  const html = invoice.render({
    id: 7,
    date: '2026-11-21',
    customer: 'A Customer',
    items: [{ name: 'Rice', hsn: '1006', price: 100, qty: 1 }],
    coupon: '',
    total: 105
  });

  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">₹5\.00/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹105\.00/);
  assert.doesNotMatch(html, /differs from Order Ledger recorded total/);
});
