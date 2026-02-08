"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface DashboardStats {
  totalContacts: number;
  emailsSent: number;
  openRate: number;
  replyRate: number;
  contactsByStatus: Record<string, number>;
}

export function useStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    emailsSent: 0,
    openRate: 0,
    replyRate: 0,
    contactsByStatus: {},
  });
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const getOrgId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("lp_org_members")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (membership?.org_id) {
        setOrgId(membership.org_id);
      } else {
        const { data: defaultOrg } = await supabase
          .from("lp_organizations")
          .select("id")
          .eq("slug", "default")
          .single();
        if (defaultOrg) setOrgId(defaultOrg.id);
      }
    };
    getOrgId();
  }, [supabase]);

  const fetchStats = useCallback(async () => {
    if (!orgId) return;
    
    setLoading(true);
    try {
      // Get contacts count
      const { count: contactCount } = await supabase
        .from("lp_contacts")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId);

      // Get contacts by status
      const { data: contacts } = await supabase
        .from("lp_contacts")
        .select("status")
        .eq("org_id", orgId);

      const statusCounts: Record<string, number> = {};
      contacts?.forEach((c) => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      });

      // Get emails sent
      const { count: emailCount } = await supabase
        .from("lp_emails_sent")
        .select("*", { count: "exact", head: true });

      // Get email events for open/reply rates
      const { data: events } = await supabase
        .from("lp_email_events")
        .select("event_type");

      const openCount = events?.filter((e) => e.event_type === "opened").length || 0;
      const replyCount = events?.filter((e) => e.event_type === "replied").length || 0;
      const totalEmails = emailCount || 1;

      setStats({
        totalContacts: contactCount || 0,
        emailsSent: emailCount || 0,
        openRate: Math.round((openCount / totalEmails) * 100),
        replyRate: Math.round((replyCount / totalEmails) * 100),
        contactsByStatus: statusCounts,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, orgId]);

  useEffect(() => {
    if (orgId) fetchStats();
  }, [orgId, fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
