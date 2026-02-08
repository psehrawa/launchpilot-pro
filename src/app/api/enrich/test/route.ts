import { NextRequest, NextResponse } from "next/server";

// Test Hunter API directly
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || "intercom.com";
  
  const apiKey = process.env.HUNTER_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: "No API key" });
  }

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    return NextResponse.json({
      status: res.status,
      hasEmails: data.data?.emails?.length > 0,
      emailCount: data.data?.emails?.length || 0,
      firstEmail: data.data?.emails?.[0]?.value || null,
      errors: data.errors || null,
      meta: data.meta || null,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) });
  }
}
