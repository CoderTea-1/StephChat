import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// In-Memory TTL Cache State
let cachedSettings = null;
let cachedBannedWords = null;
let cachedAllowedWords = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000; // 30 seconds cache duration

// Default settings matching your CSS values (removed sensitive keys from editable Redis storage)
const defaultSettings = {
  twitchChannel: "",
  kickChannel: "",
  ytHandle: "",
  pinnedAnnouncement: "",
  userboxColor: "#af98dc",
  userboxOpacity: "0.9",
  msgboxColor: "#ff69b4",
  msgboxOpacity: "0.6",
  textColor: "#ffffff",
};

// Helper function to invalidate cache on updates
function invalidateCache() {
  cachedSettings = null;
  cachedBannedWords = null;
  cachedAllowedWords = null;
  cacheTimestamp = 0;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const now = Date.now();

      // Return from in-memory cache if valid
      if (cachedSettings && now - cacheTimestamp < CACHE_TTL_MS) {
        return res.status(200).json({
          settings: cachedSettings,
          bannedWords: cachedBannedWords,
          allowedWords: cachedAllowedWords,
        });
      }

      // Otherwise fetch from Redis
      let settings = (await redis.get("app_settings")) || {
        ...defaultSettings,
      };

      // Always inject the environment variable versions of the secrets server-side
      settings.ytApiKey = process.env.YT_API_KEY || "";
      settings.giphyApiKey = process.env.GIPHY_API_KEY || "";
      settings.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";

      const bannedWords = (await redis.get("banned_words")) || [];
      const allowedWords = (await redis.get("allowed_words")) || [];

      // Update in-memory cache
      cachedSettings = settings;
      cachedBannedWords = bannedWords;
      cachedAllowedWords = allowedWords;
      cacheTimestamp = now;

      return res.status(200).json({ settings, bannedWords, allowedWords });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch settings" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body;

      // Prevent saving hardcoded/client-edited sensitive keys back to Redis
      if (body.ytApiKey) delete body.ytApiKey;
      if (body.giphyApiKey) delete body.giphyApiKey;
      if (body.discordWebhookUrl) delete body.discordWebhookUrl;

      // Invalidate cache immediately on any write/mutation operation
      invalidateCache();

      // 1. Import bulk GitHub list action
      if (body.action === "import_github_lists") {
        const externalWords = body.words || [];
        let currentBanned = (await redis.get("banned_words")) || [];
        const combined = [
          ...new Set([
            ...currentBanned,
            ...externalWords.map((w) => w.toLowerCase()),
          ]),
        ];

        await redis.set("banned_words", combined);
        return res.status(200).json({ success: true, bannedWords: combined });
      }

      // 2. Add individual allowed word action
      if (body.action === "add_allowed_word") {
        const word = body.word ? body.word.trim().toLowerCase() : "";
        if (!word) return res.status(400).json({ error: "No word provided" });

        let currentAllowed = (await redis.get("allowed_words")) || [];
        if (!currentAllowed.includes(word)) {
          currentAllowed.push(word);
          await redis.set("allowed_words", currentAllowed);
        }
        return res
          .status(200)
          .json({ success: true, allowedWords: currentAllowed });
      }

      // 3. Remove individual allowed word action
      if (body.action === "remove_allowed_word") {
        const word = body.word ? body.word.trim().toLowerCase() : "";
        let currentAllowed = (await redis.get("allowed_words")) || [];
        currentAllowed = currentAllowed.filter((w) => w !== word);
        await redis.set("allowed_words", currentAllowed);
        return res
          .status(200)
          .json({ success: true, allowedWords: currentAllowed });
      }

      // Add a custom banned word action
      if (body.action === "add_banned_word") {
        const word = body.word ? body.word.trim().toLowerCase() : "";
        if (!word) return res.status(400).json({ error: "No word provided" });

        let currentBanned = (await redis.get("banned_words")) || [];
        if (!currentBanned.includes(word)) {
          currentBanned.push(word);
          await redis.set("banned_words", currentBanned);
        }
        return res
          .status(200)
          .json({ success: true, bannedWords: currentBanned });
      }

      // Remove a custom banned word action
      if (body.action === "remove_banned_word") {
        const word = body.word ? body.word.trim().toLowerCase() : "";
        let currentBanned = (await redis.get("banned_words")) || [];
        currentBanned = currentBanned.filter((w) => w !== word);
        await redis.set("banned_words", currentBanned);
        return res
          .status(200)
          .json({ success: true, bannedWords: currentBanned });
      }

      // Clear app settings action
      if (body.action === "clear") {
        await redis.del("app_settings");
        let freshSettings = { ...defaultSettings };
        freshSettings.ytApiKey = process.env.YT_API_KEY || "";
        freshSettings.giphyApiKey = process.env.GIPHY_API_KEY || "";
        freshSettings.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
        return res.status(200).json({ success: true, settings: freshSettings });
      }

      // Fetch current settings, merge new updates, and save back
      let currentSettings = (await redis.get("app_settings")) || {
        ...defaultSettings,
      };

      if (body.action === "clear_colors") {
        currentSettings.userboxColor = defaultSettings.userboxColor;
        currentSettings.userboxOpacity = defaultSettings.userboxOpacity;
        currentSettings.msgboxColor = defaultSettings.msgboxColor;
        currentSettings.msgboxOpacity = defaultSettings.msgboxOpacity;
        currentSettings.textColor = defaultSettings.textColor;
      } else if (body.action === "clear_emotes") {
        Object.keys(currentSettings).forEach((key) => {
          if (key.startsWith("emote_toggle_")) {
            delete currentSettings[key];
          }
        });
      } else {
        currentSettings = { ...currentSettings, ...body };
      }

      await redis.set("app_settings", currentSettings);

      // Re-attach env keys to response
      currentSettings.ytApiKey = process.env.YT_API_KEY || "";
      currentSettings.giphyApiKey = process.env.GIPHY_API_KEY || "";
      currentSettings.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";

      return res.status(200).json({ success: true, settings: currentSettings });
    } catch (error) {
      if (process.env.DISCORD_WEBHOOK_URL) {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `🚨 **Error in Settings API:** \`${error.message}\``,
          }),
        }).catch(() => {});
      }
      return res
        .status(500)
        .json({ error: error.message || "Internal Server Error" });
    }
  }

  return res
    .status(405)
    .setHeader("Allow", ["GET", "POST"])
    .end(`Method ${req.method} Not Allowed`);
}
