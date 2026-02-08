import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { EnrichmentEngine } from "@/lib/enrichment-engine";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const engine = new EnrichmentEngine({
  hunterKey: process.env.HUNTER_API_KEY,
  clearbitKey: process.env.CLEARBIT_API_KEY,
  snovClientId: process.env.SNOV_CLIENT_ID,
  snovClientSecret: process.env.SNOV_CLIENT_SECRET,
});

// Auto-discover leads from multiple sources and add to database
export async function POST(request: NextRequest) {
  try {
    const { 
      sources = ["hackernews", "reddit", "github"],
      limit = 30,
      org_id,
      auto_enrich = true,
      min_confidence = 50,
    } = await request.json();

    const allLeads: any[] = [];
    const errors: string[] = [];

    // 1. Hacker News - Show HN posts (founders launching products)
    if (sources.includes("hackernews")) {
      try {
        const hnRes = await fetch("https://hn.algolia.com/api/v1/search?query=Show%20HN&tags=story&hitsPerPage=50");
        const hnData = await hnRes.json();
        
        const seenUsers = new Set<string>();
        
        for (const hit of (hnData.hits || []).slice(0, 40)) {
          const username = hit.author;
          if (seenUsers.has(username)) continue;
          seenUsers.add(username);
          
          try {
            const userRes = await fetch(`https://hacker-news.firebaseio.com/v0/user/${username}.json`);
            const user = await userRes.json();
            
            // Extract email from about section
            let email = "";
            let website = "";
            let twitter = "";
            
            if (user?.about) {
              const emailMatch = user.about.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
              if (emailMatch) email = emailMatch[0];
              
              const urlMatch = user.about.match(/https?:\/\/[\w.-]+\.\w+[^\s<]*/);
              if (urlMatch) website = urlMatch[0];
              
              const twitterMatch = user.about.match(/@(\w{1,15})(?:\s|$)/);
              if (twitterMatch) twitter = twitterMatch[1];
            }

            // Extract company name from post title
            let company = hit.title?.replace(/^Show HN:\s*/i, "").split(/[–\-:|]/)[0].trim().slice(0, 60);

            allLeads.push({
              name: username,
              email: email || null,
              company: company,
              title: "Founder",
              source: "hackernews",
              source_url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
              karma: user?.karma,
              website,
              twitter,
            });
          } catch (e) {
            // Skip
          }
          
          await new Promise(r => setTimeout(r, 50));
        }
      } catch (e: any) {
        errors.push(`HN: ${e.message}`);
      }
    }

    // 2. Reddit - Startup/SaaS subreddits
    if (sources.includes("reddit")) {
      const subreddits = ["SaaS", "startups", "Entrepreneur", "indiehackers", "microsaas"];
      
      for (const sub of subreddits) {
        try {
          const redditRes = await fetch(`https://www.reddit.com/r/${sub}/new.json?limit=20`, {
            headers: { "User-Agent": "LaunchPilot/1.0" },
          });
          const redditData = await redditRes.json();
          
          const seenUsers = new Set<string>();
          
          for (const { data: post } of (redditData.data?.children || [])) {
            if (!post.author || post.author === "[deleted]" || post.author === "AutoModerator") continue;
            if (seenUsers.has(post.author)) continue;
            seenUsers.add(post.author);
            
            // Get user's website from their Reddit profile
            let website = post.url && !post.url.includes("reddit.com") ? post.url : "";
            
            allLeads.push({
              name: post.author,
              email: null,
              company: post.title?.slice(0, 60),
              title: "Reddit User",
              source: "reddit",
              source_url: `https://reddit.com${post.permalink}`,
              subreddit: sub,
              website,
            });
          }
          
          await new Promise(r => setTimeout(r, 200));
        } catch (e: any) {
          errors.push(`Reddit ${sub}: ${e.message}`);
        }
      }
    }

    // 3. GitHub - Trending repos & their contributors
    if (sources.includes("github")) {
      const headers: Record<string, string> = { 
        "User-Agent": "LaunchPilot",
        "Accept": "application/vnd.github.v3+json",
      };
      if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
      }

      try {
        // Search for recently created repos with good engagement
        const searchRes = await fetch(
          "https://api.github.com/search/repositories?q=stars:>50+pushed:>2024-01-01&sort=stars&order=desc&per_page=10",
          { headers }
        );
        const searchData = await searchRes.json();

        for (const repo of (searchData.items || []).slice(0, 5)) {
          // Get repo owner details
          try {
            const userRes = await fetch(repo.owner.url, { headers });
            const user = await userRes.json();

            if (user.email) {
              allLeads.push({
                name: user.name || user.login,
                email: user.email,
                company: repo.name,
                title: "Developer",
                source: "github",
                source_url: user.html_url,
                twitter: user.twitter_username,
                website: user.blog,
              });
            }

            await new Promise(r => setTimeout(r, 100));
          } catch (e) {
            // Skip
          }
        }
      } catch (e: any) {
        errors.push(`GitHub: ${e.message}`);
      }
    }

    // 4. Product Hunt (if token available)
    if (sources.includes("producthunt") && process.env.PRODUCTHUNT_TOKEN) {
      try {
        const query = `
          query { posts(first: 30, order: VOTES) {
            edges { node { 
              name 
              website
              makers { name username headline twitterUsername } 
            } }
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
                twitter: maker.twitterUsername,
                website: node.website,
              });
            }
          }
        }
      } catch (e: any) {
        errors.push(`PH: ${e.message}`);
      }
    }

    // Deduplicate by name (case-insensitive)
    const seen = new Set<string>();
    const uniqueLeads = allLeads.filter(lead => {
      const key = lead.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Multi-source enrichment for leads without emails
    if (auto_enrich) {
      for (const lead of uniqueLeads) {
        if (!lead.email && lead.company) {
          try {
            // Parse name
            const nameParts = lead.name.split(/[\s_-]+/);
            const firstName = nameParts[0] || lead.name;
            const lastName = nameParts.slice(1).join(" ") || "";

            // Try to extract domain from website
            let domain = "";
            if (lead.website) {
              try {
                const url = new URL(lead.website.startsWith("http") ? lead.website : `https://${lead.website}`);
                domain = url.hostname.replace(/^www\./, "");
              } catch {}
            }

            const result = await engine.enrich({
              first_name: firstName,
              last_name: lastName || firstName, // Use first name as last if not available
              company: lead.company,
              domain: domain || undefined,
              twitter: lead.twitter,
            });

            if (result.email && result.confidence >= min_confidence) {
              lead.email = result.email;
              lead.email_verified = result.verified;
              lead.enrichment_source = result.source;
              lead.confidence = result.confidence;
              
              if (result.additionalData?.title) {
                lead.title = result.additionalData.title;
              }
            }

            await new Promise(r => setTimeout(r, 200));
          } catch (e) {
            // Skip enrichment errors
          }
        }
      }
    }

    // Get target org_id
    let targetOrgId = org_id;
    if (!targetOrgId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: membership } = await supabase
          .from("lp_org_members")
          .select("org_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        targetOrgId = membership?.org_id;
      }
      
      if (!targetOrgId) {
        const { data: defaultOrg } = await supabase
          .from("lp_organizations")
          .select("id")
          .eq("slug", "default")
          .single();
        targetOrgId = defaultOrg?.id;
      }
    }

    // Insert into database (only leads with emails or high-value sources)
    let inserted = 0;
    let skipped = 0;
    let noEmail = 0;
    
    for (const lead of uniqueLeads.slice(0, limit)) {
      // Skip if no email found
      if (!lead.email) {
        noEmail++;
        continue;
      }

      // Check if already exists (by email)
      const { data: existing } = await supabase
        .from("lp_contacts")
        .select("id")
        .eq("org_id", targetOrgId)
        .eq("email", lead.email)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const nameParts = lead.name.split(/[\s_-]+/);
      
      const { error } = await supabase.from("lp_contacts").insert([{
        org_id: targetOrgId,
        email: lead.email,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(" ") || null,
        company: lead.company,
        title: lead.title,
        status: "new",
        tags: [lead.source, lead.enrichment_source].filter(Boolean),
        email_verified: lead.email_verified || false,
      }]);

      if (!error) inserted++;
    }

    return NextResponse.json({
      success: true,
      found: uniqueLeads.length,
      with_email: uniqueLeads.filter(l => l.email).length,
      inserted,
      skipped,
      no_email: noEmail,
      sources: sources,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Auto-discover error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Check status and stats
export async function GET() {
  try {
    const { count: total } = await supabase
      .from("lp_contacts")
      .select("*", { count: "exact", head: true });

    const { count: today } = await supabase
      .from("lp_contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { count: verified } = await supabase
      .from("lp_contacts")
      .select("*", { count: "exact", head: true })
      .eq("email_verified", true);

    return NextResponse.json({
      status: "ok",
      total_contacts: total || 0,
      added_24h: today || 0,
      verified_emails: verified || 0,
      sources_available: ["hackernews", "reddit", "github", "producthunt"],
      enrichment_sources: ["hunter", "github", "clearbit", "snov", "pattern"],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
