import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingId = searchParams.get("id");
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (trackingId) {
    try {
      // Find the email by tracking_id
      const { data: email } = await supabase
        .from("lp_emails_sent")
        .select("id")
        .eq("tracking_id", trackingId)
        .single();

      if (email) {
        // Log click event
        await supabase.from("lp_email_events").insert([{
          email_id: email.id,
          event_type: "clicked",
          metadata: { url },
        }]);
      }
    } catch (err) {
      console.error("Click tracking error:", err);
    }
  }

  // Redirect to the actual URL
  return NextResponse.redirect(url);
}
