import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { subreddit, query, limit = 50, sort = "new" } = await request.json();

    if (!subreddit && !query) {
      return NextResponse.json({ error: "Subreddit or query required" }, { status: 400 });
    }

    let endpoint: string;
    
    if (subreddit) {
      // Get posts from a subreddit
      endpoint = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
    } else {
      // Search across Reddit
      endpoint = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=${sort}`;
    }

    const res = await fetch(endpoint, {
      headers: {
        "User-Agent": "LaunchPilot-Pro/1.0",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Reddit API error" }, { status: res.status });
    }

    const data = await res.json();
    const posts = data.data?.children || [];
    
    const seenAuthors = new Set<string>();
    const leads: any[] = [];

    for (const { data: post } of posts) {
      const author = post.author;
      
      // Skip deleted/bot accounts
      if (!author || author === "[deleted]" || author === "AutoModerator") continue;
      if (seenAuthors.has(author)) continue;
      
      seenAuthors.add(author);

      // Get user details
      try {
        const userRes = await fetch(`https://www.reddit.com/user/${author}/about.json`, {
          headers: { "User-Agent": "LaunchPilot-Pro/1.0" },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          const user = userData.data;

          leads.push({
            name: author,
            username: author,
            source: "reddit",
            url: `https://reddit.com/u/${author}`,
            karma: (user.link_karma || 0) + (user.comment_karma || 0),
            accountAge: Math.floor((Date.now() / 1000 - user.created_utc) / 86400 / 365), // years
            subreddit: post.subreddit,
            postTitle: post.title?.slice(0, 100),
            postUrl: `https://reddit.com${post.permalink}`,
          });
        }

        // Rate limit
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        // Skip failed fetches
      }

      if (leads.length >= 30) break;
    }

    return NextResponse.json({
      leads,
      total: posts.length,
      source: subreddit ? `r/${subreddit}` : query,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
