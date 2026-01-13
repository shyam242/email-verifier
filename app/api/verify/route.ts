import { NextResponse } from "next/server";

const ABSTRACT_API_KEY = process.env.ABSTRACT_API_KEY!;

export async function POST(req: Request) {
  try {
    const { emails } = await req.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results: any[] = [];

    for (const email of emails) {
      try {
        const res = await fetch(
          `https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${encodeURIComponent(
            email
          )}`
        );

        const data = await res.json();
        results.push({ email, ...data });

        // ✅ rate-limit protection (important)
        await new Promise((r) => setTimeout(r, 1200));
      } catch {
        results.push({ email, error: true });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("VERIFY API ERROR:", err);
    return NextResponse.json({ results: [] });
  }
}
