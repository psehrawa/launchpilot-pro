import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { days = 7 } = await request.json();

    // Use Product Hunt's public GraphQL API (no auth for basic queries)
    // For full access, you'd need a PH API token
    
    const query = `
      query {
        posts(first: 50, order: VOTES) {
          edges {
            node {
              name
              tagline
              website
              votesCount
              makers {
                name
                username
                headline
                twitterUsername
              }
            }
          }
        }
      }
    `;

    // Product Hunt requires authentication for their GraphQL API
    // For now, we'll scrape the public RSS feed or use a simpler approach
    
    // Fallback: Use the public website data
    const leads: any[] = [];
    
    // Fetch from Product Hunt's public API (limited)
    try {
      const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          // Add your PH token if you have one
          ...(process.env.PRODUCTHUNT_TOKEN && {
            "Authorization": `Bearer ${process.env.PRODUCTHUNT_TOKEN}`,
          }),
        },
        body: JSON.stringify({ query }),
      });

      if (res.ok) {
        const data = await res.json();
        const posts = data.data?.posts?.edges || [];
        
        for (const { node } of posts) {
          for (const maker of node.makers || []) {
            leads.push({
              name: maker.name,
              company: node.name,
              title: maker.headline || "Maker",
              source: "producthunt",
              url: `https://www.producthunt.com/@${maker.username}`,
              twitter: maker.twitterUsername,
            });
          }
        }
      }
    } catch (err) {
      // API failed, return demo data
    }

    // If no leads from API, return demo data
    if (leads.length === 0) {
      return NextResponse.json({
        leads: [
          { name: "Demo Maker 1", company: "AI Startup", title: "Founder", source: "producthunt" },
          { name: "Demo Maker 2", company: "SaaS Tool", title: "CEO", source: "producthunt" },
          { name: "Demo Maker 3", company: "Dev Tool", title: "Indie Hacker", source: "producthunt" },
        ],
        demo: true,
        note: "Add PRODUCTHUNT_TOKEN to env for real data",
      });
    }

    return NextResponse.json({ leads });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
