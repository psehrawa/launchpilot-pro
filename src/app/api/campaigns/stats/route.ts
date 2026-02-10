import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Get campaign statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id");
    const days = parseInt(searchParams.get("days") || "7");
    
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    // Get org
    const { data: org } = await supabase
      .from("lp_organizations")
      .select("id")
      .eq("slug", "default")
      .single();
    
    if (!org) {
      return NextResponse.json({ success: false, error: "No org" }, { status: 400 });
    }
    
    // Build query
    let query = supabase
      .from("lp_emails_sent")
      .select("*")
      .eq("org_id", org.id)
      .gte("sent_at", since.toISOString());
    
    if (campaignId) {
      query = query.eq("campaign_id", campaignId);
    }
    
    const { data: emails, error } = await query;
    
    if (error) throw error;
    
    // Calculate stats
    const total = emails?.length || 0;
    const opened = emails?.filter(e => e.opened_at).length || 0;
    const clicked = emails?.filter(e => e.clicked_at).length || 0;
    const replied = emails?.filter(e => e.replied_at).length || 0;
    const bounced = emails?.filter(e => e.status === "bounced").length || 0;
    
    const stats = {
      total,
      opened,
      clicked,
      replied,
      bounced,
      open_rate: total > 0 ? ((opened / total) * 100).toFixed(1) : 0,
      click_rate: total > 0 ? ((clicked / total) * 100).toFixed(1) : 0,
      reply_rate: total > 0 ? ((replied / total) * 100).toFixed(1) : 0,
      bounce_rate: total > 0 ? ((bounced / total) * 100).toFixed(1) : 0,
    };
    
    // Get daily breakdown
    const dailyStats: Record<string, { sent: number; opened: number; clicked: number; replied: number }> = {};
    
    emails?.forEach(email => {
      const day = email.sent_at.split("T")[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { sent: 0, opened: 0, clicked: 0, replied: 0 };
      }
      dailyStats[day].sent++;
      if (email.opened_at) dailyStats[day].opened++;
      if (email.clicked_at) dailyStats[day].clicked++;
      if (email.replied_at) dailyStats[day].replied++;
    });
    
    return NextResponse.json({
      success: true,
      stats,
      daily: dailyStats,
      emails: emails?.slice(0, 50), // Last 50 emails
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
