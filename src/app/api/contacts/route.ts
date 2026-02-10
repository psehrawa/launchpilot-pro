import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all contacts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("lp_contacts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      contacts: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST - Create new contact
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get default org
    const { data: org } = await supabase
      .from("lp_organizations")
      .select("id")
      .eq("slug", "default")
      .single();

    if (!org) {
      return NextResponse.json(
        { success: false, error: "No organization found" },
        { status: 400 }
      );
    }

    const contact = {
      org_id: org.id,
      email: body.email || null,
      first_name: body.firstName || body.first_name,
      last_name: body.lastName || body.last_name,
      company: body.company,
      title: body.title,
      status: body.status || "new",
      tags: body.tags || [],
      email_verified: body.email_verified || false,
      linkedin_url: body.linkedin_url || null,
      source: body.source || "manual",
    };

    const { data, error } = await supabase
      .from("lp_contacts")
      .insert([contact])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, contact: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Delete contacts
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const ids = body.ids || [body.id];

    const { error } = await supabase
      .from("lp_contacts")
      .delete()
      .in("id", ids);

    if (error) throw error;

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
