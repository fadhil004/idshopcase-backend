const { User } = require("../models");
const { Op } = require("sequelize");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { hashPassword, comparePassword } = require("../utils/hash");
const sendEmail = require("../utils/sendEmail");

module.exports = {
  register: async (req, res) => {
    try {
      const { name, email, phone, password } = req.body;
      const existEmail = await User.findOne({ where: { email } });
      if (existEmail)
        return res.status(400).json({ message: "Email already used" });

      const existPhone = await User.findOne({ where: { phone } });
      if (existPhone)
        return res.status(400).json({ message: "Phone already used" });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

      const hashed = await hashPassword(password);
      const user = await User.create({
        name,
        email,
        phone,
        password: hashed,
        otp_code: otp,
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
      return res.status(500).json({ error: err.message });
    }
  },

  verifyOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.is_verified)
        return res.status(400).json({ message: "Account has been verified" });

      if (
        user.otp_code !== otp ||
        new Date(user.otp_expire).getTime() < Date.now()
      ) {
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
      return res.status(500).json({ error: err.message });
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

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );

      return res.json({ message: "Login success", token });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: "User not found!" });

      // Generate unique token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Save hash token in DB + expired
      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
      await user.save();

      // Link reset password
      const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;

      const message = `
      <h2>Reset Password</h2>
      <p>Click link for reset password (10 minutes):</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
    `;

      // Send Email
      try {
        await sendEmail(user.email, "Reset Password", message);
        res.json({ message: "Reset password email sent" });
      } catch (emailErr) {
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();
        return res
          .status(500)
          .json({ message: "Email sending failed", error: emailErr.message });
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

      // Hash new password
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
};
