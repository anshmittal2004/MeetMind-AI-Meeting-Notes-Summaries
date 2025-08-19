
import nodemailer from "nodemailer";

export async function sendSummaryEmail({ to, subject, summary }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  if (!SMTP_HOST) throw new Error("SMTP not configured");

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const info = await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to,
    subject: subject || "Meeting Summary",
    html: `<div style="font-family:sans-serif;white-space:pre-wrap">${summary}</div>`
  });
  return info.messageId;
}
