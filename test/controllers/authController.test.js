const authController = require("../../controllers/authController");

jest.mock("../../models", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../utils/hash", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock("../../utils/sendEmail");

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

const crypto = require("crypto");
const { User } = require("../../models");
const { hashPassword, comparePassword } = require("../../utils/hash");
const sendEmail = require("../../utils/sendEmail");
const jwt = require("jsonwebtoken");

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("authController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register user successfully", async () => {
      const req = {
        body: { name: "Fadhil", email: "test@example.com", password: "123456" },
      };
      const res = mockResponse();

      User.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashed_pw");
      User.create.mockResolvedValue({
        toJSON: () => ({
          id: 1,
          name: "Fadhil",
          email: "test@example.com",
          password: "hashed_pw",
        }),
      });

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User registered",
        })
      );
    });

    it("should return 400 if email already used", async () => {
      const req = {
        body: { name: "Test", email: "test@example.com", password: "123" },
      };
      const res = mockResponse();

      User.findOne.mockResolvedValue({ id: 1 });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Email already used" });
    });

    it("should return 500 on server error", async () => {
      const req = { body: { email: "a@a.com", password: "123" } };
      const res = mockResponse();
      User.findOne.mockRejectedValue(new Error("DB error"));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
    });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      const req = { body: { email: "test@example.com", password: "123456" } };
      const res = mockResponse();

      const user = {
        id: 1,
        email: "test@example.com",
        password: "hashed_pw",
        role: "user",
      };

      User.findOne.mockResolvedValue(user);
      comparePassword.mockResolvedValue(true);
      jwt.sign.mockReturnValue("fake_jwt_token");

      await authController.login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(comparePassword).toHaveBeenCalledWith("123456", "hashed_pw");
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login success",
          token: "fake_jwt_token",
        })
      );
    });

    it("should return 404 if user not found", async () => {
      const req = { body: { email: "none@example.com", password: "123" } };
      const res = mockResponse();

      User.findOne.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should return 400 if password mismatch", async () => {
      const req = { body: { email: "test@example.com", password: "wrong" } };
      const res = mockResponse();

      User.findOne.mockResolvedValue({ password: "hashed_pw" });
      comparePassword.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Wrong password" });
    });

    it("should handle server error", async () => {
      const req = { body: { email: "test@example.com", password: "123" } };
      const res = mockResponse();

      User.findOne.mockRejectedValue(new Error("DB error"));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
    });
  });

  describe("forgotPassword", () => {
    it("should send reset email successfully", async () => {
      process.env.FRONTEND_URL = "http://localhost:3000";

      const req = { body: { email: "user@example.com" } };
      const res = mockResponse();

      const user = {
        email: "user@example.com",
        save: jest.fn(),
      };

      User.findOne.mockResolvedValue(user);
      sendEmail.mockResolvedValue();

      await authController.forgotPassword(req, res);

      expect(user.save).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Reset password email sent",
      });
    });

    it("should return 404 if user not found", async () => {
      const req = { body: { email: "none@example.com" } };
      const res = mockResponse();

      User.findOne.mockResolvedValue(null);

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found!" });
    });

    it("should return 500 if email sending fails", async () => {
      const req = { body: { email: "user@example.com" } };
      const res = mockResponse();

      const user = {
        email: "user@example.com",
        save: jest.fn(),
      };

      User.findOne.mockResolvedValue(user);
      sendEmail.mockRejectedValue(new Error("Email failed"));

      await authController.forgotPassword(req, res);

      expect(user.save).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Email sending failed",
        })
      );
    });
    it("should handle email sending failure in forgotPassword", async () => {
      const mockUser = {
        email: "fail@test.com",
        resetPasswordToken: "hash",
        resetPasswordExpire: Date.now() + 10000,
        save: jest.fn().mockResolvedValue(),
      };

      // Mock User.findOne → return user
      User.findOne.mockResolvedValue(mockUser);

      // Mock sendEmail → lempar error
      sendEmail.mockRejectedValueOnce(new Error("SMTP connection failed"));

      const req = { body: { email: "fail@test.com" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await authController.forgotPassword(req, res);

      expect(sendEmail).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalledTimes(2); // sekali sebelum kirim, sekali saat gagal
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email sending failed",
        error: "SMTP connection failed",
      });
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const token = "validtoken";
      const req = { params: { token }, body: { password: "newpass" } };
      const res = mockResponse();

      const user = { save: jest.fn() };
      User.findOne.mockResolvedValue(user);
      hashPassword.mockResolvedValue("hashed_newpass");

      await authController.resetPassword(req, res);

      expect(user.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Password successfully reset, please login",
      });
    });

    it("should return 400 if token invalid or expired", async () => {
      const req = { params: { token: "invalid" }, body: { password: "pass" } };
      const res = mockResponse();

      User.findOne.mockResolvedValue(null);

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Token invalid or expired",
      });
    });

    it("should handle server error", async () => {
      const req = { params: { token: "any" }, body: { password: "pass" } };
      const res = mockResponse();

      User.findOne.mockRejectedValue(new Error("DB error"));

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server Error" });
    });
    it("should handle unexpected server error in forgotPassword", async () => {
      const req = { body: { email: "boom@example.com" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Simulasi error database, agar langsung masuk ke outer catch
      User.findOne.mockRejectedValueOnce(new Error("Unexpected DB failure"));

      // Jalankan controller
      await authController.forgotPassword(req, res);

      // ✅ Verifikasi blok outer catch terpanggil
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server Error" });
    });
  });
});
