"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Contact {
  id: string;
  org_id?: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  title: string | null;
  status: string;
  tags: string[];
  email_verified: boolean;
  email_verification_status: "valid" | "invalid" | "unknown" | "disposable" | "catchall" | null;
  created_at: string;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  const supabase = createClient();

  // Get user's org_id on mount
  useEffect(() => {
    const getOrgId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Get user's org from membership
      const { data: membership } = await supabase
        .from("lp_org_members")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (membership?.org_id) {
        setOrgId(membership.org_id);
      } else {
        // Fallback to default org
        const { data: defaultOrg } = await supabase
          .from("lp_organizations")
          .select("id")
          .eq("slug", "default")
          .single();
        
        if (defaultOrg) {
          setOrgId(defaultOrg.id);
        }
      }
    };

    getOrgId();
  }, [supabase]);

  const fetchContacts = useCallback(async () => {
    if (!orgId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lp_contacts")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [supabase, orgId]);

  // Fetch when orgId is available
  useEffect(() => {
    if (orgId) {
      fetchContacts();
    }
  }, [orgId, fetchContacts]);

  const addContact = async (contact: Partial<Contact>) => {
    if (!orgId) return { success: false, error: "No organization" };
    
    try {
      const { data, error } = await supabase
        .from("lp_contacts")
        .insert([{ ...contact, org_id: orgId, status: contact.status || "new", tags: contact.tags || [] }])
        .select()
        .single();

      if (error) throw error;
      setContacts((prev) => [data, ...prev]);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const { data, error } = await supabase
        .from("lp_contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lp_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setContacts((prev) => prev.filter((c) => c.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  };

  const deleteContacts = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from("lp_contacts")
        .delete()
        .in("id", ids);

      if (error) throw error;
      setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  };

  return {
    contacts,
    loading,
    error,
    orgId,
    refresh: fetchContacts,
    addContact,
    updateContact,
    deleteContact,
    deleteContacts,
  };
}
