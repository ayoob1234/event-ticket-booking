
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

async function sendEmail({ to, subject, text, html, attachments }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error(
      "Gmail SMTP credentials are missing. Check EMAIL_USER and EMAIL_APP_PASSWORD."
    );
  }

  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "Evently"}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
    ...(attachments?.length ? { attachments } : {}),
  });
}

async function verifyEmailConnection() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error(
      "Gmail SMTP configuration missing. Check EMAIL_USER and EMAIL_APP_PASSWORD."
    );
    return;
  }

  try {
    await transporter.verify();
    console.log("Gmail SMTP connected successfully");
  } catch (error) {
    console.error("Gmail SMTP connection failed:", error.message);
  }
}

module.exports = {
  sendEmail,
  verifyEmailConnection,
};
