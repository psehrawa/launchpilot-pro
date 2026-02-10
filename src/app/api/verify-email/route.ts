import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Email verification using NeverBounce API (free tier: 1000 verifications)
// Alternative: Clearout API
async function verifyEmailNeverBounce(email: string): Promise<{
  valid: boolean;
  status: "valid" | "invalid" | "unknown" | "disposable" | "catchall";
  reason?: string;
}> {
  const apiKey = process.env.NEVERBOUNCE_API_KEY;
  
  if (!apiKey) {
    // Fallback: basic regex + MX check simulation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, status: "invalid", reason: "Invalid format" };
    }
    // Return unknown without API key
    return { valid: true, status: "unknown", reason: "API key not configured - basic validation only" };
  }

  try {
    const response = await fetch("https://api.neverbounce.com/v4/single/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: apiKey,
        email: email,
      }),
    });

    const data = await response.json();

    if (data.status === "success") {
      const result = data.result;
      // NeverBounce result codes: valid, invalid, disposable, catchall, unknown
      const statusMap: Record<string, { valid: boolean; status: "valid" | "invalid" | "unknown" | "disposable" | "catchall" }> = {
        valid: { valid: true, status: "valid" },
        invalid: { valid: false, status: "invalid" },
        disposable: { valid: false, status: "disposable" },
        catchall: { valid: true, status: "catchall" },
        unknown: { valid: true, status: "unknown" },
      };
      
      return statusMap[result] || { valid: true, status: "unknown" };
    }

    return { valid: true, status: "unknown", reason: data.message || "API error" };
  } catch (error: any) {
    console.error("NeverBounce error:", error);
    return { valid: true, status: "unknown", reason: error.message };
  }
}

// Verify using Clearout as fallback (free tier: 100 verifications)
async function verifyEmailClearout(email: string): Promise<{
  valid: boolean;
  status: "valid" | "invalid" | "unknown" | "disposable" | "catchall";
  reason?: string;
}> {
  const apiKey = process.env.CLEAROUT_API_KEY;
  
  if (!apiKey) {
    return verifyEmailNeverBounce(email);
  }

  try {
    const response = await fetch("https://api.clearout.io/v2/email_verify/instant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.status === "valid") {
      return { valid: true, status: "valid" };
    } else if (data.status === "invalid") {
      return { valid: false, status: "invalid", reason: data.sub_status };
    } else if (data.status === "catch_all") {
      return { valid: true, status: "catchall" };
    } else if (data.status === "disposable") {
      return { valid: false, status: "disposable" };
    }

    return { valid: true, status: "unknown" };
  } catch (error: any) {
    console.error("Clearout error:", error);
    // Fallback to NeverBounce
    return verifyEmailNeverBounce(email);
  }
}

// POST - Verify a single email
export async function POST(request: NextRequest) {
  try {
    const { email, contact_id } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Try Clearout first, then NeverBounce
    const result = await verifyEmailClearout(email);

    // Update contact if contact_id provided
    if (contact_id) {
      await supabase
        .from("lp_contacts")
        .update({
          email_verified: result.valid,
          email_verification_status: result.status,
        })
        .eq("id", contact_id);
    }

    return NextResponse.json({
      success: true,
      email,
      ...result,
    });
  } catch (error: any) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/verify-email/batch - Verify multiple emails
export async function PUT(request: NextRequest) {
  try {
    const { contact_ids } = await request.json();

    if (!contact_ids || contact_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "contact_ids required" },
        { status: 400 }
      );
    }

    // Get contacts
    const { data: contacts } = await supabase
      .from("lp_contacts")
      .select("id, email")
      .in("id", contact_ids);

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No contacts found" },
        { status: 404 }
      );
    }

    const results: { email: string; status: string; valid: boolean }[] = [];

    for (const contact of contacts) {
      const result = await verifyEmailClearout(contact.email);
      
      await supabase
        .from("lp_contacts")
        .update({
          email_verified: result.valid,
          email_verification_status: result.status,
        })
        .eq("id", contact.id);

      results.push({
        email: contact.email,
        status: result.status,
        valid: result.valid,
      });

      // Rate limit: 100ms between requests
      await new Promise((r) => setTimeout(r, 100));
    }

    const valid = results.filter((r) => r.valid).length;
    const invalid = results.filter((r) => !r.valid).length;

    return NextResponse.json({
      success: true,
      total: results.length,
      valid,
      invalid,
      results,
    });
  } catch (error: any) {
    console.error("Batch verify error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
