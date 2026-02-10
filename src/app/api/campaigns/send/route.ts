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

// Rewrite links for click tracking
function rewriteLinksForTracking(html: string, trackingId: string, baseUrl: string): string {
  // Match all href attributes with http/https URLs
  const linkRegex = /href="(https?:\/\/[^"]+)"/gi;
  
  return html.replace(linkRegex, (match, url) => {
    // Don't track unsubscribe links or mailto
    if (url.includes("unsubscribe") || url.startsWith("mailto:")) {
      return match;
    }
    const trackingUrl = `${baseUrl}/api/track/click?id=${trackingId}&url=${encodeURIComponent(url)}`;
    return `href="${trackingUrl}"`;
  });
}

// Verify email before sending (using NeverBounce/Clearout)
async function verifyEmail(email: string): Promise<{ valid: boolean; status: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    
    if (!res.ok) {
      return { valid: true, status: "unknown" }; // Assume valid if verification fails
    }
    
    const data = await res.json();
    return { valid: data.valid, status: data.status };
  } catch {
    return { valid: true, status: "unknown" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      campaign_id, 
      contact_ids, 
      verify_emails = true,
      schedule_send_at = null, // ISO timestamp for scheduled sends
    } = await request.json();

    if (!campaign_id || !contact_ids || contact_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing campaign_id or contact_ids" },
        { status: 400 }
      );
    }

    // Get campaign and its settings
    const { data: campaign } = await supabase
      .from("lp_campaigns")
      .select("*, settings")
      .eq("id", campaign_id)
      .single();

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get first step
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

    // Check if this is a scheduled send
    if (schedule_send_at) {
      const scheduleTime = new Date(schedule_send_at);
      
      // Create campaign_contacts entries with scheduled time
      for (const contact of contacts) {
        // Check if already in campaign
        const { data: existing } = await supabase
          .from("lp_campaign_contacts")
          .select("id")
          .eq("campaign_id", campaign_id)
          .eq("contact_id", contact.id)
          .single();

        if (!existing) {
          await supabase.from("lp_campaign_contacts").insert([{
            campaign_id,
            contact_id: contact.id,
            status: "pending",
            current_step: 0,
            next_send_at: scheduleTime.toISOString(),
          }]);
        }
      }

      // Activate campaign
      await supabase
        .from("lp_campaigns")
        .update({ status: "active" })
        .eq("id", campaign_id);

      return NextResponse.json({
        success: true,
        scheduled: true,
        scheduled_at: schedule_send_at,
        contacts_queued: contacts.length,
        message: "Emails scheduled. They will be sent by the cron job.",
      });
    }

    let sentCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const verificationResults: { email: string; status: string }[] = [];

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    for (const contact of contacts) {
      // Verify email if enabled and not already verified
      if (verify_emails && !contact.email_verified) {
        const verifyResult = await verifyEmail(contact.email);
        verificationResults.push({ email: contact.email, status: verifyResult.status });

        // Update contact verification status
        await supabase
          .from("lp_contacts")
          .update({
            email_verified: verifyResult.valid,
            email_verification_status: verifyResult.status,
          })
          .eq("id", contact.id);

        // Skip invalid emails
        if (!verifyResult.valid) {
          skippedCount++;
          errors.push(`${contact.email}: Skipped (${verifyResult.status})`);
          continue;
        }
      } else if (contact.email_verification_status === "invalid" || 
                 contact.email_verification_status === "disposable") {
        // Already known to be invalid
        skippedCount++;
        continue;
      }

      const subject = personalize(firstStep.subject, contact);
      const body = personalize(firstStep.body, contact);

      // Generate tracking pixel URL
      const trackingId = crypto.randomUUID();
      const trackingPixel = `${baseUrl}/api/track/open?id=${trackingId}`;

      // Add tracking pixel to HTML body
      let htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
          ${body.split("\n").map((line) => `<p style="margin: 0 0 10px 0;">${line}</p>`).join("")}
          <img src="${trackingPixel}" width="1" height="1" style="display:none;" alt="" />
        </div>
      `;

      // Rewrite links for click tracking
      htmlBody = rewriteLinksForTracking(htmlBody, trackingId, baseUrl);

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
              sequence_step: 1,
              message_id: result.id,
            }]);

            // Add to campaign_contacts for sequence tracking
            const { data: existing } = await supabase
              .from("lp_campaign_contacts")
              .select("id")
              .eq("campaign_id", campaign_id)
              .eq("contact_id", contact.id)
              .single();

            if (!existing) {
              // Check for step 2
              const { data: nextStep } = await supabase
                .from("lp_sequence_steps")
                .select("delay_days, delay_hours")
                .eq("campaign_id", campaign_id)
                .eq("step_number", 2)
                .single();

              const nextSendAt = nextStep 
                ? new Date(Date.now() + ((nextStep.delay_days || 0) * 24 * 60 + (nextStep.delay_hours || 0) * 60) * 60 * 1000).toISOString()
                : null;

              await supabase.from("lp_campaign_contacts").insert([{
                campaign_id,
                contact_id: contact.id,
                status: nextStep ? "in_progress" : "completed",
                current_step: 1,
                next_send_at: nextSendAt,
                completed_at: nextStep ? null : new Date().toISOString(),
              }]);
            }

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
          sequence_step: 1,
        }]);

        // Add to campaign_contacts
        const { data: existing } = await supabase
          .from("lp_campaign_contacts")
          .select("id")
          .eq("campaign_id", campaign_id)
          .eq("contact_id", contact.id)
          .single();

        if (!existing) {
          const { data: nextStep } = await supabase
            .from("lp_sequence_steps")
            .select("delay_days, delay_hours")
            .eq("campaign_id", campaign_id)
            .eq("step_number", 2)
            .single();

          const nextSendAt = nextStep 
            ? new Date(Date.now() + ((nextStep.delay_days || 0) * 24 * 60 + (nextStep.delay_hours || 0) * 60) * 60 * 1000).toISOString()
            : null;

          await supabase.from("lp_campaign_contacts").insert([{
            campaign_id,
            contact_id: contact.id,
            status: nextStep ? "in_progress" : "completed",
            current_step: 1,
            next_send_at: nextSendAt,
          }]);
        }

        await supabase
          .from("lp_contacts")
          .update({ status: "contacted" })
          .eq("id", contact.id);

        sentCount++;
      }

      // Rate limit between sends
      await new Promise((r) => setTimeout(r, 100));
    }

    // Activate campaign
    await supabase
      .from("lp_campaigns")
      .update({ status: "active" })
      .eq("id", campaign_id);

    return NextResponse.json({
      success: true,
      sent: sentCount,
      skipped: skippedCount,
      total: contacts.length,
      errors: errors.length > 0 ? errors : undefined,
      verification: verificationResults.length > 0 ? verificationResults : undefined,
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
