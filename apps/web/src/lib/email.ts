import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "";
const API_KEY = process.env.RESEND_API_KEY || "";

if (!API_KEY) {
  console.warn("[email] RESEND_API_KEY is not set");
}

function sanitize(input: string, maxLen = 256): string {
  const s = (input ?? "").toString().replace(/[\r\n]/g, "").slice(0, maxLen);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getResend() {
  if (!API_KEY) throw new Error("Missing RESEND_API_KEY");
  return new Resend(API_KEY);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const resend = getResend();
  const to = sanitize(opts.to, 320).trim();
  if (!to) throw new Error("Invalid recipient email address");

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error("Failed to send email");
  }

  return { id: data?.id };
}
