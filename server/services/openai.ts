import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  reason?: string;
  suggestedAction?: string;
}

export async function moderateMessage(content: string): Promise<ModerationResult> {
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
          }`
        },
        {
          role: "user",
          content: `Please moderate this educational chat message: "${content}"`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      isAppropriate: result.isAppropriate || false,
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
      reason: result.reason,
      suggestedAction: result.suggestedAction || "allow"
    };
  } catch (error) {
    console.error("Moderation error:", error);
    // Default to allowing message if moderation fails
    return {
      isAppropriate: true,
      confidence: 0.5,
      reason: "Moderation service unavailable",
      suggestedAction: "allow"
    };
  }
}

export async function generateStudyGroupSuggestions(topic: string, userLevel: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Generate study group name suggestions for educational topics. Respond with JSON array of 5 creative, professional study group names.
          Format: {"suggestions": ["name1", "name2", ...]}`
        },
        {
          role: "user",
          content: `Topic: ${topic}, Level: ${userLevel}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.suggestions || [];
  } catch (error) {
    console.error("Study group suggestions error:", error);
    return [`${topic} Study Group`, `${topic} Learning Circle`, `${topic} Collaborative Study`];
  }
}
