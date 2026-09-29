// bot.js (Command Handler Extension)
const tmi = require('tmi.js');
const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();
let DISCORD_WEBHOOK_URL = '';

// Fetch webhook URL dynamically from Upstash Redis on startup
async function initBotEnvironment() {
    try {
        const settings = await redis.get('settings');
        if (settings) {
            const parsed = typeof settings === 'string' ? JSON.parse(settings) : settings;
            DISCORD_WEBHOOK_URL = parsed.discordWebhookUrl || parsed.discordWebhook || '';
        }
        
        // Fallback: Check if stored directly under a specific key instead of a general 'settings' hash
        if (!DISCORD_WEBHOOK_URL) {
            const directUrl = await redis.get('discordWebhookUrl');
            if (directUrl) DISCORD_WEBHOOK_URL = directUrl;
        }
    } catch (err) {
        sendDiscordLog("error","Failed to fetch webhook URL from Redis:", err);
    }
}
initBotEnvironment();

async function sendDiscordLog(level, message, error = null) {
  const formattedMessage = `🛠️ **[${level.toUpperCase()}]** ${message} ${error ? `\n> \`${error.message || error}\`` : ""}`;
  
  // If webhook URL isn't loaded yet, attempt to fetch it directly from Redis
  if (!DISCORD_WEBHOOK_URL) {
    try {
      const settings = await redis.get('settings');
      if (settings) {
        const parsed = typeof settings === 'string' ? JSON.parse(settings) : settings;
        DISCORD_WEBHOOK_URL = parsed.discordWebhookUrl || parsed.discordWebhook || '';
      }
      if (!DISCORD_WEBHOOK_URL) {
        const directUrl = await redis.get('discordWebhookUrl');
        if (directUrl) DISCORD_WEBHOOK_URL = directUrl;
      }
    } catch (e) {}
  }
  
  if (!DISCORD_WEBHOOK_URL) {
    console[level](message, error || "");
    return;
  }

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: formattedMessage }),
    });

    if (!res.ok) {
      console[level](message, error || "");
    }
  } catch (err) {
    console[level](message, error || "");
  }
}

const client = new tmi.Client({
    options: { debug: false },
    identity: {
        username: 'stephychat',
        password: process.env.TWITCH_OAUTH_TOKEN || ''
    },
    channels: [
        'stephychat',                      // Your channel
        'sassinatorsteph'                // Other channels you want the bot to join
    ]
});

// Define your custom command list and responses here
const customCommands = {
    '!love': {
        response: 'We love our Stephy!',
        matchType: 'exact' // Must be just "!love"
    },
    '!so Masster_tea': {
        response: 'Welcome in raiders!',
        matchType: 'startsWith' // Triggers on "!so" even if there is text afterwards
    },
    "!tea":{
        response: 'Masster_tea is in chat now. Best to ignore him... he is a silly goose',
        matchType: 'exact'
    }
};

client.connect().catch((err) => {
    sendDiscordLog("error", `Failed to connect: ${err}`);
});

client.on('connected', (address, port) => {
    const channelsList = client.getChannels().join(', ');
    sendDiscordLog("info", `[Bot.js] Connected to Twitch IRC server at ${address}:${port}. Active channels: ${channelsList}`);
});

client.on('message', (channel, tags, message, self) => {
    if (self) return; // Ignore messages from the bot itself

    const username = tags['display-name'] || tags['username'];
    const cleanUser = username.toLowerCase();
    const msgText = message.trim();
    const msgTextLower = msgText.toLowerCase();

    // 1. Log incoming user message asynchronously to Redis for behavioral tracking
    (async () => {
        try {
            const key = `user_msgs:${cleanUser}`;
            await redis.lpush(key, msgText);
            await redis.ltrim(key, 0, 24); // Keep only the latest 25 messages
            await redis.expire(key, 86400); // Expire after 24 hours of inactivity
        } catch (err) {
            sendDiscordLog("error", `Failed to log message to Redis: ${err}`);
        }
    })();

    // 2. Handle !sass or !sassmeter commands
    if (msgTextLower === '!sass' || msgTextLower.startsWith('!sass ') || msgTextLower === '!sassmeter' || msgTextLower.startsWith('!sassmeter ')) {
        const args = msgText.split(' ');
        const targetUser = args[1] ? args[1].replace('@', '') : username;
        
        (async () => {
            try {
                // Replace with your actual deployed Vercel URL or production domain
                const apiRes = await fetch('https://steph-chat.vercel.app/api/sass-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: targetUser })
                });
                
                const data = await apiRes.json();
                if (data && data.message) {
                    client.say(channel, data.message);
                } else {
                    client.say(channel, `@${targetUser} has an unmeasurable mystery sass level today!`);
                }
            } catch (err) {
                sendDiscordLog("error", `Failed to fetch sass score from API: ${err}`);
                client.say(channel, `@${targetUser} is infinitely sassy.`);
            }
        })();
        
        return;
    }

    // 3. Loop through your custom commands to find a match based on its rule
    for (const [cmdKey, data] of Object.entries(customCommands)) {
        let isMatched = false;

        if (data.matchType === 'exact') {
            isMatched = (msgTextLower === cmdKey);
        } 
        else if (data.matchType === 'startsWith') {
            isMatched = (msgTextLower === cmdKey || msgTextLower.startsWith(cmdKey + ' '));
        } 
        else if (data.matchType === 'contains') {
            isMatched = msgTextLower.includes(cmdKey);
        }

        if (isMatched) {
            let finalResponse = data.response;
            
            client.say(channel, `${finalResponse}`)
                 .catch((err) => sendDiscordLog("error", "Error sending command response:", err));
                 
            
             break;
        }
    }
});


async function sendDiscordLog(level, message, error = null) {
  const formattedMessage = `🛠️ **[${level.toUpperCase()}]** ${message} ${error ? `\n> \`${error.message || error}\`` : ""}`;
  
  if (!DISCORD_WEBHOOK_URL) {
    try {
      const settings = await redis.get('settings');
      if (settings) {
        const parsed = typeof settings === 'string' ? JSON.parse(settings) : settings;
        DISCORD_WEBHOOK_URL = parsed.discordWebhookUrl || parsed.discordWebhook || '';
      }
    } catch (e) {}
  }
  
  if (!DISCORD_WEBHOOK_URL) {
    console[level](message, error || "");
    return;
  }

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: formattedMessage }),
    });
  } catch (err) {
    console[level](message, error || "");
  }
}