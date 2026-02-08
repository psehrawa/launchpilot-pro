import { NextRequest, NextResponse } from "next/server";

// Email enrichment API - finds and verifies emails from multiple providers

interface EnrichmentResult {
  success: boolean;
  email?: string;
  emails?: string[];
  verified?: boolean;
  confidence?: number;
  source?: string;
  error?: string;
}

// Hunter.io API
async function findEmailHunter(
  domain: string,
  firstName?: string,
  lastName?: string
): Promise<EnrichmentResult> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Hunter API key not configured" };
  }

  try {
    // If we have name, use email finder
    if (firstName && lastName) {
      const url = new URL("https://api.hunter.io/v2/email-finder");
      url.searchParams.set("domain", domain);
      url.searchParams.set("first_name", firstName);
      url.searchParams.set("last_name", lastName);
      url.searchParams.set("api_key", apiKey);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.data?.email) {
        return {
          success: true,
          email: data.data.email,
          confidence: data.data.score,
          verified: data.data.verification?.status === "valid",
          source: "hunter",
        };
      }
    }

    // Otherwise, domain search
    const url = new URL("https://api.hunter.io/v2/domain-search");
    url.searchParams.set("domain", domain);
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.data?.emails?.length > 0) {
      const emails = data.data.emails.map((e: { value: string }) => e.value);
      return {
        success: true,
        emails,
        email: emails[0],
        source: "hunter",
      };
    }

    return { success: false, error: "No emails found", source: "hunter" };
  } catch (error) {
    return { success: false, error: String(error), source: "hunter" };
  }
}

// Snov.io API
async function findEmailSnov(domain: string): Promise<EnrichmentResult> {
  const clientId = process.env.SNOV_CLIENT_ID;
  const clientSecret = process.env.SNOV_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { success: false, error: "Snov.io credentials not configured" };
  }

  try {
    // Get access token
    const tokenRes = await fetch("https://api.snov.io/v1/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    if (!token) {
      return { success: false, error: "Failed to get Snov token" };
    }

    // Domain search
    const url = new URL("https://api.snov.io/v2/domain-emails-with-info");
    url.searchParams.set("domain", domain);
    url.searchParams.set("type", "all");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.emails?.length > 0) {
      const emails = data.emails.map((e: { email: string }) => e.email);
      return {
        success: true,
        emails,
        email: emails[0],
        source: "snov",
      };
    }

    return { success: false, error: "No emails found", source: "snov" };
  } catch (error) {
    return { success: false, error: String(error), source: "snov" };
  }
}

// Clearout Verification
async function verifyEmailClearout(email: string): Promise<EnrichmentResult> {
  const apiKey = process.env.CLEAROUT_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Clearout API key not configured" };
  }

  try {
    const res = await fetch("https://api.clearout.io/v2/email_verify/instant", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    const status = data.data?.status;
    const isValid = ["valid", "catch_all"].includes(status);

    return {
      success: true,
      email,
      verified: isValid,
      confidence: isValid ? 95 : 30,
      source: "clearout",
    };
  } catch (error) {
    return { success: false, error: String(error), source: "clearout" };
  }
}

// Main enrichment endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, firstName, lastName, email, action = "find" } = body;

    if (action === "verify" && email) {
      // Verify existing email
      const result = await verifyEmailClearout(email);
      return NextResponse.json(result);
    }

    if (!domain) {
      return NextResponse.json(
        { success: false, error: "Domain is required" },
        { status: 400 }
      );
    }

    // Try multiple providers in order
    let result: EnrichmentResult;

    // 1. Try Hunter first
    result = await findEmailHunter(domain, firstName, lastName);
    if (result.success && result.email) {
      // Verify the found email
      const verification = await verifyEmailClearout(result.email);
      return NextResponse.json({
        ...result,
        verified: verification.verified,
      });
    }

    // 2. Try Snov.io
    result = await findEmailSnov(domain);
    if (result.success && result.email) {
      const verification = await verifyEmailClearout(result.email);
      return NextResponse.json({
        ...result,
        verified: verification.verified,
      });
    }

    return NextResponse.json({
      success: false,
      error: "No emails found from any provider",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint for checking available providers
export async function GET() {
  const providers = {
    hunter: !!process.env.HUNTER_API_KEY,
    snov: !!process.env.SNOV_CLIENT_ID && !!process.env.SNOV_CLIENT_SECRET,
    clearout: !!process.env.CLEAROUT_API_KEY,
  };

  const configured = Object.values(providers).filter(Boolean).length;

  return NextResponse.json({
    providers,
    configured,
    message:
      configured === 0
        ? "No enrichment providers configured. Add API keys to .env"
        : `${configured} provider(s) configured`,
  });
}
