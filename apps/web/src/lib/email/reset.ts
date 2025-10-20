import { sendEmail } from "@/lib/email";

function sanitize(input: string, maxLen = 1024): string {
  return (input ?? "")
    .toString()
    .replace(/[\r\n]/g, "")
    .slice(0, maxLen)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function resetPasswordHtml(resetUrl: string, minutesLeft: number) {
  const safeUrl = sanitize(resetUrl);
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
      <h2 style="color:black;">Reset your password</h2>
      <p style="color:black;">We received a request to reset your password.</p>
      <p style="color:black;">This link will expire in <strong>${minutesLeft} minutes</strong>.</p>
      <a href="${safeUrl}" target="_blank" 
         style="display:inline-block;margin-top:16px;padding:10px 16px;
                background:#10B981;color:#fff;text-decoration:none;border-radius:8px;">
         Reset Password
      </a>
      <p style="color:#6B7280;font-size:13px;margin-top:24px;">If you didn’t request this, ignore this email.</p>
    </div>
  `;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  expiresAt: Date
) {
  const minutesLeft = Math.max(
    1,
    Math.round((expiresAt.getTime() - Date.now()) / 60000)
  );

  return sendEmail({
    to,
    subject: "Reset your password",
    html: resetPasswordHtml(resetUrl, minutesLeft),
    text: `Reset your password using this link (expires in ${minutesLeft} minutes): ${resetUrl}`,
  });
}
