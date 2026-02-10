import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingId = searchParams.get("id") || searchParams.get("t");

  if (trackingId) {
    try {
      // Find the email by tracking_id
      const { data: email } = await supabase
        .from("lp_emails_sent")
        .select("id, contact_id, opened_at, open_count")
        .eq("tracking_id", trackingId)
        .single();

      if (email) {
        // Update email with open tracking
        await supabase
          .from("lp_emails_sent")
          .update({
            opened_at: email.opened_at || new Date().toISOString(),
            last_opened_at: new Date().toISOString(),
            open_count: (email.open_count || 0) + 1,
          })
          .eq("id", email.id);

        // Log open event
        await supabase.from("lp_email_events").insert([{
          email_id: email.id,
          event_type: "opened",
          metadata: {
            user_agent: request.headers.get("user-agent"),
            ip: request.headers.get("x-forwarded-for") || "unknown",
            timestamp: new Date().toISOString(),
          },
        }]);

        // Update contact status if first open
        if (!email.opened_at && email.contact_id) {
          await supabase
            .from("lp_contacts")
            .update({ status: "engaged" })
            .eq("id", email.contact_id)
            .eq("status", "contacted");
        }
      }
    } catch (err) {
      // Silently fail - don't break the pixel
      console.error("Tracking error:", err);
    }
  }

  // Return 1x1 transparent GIF
  return new NextResponse(TRACKING_PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
