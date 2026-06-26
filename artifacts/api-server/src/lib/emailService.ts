import { Resend } from "resend";
import { logger } from "./logger";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendLeadNotificationEmail(opts: {
  toProfessionalEmail: string;
  businessName: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string | null;
  zipCode: string;
  diagnosisTitle?: string | null;
  leadScore: number;
  leadId: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.warn("RESEND_API_KEY not set — skipping lead notification email");
    return;
  }

  const fromEmail = process.env.EMAIL_FROM ?? "LawnRX <noreply@lawn-rx.replit.app>";
  const portalUrl = process.env.PARTNERS_PORTAL_URL ?? "https://lawn-rx.replit.app/partners";

  const scoreColor = opts.leadScore >= 80 ? "#059669" : opts.leadScore >= 60 ? "#d97706" : "#6b7280";

  try {
    await resend.emails.send({
      from: fromEmail,
      to: opts.toProfessionalEmail,
      subject: `🌿 New Lead: ${opts.leadName} (${opts.zipCode}) — Score ${opts.leadScore}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:#059669;padding:24px 28px">
      <p style="margin:0;color:#fff;font-size:1.25rem;font-weight:700">🌿 New Lead from LawnRX</p>
      <p style="margin:4px 0 0;color:#d1fae5;font-size:.9rem">Hello, ${opts.businessName}</p>
    </div>
    <div style="padding:28px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:.875rem">Homeowner</td><td style="padding:8px 0;font-weight:600">${opts.leadName}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:.875rem">Email</td><td style="padding:8px 0"><a href="mailto:${opts.leadEmail}" style="color:#059669">${opts.leadEmail}</a></td></tr>
        ${opts.leadPhone ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:.875rem">Phone</td><td style="padding:8px 0">${opts.leadPhone}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#6b7280;font-size:.875rem">ZIP Code</td><td style="padding:8px 0">${opts.zipCode}</td></tr>
        ${opts.diagnosisTitle ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:.875rem">Lawn Issue</td><td style="padding:8px 0">${opts.diagnosisTitle}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#6b7280;font-size:.875rem">Lead Score</td><td style="padding:8px 0"><span style="background:${scoreColor};color:#fff;font-weight:700;padding:2px 10px;border-radius:20px;font-size:.875rem">${opts.leadScore}/100</span></td></tr>
      </table>
      <div style="margin-top:24px;text-align:center">
        <a href="${portalUrl}/leads/${opts.leadId}" style="display:inline-block;background:#059669;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
          View &amp; Manage Lead
        </a>
      </div>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #f3f4f6;text-align:center">
      <p style="margin:0;color:#9ca3af;font-size:.75rem">LawnRX Partner Network · <a href="${portalUrl}" style="color:#059669">Partners Portal</a></p>
    </div>
  </div>
</body>
</html>`,
    });
    logger.info({ leadId: opts.leadId, to: opts.toProfessionalEmail }, "Lead notification email sent");
  } catch (err) {
    logger.error({ err, leadId: opts.leadId }, "Failed to send lead notification email");
  }
}

export async function sendLeadConfirmationEmail(opts: {
  toHomeownerEmail: string;
  homeownerName: string;
  businessName: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const fromEmail = process.env.EMAIL_FROM ?? "LawnRX <noreply@lawn-rx.replit.app>";

  try {
    await resend.emails.send({
      from: fromEmail,
      to: opts.toHomeownerEmail,
      subject: "Your LawnRX Pro referral has been sent!",
      html: `
<!DOCTYPE html>
<html lang="en">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:#059669;padding:24px 28px">
      <p style="margin:0;color:#fff;font-size:1.25rem;font-weight:700">🌿 LawnRX</p>
    </div>
    <div style="padding:28px">
      <p style="color:#111827;font-size:1rem">Hi ${opts.homeownerName},</p>
      <p style="color:#374151">Your request has been sent to <strong>${opts.businessName}</strong>. They'll be in touch soon to discuss your lawn care needs.</p>
      <p style="color:#374151">In the meantime, keep checking the LawnRX app for more tips and AI diagnosis features.</p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #f3f4f6;text-align:center">
      <p style="margin:0;color:#9ca3af;font-size:.75rem">LawnRX &mdash; AI-Powered Lawn Care</p>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (err) {
    logger.error({ err }, "Failed to send lead confirmation email");
  }
}
