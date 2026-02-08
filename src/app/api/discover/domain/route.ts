import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json({ error: "Domain required" }, { status: 400 });
    }

    const hunterKey = process.env.HUNTER_API_KEY;
    
    if (!hunterKey) {
      // Demo mode - return sample data
      return NextResponse.json({
        leads: [
          { name: "John Doe", email: `john@${domain}`, company: domain, title: "CEO", source: "hunter" },
          { name: "Jane Smith", email: `jane@${domain}`, company: domain, title: "CTO", source: "hunter" },
        ],
        demo: true,
      });
    }

    // Real Hunter.io domain search
    const res = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterKey}`
    );
    
    const data = await res.json();
    
    if (data.errors) {
      return NextResponse.json({ error: data.errors[0]?.details || "API error" }, { status: 400 });
    }

    const leads = (data.data?.emails || []).map((e: any) => ({
      name: `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.value.split("@")[0],
      email: e.value,
      company: data.data?.organization || domain,
      title: e.position || "",
      source: "hunter",
    }));

    return NextResponse.json({ leads, total: data.meta?.results || leads.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
