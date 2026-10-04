import { Redis } from "@upstash/redis";

// Robust fallback to support both standard Upstash and Vercel KV environment variables
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// In-Memory TTL Cache State
let cachedSettings = null;
let cachedBannedWords = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 1800000; // 30 minute cache duration

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
  cacheTimestamp = 0;
}

// --- VERCEL-COMPATIBLE API HANDLER (Mounted to /api/settings) ---
export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const now = Date.now();

      if (cachedSettings && now - cacheTimestamp < CACHE_TTL_MS) {
        return res.status(200).json({
          settings: cachedSettings,
          bannedWords: cachedBannedWords,
        });
      }

      let settings = { ...defaultSettings };
      let bannedWords = [];

      try {
        settings = (await redis.get("app_settings")) || { ...defaultSettings };
        bannedWords = (await redis.get("banned_words")) || [];
      } catch (redisErr) {
        await sendDiscordLogBackend(
          "warning",
          "[Redis Connection/Auth Warning] Using default configurations:",
          redisErr.message,
        );
      }

      // Dynamically pull OAuth and profile info stored from Redis / Twitch
      const accessToken = (await redis.get("twitch_access_token")) || "";
      const clientId = process.env.TWITCH_CLIENT_ID || "";

      let broadcasterUserId = "";
      let twitchChannel = settings.twitchChannel || "";

      if (accessToken && clientId) {
        try {
          const userResponse = await fetch(
            "https://api.twitch.tv/helix/users",
            {
              headers: {
                "Client-ID": clientId,
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          if (userResponse.ok) {
            const userData = await userResponse.json();
            const user = userData.data?.[0];
            if (user) {
              broadcasterUserId = user.id;
              if (!twitchChannel) {
                twitchChannel = user.login;
              }
            }
          }
        } catch (twitchErr) {
          console.error(
            "Failed to fetch Twitch user details from token:",
            twitchErr,
          );
        }
      }

      settings.twitchClientId = clientId;
      settings.twitchAccessToken = accessToken;
      settings.twitchBroadcasterUserId = broadcasterUserId;
      settings.twitchChannel = twitchChannel;
      settings.ytApiKey = process.env.YT_API_KEY || "";
      settings.giphyApiKey = process.env.GIPHY_API_KEY || "";
      settings.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";

      cachedSettings = settings;
      cachedBannedWords = bannedWords;
      cacheTimestamp = now;

      return res.status(200).json({ settings, bannedWords });
    } catch (error) {
      await sendDiscordLogBackend("error", "--- DEBUG API GET ERROR ---");
      await sendDiscordLogBackend("error", "Error Name:", error.name);
      await sendDiscordLogBackend("error", "Error Message:", error.message);

      const fallbackSettings = { ...defaultSettings };
      fallbackSettings.twitchClientId = process.env.TWITCH_CLIENT_ID || "";
      fallbackSettings.twitchAccessToken =
        (await redis.get("twitch_access_token")) || "";
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
    let body = {};
    try {
      body = req.body || {};

      if (body.action === "clear") {
        await redis.del("app_settings");
        let freshSettings = { ...defaultSettings };
        freshSettings.twitchClientId = process.env.TWITCH_CLIENT_ID || "";
        freshSettings.twitchAccessToken =
          (await redis.get("twitch_access_token")) || "";
        freshSettings.ytApiKey = process.env.YT_API_KEY || "";
        freshSettings.giphyApiKey = process.env.GIPHY_API_KEY || "";
        freshSettings.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
        return res.status(200).json({ success: true, settings: freshSettings });
      }

      if (body.ytApiKey) delete body.ytApiKey;
      if (body.giphyApiKey) delete body.giphyApiKey;
      if (body.discordWebhookUrl) delete body.discordWebhookUrl;

      invalidateCache();

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

      let currentSettings = { ...defaultSettings };
      try {
        currentSettings = (await redis.get("app_settings")) || {
          ...defaultSettings,
        };
      } catch (e) {}

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

      try {
        await redis.set("app_settings", currentSettings);
        if (currentSettings.ytHandle) {
          await registerYouTubeWebSub(currentSettings.ytHandle);
        }
      } catch (e) {
        await sendDiscordLogBackend(
          "error",
          "Failed to save app_settings to Redis",
          e,
        );
      }

      currentSettings.twitchClientId = process.env.TWITCH_CLIENT_ID || "";
      currentSettings.twitchAccessToken =
        (await redis.get("twitch_access_token")) || "";
      currentSettings.ytApiKey = process.env.YT_API_KEY || "";
      currentSettings.giphyApiKey = process.env.GIPHY_API_KEY || "";
      currentSettings.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";

      return res.status(200).json({ success: true, settings: currentSettings });
    } catch (error) {
      await sendDiscordLogBackend("error", "--- DEBUG API POST ERROR ---");
      await sendDiscordLogBackend("error", "Error Name:", error.name);
      await sendDiscordLogBackend("error", "Error Message:", error.message);

      return res.status(200).json({
        success: true,
        settings: defaultSettings,
        errorDebug: error.message,
        warning: "Handled save action via local fallback safely.",
      });
    }
  }

  return res
    .status(405)
    .setHeader("Allow", ["GET", "POST"])
    .end(`Method ${req.method} Not Allowed`);
}

async function sendDiscordLogBackend(level, message, error = null) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;
  const formattedMessage = `🛠️ **[${level.toUpperCase()}]** ${message} ${error ? `\n> \`${error.message || error}\`` : ""}`;
  try {
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: formattedMessage }),
    });
  } catch (e) {}
}

async function registerYouTubeWebSub(channelId) {
  if (!channelId) return;

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://test-chat-nine-theta.vercel.app"}/api/youtube-webhook`;
  const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;

  try {
    const params = new URLSearchParams();
    params.append("hub.callback", callbackUrl);
    params.append("hub.topic", topicUrl);
    params.append("hub.mode", "subscribe");
    params.append("hub.verify", "async");

    const response = await fetch("https://pubsubhubbub.appspot.com/subscribe", {
      method: "POST",
      body: params,
    });

    if (response.ok) {
      console.log(
        `Successfully requested WebSub subscription for channel: ${channelId}`,
      );
    }
  } catch (err) {
    console.error("Failed to register WebSub subscription:", err);
  }
}