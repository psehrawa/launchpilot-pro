import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { EnrichmentEngine } from "@/lib/enrichment-engine";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize enrichment engine with all available API keys
const engine = new EnrichmentEngine({
  hunterKey: process.env.HUNTER_API_KEY,
  clearbitKey: process.env.CLEARBIT_API_KEY,
  snovClientId: process.env.SNOV_CLIENT_ID,
  snovClientSecret: process.env.SNOV_CLIENT_SECRET,
});

// Auto-enrich a contact with email and additional data
export async function POST(request: NextRequest) {
  try {
    const { contact_id, first_name, last_name, company, domain, linkedin_url, twitter } = await request.json();

    if (!first_name || !last_name) {
      return NextResponse.json({ 
        error: "Need first_name and last_name" 
      }, { status: 400 });
    }

    if (!company && !domain) {
      return NextResponse.json({ 
        error: "Need company or domain" 
      }, { status: 400 });
    }

    // Use the multi-source enrichment engine
    const result = await engine.enrich({
      first_name,
      last_name,
      company,
      domain,
      linkedin_url,
      twitter,
    });

    // Update contact in database if contact_id provided
    if (contact_id && result.email) {
      const updateData: any = {
        email: result.email,
        email_verified: result.verified,
      };

      if (result.additionalData?.title) {
        updateData.title = result.additionalData.title;
      }

      await supabase
        .from("lp_contacts")
        .update(updateData)
        .eq("id", contact_id);
    }

    return NextResponse.json({
      success: true,
      email: result.email,
      verified: result.verified,
      confidence: result.confidence,
      source: result.source,
      additionalData: result.additionalData,
    });
  } catch (error: any) {
    console.error("Enrichment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Bulk enrich multiple contacts
export async function PUT(request: NextRequest) {
  try {
    const { contacts } = await request.json();

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: "contacts array required" }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      details: [] as any[],
    };

    for (const contact of contacts) {
      try {
        const result = await engine.enrich({
          first_name: contact.first_name,
          last_name: contact.last_name,
          company: contact.company,
          domain: contact.domain,
        });

        if (result.email && result.confidence >= 50) {
          // Update in database if contact_id provided
          if (contact.contact_id) {
            await supabase
              .from("lp_contacts")
              .update({
                email: result.email,
                email_verified: result.verified,
                title: result.additionalData?.title,
              })
              .eq("id", contact.contact_id);
          }

          results.success++;
          results.details.push({
            name: `${contact.first_name} ${contact.last_name}`,
            email: result.email,
            source: result.source,
            confidence: result.confidence,
          });
        } else {
          results.failed++;
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        results.failed++;
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
