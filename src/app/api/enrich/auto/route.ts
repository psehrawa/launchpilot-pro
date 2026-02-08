import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Auto-enrich a contact with email and additional data
export async function POST(request: NextRequest) {
  try {
    const { contact_id, first_name, last_name, company, domain } = await request.json();

    if (!first_name || !last_name || (!company && !domain)) {
      return NextResponse.json({ 
        error: "Need first_name, last_name, and company or domain" 
      }, { status: 400 });
    }

    // Determine domain from company name if not provided
    let searchDomain = domain;
    if (!searchDomain && company) {
      // Try common patterns
      searchDomain = company
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .replace(/inc$|llc$|ltd$|corp$/, "") + ".com";
    }

    let email = null;
    let verified = false;
    let provider = null;
    let additionalData: any = {};

    // 1. Try Hunter.io Email Finder
    if (process.env.HUNTER_API_KEY && searchDomain) {
      try {
        const hunterUrl = `https://api.hunter.io/v2/email-finder?domain=${searchDomain}&first_name=${first_name}&last_name=${last_name}&api_key=${process.env.HUNTER_API_KEY}`;
        const res = await fetch(hunterUrl);
        const data = await res.json();

        if (data.data?.email) {
          email = data.data.email;
          verified = data.data.score > 80;
          provider = "hunter";
          additionalData = {
            position: data.data.position,
            linkedin: data.data.linkedin,
            twitter: data.data.twitter,
            confidence: data.data.score,
          };
        }
      } catch (err) {
        console.error("Hunter error:", err);
      }
    }

    // 2. Fallback: Try email pattern guessing
    if (!email && searchDomain) {
      const patterns = [
        `${first_name.toLowerCase()}.${last_name.toLowerCase()}@${searchDomain}`,
        `${first_name.toLowerCase()}${last_name.toLowerCase()}@${searchDomain}`,
        `${first_name.toLowerCase()[0]}${last_name.toLowerCase()}@${searchDomain}`,
        `${first_name.toLowerCase()}@${searchDomain}`,
      ];

      // For now, use the most common pattern
      email = patterns[0];
      verified = false;
      provider = "pattern";
    }

    // 3. Try to get company info from Clearbit (if available)
    if (process.env.CLEARBIT_API_KEY && searchDomain) {
      try {
        const res = await fetch(`https://company.clearbit.com/v2/companies/find?domain=${searchDomain}`, {
          headers: { Authorization: `Bearer ${process.env.CLEARBIT_API_KEY}` },
        });

        if (res.ok) {
          const company = await res.json();
          additionalData.companySize = company.metrics?.employees;
          additionalData.industry = company.category?.industry;
          additionalData.companyLinkedIn = company.linkedin?.handle;
        }
      } catch (err) {
        // Skip
      }
    }

    // 4. Update contact in database if contact_id provided
    if (contact_id && email) {
      await supabase
        .from("lp_contacts")
        .update({
          email,
          email_verified: verified,
          title: additionalData.position || undefined,
        })
        .eq("id", contact_id);
    }

    return NextResponse.json({
      success: true,
      email,
      verified,
      provider,
      domain: searchDomain,
      additionalData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
