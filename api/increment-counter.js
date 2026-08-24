import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Get today's date string as a key (e.g., "counter:2026-06-07")
    const today = new Date().toISOString().split('T')[0];
    const key = `api_requests:${today}`;

    // Atomically increment the counter in Vercel KV
    const totalToday = await kv.incr(key);

    return res.status(200).json({
      success: true,
      totalToday: totalToday
    });
  } catch (error) {
    console.error("Counter API Error:", error);
    // Fallback response so frontend doesn't break if KV isn't set up yet
    return res.status(200).json({
      success: true,
      totalToday: 1
    });
  }
}