import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Dashboard statistics
export async function GET() {
  try {
    const supabase = await createClient();

    // Get contact stats
    const { count: totalContacts } = await supabase
      .from("lp_contacts")
      .select("*", { count: "exact", head: true });

    const { count: verifiedContacts } = await supabase
      .from("lp_contacts")
      .select("*", { count: "exact", head: true })
      .eq("email_verified", true);

    // Get contacts by status
    const { data: statusCounts } = await supabase
      .from("lp_contacts")
      .select("status");

    const statusBreakdown = (statusCounts || []).reduce((acc: Record<string, number>, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    // Get campaign stats
    const { count: totalCampaigns } = await supabase
      .from("lp_campaigns")
      .select("*", { count: "exact", head: true });

    const { count: activeCampaigns } = await supabase
      .from("lp_campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // Get email stats
    const { count: emailsSent } = await supabase
      .from("lp_emails_sent")
      .select("*", { count: "exact", head: true });

    const { count: emailsOpened } = await supabase
      .from("lp_email_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "opened");

    const { count: emailsReplied } = await supabase
      .from("lp_email_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "replied");

    // Calculate rates
    const openRate = emailsSent ? ((emailsOpened || 0) / emailsSent * 100).toFixed(1) : "0";
    const replyRate = emailsSent ? ((emailsReplied || 0) / emailsSent * 100).toFixed(1) : "0";

    // Get recent activity
    const { data: recentEmails } = await supabase
      .from("lp_emails_sent")
      .select(`
        id,
        subject,
        status,
        sent_at,
        contact:lp_contacts(email, first_name, last_name)
      `)
      .order("sent_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      stats: {
        contacts: {
          total: totalContacts || 0,
          verified: verifiedContacts || 0,
          byStatus: statusBreakdown,
        },
        campaigns: {
          total: totalCampaigns || 0,
          active: activeCampaigns || 0,
        },
        emails: {
          sent: emailsSent || 0,
          opened: emailsOpened || 0,
          replied: emailsReplied || 0,
          openRate: parseFloat(openRate),
          replyRate: parseFloat(replyRate),
        },
      },
      recentActivity: recentEmails || [],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
