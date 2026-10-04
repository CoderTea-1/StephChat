export default function handler(req, res) {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const redirectUri = `${protocol}://${host}/api/auth/youtube/callback`;
  const scope = 'https://www.googleapis.com/auth/youtube.readonly';
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
  
  res.writeHead(302, { Location: googleAuthUrl });
  res.end();
}