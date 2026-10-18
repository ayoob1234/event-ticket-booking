
async function sendEmail({ to, subject, text, html, attachments }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing from environment variables");
  }

  if (!from) {
    throw new Error("EMAIL_FROM is missing from environment variables");
  }

  const email = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
  };

  if (attachments?.length) {
    email.attachments = attachments.map((file) => {
      if (file.content) {
        return {
          filename: file.filename,
          content: Buffer.isBuffer(file.content)
            ? file.content.toString("base64")
            : file.content,
        };
      }

      throw new Error(
        "Resend attachments need file content or base64 data"
      );
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(email),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Resend API error:", response.status, result);
    throw new Error(
      result.message || `Resend request failed: ${response.status}`
    );
  }

  console.log("Email accepted by Resend:", result.id);
  return result;
}

async function verifyEmailConnection() {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.error(
      "Resend email configuration missing: check RESEND_API_KEY and EMAIL_FROM"
    );
    return;
  }

  console.log("Resend email configuration found");
}

module.exports = { sendEmail, verifyEmailConnection };
