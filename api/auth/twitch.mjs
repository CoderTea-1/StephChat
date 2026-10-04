export default function handler(req, res) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = process.env.TWITCH_REDIRECT_URI || "https://test-chat-nine-theta.vercel.app/api/auth/twitch/callback";
  
  const scope = 'user:read:chat channel:read:subscriptions moderator:read:followers bits:read channel:read:redemptions';
  
  const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  
  res.writeHead(302, { Location: twitchAuthUrl });
  res.end();
}