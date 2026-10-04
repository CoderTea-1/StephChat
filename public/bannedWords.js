let bannedWords = [];
let allowedWords = [];
let isEmergencyStopped = false;

// Avoids global scope redeclaration errors entirely by attaching to window
window.DISCORD_WEBHOOK_URL = window.DISCORD_WEBHOOK_URL || "";

// Fetch configuration from the backend .env bridge on load
async function initializeEnvironment() {
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      window.DISCORD_WEBHOOK_URL = data.discordWebhookUrl || "";
    } else {
      await sendDiscordLog("warn", `Environment initialization received status ${res.status}`);
    }
  } catch (err) {
    await sendDiscordLog("error", "Failed to initialize environment settings from API", err);
  }
}

async function sendBannedWordAlert(platform, username, text) {
  if (!window.DISCORD_WEBHOOK_URL) return;

  try {
    const res = await fetch(window.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `🚨 **Banned Word Blocked!**\n> **Platform:** ${platform || "Unknown"}\n> **User:** ${username || "Unknown"}\n> **Message:** "${text}"`,
      }),
    });

    if (!res.ok) {
      console.error(`Failed to send banned word alert: Discord API returned status ${res.status}`);
    }
  } catch (err) {
    // Fall back to console log since the webhook itself failed
    console.error("Failed to send banned word alert to Discord:", err);
  }
}

/**
 * Emergency Circuit Breaker: Nuclear option to kill ALL page timers, connections, arrays, and UI.
 */
function triggerEmergencyStop(currentMemoryMB) {
  if (isEmergencyStopped) return;
  isEmergencyStopped = true;

  // 1. NUCLEAR TIMER SWEEP: Clear EVERY interval and timeout running in the entire browser window
  try {
    const highestId = window.setTimeout(() => {}, 0);
    for (let i = 0; i <= highestId; i++) {
      window.clearInterval(i);
      window.clearTimeout(i);
    }
  } catch (e) {}

  // 2. Kill global platform connections if they exist
  try {
    if (window.twitchWs) window.twitchWs.close();
    if (window.pusherInstance) window.pusherInstance.disconnect();
  } catch (e) {}

  // 3. Wipe memory arrays completely
  bannedWords = [];
  allowedWords = [];
  if (window.memoryLeakSimulator) window.memoryLeakSimulator = [];

  // 4. NEUTER core functions so they can't restart or process anything
  window.checkAndAlertBannedWord = function() {
    throw new Error("🛑 EMERGENCY STOP: Chat filter is permanently disabled.");
  };

  // 5. Send emergency notification to Discord
  if (window.DISCORD_WEBHOOK_URL) {
    fetch(window.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🛑 **EMERGENCY CIRCUIT BREAKER ACTIVATED**\n> Memory usage reached critical limits (**${currentMemoryMB.toFixed(2)} MB**). All global timers, streams, and processes have been terminated.`,
      }),
    }).catch(() => {});
  }

  // 6. FORCE CRASH THE SITE VIEW: Wipe DOM entirely using document.open/write
  try {
    document.open();
    document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CRITICAL MEMORY SPIKE - HALTED</title>
          <style>
            body { background: #000; color: #ff4757; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: monospace; text-align: center; padding: 20px; margin: 0; }
            h1 { font-size: 3rem; margin-bottom: 10px; }
            p { font-size: 1.2rem; color: #fff; max-width: 600px; line-height: 1.5; }
            .sub { color: #888; margin-top: 20px; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <h1>🛑 CRITICAL MEMORY SPIKE</h1>
          <p>
            The emergency circuit breaker detected a severe memory runaway (<strong>${currentMemoryMB.toFixed(2)} MB</strong>). 
            All background tasks, loops, and connections have been permanently severed to protect your system.
          </p>
          <p class="sub">Please refresh your browser tab manually.</p>
        </body>
      </html>
    `);
    document.close();
  } catch (e) {}

  // 7. Throw hard error to kill execution stack
  throw new Error("🛑 CRITICAL MEMORY SPIKE: Execution permanently halted.");
}

/**
 * Monitors memory usage and triggers the hard break / crash if needed.
 */
function monitorMemoryUsage() {
  if (isEmergencyStopped) return;

  let chromeHeapMB = 0;
  if (performance && performance.memory) {
    chromeHeapMB = performance.memory.usedJSHeapSize / (1024 * 1024);
  }

  let simulatedDataSizeMB = 0;
  if (window.memoryLeakSimulator && Array.isArray(window.memoryLeakSimulator)) {
    simulatedDataSizeMB = (window.memoryLeakSimulator.length * 500) / (1024 * 1024);
  }

  // Threshold set to 300MB
  if (chromeHeapMB > 300 || simulatedDataSizeMB > 300) {
    triggerEmergencyStop(Math.max(chromeHeapMB, simulatedDataSizeMB));
  }
}

/**
 * Main function to load all banned and allowed words from Redis.
 */
async function loadAllBannedWordLists() {
  if (isEmergencyStopped) return;

  let redisBannedWords = [];
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      redisBannedWords = data.bannedWords || [];
      allowedWords = data.allowedWords || [];
    } else {
      await sendDiscordLog("warn", `Failed to load banned words list: API returned status ${res.status}`);
    }
  } catch (err) {
    await sendDiscordLog("error", "Failed to fetch banned words list from API", err);
  }

  try {
    bannedWords = [
      ...new Set(
        redisBannedWords.map((w) => w.toLowerCase())
      ),
    ];
  } catch (err) {
    // Replaced silent failure with Discord logging
    await sendDiscordLog("error", "Failed to process and format banned words array", err);
  }
}

/**
 * Check text using whole-word boundaries.
 */
let checkAndAlertBannedWord = function(platform, username, text) {
  if (isEmergencyStopped || !text) return false;

  const lowerText = text.toLowerCase();

  const matchedAllowed = allowedWords.find((allowed) => {
    const regex = new RegExp(`\\b${allowed}\\b`, "i");
    return regex.test(lowerText);
  });

  if (matchedAllowed) {
    return false;
  }

  for (const word of bannedWords) {
    if (!word) continue;
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedWord}\\b`, "i");

    if (regex.test(lowerText)) {
      sendBannedWordAlert(platform, username, text);
      return true;
    }
  }
  return false;
};

// Automatically trigger initialization and set loops
loadAllBannedWordLists();
setInterval(loadAllBannedWordLists, 3600000);
setInterval(monitorMemoryUsage, 3000);