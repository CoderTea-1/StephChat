import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const username =
    req.method === "POST" ? req.body.username : req.query.username;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const cleanUser = username.trim().toLowerCase();
    const key = `user_msgs:${cleanUser}`;

    // Fetch recent messages logged by bot.js from Redis
    const recentMessages = (await redis.lrange(key, 0, 24)) || [];

    if (recentMessages.length === 0) {
      return res.status(200).json({
        success: true,
        username,
        sassScore: 0,
        message: `@${username} hasn't said anything in chat yet, so their sass level is completely unmeasured!`,
      });
    }

    // Analyze chat behavior metrics from actual messages
    let totalExclamations = 0;
    let totalUppercaseLetters = 0;
    let totalLetters = 0;
    let sassKeywordHits = 0;

    const sassTriggers = [
      "kappa",
      "lul",
      "smh",
      "sigh",
      "bruh",
      "lol",
      "whatever",
      "please",
      "bro",
    ];

    recentMessages.forEach((msg) => {
      totalExclamations += (msg.match(/!/g) || []).length;

      for (let char of msg) {
        if (char >= "A" && char <= "Z") totalUppercaseLetters++;
        if ((char >= "A" && char <= "Z") || (char >= "a" && char <= "z"))
          totalLetters++;
      }

      const lower = msg.toLowerCase();
      sassTriggers.forEach((trigger) => {
        if (lower.includes(trigger)) sassKeywordHits++;
      });
    });

    // Compute behavioral score out of 100
    const uppercaseRatio =
      totalLetters > 0 ? totalUppercaseLetters / totalLetters : 0;

    let computedScore = Math.floor(
      totalExclamations * 5 +
        uppercaseRatio * 40 +
        sassKeywordHits * 10 +
        recentMessages.length * 1.5,
    );

    // Clamp score between 1 and 100
    const sassScore = Math.max(1, Math.min(100, computedScore));

    let remark = "has an average amount of sass.";
    if (sassScore > 80) {
      remark = "is an absolute sass queen/king! Watch out!";
    } else if (sassScore > 50) {
      remark = "brings a solid amount of spice to the chat.";
    } else if (sassScore < 20) {
      remark = "is suspiciously wholesome and peaceful.";
    }

    const responseMessage = `@${username} has a Sass Score of ${sassScore}/100 — ${remark}`;

    return res.status(200).json({
      success: true,
      username,
      sassScore,
      message: responseMessage,
    });
  } catch (error) {
    if (process.env.DISCORD_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🚨 **Error in Sass API:** \`${error.message}\``,
        }),
      }).catch(() => {});
    }
  }
}
