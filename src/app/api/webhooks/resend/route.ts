import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify Resend webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) return true; // Skip verification if no secret
  
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("resend-signature") || "";
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Verify signature in production
    if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type;
    const data = event.data;

    console.log("Resend webhook event:", eventType, data);

    switch (eventType) {
      case "email.delivered": {
        // Email was delivered
        if (data.email_id) {
          const { data: emailRecord } = await supabase
            .from("lp_emails_sent")
            .select("id")
            .eq("message_id", data.email_id)
            .single();

          if (emailRecord) {
            await supabase.from("lp_email_events").insert([{
              email_id: emailRecord.id,
              event_type: "delivered",
              metadata: data,
            }]);

            await supabase
              .from("lp_emails_sent")
              .update({ status: "delivered" })
              .eq("id", emailRecord.id);
          }
        }
        break;
      }

      case "email.opened": {
        // Email was opened (via tracking pixel)
        if (data.email_id) {
          const { data: emailRecord } = await supabase
            .from("lp_emails_sent")
            .select("id")
            .eq("message_id", data.email_id)
            .single();

          if (emailRecord) {
            await supabase.from("lp_email_events").insert([{
              email_id: emailRecord.id,
              event_type: "opened",
              metadata: data,
            }]);
          }
        }
        break;
      }

      case "email.clicked": {
        // Link was clicked
        if (data.email_id) {
          const { data: emailRecord } = await supabase
            .from("lp_emails_sent")
            .select("id")
            .eq("message_id", data.email_id)
            .single();

          if (emailRecord) {
            await supabase.from("lp_email_events").insert([{
              email_id: emailRecord.id,
              event_type: "clicked",
              metadata: { url: data.link?.url, ...data },
            }]);
          }
        }
        break;
      }

      case "email.bounced": {
        // Email bounced
        if (data.email_id) {
          const { data: emailRecord } = await supabase
            .from("lp_emails_sent")
            .select("id, contact_id, campaign_id")
            .eq("message_id", data.email_id)
            .single();

          if (emailRecord) {
            await supabase.from("lp_email_events").insert([{
              email_id: emailRecord.id,
              event_type: "bounced",
              metadata: data,
            }]);

            await supabase
              .from("lp_emails_sent")
              .update({ status: "bounced" })
              .eq("id", emailRecord.id);

            // Mark contact email as invalid
            if (emailRecord.contact_id) {
              await supabase
                .from("lp_contacts")
                .update({ 
                  email_verified: false,
                  email_verification_status: "invalid",
                })
                .eq("id", emailRecord.contact_id);

              // Pause their sequence
              if (emailRecord.campaign_id) {
                await supabase
                  .from("lp_campaign_contacts")
                  .update({ status: "bounced" })
                  .eq("campaign_id", emailRecord.campaign_id)
                  .eq("contact_id", emailRecord.contact_id);
              }
            }
          }
        }
        break;
      }

      case "email.complained": {
        // Spam complaint
        if (data.email_id) {
          const { data: emailRecord } = await supabase
            .from("lp_emails_sent")
            .select("id, contact_id")
            .eq("message_id", data.email_id)
            .single();

          if (emailRecord) {
            await supabase.from("lp_email_events").insert([{
              email_id: emailRecord.id,
              event_type: "complained",
              metadata: data,
            }]);

            // Unsubscribe contact
            if (emailRecord.contact_id) {
              await supabase
                .from("lp_contacts")
                .update({ status: "unsubscribed" })
                .eq("id", emailRecord.contact_id);

              // Pause all their sequences
              await supabase
                .from("lp_campaign_contacts")
                .update({ status: "unsubscribed" })
                .eq("contact_id", emailRecord.contact_id)
                .in("status", ["pending", "in_progress"]);
            }
          }
        }
        break;
      }

      // Handle inbound emails (replies)
      case "email.received": 
      case "inbound.email": {
        // Someone replied to our email
        const fromEmail = data.from?.email || data.from;
        const toEmail = data.to?.email || data.to?.[0]?.email || data.to;
        const inReplyTo = data.in_reply_to || data.headers?.["in-reply-to"];
        const subject = data.subject;

        console.log("Inbound email received:", { fromEmail, toEmail, inReplyTo, subject });

        // Try to find the original email by In-Reply-To header
        let originalEmail = null;
        if (inReplyTo) {
          const { data: found } = await supabase
            .from("lp_emails_sent")
            .select("id, contact_id, campaign_id")
            .eq("message_id", inReplyTo)
            .single();
          originalEmail = found;
        }

        // Fallback: find by sender email
        if (!originalEmail && fromEmail) {
          const { data: contact } = await supabase
            .from("lp_contacts")
            .select("id")
            .eq("email", fromEmail)
            .single();

          if (contact) {
            // Get most recent email sent to this contact
            const { data: recentEmail } = await supabase
              .from("lp_emails_sent")
              .select("id, contact_id, campaign_id")
              .eq("contact_id", contact.id)
              .order("sent_at", { ascending: false })
              .limit(1)
              .single();
            
            originalEmail = recentEmail;
          }
        }

        if (originalEmail) {
          // Log the reply event
          await supabase.from("lp_email_events").insert([{
            email_id: originalEmail.id,
            event_type: "replied",
            metadata: { 
              from: fromEmail,
              subject,
              received_at: new Date().toISOString(),
            },
          }]);

          // Update contact status to replied
          if (originalEmail.contact_id) {
            await supabase
              .from("lp_contacts")
              .update({ status: "replied" })
              .eq("id", originalEmail.contact_id);

            // Pause their sequence (auto-stop follow-ups)
            if (originalEmail.campaign_id) {
              await supabase
                .from("lp_campaign_contacts")
                .update({ 
                  status: "completed",
                  completed_at: new Date().toISOString(),
                })
                .eq("campaign_id", originalEmail.campaign_id)
                .eq("contact_id", originalEmail.contact_id)
                .in("status", ["pending", "in_progress"]);
            }
          }
        }

        break;
      }

      default:
        console.log("Unhandled Resend event:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
