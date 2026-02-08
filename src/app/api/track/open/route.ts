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
  const trackingId = searchParams.get("id");

  if (trackingId) {
    try {
      // Find the email by tracking_id
      const { data: email } = await supabase
        .from("lp_emails_sent")
        .select("id, contact_id")
        .eq("tracking_id", trackingId)
        .single();

      if (email) {
        // Log open event (check if already exists to avoid duplicates)
        const { data: existing } = await supabase
          .from("lp_email_events")
          .select("id")
          .eq("email_id", email.id)
          .eq("event_type", "opened")
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("lp_email_events").insert([{
            email_id: email.id,
            event_type: "opened",
          }]);
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
