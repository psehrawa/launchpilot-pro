import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an expert cold email copywriter. Write short, personalized cold emails that get replies.

Rules:
- Keep it under 100 words
- No fluff, no filler phrases like "I hope this finds you well"
- Start with something specific about them (not generic)
- Focus on their pain, not your features
- One clear CTA (book a call, reply, check link)
- Sound human, not salesy
- Use their first name naturally
- Reference their company/role when relevant

Output ONLY the email body. No subject line, no signature.`;

export async function POST(request: NextRequest) {
  try {
    const { lead, context, tone = "professional", goal = "book_call" } = await request.json();

    if (!lead) {
      return NextResponse.json({ error: "Lead data required" }, { status: 400 });
    }

    const prompt = buildPrompt(lead, context, tone, goal);

    // Try multiple providers in order
    let email = "";
    let provider = "";

    // 1. Try Groq (free, fast)
    if (process.env.GROQ_API_KEY) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-70b-versatile",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt },
            ],
            max_tokens: 300,
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          email = data.choices?.[0]?.message?.content || "";
          provider = "groq";
        }
      } catch (err) {
        console.error("Groq error:", err);
      }
    }

    // 2. Try OpenAI
    if (!email && process.env.OPENAI_API_KEY) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt },
            ],
            max_tokens: 300,
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          email = data.choices?.[0]?.message?.content || "";
          provider = "openai";
        }
      } catch (err) {
        console.error("OpenAI error:", err);
      }
    }

    // 3. Fallback to template
    if (!email) {
      email = generateFallbackEmail(lead, goal);
      provider = "template";
    }

    // Generate subject line
    const subject = generateSubject(lead, goal);

    return NextResponse.json({
      email: email.trim(),
      subject,
      provider,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function buildPrompt(lead: any, context: string | undefined, tone: string, goal: string): string {
  const goalDescriptions: Record<string, string> = {
    book_call: "get them to book a 15-minute call",
    get_reply: "get them to reply with their interest",
    share_resource: "get them to check out a resource/link",
    intro_request: "ask for an introduction to the right person",
  };

  return `Write a cold email to:
Name: ${lead.first_name || lead.name || "there"} ${lead.last_name || ""}
Company: ${lead.company || "their company"}
Title: ${lead.title || ""}
${lead.source ? `Found via: ${lead.source}` : ""}
${lead.followers ? `Social following: ${lead.followers}` : ""}
${lead.karma ? `HN karma: ${lead.karma}` : ""}
${lead.bio ? `Bio: ${lead.bio}` : ""}

${context ? `Additional context: ${context}` : ""}

Tone: ${tone}
Goal: ${goalDescriptions[goal] || goal}

Write the email now:`;
}

function generateSubject(lead: any, goal: string): string {
  const company = lead.company || "your company";
  const firstName = lead.first_name || lead.name?.split(" ")[0] || "";

  const subjects = [
    `Quick question about ${company}`,
    `Idea for ${company}`,
    `${firstName} - quick thought`,
    `Re: ${company}`,
    `15 min this week?`,
  ];

  return subjects[Math.floor(Math.random() * subjects.length)];
}

function generateFallbackEmail(lead: any, goal: string): string {
  const name = lead.first_name || lead.name?.split(" ")[0] || "there";
  const company = lead.company || "your company";

  return `Hi ${name},

I came across ${company} and was impressed by what you're building.

I'm working on something that might be relevant - would you be open to a quick 15-minute chat this week?

No pressure either way, just thought it might be worth connecting.

Best,
[Your name]`;
}
