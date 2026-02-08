"use client";

import { useState } from "react";

interface EnrichmentResult {
  email?: string;
  verified?: boolean;
  provider?: string;
  additionalData?: {
    position?: string;
    linkedin?: string;
    twitter?: string;
    companySize?: string;
    industry?: string;
  };
}

export function useEnrichment() {
  const [loading, setLoading] = useState(false);

  const enrichContact = async (contact: {
    contact_id?: string;
    first_name: string;
    last_name: string;
    company?: string;
    domain?: string;
  }): Promise<EnrichmentResult | null> => {
    setLoading(true);
    
    try {
      const res = await fetch("/api/enrich/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });

      const data = await res.json();
      
      if (data.error) {
        console.error("Enrichment error:", data.error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Enrichment failed:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const enrichBatch = async (contacts: Array<{
    contact_id?: string;
    first_name: string;
    last_name: string;
    company?: string;
  }>): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (const contact of contacts) {
      try {
        const result = await enrichContact(contact);
        if (result?.email) {
          success++;
        } else {
          failed++;
        }
        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 500));
      } catch {
        failed++;
      }
    }

    return { success, failed };
  };

  return {
    enrichContact,
    enrichBatch,
    loading,
  };
}
