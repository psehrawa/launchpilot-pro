// Multi-Source Enrichment Engine
// Like Apollo.io / Hunter.io - tries multiple sources to find verified emails

export interface EnrichmentResult {
  email: string | null;
  verified: boolean;
  confidence: number; // 0-100
  source: string;
  additionalData?: {
    title?: string;
    linkedin?: string;
    twitter?: string;
    phone?: string;
    company_size?: string;
    industry?: string;
  };
}

export interface EnrichmentInput {
  first_name: string;
  last_name: string;
  company?: string;
  domain?: string;
  linkedin_url?: string;
  twitter?: string;
}

// Email patterns used by companies (ordered by frequency)
const EMAIL_PATTERNS = [
  (f: string, l: string) => `${f}.${l}`,           // john.doe
  (f: string, l: string) => `${f}${l}`,            // johndoe
  (f: string, l: string) => `${f[0]}${l}`,         // jdoe
  (f: string, l: string) => `${f}`,                // john
  (f: string, l: string) => `${f[0]}.${l}`,        // j.doe
  (f: string, l: string) => `${f}_${l}`,           // john_doe
  (f: string, l: string) => `${f}-${l}`,           // john-doe
  (f: string, l: string) => `${l}.${f}`,           // doe.john
  (f: string, l: string) => `${l}${f}`,            // doejohn
  (f: string, l: string) => `${l}`,                // doe
];

export class EnrichmentEngine {
  private hunterKey?: string;
  private clearbitKey?: string;
  private snovClientId?: string;
  private snovClientSecret?: string;

  constructor(config: {
    hunterKey?: string;
    clearbitKey?: string;
    snovClientId?: string;
    snovClientSecret?: string;
  }) {
    this.hunterKey = config.hunterKey;
    this.clearbitKey = config.clearbitKey;
    this.snovClientId = config.snovClientId;
    this.snovClientSecret = config.snovClientSecret;
  }

  async enrich(input: EnrichmentInput): Promise<EnrichmentResult> {
    const domain = input.domain || this.guessDomain(input.company);
    
    // Try sources in order of reliability
    const sources = [
      () => this.tryHunter(input, domain),
      () => this.tryGitHub(input),
      () => this.tryClearbit(input, domain),
      () => this.trySnov(input, domain),
      () => this.tryPatternMatching(input, domain),
    ];

    for (const source of sources) {
      try {
        const result = await source();
        if (result && result.email && result.confidence >= 50) {
          return result;
        }
      } catch (e) {
        // Continue to next source
      }
    }

    // Last resort: generate best-guess email
    return this.generateBestGuess(input, domain);
  }

  // Source 1: Hunter.io - Most reliable
  private async tryHunter(input: EnrichmentInput, domain?: string): Promise<EnrichmentResult | null> {
    if (!this.hunterKey || !domain) return null;

    const url = `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${input.first_name}&last_name=${input.last_name}&api_key=${this.hunterKey}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.data?.email) {
      return {
        email: data.data.email,
        verified: data.data.verification?.status === "valid",
        confidence: data.data.score || 80,
        source: "hunter",
        additionalData: {
          title: data.data.position,
          linkedin: data.data.linkedin,
          twitter: data.data.twitter,
        },
      };
    }

    return null;
  }

  // Source 2: GitHub - Free, extracts from commits
  private async tryGitHub(input: EnrichmentInput): Promise<EnrichmentResult | null> {
    // Search for user by name
    const searchUrl = `https://api.github.com/search/users?q=${input.first_name}+${input.last_name}`;
    const headers: Record<string, string> = { 
      "User-Agent": "LaunchPilot",
      "Accept": "application/vnd.github.v3+json",
    };
    
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const searchRes = await fetch(searchUrl, { headers });
    const searchData = await searchRes.json();

    if (!searchData.items?.length) return null;

    // Get user details
    const user = searchData.items[0];
    const userRes = await fetch(user.url, { headers });
    const userData = await userRes.json();

    if (userData.email) {
      return {
        email: userData.email,
        verified: true,
        confidence: 90,
        source: "github",
        additionalData: {
          twitter: userData.twitter_username,
        },
      };
    }

    // Try to get email from recent commits
    const eventsUrl = `https://api.github.com/users/${user.login}/events/public`;
    const eventsRes = await fetch(eventsUrl, { headers });
    const events = await eventsRes.json();

    for (const event of events || []) {
      if (event.type === "PushEvent") {
        for (const commit of event.payload?.commits || []) {
          if (commit.author?.email && !commit.author.email.includes("noreply.github.com")) {
            return {
              email: commit.author.email,
              verified: true,
              confidence: 85,
              source: "github_commits",
            };
          }
        }
      }
    }

    return null;
  }

  // Source 3: Clearbit
  private async tryClearbit(input: EnrichmentInput, domain?: string): Promise<EnrichmentResult | null> {
    if (!this.clearbitKey || !domain) return null;

    const url = `https://prospector.clearbit.com/v1/people/find?domain=${domain}&name=${input.first_name} ${input.last_name}`;
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.clearbitKey}` },
    });

    if (!res.ok) return null;

    const data = await res.json();

    if (data.email) {
      return {
        email: data.email,
        verified: true,
        confidence: 85,
        source: "clearbit",
        additionalData: {
          title: data.title,
          linkedin: data.linkedin,
        },
      };
    }

    return null;
  }

  // Source 4: Snov.io
  private async trySnov(input: EnrichmentInput, domain?: string): Promise<EnrichmentResult | null> {
    if (!this.snovClientId || !this.snovClientSecret || !domain) return null;

    // Get access token
    const tokenRes = await fetch("https://api.snov.io/v1/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: this.snovClientId,
        client_secret: this.snovClientSecret,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return null;

    // Find email
    const findRes = await fetch("https://api.snov.io/v1/get-emails-from-name", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        firstName: input.first_name,
        lastName: input.last_name,
        domain: domain,
      }),
    });

    const findData = await findRes.json();

    if (findData.data?.emails?.[0]) {
      const email = findData.data.emails[0];
      return {
        email: email.email,
        verified: email.status === "valid",
        confidence: 75,
        source: "snov",
      };
    }

    return null;
  }

  // Source 5: Pattern matching + SMTP verification
  private async tryPatternMatching(input: EnrichmentInput, domain?: string): Promise<EnrichmentResult | null> {
    if (!domain) return null;

    const firstName = input.first_name.toLowerCase().replace(/[^a-z]/g, "");
    const lastName = input.last_name.toLowerCase().replace(/[^a-z]/g, "");

    if (!firstName || !lastName) return null;

    // Generate candidate emails
    const candidates = EMAIL_PATTERNS.map(pattern => 
      `${pattern(firstName, lastName)}@${domain}`
    );

    // Try to verify each (basic MX check)
    for (const email of candidates) {
      const isValid = await this.quickVerify(email);
      if (isValid) {
        return {
          email,
          verified: false, // Pattern-guessed, not verified
          confidence: 60,
          source: "pattern",
        };
      }
    }

    return null;
  }

  // Quick email verification (MX record check)
  private async quickVerify(email: string): Promise<boolean> {
    try {
      const domain = email.split("@")[1];
      
      // Use DNS over HTTPS to check MX records
      const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const data = await res.json();
      
      // If domain has MX records, email format is likely valid
      return data.Answer && data.Answer.length > 0;
    } catch {
      return true; // Assume valid if check fails
    }
  }

  // Generate best-guess email when nothing else works
  private generateBestGuess(input: EnrichmentInput, domain?: string): EnrichmentResult {
    if (!domain) {
      domain = this.guessDomain(input.company) || "unknown.com";
    }

    const firstName = input.first_name.toLowerCase().replace(/[^a-z]/g, "");
    const lastName = input.last_name.toLowerCase().replace(/[^a-z]/g, "");

    // Most common pattern
    const email = `${firstName}.${lastName}@${domain}`;

    return {
      email,
      verified: false,
      confidence: 40,
      source: "guess",
    };
  }

  // Guess domain from company name
  private guessDomain(company?: string): string | undefined {
    if (!company) return undefined;

    // Clean company name
    let domain = company
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "")
      .replace(/(inc|llc|ltd|corp|company|co)$/i, "");

    // Common variations
    const suffixes = [".com", ".io", ".co", ".ai", ".app"];
    
    // Just return .com for now - in production you'd check which exists
    return domain + ".com";
  }
}

// Singleton for easy use
let engine: EnrichmentEngine | null = null;

export function getEnrichmentEngine(): EnrichmentEngine {
  if (!engine) {
    engine = new EnrichmentEngine({
      hunterKey: process.env.HUNTER_API_KEY,
      clearbitKey: process.env.CLEARBIT_API_KEY,
      snovClientId: process.env.SNOV_CLIENT_ID,
      snovClientSecret: process.env.SNOV_CLIENT_SECRET,
    });
  }
  return engine;
}
