import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<void> {
  try {
    const toArray = Array.isArray(to) ? to : [to];
    
    // In local development or if API key is dummy, skip actual API call
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("dummy")) {
      console.log(`✉️ [Email Sandbox] Skipping actual Resend call. Details:`);
      console.log(`  To: ${toArray.join(", ")}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Body length: ${html.length} chars`);
      return;
    }

    const { error } = await resend.emails.send({
      from: "Contour <noreply@contour.com>", // Can be configured with custom domain later
      to: toArray,
      subject,
      html,
    });

    if (error) {
      console.error("✉️ [Resend] Failed to send email via API:", error);
    }
  } catch (error) {
    // We swallow errors so email failures don't block parent operations
    console.error("✉️ [Resend] Unexpected error while sending email:", error);
  }
}
