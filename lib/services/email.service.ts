import { sendEmail } from "@/lib/resend";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BETTER_AUTH_URL ||
  "http://localhost:3000";

export async function sendContentSubmittedEmail(
  clientEmail: string,
  contentTitle: string,
  _clientId: string
): Promise<void> {
  const approvalLink = `${BASE_URL}/client/content`; // Scoped to client portal
  await sendEmail({
    to: clientEmail,
    subject: `Contour: New Content Pending Approval — ${contentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #0f172a;">New Content Ready for Approval</h2>
        <p>Hello,</p>
        <p>A new piece of content has been drafted and is ready for your review: <strong>"${contentTitle}"</strong>.</p>
        <p>Please review and approve or request changes using the button below:</p>
        <div style="margin: 24px 0;">
          <a href="${approvalLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Review Content</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">If the button above does not work, copy and paste this link into your browser: <br/> <a href="${approvalLink}">${approvalLink}</a></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px;">This is an automated notification from Contour. Please do not reply directly to this email.</p>
      </div>
    `,
  });
}

export async function sendContentApprovedEmail(
  adminEmail: string,
  contentTitle: string
): Promise<void> {
  const contentLink = `${BASE_URL}/admin/content`; // Scoped to admin panel
  await sendEmail({
    to: adminEmail,
    subject: `Contour: Content Approved — ${contentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #10b981;">Content Approved</h2>
        <p>Hello Admin,</p>
        <p>The client has approved the content: <strong>"${contentTitle}"</strong>.</p>
        <p>You can now schedule or post this item.</p>
        <div style="margin: 24px 0;">
          <a href="${contentLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View in Dashboard</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px;">This is an automated notification from Contour.</p>
      </div>
    `,
  });
}

export async function sendContentRejectedEmail(
  adminEmail: string,
  contentTitle: string,
  reason: string
): Promise<void> {
  const contentLink = `${BASE_URL}/admin/content`;
  await sendEmail({
    to: adminEmail,
    subject: `Contour: Content Rejected — ${contentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #ef4444;">Content Rejected</h2>
        <p>Hello Admin,</p>
        <p>The client has rejected the content: <strong>"${contentTitle}"</strong>.</p>
        <p><strong>Reason / Comment:</strong></p>
        <blockquote style="border-left: 4px solid #ef4444; padding-left: 16px; margin: 16px 0; color: #475569; font-style: italic;">
          ${reason}
        </blockquote>
        <div style="margin: 24px 0;">
          <a href="${contentLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Content</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px;">This is an automated notification from Contour.</p>
      </div>
    `,
  });
}

export async function sendChangesRequestedEmail(
  adminEmail: string,
  contentTitle: string,
  feedback: string
): Promise<void> {
  const contentLink = `${BASE_URL}/admin/content`;
  await sendEmail({
    to: adminEmail,
    subject: `Contour: Changes Requested — ${contentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #f59e0b;">Changes Requested</h2>
        <p>Hello Admin,</p>
        <p>The client has requested changes for: <strong>"${contentTitle}"</strong>.</p>
        <p><strong>Feedback:</strong></p>
        <blockquote style="border-left: 4px solid #f59e0b; padding-left: 16px; margin: 16px 0; color: #475569; font-style: italic;">
          ${feedback}
        </blockquote>
        <div style="margin: 24px 0;">
          <a href="${contentLink}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Content</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px;">This is an automated notification from Contour.</p>
      </div>
    `,
  });
}
