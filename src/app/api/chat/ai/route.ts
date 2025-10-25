import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];

    const response = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages,
      max_tokens: 1000,
    });

    const reply = response.choices[0]?.message?.content;
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("AI route error:", err);
    return new NextResponse(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}