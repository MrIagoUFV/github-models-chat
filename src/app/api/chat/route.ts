import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ 
  baseURL: process.env.NEXT_PUBLIC_GITHUB_ENDPOINT,
  apiKey: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const stream = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        ...messages
      ],
      model: process.env.NEXT_PUBLIC_GITHUB_MODEL || "gpt-4o",
      stream: true,
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 1000,
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        for await (const part of stream) {
          const text = part.choices[0]?.delta?.content || '';
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new NextResponse(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 