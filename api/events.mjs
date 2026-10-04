import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).setHeader("Allow", ["GET"]).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Attempt to fetch from Redis
    const events = await redis.lrange('recent_stream_events', 0, 4);
    
    const parsedEvents = [];
    if (Array.isArray(events)) {
      for (const e of events) {
        try {
          if (typeof e === 'string') {
            parsedEvents.push(JSON.parse(e));
          } else if (typeof e === 'object' && e !== null) {
            parsedEvents.push(e);
          }
        } catch (parseErr) {
          // Skip any malformed history items instead of crashing
        }
      }
    }

    return res.status(200).json({ success: true, events: parsedEvents });
  } catch (error) {
    console.error("Events API Error:", error);
    // Returning the actual error message in JSON helps debug directly in browser console
    return res.status(500).json({ success: false, error: error.message });
  }
}