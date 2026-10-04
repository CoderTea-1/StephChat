// youtube-webhook.mjs
import { Redis } from "@upstash/redis";
import { parseStringPromise } from "xml2js"; // Make sure to install xml2js or use standard parsing

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "",
});

export default async function handler(req, res) {
  // 1. Handle Google's WebSub Subscription Verification (GET)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const challenge = req.query["hub.challenge"];
    const topic = req.query["hub.topic"];

    if (mode && challenge) {
      if (mode === "subscribe" || mode === "unsubscribe") {
        console.log(`WebSub verification successful for topic: ${topic}`);
        return res.status(200).send(challenge);
      }
    }
    return res.status(400).send("Invalid verification request.");
  }

  // 2. Handle Incoming Live Stream Notifications from YouTube (POST)
  if (req.method === "POST") {
    try {
      let rawBody = "";
      for await (const chunk of req) {
        rawBody += chunk;
      }

      // Parse the incoming Atom XML feed from YouTube
      const parsedXml = await parseStringPromise(rawBody);
      const entry = parsedXml?.feed?.entry?.[0];

      if (entry) {
        const videoId = entry["yt:videoId"]?.[0];
        const channelId = entry["yt:channelId"]?.[0];
        const title = entry["title"]?.[0];
        
        // If YouTube sends an entry, check if it's live or newly uploaded
        // (PubSubHubbub sends notifications for uploads too, so you can verify live status or video details)
        if (videoId && channelId) {
          await redis.set(`yt_live_status:${channelId}`, {
            isLive: true,
            videoId: videoId,
            title: title,
            updatedAt: new Date().toISOString()
          });
          console.log(`[YouTube Webhook] Stream live detected for channel ${channelId}! Video ID: ${videoId}`);
        }
      }

      return res.status(200).send("OK");
    } catch (err) {
      console.error("Error processing YouTube webhook XML:", err);
      return res.status(500).send("Server Error");
    }
  }

  return res.status(405).setHeader("Allow", ["GET", "POST"]).end();
}