'use strict';
// ASCII-only GST Invoice Builder — no em-dashes, no template literals
var CGST_RATE = 0.09;
var SGST_RATE = 0.09;
var IGST_RATE = 0.18;
var HSN_CODE  = '9996';
var SAC_CODE  = '999249';
function buildInvoice(order, customer, interState) {
  if (!customer)   customer   = {};
  if (!interState) interState = false;
  var invoiceNo   = 'INV-' + Date.now().toString(36).toUpperCase();
  var invoiceDate = new Date().toISOString().slice(0, 10);
  var lineItems = (order.line_items || []).map(function(item) {
    return {
      description: item.label + ' - ' + (order.park_label || order.park || 'Park'),
      hsn_code: HSN_CODE, sac_code: SAC_CODE,
      qty: item.qty, unit_price: item.unit_net, amount: item.line_net
    };
  });
  var taxableValue = order.after_disc || 0;
  var taxLines = interState
    ? [{ type: 'IGST', rate: IGST_RATE, amount: Math.round(taxableValue * IGST_RATE) }]
    : [{ type: 'CGST', rate: CGST_RATE, amount: Math.round(taxableValue * CGST_RATE) },
       { type: 'SGST', rate: SGST_RATE, amount: Math.round(taxableValue * SGST_RATE) }];
  var totalTax   = taxLines.reduce(function(s,t){ return s+t.amount; }, 0);
  var grandTotal = taxableValue + totalTax;
  return {
    invoice_no: invoiceNo, invoice_date: invoiceDate,
    supplier: {
      name:    process.env.COMPANY_NAME    || 'Entertainment and Amusement Ltd',
      gstin:   process.env.COMPANY_GSTIN   || '07AAAAA0000A1Z5',
      address: process.env.COMPANY_ADDRESS || 'Sector 38A, Noida, UP 201303'
    },
    buyer: { name: customer.name || 'Walk-in Customer', gstin: customer.gstin || null, state_code: customer.state_code || '09' },
    line_items: lineItems, subtotal: order.subtotal || 0, discount: order.discount || 0,
    taxable_value: taxableValue, tax_lines: taxLines, total_tax: totalTax, grand_total: grandTotal,
    inter_state: interState, hsn_code: HSN_CODE, sac_code: SAC_CODE
  };
}
module.exports = { buildInvoice: buildInvoice, CGST_RATE: CGST_RATE, SGST_RATE: SGST_RATE, IGST_RATE: IGST_RATE };