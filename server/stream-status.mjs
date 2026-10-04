// api/stream-status.mjs
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "",
});

export default async function handler(req, res) {
  const { channelId } = req.query;
  if (!channelId) return res.status(400).json({ isLive: false });

  try {
    const status = await redis.get(`yt_live_status:${channelId}`);
    if (status && status.isLive) {
      return res.status(200).json(status);
    }
  } catch (e) {}

  return res.status(200).json({ isLive: false });
}