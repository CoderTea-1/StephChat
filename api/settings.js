import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // Fetch stored settings from Redis
      const settings = (await redis.get("app_settings")) || {};
      return res.status(200).json(settings);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch settings" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body; // or JSON.parse(req.body) depending on setup

      if (body.action === "clear") {
        await redis.del("app_settings");
        return res.status(200).json({ success: true });
      }

      // Fetch current settings, merge new updates, and save back
      let currentSettings = (await redis.get("app_settings")) || {};

      if (body.action === "clear_colors") {
        delete currentSettings.userboxColor;
        delete currentSettings.msgboxColor;
        delete currentSettings.textColor;
      } else if (body.action === "clear_emotes") {
        Object.keys(currentSettings).forEach((key) => {
          if (typeof currentSettings[key] === 'boolean') {
            currentSettings[key] = true;
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
