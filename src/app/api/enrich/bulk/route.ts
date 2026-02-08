import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Bulk email enrichment - find and verify emails for multiple domains
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domains, contacts } = body;

    // Accept either list of domains or list of contacts with domains
    const targetDomains = domains || contacts?.map((c: { domain?: string; company?: string }) => 
      c.domain || (c.company ? `${c.company.toLowerCase().replace(/\s+/g, '')}.com` : null)
    ).filter(Boolean);

    if (!targetDomains?.length) {
      return NextResponse.json(
        { success: false, error: "No domains provided" },
        { status: 400 }
      );
    }

    const results = [];
    const supabase = await createClient();

    // Get default org
    const { data: org } = await supabase
      .from("lp_organizations")
      .select("id")
      .eq("slug", "default")
      .single();

    for (const domain of targetDomains.slice(0, 50)) { // Limit to 50 per request
      try {
        // Call our enrich endpoint
        const enrichRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/enrich`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });
        
        const enrichData = await enrichRes.json();

        if (enrichData.success && enrichData.email) {
          // Save to database
          const { data: contact } = await supabase
            .from("lp_contacts")
            .insert([{
              org_id: org?.id,
              email: enrichData.email,
              company: domain.replace(/\.(com|co|io|org|net)$/, ''),
              email_verified: enrichData.verified || false,
              status: "new",
              tags: ["enriched"],
            }])
            .select()
            .single();

          results.push({
            domain,
            success: true,
            email: enrichData.email,
            verified: enrichData.verified,
            contactId: contact?.id,
          });
        } else {
          results.push({
            domain,
            success: false,
            error: enrichData.error || "No email found",
          });
        }
      } catch (error) {
        results.push({
          domain,
          success: false,
          error: String(error),
        });
      }
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      success: true,
      total: results.length,
      enriched: successful.length,
      failed: failed.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
