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
        <!doctype html>
        <meta charset="utf-8">
        <div style="text-align: center; font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 30px; border-radius: 16px; max-width: 500px; margin: 0 auto; box-shadow: 0 8px 25px rgba(33, 150, 243, 0.15);">
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #1565c0; margin-bottom: 10px; font-size: 26px;">🔐 Verification Required</h2>
        <p style="color: #424242; margin-bottom: 20px; font-size: 18px; line-height: 1.5;">Your verification code for <strong style="color: #1976d2;">${safeApp}</strong> is:</p>
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
        </div>`;
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
