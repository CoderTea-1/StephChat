import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  const redirectUri = process.env.TWITCH_REDIRECT_URI || "https://test-chat-nine-theta.vercel.app/api/auth/twitch/callback";

  try {
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(JSON.stringify(tokenData));
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    const validateResponse = await fetch("https://id.twitch.tv/oauth2/validate", {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });

    const validateData = await validateResponse.json();
    const broadcasterUserId = validateData.user_id;
    const broadcasterUsername = validateData.login;

    // Save to both individual keys and hash to ensure compatibility across all your functions
    await redis.set("twitch_access_token", accessToken);
    if (refreshToken) {
      await redis.set("twitch_refresh_token", refreshToken);
    }

    await redis.hset("twitch_settings", {
      twitchAccessToken: accessToken,
      twitchRefreshToken: refreshToken,
      twitchBroadcasterUserId: broadcasterUserId,
      twitchBroadcasterUsername: broadcasterUsername,
      twitchClientId: process.env.TWITCH_CLIENT_ID,
    });

    console.log(`✅ Successfully authenticated Twitch user: ${broadcasterUsername} (${broadcasterUserId})`);
    res.redirect("/?logged_in=true");
  } catch (error) {
    console.error("OAuth Error:", error);
    res.status(500).send("Authentication failed: " + error.message);
  }
}