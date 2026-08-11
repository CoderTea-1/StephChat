import http from 'http';

const PORT = 3001;

// Simulate your exact webhook handler logic
const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/api/webhook') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not Found');
  }

  // Read body stream
  let rawBody = '';
  for await (const chunk of req) {
    rawBody += chunk;
  }

  try {
    const eventData = rawBody ? JSON.parse(rawBody) : {};
    const messageType = req.headers['twitch-eventsub-message-type'];
    const subscriptionType = req.headers['twitch-eventsub-subscription-type'];

    if (messageType === 'notification') {
      const event = eventData.event || {};

      switch (subscriptionType) {
        case 'channel.subscribe':
          console.log(`[SUCCESS] ${event.user_name} subscribed to ${event.broadcaster_user_name}!`);
          break;
        case 'channel.cheer':
          console.log(`[SUCCESS] ${event.user_name} cheered ${event.bits} bits!`);
          break;
        default:
          console.log(`[EVENT] Handled type: ${subscriptionType}`);
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end('Event received');
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } catch (err) {
    console.error('Error processing:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});