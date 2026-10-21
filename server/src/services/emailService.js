
const nodemailer = require("nodemailer");
const { Resend } = require("resend");

const isProduction = process.env.NODE_ENV === "production";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function sendEmail({ to, subject, text, html, attachments }) {
  if (isProduction) {
    if (!resend) {
      throw new Error("RESEND_API_KEY is missing");
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!fromEmail) {
      throw new Error("RESEND_FROM_EMAIL is missing");
    }

    const result = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {}),
      ...(attachments?.length ? { attachments } : {}),
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error("Gmail SMTP credentials are missing");
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
  if (isProduction) {
    console.log(
      resend
        ? "Resend API configured"
        : "RESEND_API_KEY is missing"
    );
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error("Gmail SMTP configuration missing");
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