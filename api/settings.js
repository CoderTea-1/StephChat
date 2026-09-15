import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Default settings matching your CSS values
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
      const settings = (await redis.get("app_settings")) || defaultSettings;
      return res.status(200).json(settings);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch settings" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body;

      if (body.action === "clear") {
        await redis.del("app_settings");
        return res.status(200).json({ success: true, settings: defaultSettings });
      }

      // Fetch current settings, merge new updates, and save back
      let currentSettings = (await redis.get("app_settings")) || { ...defaultSettings };

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

      await redis.set("app_settings", currentSettings);
      return res.status(200).json({ success: true, settings: currentSettings });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to save settings" });
    }
  }

  return res
    .status(405)
    .setHeader("Allow", ["GET", "POST"])
    .end(`Method ${req.method} Not Allowed`);
}