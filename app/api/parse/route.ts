import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface ParsedStudent {
  name: string;
  homework: string;
  sp: string | null;
  tx: string | null;
  uncertain: boolean;
}

function buildSystemPrompt(studentNames: string[]): string {
  const hasKnownList = studentNames.length > 0;
  const listSection = hasKnownList
    ? `Known student list for verification:\n${studentNames.map((n) => `- ${n}`).join("\n")}`
    : `No prior student list is available. Read all student names directly from the handwriting in the image.`;
  return `You are helping convert handwritten student progress notes into structured data.

${listSection}

Rules:
- Read the handwriting carefully${hasKnownList ? " and prioritize matching names from the known student list" : " and extract every student name visible on the sheet"}.
- Do NOT hallucinate names, scores, or comments.
- If something is unclear, mark it as [unclear] instead of guessing.
- Preserve scores, units, comments, and homework exactly as written.
- If homework is blank, use "NA".
- "SP" refers to spelling. "TX" refers to tingxie / Chinese spelling.
- Chinese text like 第九课 or 练习 should remain in Chinese.
- Do not invent missing information.

Return ONLY valid JSON. No explanation, no markdown, no backticks.
Return an array of student objects:
[
  {
    "name": "Student Name",
    "homework": "homework value or NA",
    "sp": "SP score or comment or null",
    "tx": "TX score or comment or null",
    "uncertain": false
  }
]

Set "uncertain": true if you were unsure about any value, if any field contains [unclear]${hasKnownList ? ", or if a name doesn't exactly match the known student list" : ""}.`;
}

function detectMediaType(
  base64: string
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  // Inspect the first few bytes of the base64 string to detect image format
  const prefix = base64.slice(0, 12);
  const bytes = Buffer.from(prefix, "base64");
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png"; // PNG: 89 50 4E 47
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return "image/gif"; // GIF: 47 49 46
  if (bytes[0] === 0x52 && bytes[4] === 0x57) return "image/webp"; // RIFF....WEBP
  return "image/jpeg"; // default
}

export async function POST(req: Request) {
  let imageBase64: string;
  let studentNames: string[];
  let className: string;

  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;
    studentNames = body.studentNames;
    className = body.className;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!imageBase64 || !Array.isArray(studentNames)) {
    return Response.json(
      { error: "Missing required fields: imageBase64, studentNames" },
      { status: 400 }
    );
  }

  const mediaType = detectMediaType(imageBase64);

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: buildSystemPrompt(studentNames),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            {
              type: "text",
              text: `Parse the handwritten progress notes in this image for class "${className}". Return JSON only.`,
            },
          ],
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let students: ParsedStudent[];
    try {
      students = JSON.parse(rawText) as ParsedStudent[];
    } catch {
      // Claude returned invalid JSON — return safe fallback for all students
      students = studentNames.map((name) => ({
        name,
        homework: "NA",
        sp: null,
        tx: null,
        uncertain: true,
      }));
    }

    return Response.json({ students });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
