import { NextResponse } from "next/server";

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const emails = body.emails;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const res = await fetch(
      "https://rapid-email-verifier.fly.dev/api/validate/batch",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      }
    );

    const text = await res.text();
    const parsed = safeJsonParse(text);

    if (!parsed || !parsed.results) {
      console.warn("Non-JSON or invalid response from verifier:", text);
      return NextResponse.json({ results: [] });
    }

    return NextResponse.json(parsed);

  } catch (err) {
    console.error("VERIFY API ERROR:", err);
    return NextResponse.json({ results: [] });
  }
}
