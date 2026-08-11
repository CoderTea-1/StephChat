export const config = {
  api: {
    bodyParser: false,
  },
};

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

  try {
    const rawBody = await getRawBody(req);
    const eventData = rawBody ? JSON.parse(rawBody) : {};
    
    const messageType = req.headers['twitch-eventsub-message-type'];
    const subscriptionType = req.headers['twitch-eventsub-subscription-type'];

    if (messageType === 'webhook_callback_verification') {
      return res.status(200).send(eventData.challenge);
    }

    if (messageType === 'notification') {
      const event = eventData.event || {};

      switch (subscriptionType) {
        case 'channel.subscribe':
          console.log(`[VERCEL LOCAL SUB] ${event.user_name} subscribed to ${event.broadcaster_user_name}!`);
          break;
        case 'channel.cheer':
          console.log(`[VERCEL LOCAL BITS] ${event.user_name} cheered ${event.bits} bits!`);
          break;
        default:
          console.log(`[VERCEL LOCAL EVENT] Handled type: ${subscriptionType}`);
      }

      return res.status(200).send('Event received');
    }

    return res.status(200).send('Ignored');
  } catch (err) {
    console.error('Crash caught:', err.message);
    return res.status(500).json({ error: err.message });
  }
}