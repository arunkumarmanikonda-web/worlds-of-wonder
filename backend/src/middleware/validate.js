'use strict';
// ============================================================
//  Joi request validation middleware factory
// ============================================================
const Joi = require('joi');

/**
 * Returns an Express middleware that validates req.body against a Joi schema.
 * Sends 400 with error detail if validation fails.
 */
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly:  true,
      stripUnknown: true,
      convert:     true
    });
    if (error) {
      return res.status(400).json({
        error:  'Validation failed',
        detail: error.details[0].message
      });
    }
    req.body = value; // replace with sanitised value
    next();
  };
}

/**
 * Validate req.query
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly:  true,
      stripUnknown: true,
      convert:     true
    });
    if (error) {
      return res.status(400).json({
        error:  'Invalid query parameters',
        detail: error.details[0].message
      });
    }
    req.query = value;
    next();
  };
}

// ── Common Joi schemas ────────────────────────────────────────
const schemas = {
  booking: Joi.object({
    park:        Joi.string().valid('WATER_DAY','AMUSEMENT_DAY','COMBO_DAY').required(),
    visit_date:  Joi.string().isoDate().required(),
    adults:      Joi.number().integer().min(0).max(8).default(0),
    children:    Joi.number().integer().min(0).max(8).default(0),
    seniors:     Joi.number().integer().min(0).max(8).default(0),
    armed:       Joi.number().integer().min(0).max(8).default(0),
    differently_abled: Joi.number().integer().min(0).max(8).default(0),
    offer_code:  Joi.string().uppercase().max(20).optional().allow('', null),
    payment_mode:Joi.string().valid('UPI','Card','Cash','NetBanking').required(),
    customer_name:   Joi.string().max(120).optional().allow('', null),
    customer_email:  Joi.string().email().optional().allow('', null),
    customer_mobile: Joi.string().pattern(/^[6-9]\d{9}$/).optional().allow('', null)
  }),

  paymentInitiate: Joi.object({
    booking_ref: Joi.string().required()
  }),

  paymentConfirm: Joi.object({
    razorpay_order_id:   Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature:  Joi.string().required(),
    booking_ref:         Joi.string().required()
  }),

  login: Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().min(4).required(),
    role:     Joi.string().optional()
  })
};

module.exports = { validateBody, validateQuery, schemas };
