
async function sendEmail({ to, subject, text, html }) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  const secret = process.env.GOOGLE_SCRIPT_SECRET;

  if (!scriptUrl || !secret) {
    throw new Error("Google Apps Script email configuration is missing");
  }

  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret,
      to,
      subject,
      text: text || "",
      html: html || "",
    }),
    redirect: "follow",
  });

  const responseText = await response.text();

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error("Google Apps Script returned an invalid response");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Email could not be sent");
  }

  return result;
}

async function verifyEmailConnection() {
  if (!process.env.GOOGLE_SCRIPT_URL || !process.env.GOOGLE_SCRIPT_SECRET) {
    console.error("Google Apps Script email configuration missing");
    return;
  }

  console.log("Google Apps Script email configuration detected");
}

module.exports = {
  sendEmail,
  verifyEmailConnection,
};
