"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Campaign {
  id: string;
  org_id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface SequenceStep {
  id: string;
  campaign_id: string;
  step_number: number;
  subject: string;
  body: string;
  delay_days: number;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchCampaigns = useCallback(async () => {
    if (!orgId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lp_campaigns")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [supabase, orgId]);

  useEffect(() => {
    if (orgId) fetchCampaigns();
  }, [orgId, fetchCampaigns]);

  const createCampaign = async (name: string) => {
    if (!orgId) return { success: false, error: "No organization" };
    
    try {
      const { data, error } = await supabase
        .from("lp_campaigns")
        .insert([{ name, org_id: orgId, status: "draft" }])
        .select()
        .single();

      if (error) throw error;
      setCampaigns((prev) => [data, ...prev]);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      const { data, error } = await supabase
        .from("lp_campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setCampaigns((prev) => prev.map((c) => (c.id === id ? data : c)));
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lp_campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  };

  const addSequenceStep = async (campaignId: string, step: Omit<SequenceStep, "id" | "campaign_id">) => {
    try {
      const { data, error } = await supabase
        .from("lp_sequence_steps")
        .insert([{ ...step, campaign_id: campaignId }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  };

  return {
    campaigns,
    loading,
    error,
    orgId,
    refresh: fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    addSequenceStep,
  };
}
