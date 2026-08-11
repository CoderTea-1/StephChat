import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false, // Required to validate raw signature payload from Twitch
  },
};

// Helper function to read the raw request stream into a buffer
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { resolve(data); });
    req.on('error', err => { reject(err); });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const messageType = req.headers['twitch-eventsub-message-type'];
  const signature = req.headers['twitch-eventsub-message-signature'];
  const timestamp = req.headers['twitch-eventsub-message-timestamp'];
  const messageId = req.headers['twitch-eventsub-message-id'];
  const secret = process.env.TWITCH_WEBHOOK_SECRET;

  if (!secret) {
    return res.status(500).json({ error: 'Webhook secret is not configured' });
  }

  try {
    const rawBody = await getRawBody(req);
    
    // 1. Verify the signature from Twitch
    const calculatedSignature = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(messageId + timestamp + rawBody)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature || ''), Buffer.from(calculatedSignature))) {
      return res.status(403).send('Invalid signature');
    }

    const eventData = JSON.parse(rawBody);

    // 2. Handle the initial challenge verification from Twitch
    if (messageType === 'webhook_callback_verification') {
      return res.status(200).send(eventData.challenge);
    }

    // 3. Handle actual incoming events
    if (messageType === 'notification') {
      const subscriptionType = req.headers['twitch-eventsub-subscription-type'];

      switch (subscriptionType) {
        case 'channel.chat.message':
          console.log(`[CHAT] ${eventData.event.chatter_user_name}: ${eventData.event.message.text}`);
          break;

        case 'channel.subscribe':
          console.log(`[SUB] ${eventData.event.user_name} subscribed to ${eventData.event.broadcaster_user_name}!`);
          break;

        case 'channel.cheer':
          console.log(`[BITS] ${eventData.event.user_name} cheered ${eventData.event.bits} bits!`);
          break;

        case 'channel.channel_points_custom_reward_redemption.add':
          console.log(`[REWARD] ${eventData.event.user_name} redeemed ${eventData.event.reward.title}!`);
          break;

        default:
          console.log(`Unhandled event type: ${subscriptionType}`);
      }

      return res.status(200).send('Event received');
    }

    return res.status(200).send('Ignored message type');
  } catch (error) {
    console.error('Webhook error:', error.message);
    return res.status(400).json({ error: 'Webhook processing failed', details: error.message });
  }
}