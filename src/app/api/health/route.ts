import { NextResponse } from "next/server";

export async function GET() {
  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      resend: !!process.env.RESEND_API_KEY,
      hunter: !!process.env.HUNTER_API_KEY,
      github: !!process.env.GITHUB_TOKEN,
      twitter: !!process.env.TWITTER_BEARER_TOKEN,
      producthunt: !!process.env.PRODUCTHUNT_TOKEN,
    },
  };

  return NextResponse.json(status);
}
