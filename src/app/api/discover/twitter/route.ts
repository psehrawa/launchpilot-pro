import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, type = "followers", limit = 50 } = await request.json();

    if (!username) {
      return NextResponse.json({ error: "Twitter username required" }, { status: 400 });
    }

    const bearerToken = process.env.TWITTER_BEARER_TOKEN;

    if (!bearerToken) {
      // Demo mode - return sample data with instructions
      return NextResponse.json({
        leads: [
          { 
            name: "Demo User 1", 
            username: "demouser1", 
            company: "Tech Startup",
            bio: "Building cool stuff",
            source: "twitter",
            followers: 1234,
          },
          { 
            name: "Demo User 2", 
            username: "demouser2", 
            company: "SaaS Co",
            bio: "Founder & CEO",
            source: "twitter",
            followers: 5678,
          },
        ],
        demo: true,
        note: "Add TWITTER_BEARER_TOKEN for real data. Get one at developer.twitter.com",
      });
    }

    // Get user ID first
    const userRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
      }
    );

    if (!userRes.ok) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = await userRes.json();
    const userId = userData.data?.id;

    if (!userId) {
      return NextResponse.json({ error: "Could not get user ID" }, { status: 400 });
    }

    // Get followers
    const endpoint = type === "following"
      ? `https://api.twitter.com/2/users/${userId}/following`
      : `https://api.twitter.com/2/users/${userId}/followers`;

    const followersRes = await fetch(
      `${endpoint}?max_results=${Math.min(limit, 100)}&user.fields=name,username,description,location,public_metrics,url`,
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
      }
    );

    if (!followersRes.ok) {
      const error = await followersRes.json();
      return NextResponse.json({ 
        error: error.detail || "Twitter API error",
        code: error.status,
      }, { status: followersRes.status });
    }

    const followersData = await followersRes.json();
    
    const leads = (followersData.data || []).map((user: any) => ({
      name: user.name,
      username: user.username,
      company: extractCompany(user.description),
      title: user.description?.slice(0, 100),
      source: "twitter",
      url: `https://twitter.com/${user.username}`,
      followers: user.public_metrics?.followers_count,
      following: user.public_metrics?.following_count,
      tweets: user.public_metrics?.tweet_count,
      website: user.url,
      location: user.location,
    }));

    return NextResponse.json({
      leads,
      total: followersData.meta?.result_count || leads.length,
      target: username,
      type,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractCompany(bio: string | null): string | undefined {
  if (!bio) return undefined;
  
  // Look for common patterns
  const patterns = [
    /(?:@|at\s+)(\w+)/i,
    /(?:founder|ceo|cto|head|vp|director)\s+(?:of|at|@)\s+(\w+)/i,
    /(?:building|working on)\s+(\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = bio.match(pattern);
    if (match) return match[1];
  }

  return undefined;
}
