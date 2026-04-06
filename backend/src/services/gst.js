'use strict';
// ============================================================
//  GST Invoice Builder
//  Intra-state (UP): CGST 9% + SGST 9%
//  Inter-state:      IGST 18%
//  HSN code: 9996  SAC: 999249
// ============================================================

const CGST_RATE  = 0.09;
const SGST_RATE  = 0.09;
const IGST_RATE  = 0.18;
const HSN_CODE   = '9996';
const SAC_CODE   = '999249';

/**
 * Build a GST invoice object for a booking
 * @param {object} order     - output of pricing.computeOrder()
 * @param {object} customer  - { name, gstin, state_code }
 * @param {boolean} interState - true if customer is from different state
 */
function buildInvoice(order, customer = {}, interState = false) {
  const invoiceNo = 'INV-' + Date.now().toString(36).toUpperCase();
  const invoiceDate = new Date().toISOString().slice(0, 10);

  const lineItems = order.line_items.map(item => ({
    description: `${item.label} — ${order.park_label}`,
    hsn_code:    HSN_CODE,
    sac_code:    SAC_CODE,
    qty:         item.qty,
    unit_price:  item.unit_net,
    amount:      item.line_net
  }));

  const taxable_value = order.after_disc;

  let tax_lines;
  if (interState) {
    tax_lines = [
      { type: 'IGST', rate: IGST_RATE, amount: Math.round(taxable_value * IGST_RATE) }
    ];
  } else {
    tax_lines = [
      { type: 'CGST', rate: CGST_RATE, amount: Math.round(taxable_value * CGST_RATE) },
      { type: 'SGST', rate: SGST_RATE, amount: Math.round(taxable_value * SGST_RATE) }
    ];
  }

  const total_tax    = tax_lines.reduce((s, t) => s + t.amount, 0);
  const grand_total  = taxable_value + total_tax;

  return {
    invoice_no:    invoiceNo,
    invoice_date:  invoiceDate,
    supplier: {
      name:    process.env.COMPANY_NAME    || 'Entertainment and Amusement Ltd',
      gstin:   process.env.COMPANY_GSTIN   || '07AAAAA0000A1Z5',
      address: process.env.COMPANY_ADDRESS || 'Sector 38A, Noida, UP 201303'
    },
    buyer: {
      name:       customer.name  || 'Walk-in Customer',
      gstin:      customer.gstin || null,
      state_code: customer.state_code || '09'  // 09 = Uttar Pradesh
    },
    line_items,
    subtotal:      order.subtotal,
    discount:      order.discount,
    taxable_value,
    tax_lines,
    total_tax,
    grand_total,
    inter_state:   interState,
    hsn_code:      HSN_CODE,
    sac_code:      SAC_CODE
  };
}

module.exports = { buildInvoice, CGST_RATE, SGST_RATE, IGST_RATE };
