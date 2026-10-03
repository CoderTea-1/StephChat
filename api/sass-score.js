// api/sass-score.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, channel } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // Prompt-driven server-side evaluation via Groq's fast, free-tier LLM API
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      // Fallback if API key isn't provided yet
      return res.status(200).json({
        message: `@${username}'s sassmeter is reading at a cool 85%! (Configure GROQ_API_KEY for live AI generation)`
      });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a witty Twitch chat bot helper. Generate a fun, playful, or teasing response evaluating a user's 'sassiness' level (from 0% to 100%) as if tracking their behavior over the past 24 hours. Keep it punchy, under 2 sentences, and ready to be printed directly into Twitch chat."
          },
          {
            role: "user",
            content: `Calculate the sassmeter score for user ${username} in channel ${channel}.`
          }
        ],
        temperature: 0.8,
        max_tokens: 60
      })
    });

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content?.trim() || `@${username} is radiating a 90% sass level today!`;

    return res.status(200).json({ message: aiMessage });

  } catch (error) {
    console.error("LLM Sass calculation error:", error);
    return res.status(200).json({
      message: `@${username} breaks the sassmeter completely today—too spicy to measure!`
    });
  }
}



//groq
// To test your new setup, you will need to test both pieces: sass-score.js (the server endpoint running the LLM) and bot.js (your Twitch bot connecting to IRC).

// Here is a step-by-step guide to testing everything locally and in production.

// Step 1: Get a Free Groq API Key
// Since sass-score.js uses Groq (which provides a free-tier API with fast server-side LLM inference and no client-side overhead), you need an API key:

// Go to the Groq Console.

// Create a free account and generate an API key.

// Keep this key handy for the next step.

// Step 2: Test the Server-Side Endpoint (sass-score.js)
// If you are deploying to Vercel, make sure to add GROQ_API_KEY to your Vercel project environment variables.

// To test it locally before deploying:

// Install dependencies and create a .env file in your project root:

// Code snippet
// GROQ_API_KEY=your_actual_groq_api_key_here
// Run your local server (or use a tool like curl or Postman once your local API route is running).

// Send a test POST request using curl in your terminal:

// Bash
// curl -X POST http://localhost:3000/api/sass-score \
// -H "Content-Type: application/json" \
// -d '{"username": "testuser", "channel": "stephychat"}'
// Expected result: You should get a JSON response back containing a witty AI-generated response, like {"message": "@testuser is radiating a 90% sass level today!"}.

// Step 3: Test the Twitch Bot (bot.js)
// Make sure your bot environment has its required tokens configured (either in a .env file or your hosting environment):

// TWITCH_OAUTH_TOKEN (your bot's OAuth token starting with oauth:...)

// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (for Discord logging/settings, though message logging has been removed)

// Run your bot script locally from your terminal:

// Bash
// node bot.js
// Check your Discord webhook or console logs to confirm it successfully connects:

// [Bot.js] Connected to Twitch IRC server at chat.twitch.tv:6667...

// Open your Twitch channel (stephychat or sassinatorsteph) in your browser.

// Type the command in chat:

// Plaintext
// !sassmeter
// or test mentioning another user:

// Plaintext
// !sassmeter Masster_tea