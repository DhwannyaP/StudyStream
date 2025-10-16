import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY_ENV_VAR ||
    "default_key",
});

export interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  reason?: string;
  suggestedAction?: string;
}

export async function moderateMessage(
  content: string
): Promise<ModerationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI moderator for educational discussions. Analyze the message for:
          1. Educational relevance
          2. Appropriate language
          3. Respectful communication
          4. No harmful content
          
          Respond with JSON in this format: 
          {
            "isAppropriate": boolean,
            "confidence": number (0-1),
            "reason": "explanation if inappropriate",
            "suggestedAction": "allow|warn|block"
          }`,
        },
        {
          role: "user",
          content: `Please moderate this educational chat message: "${content}"`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      isAppropriate: result.isAppropriate || false,
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
      reason: result.reason,
      suggestedAction: result.suggestedAction || "allow",
    };
  } catch (error) {
    console.error("Moderation error:", error);
    // Default to allowing message if moderation fails
    return {
      isAppropriate: true,
      confidence: 0.5,
      reason: "Moderation service unavailable",
      suggestedAction: "allow",
    };
  }
}

export async function generateStudyGroupSuggestions(
  topic: string,
  userLevel: string
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Generate study group name suggestions for educational topics. Respond with JSON array of 5 creative, professional study group names.
          Format: {"suggestions": ["name1", "name2", ...]}`,
        },
        {
          role: "user",
          content: `Topic: ${topic}, Level: ${userLevel}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.suggestions || [];
  } catch (error) {
    console.error("Study group suggestions error:", error);
    return [
      `${topic} Study Group`,
      `${topic} Learning Circle`,
      `${topic} Collaborative Study`,
    ];
  }
}

export async function answerQuestionWithPdf(
  question: string,
  fileUrl?: string
): Promise<string> {
  try {
    let context = "";
    if (fileUrl) {
      const normalized = String(fileUrl)
        .replace(/^\\\\/g, "")
        .replace(/^\/?/, "");
      const absPath = path.resolve(process.cwd(), normalized);
      if (fs.existsSync(absPath) && absPath.toLowerCase().endsWith(".pdf")) {
        try {
          const data = await fs.promises.readFile(absPath);
          const pdfMod: any = await import("pdf-parse");
          const pdfParseFn = pdfMod.default || pdfMod;
          const parsed = await pdfParseFn(data);
          context = String(parsed.text || "").slice(0, 15000);
        } catch (e) {
          console.warn("PDF parse failed, continuing without context");
        }
      }
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "You are a helpful study assistant. Use the provided PDF text context to answer briefly and accurately. If the answer is not in the context, say so clearly.",
      },
      {
        role: "user",
        content: `Context (may be truncated):\n${context}\n\nQuestion: ${question}`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
    });
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("AI answer error:", error);
    return "Sorry, I couldn't process that right now.";
  }
}
