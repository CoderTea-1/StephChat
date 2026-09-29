import { Redis } from "@upstash/redis";

// Robust fallback to support both standard Upstash and Vercel KV environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "",
  token:
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "",
});

<<<<<<< Updated upstream
// Default settings matching your CSS values
=======
// In-Memory TTL Cache State
let cachedSettings = null;
let cachedBannedWords = null;
let cachedAllowedWords = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 1800000; // 30 minute cache duration

// Default settings matching your CSS values (removed sensitive keys from editable Redis storage)
>>>>>>> Stashed changes
const defaultSettings = {
  twitchChannel: "",
  kickChannel: "",
  ytHandle: "",
  ytApiKey: "",
  pinnedAnnouncement: "",
  userboxColor: "#af98dc",     // Matches the RGB from --header-bg
  userboxOpacity: "0.9",      // Matches the alpha from --header-bg
  msgboxColor: "#ff69b4",     // Matches the RGB from --message-bg
  msgboxOpacity: "0.6",     // Matches the alpha from --message-bg
  textColor: "#ffffff"
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
<<<<<<< Updated upstream
      const settings = (await redis.get("app_settings")) || defaultSettings;
      return res.status(200).json(settings);
=======
      const now = Date.now();

      // Return from in-memory cache if valid
      if (cachedSettings && now - cacheTimestamp < CACHE_TTL_MS) {
        return res.status(200).json({
          settings: cachedSettings,
          bannedWords: cachedBannedWords,
        });
      }

      // Otherwise fetch from Redis with graceful error handling
      let settings = { ...defaultSettings };
      let bannedWords = [];

      try {
        settings = (await redis.get("app_settings")) || { ...defaultSettings };
        bannedWords = (await redis.get("banned_words")) || [];
      } catch (redisErr) {
        console.warn(
          "[Redis Connection/Auth Warning] Using default configurations:",
          redisErr.message,
        );
      }

      // Always inject the environment variable versions of the secrets server-side
      settings.ytApiKey = process.env.YT_API_KEY || "";
      settings.giphyApiKey = process.env.GIPHY_API_KEY || "";
      settings.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";

      // Update in-memory cache
      cachedSettings = settings;
      cachedBannedWords = bannedWords;
      cacheTimestamp = now;

      return res.status(200).json({ settings, bannedWords });
>>>>>>> Stashed changes
    } catch (error) {
      // Detailed inspection logging for debugging
      console.error("--- DEBUG API GET ERROR ---");
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      console.error(
        "URL Env Present:",
        !!process.env.UPSTASH_REDIS_REST_URL || !!process.env.KV_REST_API_URL,
      );
      console.error(
        "Token Env Present:",
        !!process.env.UPSTASH_REDIS_REST_TOKEN ||
          !!process.env.KV_REST_API_TOKEN,
      );

      const fallbackSettings = { ...defaultSettings };
      fallbackSettings.ytApiKey = process.env.YT_API_KEY || "";
      fallbackSettings.giphyApiKey = process.env.GIPHY_API_KEY || "";
      fallbackSettings.discordWebhookUrl =
        process.env.DISCORD_WEBHOOK_URL || "";

      return res.status(200).json({
        settings: fallbackSettings,
        bannedWords: [],
        allowedWords: [],
        errorDebug: error.message,
        warning:
          "Served fallback data due to an environment or connection exception.",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body;

<<<<<<< Updated upstream
      if (body.action === "clear") {
        await redis.del("app_settings");
        return res.status(200).json({ success: true, settings: defaultSettings });
      }

      // Fetch current settings, merge new updates, and save back
      let currentSettings = (await redis.get("app_settings")) || { ...defaultSettings };
=======
      // Prevent saving hardcoded/client-edited sensitive keys back to Redis
      if (body.ytApiKey) delete body.ytApiKey;
      if (body.giphyApiKey) delete body.giphyApiKey;
      if (body.discordWebhookUrl) delete body.discordWebhookUrl;

      // Invalidate cache immediately on any write/mutation operation
      invalidateCache();

      // 1. Import bulk GitHub list action
      if (body.action === "import_github_lists") {
        const externalWords = body.words || [];
        let currentBanned = [];
        try {
          currentBanned = (await redis.get("banned_words")) || [];
        } catch (e) {}

        const combined = [
          ...new Set([
            ...currentBanned,
            ...externalWords.map((w) => w.toLowerCase()),
          ]),
        ];

        try {
          await redis.set("banned_words", combined);
        } catch (e) {}

        return res.status(200).json({ success: true, bannedWords: combined });
      }

      // Add a custom banned word action
      if (body.action === "add_banned_word") {
        const word = body.word ? body.word.trim().toLowerCase() : "";
        if (!word) return res.status(400).json({ error: "No word provided" });

        let currentBanned = [];
        try {
          currentBanned = (await redis.get("banned_words")) || [];
        } catch (e) {}

        if (!currentBanned.includes(word)) {
          currentBanned.push(word);
          try {
            await redis.set("banned_words", currentBanned);
          } catch (e) {}
        }
        return res
          .status(200)
          .json({ success: true, bannedWords: currentBanned });
      }

      // Remove a custom banned word action
      if (body.action === "remove_banned_word") {
        const word = body.word ? body.word.trim().toLowerCase() : "";
        invalidateCache();
        let currentBanned = [];
        try {
          currentBanned = (await redis.get("banned_words")) || [];
        } catch (e) {}

        currentBanned = currentBanned.filter((w) => w !== word);
        try {
          await redis.set("banned_words", currentBanned);
        } catch (e) {}

        return res
          .status(200)
          .json({ success: true, bannedWords: currentBanned });
      }

      // Clear app settings action
      if (body.action === "clear") {
        try {
          await redis.del("app_settings");
        } catch (e) {}

        let freshSettings = { ...defaultSettings };
        freshSettings.ytApiKey = process.env.YT_API_KEY || "";
        freshSettings.giphyApiKey = process.env.GIPHY_API_KEY || "";
        freshSettings.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
        return res.status(200).json({ success: true, settings: freshSettings });
      }

      // Fetch current settings, merge new updates, and save back
      let currentSettings = { ...defaultSettings };
      try {
        currentSettings = (await redis.get("app_settings")) || {
          ...defaultSettings,
        };
      } catch (e) {}
>>>>>>> Stashed changes

      if (body.action === "clear_colors") {
        // Reset colors/opacities directly back to CSS defaults instead of leaving them empty
        currentSettings.userboxColor = defaultSettings.userboxColor;
        currentSettings.userboxOpacity = defaultSettings.userboxOpacity;
        currentSettings.msgboxColor = defaultSettings.msgboxColor;
        currentSettings.msgboxOpacity = defaultSettings.msgboxOpacity;
        currentSettings.textColor = defaultSettings.textColor;
      } else if (body.action === "clear_emotes") {
        // Completely remove any stored emote toggle keys from the saved object
        Object.keys(currentSettings).forEach((key) => {
          if (key.startsWith("emote_toggle_")) {
            delete currentSettings[key];
          }
        });
      } else {
        // General merge of incoming settings payload on "Connect"
        currentSettings = { ...currentSettings, ...body };
      }

<<<<<<< Updated upstream
      await redis.set("app_settings", currentSettings);
      return res.status(200).json({ success: true, settings: currentSettings });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to save settings" });
=======
      try {
        await redis.set("app_settings", currentSettings);
      } catch (e) {}

      // Re-attach env keys to response
      currentSettings.ytApiKey = process.env.YT_API_KEY || "";
      currentSettings.giphyApiKey = process.env.GIPHY_API_KEY || "";
      currentSettings.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";

      return res.status(200).json({ success: true, settings: currentSettings });
    } catch (error) {
      // Detailed inspection logging for debugging
      console.error("--- DEBUG API POST ERROR ---");
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      console.error("Request Body Action:", body?.action);

      if (process.env.DISCORD_WEBHOOK_URL) {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `🚨 **Error in Settings API:** \`${error.message}\``,
          }),
        }).catch(() => {});
      }
      return res.status(200).json({
        success: true,
        settings: defaultSettings,
        errorDebug: error.message,
        warning: "Handled save action via local fallback safely.",
      });
>>>>>>> Stashed changes
    }
  }

  return res
    .status(405)
    .setHeader("Allow", ["GET", "POST"])
    .end(`Method ${req.method} Not Allowed`);
}