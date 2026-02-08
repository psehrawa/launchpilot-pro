"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  title: string | null;
  status: string;
  tags: string[];
  email_verified: boolean;
  created_at: string;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lp_contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const addContact = async (contact: Partial<Contact>) => {
    try {
      const { data, error } = await supabase
        .from("lp_contacts")
        .insert([{ ...contact, org_id: await getDefaultOrgId() }])
        .select()
        .single();

      if (error) throw error;
      setContacts((prev) => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: String(err) };
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
    } catch (err) {
      return { success: false, error: String(err) };
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
    } catch (err) {
      return { success: false, error: String(err) };
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
    } catch (err) {
      return { success: false, error: String(err) };
    }
  };

  const getDefaultOrgId = async () => {
    const { data } = await supabase
      .from("lp_organizations")
      .select("id")
      .eq("slug", "default")
      .single();
    return data?.id;
  };

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    error,
    refresh: fetchContacts,
    addContact,
    updateContact,
    deleteContact,
    deleteContacts,
  };
}
