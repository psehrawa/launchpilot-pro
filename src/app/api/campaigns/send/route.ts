import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Personalize email content with contact data
function personalize(template: string, contact: any): string {
  return template
    .replace(/\{\{first_name\}\}/g, contact.first_name || "there")
    .replace(/\{\{last_name\}\}/g, contact.last_name || "")
    .replace(/\{\{company\}\}/g, contact.company || "your company")
    .replace(/\{\{title\}\}/g, contact.title || "")
    .replace(/\{\{email\}\}/g, contact.email || "");
}

export async function POST(request: NextRequest) {
  try {
    const { campaign_id, contact_ids } = await request.json();

    if (!campaign_id || !contact_ids || contact_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing campaign_id or contact_ids" },
        { status: 400 }
      );
    }

    // Get campaign and first step
    const { data: steps } = await supabase
      .from("lp_sequence_steps")
      .select("*")
      .eq("campaign_id", campaign_id)
      .order("step_number", { ascending: true })
      .limit(1);

    if (!steps || steps.length === 0) {
      return NextResponse.json(
        { success: false, error: "No email steps in campaign" },
        { status: 400 }
      );
    }

    const firstStep = steps[0];

    // Get contacts
    const { data: contacts } = await supabase
      .from("lp_contacts")
      .select("*")
      .in("id", contact_ids);

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No contacts found" },
        { status: 400 }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    // Check if Resend API key is configured
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

    for (const contact of contacts) {
      const subject = personalize(firstStep.subject, contact);
      const body = personalize(firstStep.body, contact);

      // Generate tracking pixel URL
      const trackingId = crypto.randomUUID();
      const trackingPixel = `${process.env.NEXT_PUBLIC_APP_URL}/api/track/open?id=${trackingId}`;

      // Add tracking pixel to HTML body
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
          ${body.split("\n").map((line) => `<p style="margin: 0 0 10px 0;">${line}</p>`).join("")}
          <img src="${trackingPixel}" width="1" height="1" style="display:none;" alt="" />
        </div>
      `;

      if (resendKey) {
        // Send via Resend
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [contact.email],
              subject: subject,
              html: htmlBody,
            }),
          });

          const result = await res.json();

          if (result.id) {
            // Log email sent
            await supabase.from("lp_emails_sent").insert([{
              campaign_id: campaign_id,
              contact_id: contact.id,
              subject: subject,
              status: "sent",
              tracking_id: trackingId,
            }]);

            // Update contact status
            await supabase
              .from("lp_contacts")
              .update({ status: "contacted" })
              .eq("id", contact.id);

            sentCount++;
          } else {
            errors.push(`${contact.email}: ${result.message || "Failed"}`);
          }
        } catch (err: any) {
          errors.push(`${contact.email}: ${err.message}`);
        }
      } else {
        // Demo mode - just log without sending
        await supabase.from("lp_emails_sent").insert([{
          campaign_id: campaign_id,
          contact_id: contact.id,
          subject: subject,
          status: "demo",
          tracking_id: trackingId,
        }]);

        await supabase
          .from("lp_contacts")
          .update({ status: "contacted" })
          .eq("id", contact.id);

        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: contacts.length,
      errors: errors.length > 0 ? errors : undefined,
      demo: !resendKey,
    });
  } catch (error: any) {
    console.error("Send error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
