import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Time series stats for charts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get emails sent per day
    const { data: emailsSent } = await supabase
      .from("lp_emails_sent")
      .select("sent_at, status")
      .gte("sent_at", startDate.toISOString())
      .lte("sent_at", endDate.toISOString())
      .order("sent_at", { ascending: true });

    // Get email events per day
    const { data: emailEvents } = await supabase
      .from("lp_email_events")
      .select("created_at, event_type")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    // Aggregate by day
    const dailyStats: Record<string, {
      date: string;
      sent: number;
      opened: number;
      clicked: number;
      replied: number;
      bounced: number;
    }> = {};

    // Initialize all days in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split("T")[0];
      dailyStats[dateKey] = {
        date: dateKey,
        sent: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        bounced: 0,
      };
    }

    // Count emails sent
    emailsSent?.forEach((email) => {
      const dateKey = new Date(email.sent_at).toISOString().split("T")[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].sent++;
        if (email.status === "bounced") {
          dailyStats[dateKey].bounced++;
        }
      }
    });

    // Count events
    emailEvents?.forEach((event) => {
      const dateKey = new Date(event.created_at).toISOString().split("T")[0];
      if (dailyStats[dateKey]) {
        switch (event.event_type) {
          case "opened":
            dailyStats[dateKey].opened++;
            break;
          case "clicked":
            dailyStats[dateKey].clicked++;
            break;
          case "replied":
            dailyStats[dateKey].replied++;
            break;
          case "bounced":
            dailyStats[dateKey].bounced++;
            break;
        }
      }
    });

    // Convert to array sorted by date
    const timeSeries = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get campaign breakdown
    const { data: campaigns } = await supabase
      .from("lp_campaigns")
      .select("id, name, status");

    const campaignStats = [];

    for (const campaign of campaigns || []) {
      const { count: sent } = await supabase
        .from("lp_emails_sent")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id);

      const { data: campaignEmails } = await supabase
        .from("lp_emails_sent")
        .select("id")
        .eq("campaign_id", campaign.id);

      const emailIds = campaignEmails?.map((e) => e.id) || [];

      let opened = 0;
      let replied = 0;
      let clicked = 0;

      if (emailIds.length > 0) {
        const { count: openCount } = await supabase
          .from("lp_email_events")
          .select("*", { count: "exact", head: true })
          .in("email_id", emailIds)
          .eq("event_type", "opened");

        const { count: replyCount } = await supabase
          .from("lp_email_events")
          .select("*", { count: "exact", head: true })
          .in("email_id", emailIds)
          .eq("event_type", "replied");

        const { count: clickCount } = await supabase
          .from("lp_email_events")
          .select("*", { count: "exact", head: true })
          .in("email_id", emailIds)
          .eq("event_type", "clicked");

        opened = openCount || 0;
        replied = replyCount || 0;
        clicked = clickCount || 0;
      }

      campaignStats.push({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        sent: sent || 0,
        opened,
        clicked,
        replied,
        openRate: sent ? Math.round((opened / sent) * 100) : 0,
        replyRate: sent ? Math.round((replied / sent) * 100) : 0,
        clickRate: sent ? Math.round((clicked / sent) * 100) : 0,
      });
    }

    return NextResponse.json({
      success: true,
      timeSeries,
      campaignStats,
      range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error("Time series stats error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
