'use strict';
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;
const IGST_RATE = 0.18;
const HSN_CODE  = '9996';
const SAC_CODE  = '999249';

function buildInvoice(order, customer, interState) {
  if (!customer) customer = {};
  if (!interState) interState = false;
  var invoiceNo   = 'INV-' + Date.now().toString(36).toUpperCase();
  var invoiceDate = new Date().toISOString().slice(0, 10);
  var lineItems   = (order.line_items || []).map(function(item) {
    return {
      description: item.label + ' - ' + (order.park_label || order.park),
      hsn_code:    HSN_CODE,
      sac_code:    SAC_CODE,
      qty:         item.qty,
      unit_price:  item.unit_net,
      amount:      item.line_net
    };
  });
  var taxable_value = order.after_disc || 0;
  var tax_lines;
  if (interState) {
    tax_lines = [{ type: 'IGST', rate: IGST_RATE, amount: Math.round(taxable_value * IGST_RATE) }];
  } else {
    tax_lines = [
      { type: 'CGST', rate: CGST_RATE, amount: Math.round(taxable_value * CGST_RATE) },
      { type: 'SGST', rate: SGST_RATE, amount: Math.round(taxable_value * SGST_RATE) }
    ];
  }
  var total_tax   = tax_lines.reduce(function(s, t) { return s + t.amount; }, 0);
  var grand_total = taxable_value + total_tax;
  return {
    invoice_no:    invoiceNo,
    invoice_date:  invoiceDate,
    supplier: {
      name:    process.env.COMPANY_NAME    || 'Entertainment and Amusement Ltd',
      gstin:   process.env.COMPANY_GSTIN   || '07AAAAA0000A1Z5',
      address: process.env.COMPANY_ADDRESS || 'Sector 38A, Noida, UP 201303'
    },
    buyer: {
      name:       (customer.name)  || 'Walk-in Customer',
      gstin:      (customer.gstin) || null,
      state_code: (customer.state_code) || '09'
    },
    line_items:    lineItems,
    subtotal:      order.subtotal      || 0,
    discount:      order.discount      || 0,
    taxable_value: taxable_value,
    tax_lines:     tax_lines,
    total_tax:     total_tax,
    grand_total:   grand_total,
    inter_state:   interState,
    hsn_code:      HSN_CODE,
    sac_code:      SAC_CODE
  };
}

module.exports = { buildInvoice, CGST_RATE, SGST_RATE, IGST_RATE };