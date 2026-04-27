const { User } = require("../models");
const { Op } = require("sequelize");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { hashPassword, comparePassword } = require("../utils/hash");
const sendEmail = require("../utils/sendEmail");
const { blacklistToken } = require("../middlewares/auth");

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

module.exports = {
  register: async (req, res) => {
    try {
      const { name, email, phone, password } = req.body;
      const existEmail = await User.findOne({ where: { email } });
      if (existEmail) {
        if (!existEmail.is_verified) {
          return res.status(400).json({
            message: "Account not verified. Please verify or resend OTP.",
            need_verify: true,
          });
        }
        return res.status(400).json({ message: "Email already used" });
      }

      const existPhone = await User.findOne({ where: { phone } });
      if (existPhone)
        return res.status(400).json({ message: "Phone already used" });

      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

      const hashed = await hashPassword(password);
      const user = await User.create({
        name,
        email,
        phone,
        password: hashed,
        otp_code: hashOtp(otp), // simpan hash, bukan plaintext
        otp_expire: otpExpire,
        is_verified: false,
      });

      const message = `
        <h2>IDSHOPCASE Account Verification</h2>
        <p>Hello <b>${name}</b>,</p>
        <p>Enter the following OTP code to verify your account (valid for 10 minutes):</p>
        <h1 style="letter-spacing: 3px;">${otp}</h1>
      `;

      await sendEmail(user.email, "IDSHOPCASE Account Verification", message);

      return res.status(201).json({
        message:
          "Registration successful, please check your email for OTP verification.",
        email: user.email,
      });
    } catch (err) {
      return res.status(500).json({
        message:
          process.env.NODE_ENV !== "production"
            ? err.message
            : "Internal server error",
      });
    }
  },

  verifyOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.is_verified)
        return res.status(400).json({ message: "Account has been verified" });

      const otpExpired = new Date(user.otp_expire).getTime() < Date.now();
      const otpMatch = user.otp_code === hashOtp(otp); // bandingkan hash

      if (!otpMatch || otpExpired) {
        return res
          .status(400)
          .json({ message: "OTP code is incorrect or expired" });
      }

      user.is_verified = true;
      user.otp_code = null;
      user.otp_expire = null;
      await user.save();

      return res.json({ message: "Verification successful, please login" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message:
          process.env.NODE_ENV !== "production"
            ? err.message
            : "Internal server error",
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.is_verified)
        return res.status(400).json({ message: "Account not verified" });

      const match = await comparePassword(password, user.password);
      if (!match) return res.status(400).json({ message: "Wrong password" });

      // jti (JWT ID) unik per token — dipakai untuk blacklist saat logout
      const jti = crypto.randomUUID();

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, jti },
        process.env.JWT_SECRET,
        { expiresIn: "30m" },
      );

      return res.json({ message: "Login success", token });
    } catch (err) {
      return res.status(500).json({
        message:
          process.env.NODE_ENV !== "production"
            ? err.message
            : "Internal server error",
      });
    }
  },

  logout: async (req, res) => {
    try {
      // req.user sudah diisi oleh middleware authenticate
      await blacklistToken(req.user);
      return res.json({ message: "Logout berhasil" });
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: "User not found!" });

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
      await user.save();

      const frontendBase = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",")[0].trim()
        : "";
      const resetUrl = `${frontendBase}/auth/reset-password/${resetToken}`;

      const message = `
      <h2>Reset Password</h2>
      <p>Click link for reset password (10 minutes):</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
    `;

      try {
        await sendEmail(user.email, "Reset Password", message);
        res.json({ message: "Reset password email sent" });
      } catch (emailErr) {
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();
        return res.status(500).json({ message: "Email sending failed" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error" });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const resetTokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        where: {
          resetPasswordToken: resetTokenHash,
          resetPasswordExpire: { [Op.gt]: Date.now() },
        },
      });

      if (!user)
        return res.status(400).json({ message: "Token invalid or expired" });

      user.password = await hashPassword(password);
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;

      await user.save();

      res.json({ message: "Password successfully reset, please login" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error" });
    }
  },

  resendOtp: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.is_verified)
        return res.status(400).json({ message: "Account already verified" });

      if (user.otp_expire && new Date(user.otp_expire).getTime() > Date.now()) {
        return res.status(429).json({
          message: "OTP already sent. Please wait before requesting again.",
        });
      }

      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

      user.otp_code = hashOtp(otp); // simpan hash
      user.otp_expire = otpExpire;
      await user.save();

      const message = `
      <h2>IDSHOPCASE Account Verification</h2>
      <p>Hello <b>${user.name}</b>,</p>
      <p>Your new OTP code (valid for 10 minutes):</p>
      <h1 style="letter-spacing: 3px;">${otp}</h1>
    `;

      await sendEmail(user.email, "Resend OTP Verification", message);

      res.json({ message: "OTP successfully resent" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error" });
    }
  },
};
