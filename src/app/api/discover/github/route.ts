import { NextRequest, NextResponse } from "next/server";

interface GitHubUser {
  login: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  company: string | null;
  blog: string | null;
  twitter_username: string | null;
  followers: number;
  public_repos: number;
}

export async function POST(request: NextRequest) {
  try {
    const { repo, type = "stargazers", limit = 50 } = await request.json();

    if (!repo) {
      return NextResponse.json({ error: "Repository required (owner/repo)" }, { status: 400 });
    }

    const [owner, repoName] = repo.split("/");
    if (!owner || !repoName) {
      return NextResponse.json({ error: "Invalid format. Use: owner/repo" }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "LaunchPilot-Pro",
    };
    
    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`;
    }

    // Get stargazers or contributors
    const endpoint = type === "contributors" 
      ? `https://api.github.com/repos/${owner}/${repoName}/contributors?per_page=${limit}`
      : `https://api.github.com/repos/${owner}/${repoName}/stargazers?per_page=${limit}`;

    const res = await fetch(endpoint, { headers });
    
    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ 
        error: error.message || "GitHub API error",
        hint: res.status === 403 ? "Rate limited. Add GITHUB_TOKEN to env" : undefined
      }, { status: res.status });
    }

    const users = await res.json();
    const leads: any[] = [];

    // Fetch detailed info for each user (with rate limiting)
    for (const user of users.slice(0, Math.min(limit, 30))) {
      try {
        const userRes = await fetch(`https://api.github.com/users/${user.login}`, { headers });
        
        if (userRes.ok) {
          const userData: GitHubUser = await userRes.json();
          
          leads.push({
            name: userData.name || userData.login,
            email: userData.email || undefined,
            company: userData.company?.replace(/^@/, "") || undefined,
            title: userData.bio?.slice(0, 100) || undefined,
            source: "github",
            url: `https://github.com/${userData.login}`,
            twitter: userData.twitter_username || undefined,
            website: userData.blog || undefined,
            followers: userData.followers,
            repos: userData.public_repos,
            username: userData.login,
          });
        }

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        // Skip failed user fetches
      }
    }

    return NextResponse.json({
      leads,
      total: users.length,
      repo: `${owner}/${repoName}`,
      type,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
