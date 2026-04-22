const Joi = require("joi");

// Generic validation middleware factory
const validate = (schema, source = "body") =>
  (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map((d) => d.message),
      });
    }
    next();
  };

// ── Auth schemas ─────────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().max(254).required(),
  phone: Joi.string().pattern(/^[0-9+\-\s]{8,20}$/).required()
    .messages({ "string.pattern.base": "Phone must be 8–20 digits" }),
  password: Joi.string().min(8).max(128).required()
    .messages({ "string.min": "Password must be at least 8 characters" }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
  password: Joi.string().min(1).max(128).required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).max(128).required(),
});

const resendOtpSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
});

// ── User / admin schemas ──────────────────────────────────────────────────────

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  phone: Joi.string().pattern(/^[0-9+\-\s]{8,20}$/),
});

const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(1).max(128).required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

const addAddressSchema = Joi.object({
  recipient_name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[0-9+\-\s]{8,20}$/).required(),
  province: Joi.string().trim().min(2).max(100).required(),
  city: Joi.string().trim().min(2).max(100).required(),
  district: Joi.string().trim().min(2).max(100).required(),
  postal_code: Joi.string().pattern(/^\d{5}$/).required()
    .messages({ "string.pattern.base": "Postal code must be 5 digits" }),
  details: Joi.string().trim().min(5).max(500).required(),
  is_primary: Joi.boolean().optional(),
});

const createUserByAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().max(254).required(),
  phone: Joi.string().pattern(/^[0-9+\-\s]{8,20}$/).required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid("customer", "admin").optional(),
});

const updateUserByAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().email().max(254),
  phone: Joi.string().pattern(/^[0-9+\-\s]{8,20}$/),
  role: Joi.string().valid("customer", "admin"),
});

// ── Cart schemas ──────────────────────────────────────────────────────────────

const addToCartSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  variantId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(99).required(),
  phoneTypeId: Joi.number().integer().positive().optional().allow(null),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(99).optional(),
  variantId: Joi.number().integer().positive().optional(),
  phoneTypeId: Joi.number().integer().positive().optional().allow(null),
});

// ── Order schemas ─────────────────────────────────────────────────────────────

const orderSummarySchema = Joi.object({
  addressId: Joi.number().integer().positive().required(),
  selectedItemIds: Joi.array().items(Joi.number().integer().positive()).optional(),
  buyNow: Joi.alternatives().try(
    Joi.object({
      variantId: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().min(1).max(99).required(),
      phoneTypeId: Joi.number().integer().positive().optional().allow(null),
    }),
    Joi.string()
  ).optional(),
});

module.exports = {
  validate,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    verifyOtp: verifyOtpSchema,
    forgotPassword: forgotPasswordSchema,
    resetPassword: resetPasswordSchema,
    resendOtp: resendOtpSchema,
    updateProfile: updateProfileSchema,
    updatePassword: updatePasswordSchema,
    addAddress: addAddressSchema,
    createUserByAdmin: createUserByAdminSchema,
    updateUserByAdmin: updateUserByAdminSchema,
    addToCart: addToCartSchema,
    updateCartItem: updateCartItemSchema,
    orderSummary: orderSummarySchema,
  },
};
