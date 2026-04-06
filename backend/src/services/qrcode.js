'use strict';
// ============================================================
//  QR Code Generator for booking tickets
//  Returns a base64 PNG data URI
// ============================================================
const QRCode = require('qrcode');

/**
 * Generate a QR code data URI for a booking
 * @param {object} booking - booking row from DB
 * @returns {string} base64 PNG data URI
 */
async function generateTicketQR(booking) {
  const baseUrl = process.env.QR_BASE_URL || 'https://wow.yourwebsite.com/verify';
  const payload = {
    ref:        booking.booking_ref,
    park:       booking.park,
    visit:      booking.visit_date,
    tickets:    booking.ticket_total,
    verified_at:new Date().toISOString()
  };

  const qrData = `${baseUrl}?ref=${booking.booking_ref}&sig=${
    Buffer.from(JSON.stringify(payload)).toString('base64url').slice(0, 24)
  }`;

  const dataUri = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width:  300,
    color:  { dark: '#1a1a2e', light: '#ffffff' }
  });

  return { dataUri, qrData, payload };
}

module.exports = { generateTicketQR };
