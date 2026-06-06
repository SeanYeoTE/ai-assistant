import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  const { question, pdfText } = await req.json();

  const systemPrompt = pdfText
    ? `You are a helpful assistant. Answer questions based on this document:\n\n${pdfText}`
    : "You are a helpful assistant.";

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: question }],
  });

  const answer =
    message.content[0].type === "text" ? message.content[0].text : "";

  return Response.json({ answer });
}
