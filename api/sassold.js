import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Accept messages passed directly from your Twitch IRC source or request body
  const username = req.method === "POST" ? req.body.username : req.query.username;
  const recentMessages = req.method === "POST" ? req.body.messages : [];

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    if (!recentMessages || recentMessages.length === 0) {
      return res.status(200).json({
        success: true,
        username,
        sassScore: 0,
        message: `@${username} hasn't said anything in chat yet, so their sass level is completely unmeasured!`,
      });
    }

    // Call free-tier Gemini Flash on the Vercel server side to evaluate behavior/sass[cite: 12]
    const { object } = await generateObject({
      model: google("gemini-2.0-flash"), // Fast, lightweight, and free tier friendly[cite: 12]
      schema: z.object({
        sassScore: z.number().min(1).max(100).describe("A score from 1 to 100 representing how sassy, sarcastic, or spicy the user's chat messages are."),
        remark: z.string().describe("A brief, humorous 1-sentence description of their chat personality based on the messages."),
      }),
      prompt: `You are a Twitch chat analyzer bot. Analyze the following recent chat messages from user "@${username}" and determine their "sass score" (1 to 100) and write a funny remark about their vibe.

Messages:
${recentMessages.map((m) => `- ${m}`).join("\n")}`,
    });

    const { sassScore, remark } = object;
    const responseMessage = `@${username} has a Sass Score of ${sassScore}/100 —${remark}`;

    return res.status(200).json({
      success: true,
      username,
      sassScore,
      message: responseMessage,
    });
  } catch (error) {
    if (process.env.DISCORD_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🚨 **Error in LLM Sass API:** \`${error.message}\``,
        }),
      }).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      error: "Failed to calculate sass score using AI.",
    });
  }
}