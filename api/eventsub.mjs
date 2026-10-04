import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).setHeader("Allow", ["POST"]).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const messageType = req.headers['twitch-eventsub-message-type'];

    // 1. Handle Twitch EventSub Subscription Verification Challenge
    if (messageType === 'webhook_callback_verification') {
      res.setHeader('content-type', 'text/plain');
      return res.status(200).send(req.body?.challenge);
    }

    // 2. Handle Actual Notifications
    const eventType = req.body?.subscription?.type || req.body?.metadata?.subscription_type;
    const eventData = req.body?.event;

    console.log(`Twitch Event Received [${eventType}]:`, JSON.stringify(eventData));

    const username = eventData?.user_name || eventData?.user_login || eventData?.chatter_user_name || "TwitchUser";
    
    // --- FORMAT SPECIFIC EVENT MESSAGES ---
    let messageText = "Triggered an event!";
    
    if (eventType === 'channel.subscribe') {
      const tier = eventData?.tier ? eventData.tier.replace('1000', '1').replace('2000', '2').replace('3000', '3') : '1';
      messageText = `subscribed at tier ${tier} for 1 month`;
    } else if (eventType === 'channel.subscription.gift') {
      const tier = eventData?.tier ? eventData.tier.replace('1000', '1').replace('2000', '2').replace('3000', '3') : '1';
      const total = eventData?.total || 1;
      messageText = `gifted ${total} sub(s) at tier ${tier}`;
    } else if (eventType === 'channel.subscription.message') {
      const tier = eventData?.tier ? eventData.tier.replace('1000', '1').replace('2000', '2').replace('3000', '3') : '1';
      const months = eventData?.cumulative_months || eventData?.duration_months || 1;
      messageText = `resubscribed at tier ${tier} for ${months} months: "${eventData?.message?.text || ''}"`;
    } else {
      messageText = eventData?.message?.text || eventData?.reward?.title || "Triggered an event!";
    }

    // --- SAVE EVENT TO REDIS FOR FRONTEND POLLING ---
    const streamEvent = {
      platform: 'twitch',
      type: eventType || 'unknown_event',
      user: username,
      message: messageText,
      timestamp: Date.now()
    };

    await redis.lpush('recent_stream_events', JSON.stringify(streamEvent));
    await redis.ltrim('recent_stream_events', 0, 19); // Keep last 20 events

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing EventSub webhook:", error);
    return res.status(500).json({ error: error.message });
  }
}