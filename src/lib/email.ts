import { Resend } from "resend";
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from "@/lib/env";

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!resend) {
    resend = new Resend(RESEND_API_KEY);
  }
  return resend;
}

const fromEmail = RESEND_FROM_EMAIL || "onboarding@resend.dev";

/** Send a publishing summary email */
export async function sendPublishSummaryEmail(
  to: string,
  results: { posted: number; failed: number; failures: { platform: string; error: string }[] }
): Promise<void> {
  if (!RESEND_API_KEY) return; // Skip if not configured

  try {
    const client = getResendClient();
    const hasFailures = results.failed > 0;

    const subject = hasFailures
      ? `⚠️ OrbitPost: ${results.posted} posted, ${results.failed} failed`
      : `✅ OrbitPost: ${results.posted} posts published successfully`;

    const failureRows = results.failures
      .map(
        (f) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #2a2a3a;color:#e0d9cc;font-size:14px;">${f.platform}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #2a2a3a;color:#ff6b6b;font-size:14px;">${f.error}</td>
          </tr>`
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0d0d12;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#e0d9cc;font-size:22px;margin:0;">
        <span style="color:#5b5eff;">●</span> OrbitPost
      </h1>
    </div>

    <!-- Card -->
    <div style="background:#16161e;border:1px solid #2a2a3a;border-radius:16px;padding:24px;margin-bottom:24px;">
      <h2 style="color:#e0d9cc;font-size:18px;margin:0 0 16px;">Publishing Report</h2>

      <!-- Stats -->
      <div style="display:flex;gap:12px;margin-bottom:20px;">
        <div style="flex:1;background:#0d0d12;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:#4ade80;font-family:monospace;">${results.posted}</div>
          <div style="font-size:12px;color:#8a8490;margin-top:4px;">Posted</div>
        </div>
        <div style="flex:1;background:#0d0d12;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:${hasFailures ? "#ff6b6b" : "#4ade80"};font-family:monospace;">${results.failed}</div>
          <div style="font-size:12px;color:#8a8490;margin-top:4px;">Failed</div>
        </div>
      </div>

      ${
        hasFailures
          ? `
      <!-- Failure details -->
      <h3 style="color:#ff6b6b;font-size:14px;margin:0 0 8px;">Failures</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#8a8490;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #2a2a3a;">Platform</th>
            <th style="padding:8px 12px;text-align:left;font-size:11px;color:#8a8490;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #2a2a3a;">Error</th>
          </tr>
        </thead>
        <tbody>${failureRows}</tbody>
      </table>`
          : ""
      }
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:12px;color:#8a8490;margin:0;">
      OrbitPost — AI-powered social media scheduling
    </p>
  </div>
</body>
</html>`;

    await client.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("[Resend] Failed to send email:", error);
    // Don't throw — email failure shouldn't break the publish pipeline
  }
}

/** Send a single failure alert email */
export async function sendFailureAlertEmail(
  to: string,
  platform: string,
  postContent: string,
  errorMessage: string
): Promise<void> {
  if (!RESEND_API_KEY) return;

  try {
    const client = getResendClient();

    await client.emails.send({
      from: fromEmail,
      to,
      subject: `❌ OrbitPost: Failed to publish to ${platform}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0d0d12;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#e0d9cc;font-size:22px;margin:0;">
        <span style="color:#5b5eff;">●</span> OrbitPost
      </h1>
    </div>
    <div style="background:#16161e;border:1px solid #2a2a3a;border-radius:16px;padding:24px;">
      <h2 style="color:#ff6b6b;font-size:16px;margin:0 0 12px;">⚠️ Publishing Failed</h2>
      <p style="color:#8a8490;font-size:13px;margin:0 0 16px;">
        A post to <strong style="color:#e0d9cc;">${platform}</strong> could not be published:
      </p>
      <div style="background:#0d0d12;border-radius:8px;padding:12px;margin-bottom:16px;">
        <p style="color:#e0d9cc;font-size:14px;margin:0;line-height:1.5;">${postContent.substring(0, 200)}${postContent.length > 200 ? "…" : ""}</p>
      </div>
      <div style="background:#ff6b6b10;border:1px solid #ff6b6b30;border-radius:8px;padding:12px;">
        <p style="color:#ff6b6b;font-size:13px;margin:0;"><strong>Error:</strong> ${errorMessage}</p>
      </div>
    </div>
    <p style="text-align:center;font-size:12px;color:#8a8490;margin:24px 0 0;">
      OrbitPost — AI-powered social media scheduling
    </p>
  </div>
</body>
</html>`,
    });
  } catch (error) {
    console.error("[Resend] Failed to send failure alert:", error);
  }
}
