import { NextRequest, NextResponse } from "next/server";

interface HNItem {
  id: number;
  title: string;
  by: string;
  url?: string;
  text?: string;
  time: number;
}

interface HNUser {
  id: string;
  about?: string;
  karma: number;
}

export async function POST(request: NextRequest) {
  try {
    const { query = "Show HN", limit = 30 } = await request.json();

    // Use Algolia's HN Search API (free, no auth)
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`;
    
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    const leads: any[] = [];
    const seenUsers = new Set<string>();

    for (const hit of data.hits || []) {
      const username = hit.author;
      
      if (seenUsers.has(username)) continue;
      seenUsers.add(username);

      // Get user details
      try {
        const userRes = await fetch(`https://hacker-news.firebaseio.com/v0/user/${username}.json`);
        const user: HNUser = await userRes.json();
        
        // Try to extract info from user's "about" field
        let email = "";
        let website = "";
        let twitter = "";
        
        if (user.about) {
          // Look for email patterns
          const emailMatch = user.about.match(/[\w.-]+@[\w.-]+\.\w+/);
          if (emailMatch) email = emailMatch[0];
          
          // Look for website
          const urlMatch = user.about.match(/https?:\/\/[\w.-]+\.\w+[^\s]*/);
          if (urlMatch) website = urlMatch[0];
          
          // Look for Twitter
          const twitterMatch = user.about.match(/@(\w+)/);
          if (twitterMatch) twitter = twitterMatch[1];
        }

        leads.push({
          name: username,
          email: email || undefined,
          company: hit.title?.replace("Show HN: ", "").split(/[–\-:]/)[0].trim() || "",
          title: "HN Poster",
          source: "hackernews",
          url: `https://news.ycombinator.com/user?id=${username}`,
          karma: user.karma,
          website,
          twitter,
          post: hit.title,
          postUrl: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        });
      } catch (err) {
        // Skip if user fetch fails
      }

      // Rate limit - don't hammer the API
      if (leads.length >= 20) break;
    }

    return NextResponse.json({ 
      leads,
      total: data.nbHits,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
