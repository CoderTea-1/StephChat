export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const messageType = req.headers['twitch-eventsub-message-type'];

  try {
    const rawBody = await getRawBody(req);
    const eventData = JSON.parse(rawBody);

    // 1. Handle the initial challenge verification from Twitch
    if (messageType === 'webhook_callback_verification') {
      return res.status(200).send(eventData.challenge);
    }

    // 2. Handle actual incoming events (BYPASSED SIGNATURE CHECK FOR TESTING)
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