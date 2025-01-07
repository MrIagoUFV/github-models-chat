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
        { role: "system", content: "You are a direct and precise assistant. Always provide factual, straightforward answers without speculation or creativity. Stick strictly to what is asked." },
        ...messages
      ],
      model: process.env.NEXT_PUBLIC_GITHUB_MODEL || "gpt-4o",
      stream: true,
      temperature: 0,
      top_p: 1,
      max_tokens: 4096,
      frequency_penalty: 0,
      presence_penalty: 0,
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
