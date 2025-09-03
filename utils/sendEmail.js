const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Data email
    const mailOptions = {
      from: {
        name: "Idshopcase",
        address: process.env.EMAIL_USER,
      },
      to,
      subject,
      html,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error("Fail send Email:", err);
    throw err;
  }
};

module.exports = sendEmail;
