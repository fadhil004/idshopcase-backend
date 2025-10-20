const nodemailer = require("nodemailer");
const sendEmail = require("../../utils/sendEmail");

jest.mock("nodemailer");

describe("sendEmail utility", () => {
  let mockSendMail;

  beforeEach(() => {
    mockSendMail = jest.fn().mockResolvedValue("Email sent");
    nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

    process.env.EMAIL_USER = "test@example.com";
    process.env.EMAIL_PASS = "password123";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should send email successfully", async () => {
    await sendEmail("user@test.com", "Subject", "<p>Hello</p>");

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    expect(mockSendMail).toHaveBeenCalledWith({
      from: { name: "Idshopcase", address: process.env.EMAIL_USER },
      to: "user@test.com",
      subject: "Subject",
      html: "<p>Hello</p>",
    });
  });

  test("should throw error when sendMail fails", async () => {
    const error = new Error("SMTP Error");
    mockSendMail.mockRejectedValueOnce(error);

    await expect(
      sendEmail("user@test.com", "Subject", "<p>Hi</p>")
    ).rejects.toThrow("SMTP Error");
  });
});