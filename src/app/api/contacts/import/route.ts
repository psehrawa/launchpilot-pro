import { NextRequest, NextResponse } from "next/server";

// Contact import endpoint - accepts CSV data or JSON array

interface ImportContact {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  linkedinUrl?: string;
  tags?: string[];
  source?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  contacts: ImportContact[];
}

function parseCSV(csvText: string): ImportContact[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const contacts: ImportContact[] = [];

  // Map common header variations
  const headerMap: Record<string, keyof ImportContact> = {
    email: "email",
    "e-mail": "email",
    "email address": "email",
    firstname: "firstName",
    "first name": "firstName",
    "first_name": "firstName",
    lastname: "lastName",
    "last name": "lastName",
    "last_name": "lastName",
    company: "company",
    "company name": "company",
    organization: "company",
    title: "title",
    "job title": "title",
    "job_title": "title",
    position: "title",
    phone: "phone",
    "phone number": "phone",
    linkedin: "linkedinUrl",
    "linkedin url": "linkedinUrl",
    tags: "tags",
  };

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const contact: Partial<ImportContact> = {};

    headers.forEach((header, index) => {
      const mappedField = headerMap[header];
      if (mappedField && values[index]) {
        if (mappedField === "tags") {
          contact.tags = values[index].split(";").map((t) => t.trim());
        } else {
          (contact as Record<string, string>)[mappedField] = values[index];
        }
      }
    });

    if (contact.email && isValidEmail(contact.email)) {
      contacts.push(contact as ImportContact);
    }
  }

  return contacts;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let contacts: ImportContact[] = [];
    const errors: string[] = [];

    if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      // Handle CSV upload
      const csvText = await request.text();
      contacts = parseCSV(csvText);
    } else if (contentType.includes("application/json")) {
      // Handle JSON array
      const body = await request.json();
      
      if (Array.isArray(body)) {
        contacts = body;
      } else if (body.contacts && Array.isArray(body.contacts)) {
        contacts = body.contacts;
      } else if (body.csv) {
        contacts = parseCSV(body.csv);
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid request format" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported content type" },
        { status: 400 }
      );
    }

    // Validate and clean contacts
    const validContacts: ImportContact[] = [];
    const skipped: string[] = [];

    for (const contact of contacts) {
      if (!contact.email) {
        errors.push("Contact missing email");
        continue;
      }

      if (!isValidEmail(contact.email)) {
        skipped.push(contact.email);
        errors.push(`Invalid email: ${contact.email}`);
        continue;
      }

      // Clean and normalize
      validContacts.push({
        email: contact.email.toLowerCase().trim(),
        firstName: contact.firstName?.trim(),
        lastName: contact.lastName?.trim(),
        company: contact.company?.trim(),
        title: contact.title?.trim(),
        phone: contact.phone?.trim(),
        linkedinUrl: contact.linkedinUrl?.trim(),
        tags: contact.tags || [],
        source: contact.source || "import",
      });
    }

    // TODO: Save to database via Supabase
    // For now, just return the parsed data

    const result: ImportResult = {
      success: true,
      imported: validContacts.length,
      skipped: skipped.length,
      errors: errors.slice(0, 10), // Limit error messages
      contacts: validContacts,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint - returns import template
export async function GET() {
  const template = `email,firstName,lastName,company,title,phone,linkedinUrl,tags
john@example.com,John,Doe,Acme Inc,CEO,+1234567890,https://linkedin.com/in/johndoe,lead;enterprise
jane@startup.com,Jane,Smith,Startup Co,CTO,,,hot-lead;tech`;

  return new NextResponse(template, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="contacts_template.csv"',
    },
  });
}
