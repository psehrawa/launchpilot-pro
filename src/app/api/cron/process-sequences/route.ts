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

export async function GET(request: NextRequest) {
  // Verify cron secret for Vercel
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow local dev
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date().toISOString();
    
    // Find campaign_contacts that need processing:
    // - Status is 'in_progress' (active in sequence)
    // - next_send_at <= now
    // - Contact hasn't replied
    const { data: pendingContacts, error: fetchError } = await supabase
      .from("lp_campaign_contacts")
      .select(`
        id,
        campaign_id,
        contact_id,
        current_step,
        status,
        contact:lp_contacts!inner(
          id,
          email,
          first_name,
          last_name,
          company,
          title,
          status,
          email_verified,
          email_verification_status
        ),
        campaign:lp_campaigns!inner(
          id,
          name,
          status,
          settings
        )
      `)
      .eq("status", "in_progress")
      .lte("next_send_at", now);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!pendingContacts || pendingContacts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No pending sequences to process",
        processed: 0 
      });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let processed = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (const cc of pendingContacts) {
      const contact = cc.contact as any;
      const campaign = cc.campaign as any;

      // Skip if campaign is not active
      if (campaign.status !== "active") {
        skipped++;
        continue;
      }

      // Skip if contact replied (check their main status)
      if (contact.status === "replied") {
        // Mark campaign_contact as completed
        await supabase
          .from("lp_campaign_contacts")
          .update({ status: "completed", completed_at: now })
          .eq("id", cc.id);
        skipped++;
        continue;
      }

      // Skip invalid emails
      if (contact.email_verification_status === "invalid" || 
          contact.email_verification_status === "disposable") {
        await supabase
          .from("lp_campaign_contacts")
          .update({ status: "bounced" })
          .eq("id", cc.id);
        skipped++;
        continue;
      }

      // Get next step for this contact
      const nextStepNumber = (cc.current_step || 0) + 1;
      
      const { data: nextStep } = await supabase
        .from("lp_sequence_steps")
        .select("*")
        .eq("campaign_id", cc.campaign_id)
        .eq("step_number", nextStepNumber)
        .single();

      if (!nextStep) {
        // No more steps - mark as completed
        await supabase
          .from("lp_campaign_contacts")
          .update({ status: "completed", completed_at: now })
          .eq("id", cc.id);
        processed++;
        continue;
      }

      // Personalize email
      const subject = personalize(nextStep.subject, contact);
      let body = personalize(nextStep.body, contact);

      // Generate tracking ID
      const trackingId = crypto.randomUUID();
      const trackingPixel = `${baseUrl}/api/track/open?id=${trackingId}`;

      // Build HTML with link tracking
      let htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
          ${body.split("\n").map((line) => `<p style="margin: 0 0 10px 0;">${line}</p>`).join("")}
          <img src="${trackingPixel}" width="1" height="1" style="display:none;" alt="" />
        </div>
      `;

      // Rewrite links for click tracking
      htmlBody = rewriteLinksForTracking(htmlBody, trackingId, baseUrl);

      if (resendKey) {
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
              campaign_id: cc.campaign_id,
              contact_id: contact.id,
              subject: subject,
              status: "sent",
              tracking_id: trackingId,
              sequence_step: nextStepNumber,
              message_id: result.id,
            }]);

            // Check for more steps
            const { data: moreSteps } = await supabase
              .from("lp_sequence_steps")
              .select("step_number, delay_days, delay_hours")
              .eq("campaign_id", cc.campaign_id)
              .eq("step_number", nextStepNumber + 1)
              .single();

            if (moreSteps) {
              // Calculate next send time
              const delayMs = ((moreSteps.delay_days || 0) * 24 * 60 + (moreSteps.delay_hours || 0) * 60) * 60 * 1000;
              const nextSendAt = new Date(Date.now() + delayMs).toISOString();

              await supabase
                .from("lp_campaign_contacts")
                .update({ 
                  current_step: nextStepNumber,
                  next_send_at: nextSendAt,
                })
                .eq("id", cc.id);
            } else {
              // Last step sent - mark as completed
              await supabase
                .from("lp_campaign_contacts")
                .update({ 
                  current_step: nextStepNumber,
                  status: "completed",
                  completed_at: now,
                })
                .eq("id", cc.id);
            }

            processed++;
          } else {
            errors.push(`${contact.email}: ${result.message || "Send failed"}`);
          }
        } catch (err: any) {
          errors.push(`${contact.email}: ${err.message}`);
        }
      } else {
        // Demo mode
        await supabase.from("lp_emails_sent").insert([{
          campaign_id: cc.campaign_id,
          contact_id: contact.id,
          subject: subject,
          status: "demo",
          tracking_id: trackingId,
          sequence_step: nextStepNumber,
        }]);

        // Still update the sequence position
        const { data: moreSteps } = await supabase
          .from("lp_sequence_steps")
          .select("step_number, delay_days, delay_hours")
          .eq("campaign_id", cc.campaign_id)
          .eq("step_number", nextStepNumber + 1)
          .single();

        if (moreSteps) {
          const delayMs = ((moreSteps.delay_days || 0) * 24 * 60 + (moreSteps.delay_hours || 0) * 60) * 60 * 1000;
          const nextSendAt = new Date(Date.now() + delayMs).toISOString();

          await supabase
            .from("lp_campaign_contacts")
            .update({ 
              current_step: nextStepNumber,
              next_send_at: nextSendAt,
            })
            .eq("id", cc.id);
        } else {
          await supabase
            .from("lp_campaign_contacts")
            .update({ 
              current_step: nextStepNumber,
              status: "completed",
              completed_at: now,
            })
            .eq("id", cc.id);
        }

        processed++;
      }

      // Rate limit between sends
      await new Promise((r) => setTimeout(r, 200));
    }

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      demo: !resendKey,
    });
  } catch (error: any) {
    console.error("Process sequences error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
