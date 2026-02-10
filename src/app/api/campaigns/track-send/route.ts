import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

// Log an email send and generate tracking IDs
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      to,
      subject,
      body: emailBody,
      campaign_id,
      contact_id,
      gmail_message_id,
    } = body;
    
    // Generate tracking ID
    const trackingId = uuidv4();
    
    // Get org
    const { data: org } = await supabase
      .from("lp_organizations")
      .select("id")
      .eq("slug", "default")
      .single();
    
    if (!org) {
      return NextResponse.json({ success: false, error: "No org" }, { status: 400 });
    }
    
    // Create or get contact
    let contactId = contact_id;
    if (!contactId && to) {
      // Check if contact exists
      const { data: existing } = await supabase
        .from("lp_contacts")
        .select("id")
        .eq("email", to)
        .eq("org_id", org.id)
        .single();
      
      if (existing) {
        contactId = existing.id;
      } else {
        // Create contact
        const { data: newContact } = await supabase
          .from("lp_contacts")
          .insert({
            org_id: org.id,
            email: to,
            status: "contacted",
            source: "cold_email",
          })
          .select()
          .single();
        contactId = newContact?.id;
      }
    }
    
    // Log the email
    const { data: email, error } = await supabase
      .from("lp_emails_sent")
      .insert({
        org_id: org.id,
        campaign_id: campaign_id || null,
        contact_id: contactId,
        to_email: to,
        subject,
        body: emailBody,
        status: "sent",
        tracking_id: trackingId,
        gmail_message_id: gmail_message_id || null,
        sent_at: new Date().toISOString(),
        opened_at: null,
        clicked_at: null,
        replied_at: null,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Generate tracking URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://launchpilot-pro.vercel.app";
    const openPixel = `${baseUrl}/api/track/open?t=${trackingId}`;
    const clickBase = `${baseUrl}/api/track/click?t=${trackingId}&url=`;
    
    return NextResponse.json({
      success: true,
      email_id: email.id,
      tracking_id: trackingId,
      tracking: {
        open_pixel: openPixel,
        click_base: clickBase,
      },
    });
  } catch (error) {
    console.error("Track send error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
