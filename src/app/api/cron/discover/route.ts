import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Called daily by Vercel Cron at 8 AM UTC
export async function GET(request: NextRequest) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Call the auto-discover endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://launchpilot-pro.vercel.app";
    
    const res = await fetch(`${baseUrl}/api/discover/auto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sources: ["hackernews", "reddit"],
        limit: 30,
        auto_enrich: true,
      }),
    });

    const data = await res.json();

    console.log("Auto-discovery completed:", data);

    return NextResponse.json({
      success: true,
      ...data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron discover error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
