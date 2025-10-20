import { sendEmail } from "@/lib/email";

export const CODE_TIME = 2; // minutes

function sanitize(input: string, maxLen = 6): string {
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

export function verificationHtml(code: string, expiresInMinutes = CODE_TIME) {
  const safeCode = sanitize(code, 6);
  const safeApp = "Auth App (Demo)";

    return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
      <h2 style="color:black;">Verification</h2>
      <p style="color:black;">Your verification code for ${safeApp} is:</p>
      <p style="font-size:42px;font-weight:800;color:#0d47a1;letter-spacing:6px;margin:6px 0 0;text-align:center;text-shadow:1px 1px 2px rgba(255,255,255,0.7);">
        ${safeCode}
      </p>
     
      <div style="background:#e1f5fe;padding:16px;border-radius:10px;margin-top:22px;border-left:4px solid #4fc3f7;text-align:center;">
        <p style="margin:0 0 6px;font-weight:600;color:#0d0d0d;font-size:15px;">
          Do not share this code with anyone
        </p>
        <p style="margin:0;color:#0d0d0d;font-size:13px;">
          This code will expire in ${expiresInMinutes} minutes
        </p>
      </div>
    </div>
  `;
}

export async function sendVerificationEmail(to: string, code: string) {
  const html = verificationHtml(code, CODE_TIME);
  return sendEmail({
    to,
    subject: "Your verification code",
    html,
    text: `Your verification code is: ${code} (expires in ${CODE_TIME} minutes)`,
  });
}
