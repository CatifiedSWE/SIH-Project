import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model || "gemma4:2b",
        prompt: body.prompt,
        format: "json",
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Ollama error: ${response.statusText}`, details: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Ollama proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to local Ollama at http://127.0.0.1:11434", details: error.message },
      { status: 502 }
    );
  }
}

export async function GET() {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
    const res = await fetch(`${ollamaUrl}/api/tags`);
    if (!res.ok) throw new Error("Ollama tags request failed");
    const data = await res.json();
    return NextResponse.json({ status: "connected", models: data.models });
  } catch (err: any) {
    return NextResponse.json({ status: "disconnected", error: err.message }, { status: 503 });
  }
}
