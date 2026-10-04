import express from 'express';
import cors from 'cors';

// Import your custom handlers
import settingsHandler from '../api/settings.mjs';
import { handleYouTubeWebhook } from './youtube-webhook.mjs';
import streamStatusHandler from './stream-status.mjs';

const app = express();
app.use(express.json());
app.use(cors());

let clients = [];

// SSE Endpoint for browser
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// Settings API Endpoint (Supports GET and POST)
app.all('/api/settings', async (req, res) => {
  return await settingsHandler(req, res);
});

// Stream Status API Endpoint
app.get('/api/stream-status', async (req, res) => {
  return await streamStatusHandler(req, res);
});

// Twitch Webhook
app.post('/api/eventsub', (req, res) => {
  // ... your twitch handling logic ...
  res.status(200).send('OK');
});

// YouTube Webhook (GET for verification, POST for notifications)
app.get('/api/youtube-webhook', async (req, res) => {
  return await handleYouTubeWebhook(req, res);
});
app.post('/api/youtube-webhook', async (req, res) => {
  return await handleYouTubeWebhook(req, res, clients);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});