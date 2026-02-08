import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Auto-discover leads from multiple sources and add to database
export async function POST(request: NextRequest) {
  try {
    const { 
      sources = ["hackernews", "reddit", "producthunt"],
      limit = 20,
      org_id,
      auto_enrich = true,
    } = await request.json();

    const allLeads: any[] = [];
    const errors: string[] = [];

    // 1. Hacker News - Show HN posts
    if (sources.includes("hackernews")) {
      try {
        const hnRes = await fetch("https://hn.algolia.com/api/v1/search?query=Show%20HN&tags=story&hitsPerPage=30");
        const hnData = await hnRes.json();
        
        for (const hit of (hnData.hits || []).slice(0, limit)) {
          const username = hit.author;
          
          // Get user details
          try {
            const userRes = await fetch(`https://hacker-news.firebaseio.com/v0/user/${username}.json`);
            const user = await userRes.json();
            
            let email = "";
            if (user?.about) {
              const emailMatch = user.about.match(/[\w.-]+@[\w.-]+\.\w+/);
              if (emailMatch) email = emailMatch[0];
            }

            allLeads.push({
              name: username,
              email: email || null,
              company: hit.title?.replace("Show HN: ", "").split(/[–\-:]/)[0].trim().slice(0, 50),
              title: "Founder",
              source: "hackernews",
              source_url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
              karma: user?.karma,
            });
          } catch (e) {
            // Skip
          }
          
          await new Promise(r => setTimeout(r, 100)); // Rate limit
        }
      } catch (e: any) {
        errors.push(`HN: ${e.message}`);
      }
    }

    // 2. Reddit - SaaS/Startups subreddits
    if (sources.includes("reddit")) {
      const subreddits = ["SaaS", "startups", "indiehackers"];
      
      for (const sub of subreddits) {
        try {
          const redditRes = await fetch(`https://www.reddit.com/r/${sub}/new.json?limit=15`, {
            headers: { "User-Agent": "LaunchPilot/1.0" },
          });
          const redditData = await redditRes.json();
          
          for (const { data: post } of (redditData.data?.children || [])) {
            if (!post.author || post.author === "[deleted]") continue;
            
            allLeads.push({
              name: post.author,
              email: null,
              company: post.title?.slice(0, 50),
              title: "Reddit User",
              source: "reddit",
              source_url: `https://reddit.com${post.permalink}`,
              subreddit: sub,
            });
          }
          
          await new Promise(r => setTimeout(r, 200));
        } catch (e: any) {
          errors.push(`Reddit ${sub}: ${e.message}`);
        }
      }
    }

    // 3. Product Hunt (if token available)
    if (sources.includes("producthunt") && process.env.PRODUCTHUNT_TOKEN) {
      try {
        const query = `
          query { posts(first: 20, order: VOTES) {
            edges { node { name makers { name username headline } } }
          }}
        `;
        
        const phRes = await fetch("https://api.producthunt.com/v2/api/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PRODUCTHUNT_TOKEN}`,
          },
          body: JSON.stringify({ query }),
        });

        if (phRes.ok) {
          const phData = await phRes.json();
          for (const { node } of (phData.data?.posts?.edges || [])) {
            for (const maker of (node.makers || [])) {
              allLeads.push({
                name: maker.name,
                email: null,
                company: node.name,
                title: maker.headline || "Maker",
                source: "producthunt",
                source_url: `https://producthunt.com/@${maker.username}`,
              });
            }
          }
        }
      } catch (e: any) {
        errors.push(`PH: ${e.message}`);
      }
    }

    // Deduplicate by name
    const seen = new Set<string>();
    const uniqueLeads = allLeads.filter(lead => {
      const key = lead.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Auto-enrich leads with emails
    if (auto_enrich && process.env.HUNTER_API_KEY) {
      for (const lead of uniqueLeads) {
        if (!lead.email && lead.company) {
          try {
            // Try to find email via Hunter
            const domain = lead.company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
            const nameParts = lead.name.split(" ");
            const firstName = nameParts[0] || lead.name;
            const lastName = nameParts[1] || "";
            
            if (firstName && domain) {
              const hunterUrl = `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${process.env.HUNTER_API_KEY}`;
              const hunterRes = await fetch(hunterUrl);
              const hunterData = await hunterRes.json();
              
              if (hunterData.data?.email) {
                lead.email = hunterData.data.email;
                lead.email_verified = hunterData.data.score > 80;
              }
            }
          } catch (e) {
            // Skip enrichment errors
          }
          
          await new Promise(r => setTimeout(r, 200)); // Rate limit Hunter
        }
      }
    }

    // Get target org_id
    let targetOrgId = org_id;
    if (!targetOrgId) {
      const { data: defaultOrg } = await supabase
        .from("lp_organizations")
        .select("id")
        .eq("slug", "default")
        .single();
      targetOrgId = defaultOrg?.id;
    }

    // Insert into database
    let inserted = 0;
    let skipped = 0;
    
    for (const lead of uniqueLeads.slice(0, limit)) {
      // Check if already exists
      const { data: existing } = await supabase
        .from("lp_contacts")
        .select("id")
        .eq("org_id", targetOrgId)
        .or(`email.eq.${lead.email || "NONE"},first_name.eq.${lead.name.split(" ")[0]}`)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const nameParts = lead.name.split(" ");
      
      const { error } = await supabase.from("lp_contacts").insert([{
        org_id: targetOrgId,
        email: lead.email || `${lead.name.toLowerCase().replace(/\s/g, ".")}@placeholder.needs-enrichment`,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(" ") || null,
        company: lead.company,
        title: lead.title,
        status: "new",
        tags: [lead.source],
        email_verified: lead.email_verified || false,
      }]);

      if (!error) inserted++;
    }

    return NextResponse.json({
      success: true,
      found: uniqueLeads.length,
      inserted,
      skipped,
      sources: sources,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Check last run status
export async function GET() {
  try {
    const { count } = await supabase
      .from("lp_contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return NextResponse.json({
      status: "ok",
      contacts_added_24h: count || 0,
      sources_available: ["hackernews", "reddit", "producthunt", "github"],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
