import { extractText } from "unpdf";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("pdf") as File;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { text } = await extractText(new Uint8Array(buffer));

  return Response.json({ text });
}
