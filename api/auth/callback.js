export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code from Twitch.");

  try {
    // 1. Exchange temporary code for User Access Token
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: "https://steph-chat.vercel.app/api/auth/callback",
      }),
    });
    const tokenData = await tokenRes.json();
    const userAccessToken = tokenData.access_token;

    // 2. Get the streamer's unique User ID
    const userRes = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Authorization": `Bearer ${userAccessToken}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    });
    const userData = await userRes.json();
    const streamerId = userData.data[0].id;

    // 3. Get an App Access Token to register the webhooks
    const appTokenRes = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
      { method: "POST" }
    );
    const appTokenData = await appTokenRes.json();
    const appAccessToken = appTokenData.access_token;

    // 4. Define the 4 EventSub subscriptions you want to create
    const subscriptionsToCreate = [
      { type: "channel.chat.message", version: "1", condition: { broadcaster_user_id: streamerId, user_id: streamerId } },
      { type: "channel.subscribe", version: "1", condition: { broadcaster_user_id: streamerId } },
      { type: "channel.cheer", version: "1", condition: { broadcaster_user_id: streamerId } },
      { type: "channel.channel_points_custom_reward_redemption.add", version: "1", condition: { broadcaster_user_id: streamerId } }
    ];

    // 5. Loop through and register each one with Twitch's API
    for (const sub of subscriptionsToCreate) {
      await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${appAccessToken}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: sub.type,
          version: sub.version,
          condition: sub.condition,
          transport: {
            method: "webhook",
            callback: "https://steph-chat.vercel.app/api/webhook",
            secret: process.env.TWITCH_WEBHOOK_SECRET,
          },
        }),
      });
    }

    res.send(`Successfully connected and registered webhooks for ${userData.data[0].display_name}!`);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}