import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mark an email as replied
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email, email_id, tracking_id } = body;

    // Get org
    const { data: org } = await supabase
      .from("lp_organizations")
      .select("id")
      .eq("slug", "default")
      .single();

    if (!org) {
      return NextResponse.json({ success: false, error: "No org" }, { status: 400 });
    }

    // Find the email record
    let query = supabase.from("lp_emails_sent").select("id, contact_id");

    if (email_id) {
      query = query.eq("id", email_id);
    } else if (tracking_id) {
      query = query.eq("tracking_id", tracking_id);
    } else if (email) {
      query = query.eq("to_email", email.toLowerCase());
    } else {
      return NextResponse.json({ success: false, error: "Need email, email_id, or tracking_id" }, { status: 400 });
    }

    const { data: emailRecord } = await query.order("sent_at", { ascending: false }).limit(1).single();

    if (!emailRecord) {
      return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });
    }

    // Update email as replied
    await supabase
      .from("lp_emails_sent")
      .update({
        replied_at: new Date().toISOString(),
        status: "replied",
      })
      .eq("id", emailRecord.id);

    // Log reply event
    await supabase.from("lp_email_events").insert({
      email_id: emailRecord.id,
      event_type: "replied",
      metadata: {
        marked_by: "auto",
        timestamp: new Date().toISOString(),
      },
    });

    // Update contact status
    if (emailRecord.contact_id) {
      await supabase
        .from("lp_contacts")
        .update({ status: "replied" })
        .eq("id", emailRecord.contact_id);
    }

    return NextResponse.json({ success: true, email_id: emailRecord.id });
  } catch (error) {
    console.error("Mark replied error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
