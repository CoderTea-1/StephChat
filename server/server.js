import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors()); // Allows your Vercel frontend to talk to this server

let clients = [];

// 1. SSE Endpoint: The browser connects here and keeps the line open 24/7
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);
  console.log('Overlay connected via SSE!');

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
    console.log('Overlay disconnected.');
  });
});

// 2. Webhook Endpoint: Twitch pings this when an event happens
app.post('/api/eventsub', (req, res) => {
  const messageType = req.headers['twitch-eventsub-message-type'];

  if (messageType === 'webhook_callback_verification') {
    return res.status(200).send(req.body?.challenge);
  }

  const eventData = req.body?.event;
  const eventType = req.body?.subscription?.type || 'unknown';
  const username = eventData?.user_name || "TwitchUser";
  let messageText = `subscribed at tier ${eventData?.tier?.replace('1000', '1') || '1'}`;

  const payload = JSON.stringify({
    type: eventType,
    user: username,
    message: messageText
  });

  // Broadcast instantly to all connected browser overlay tabs
  clients.forEach(client => {
    client.write(`data: ${payload}\n\n`);
  });

  return res.status(200).json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SSE Server running on port ${PORT}`);
});