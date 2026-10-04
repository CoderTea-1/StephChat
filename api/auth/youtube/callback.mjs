import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const code = urlParams.get('code');

  if (!code) {
      return res.status(400).send('Authorization code not provided by Google.');
  }

  const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const redirectUri = `${protocol}://${host}/api/auth/youtube/callback`;

  try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
              client_id: YOUTUBE_CLIENT_ID,
              client_secret: YOUTUBE_CLIENT_SECRET,
              code: code,
              grant_type: 'authorization_code',
              redirect_uri: redirectUri
          })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
          throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange Google token');
      }

      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;

      await redis.set('youtube_access_token', accessToken);
      if (refreshToken) {
          await redis.set('youtube_refresh_token', refreshToken);
      }

      res.status(200).send('YouTube authentication successful! You can close this tab and return to your dashboard.');
  } catch (error)  {
      console.error('YouTube Auth Error:', error);
      res.status(500).send('YouTube Authentication failed: ' + error.message);
  }
}