/* Global references and state variables */
const API_BASE = "https://stephchat.onrender.com";
const chatContainer = document.getElementById("chat-container");
let ytTimeouts = [];
let pusherInstance = null;
const seenKickIds = new Set();
let isScrollingEnabled = false;

const ignoredUsers = [];

// Avoids global scope redeclaration errors entirely by attaching to window
window.DISCORD_WEBHOOK_URL = window.DISCORD_WEBHOOK_URL || "";

async function initializeEnvironment() {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (res.ok) {
      const data = await res.json();
      window.DISCORD_WEBHOOK_URL =
        data.discordWebhookUrl || data.settings?.discordWebhookUrl || "";
    } else {
      // Optional: Handle non-200 responses as well
      await sendDiscordLog(
        "error",
        `Failed to fetch settings: API returned status ${res.status}`,
      );
    }
  } catch (err) {
    // Put this here:
    await sendDiscordLog(
      "error",
      "Failed to initialize environment settings from API",
      err,
    );
  }
}

// Configuration mapping chat trigger keywords to specific symbol animations
const emoteTriggers = {
  "!prayer": ["🙏"],
  "!praise": ["🙌"],
  "!cornbread": [
    "https://static.vecteezy.com/system/resources/previews/044/755/342/non_2x/cornbread-against-transparent-background-free-png.png",
  ],
  "!brit": ["🇬🇧"],
  "!boop": ["https://media.tenor.com/x4EkBqnQJysAAAAi/boop.gif"],
  "!beep": [],
  "!hug": ["https://files.kick.com/emotes/980711/fullsize", "🫂"],
  "!grounded": ["https://files.kick.com/emotes/980532/fullsize"],
  "!bonk": [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d22eb06192f3427e956d4a6373053c06/default/dark/4.0",
  ],
  "!marker": [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_1131b76bea8142718a730799625cf0aa/default/dark/4.0",
  ],
  "!clip": [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_1131b76bea8142718a730799625cf0aa/default/dark/4.0",
  ],
  "!church": ["⛪"],
  "!prime": ["👨🏻‍💼", "⛪"],
  "!lurk": [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_0bcbac13d1224d548c34c03b84a4e06e/default/dark/4.0",
  ],
  "!ban": [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_cbd1abdccdc740e4a1de4826e9e971b9/default/dark/4.0",
  ],
  "!shank": [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_2405ae7db22b46eaafd10b8cba206508/default/dark/4.0",
  ],
  yay: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_b925f7c5716b4cd2a9bcfe52ce0009a5/default/dark/4.0",
  ],
  "no you": [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_9825374f890a43788ba64ff15ba2216b/default/dark/4.0",
  ],
  "no u": [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_9825374f890a43788ba64ff15ba2216b/default/dark/4.0",
  ],
  sus: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_ae9fa1ed598f4a8bbd063cb9fd90f50b/default/dark/4.0",
  ],
  garrett: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_c3d3aaf3f5ea4401a7f1d2a6e45b80bf/default/light/3.0",
  ],
  "!hubby": [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_c3d3aaf3f5ea4401a7f1d2a6e45b80bf/default/light/3.0",
  ],
  mod: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a2dfbbbbf66f4a75b0f53db841523e6c/default/dark/4.0",
  ],
};

/* Automatically generate checkboxes from emoteTriggers and load saved states */
function initEmoteToggles() {
  const container = document.getElementById("emote-toggles-container");
  if (!container) return;

  const existingToggles = container.querySelectorAll(".emote-toggle-label");
  existingToggles.forEach((el) => el.remove());

  Object.keys(emoteTriggers).forEach((keyword) => {
    const label = document.createElement("label");
    label.className = "emote-toggle-label";
    label.style.cssText =
      "display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 12px; color: var(--text-color, #fff);";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "emote-toggle";
    checkbox.id = `emote_toggle_${keyword}`;
    checkbox.dataset.keyword = keyword;

    const savedState = localStorage.getItem(`emote_toggle_${keyword}`);
    checkbox.checked = savedState !== null ? savedState === "true" : true;

    checkbox.addEventListener("change", () => {
      localStorage.setItem(`emote_toggle_${keyword}`, checkbox.checked);
    });

    const displayName = keyword.replace(/^!/, "");
    const formattedName =
      displayName.charAt(0).toUpperCase() + displayName.slice(1);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + formattedName));
    container.appendChild(label);
  });
}

/* Scans incoming chat text for mapped emote trigger keywords if enabled */
function checkEmoteTrigger(messageText) {
  const lowerText = messageText.trim().toLowerCase();
  for (const [keyword, values] of Object.entries(emoteTriggers)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      const checkbox = document.querySelector(
        `.emote-toggle[data-keyword="${keyword}"]`,
      );

      if (checkbox && !checkbox.checked) {
        continue;
      }

      if (Array.isArray(values) && values.length > 0) {
        launchEmoteBurst(values);
      }
      break;
    }
  }
}

/* Helper function to determine if a string is an image URL/path */
function isImageUrl(str) {
  return (
    str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("/") ||
    str.includes("images/") ||
    str.includes(".")
  );
}

/* Generates a visual falling particle burst effect using a random mix of emojis/images */
function launchEmoteBurst(values) {
  const container = document.getElementById("burst-container");
  const burstCount = 25;

  for (let i = 0; i < burstCount; i++) {
    const el = document.createElement("div");
    el.className = "burst-item";

    const item = values[Math.floor(Math.random() * values.length)];

    if (isImageUrl(item)) {
      const img = document.createElement("img");
      img.src = item;
      img.alt = "emote";
      img.style.width = "100px";
      img.style.height = "100px";
      img.style.objectFit = "contain";
      el.appendChild(img);
    } else {
      el.textContent = item;
    }

    const leftPos = Math.random() * 100;
    const animDuration = 2 + Math.random() * 2.5;
    const animDelay = Math.random() * 0.8;
    const driftX = (Math.random() - 0.5) * 200;

    el.style.left = `${leftPos}%`;
    el.style.animationDuration = `${animDuration}s`;
    el.style.animationDelay = `${animDelay}s`;
    el.style.setProperty("--drift", driftX);

    container.appendChild(el);

    setTimeout(
      () => {
        el.remove();
      },
      (animDuration + animDelay) * 1000,
    );
  }
}

/* Sanitizes raw chat messages by stripping IRC control chars and action tags */
function sanitizeChatMessage(rawMessage) {
  if (!rawMessage) return "";

  let cleanedMessage = rawMessage;
  cleanedMessage = cleanedMessage.replace(/\u0001/g, "");
  cleanedMessage = cleanedMessage.replace(/^ACTION\s*/i, "");
  cleanedMessage = cleanedMessage.replace(/[\r\n\x00-\x1F\x7F-\x9F]/g, "");
  return cleanedMessage.trim();
}

/* Dynamically populates the background container with floating butterfly elements */
function initButterflies() {
  const container = document.getElementById("butterfly-container");
  const count = Math.random() * 20;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "butterfly";
    el.textContent = "🦋";

    const leftPos = Math.random() * 100;
    const animDuration = 10 + Math.random() * 8;
    const animDelay = Math.random() * 12;
    const randX = (Math.random() - 0.5) * 150;

    el.style.left = `${leftPos}%`;
    el.style.animationDuration = `${animDuration}s`;
    el.style.animationDelay = `-${animDelay}s`;
    el.style.setProperty("--rand-x", randX);

    container.appendChild(el);
  }
}

/* Core function to construct, format, and append incoming chat messages to the chat feed */
function appendMessage(
  platform,
  username,
  rawText,
  color = "#ffffff",
  emotesData = null,
  ytDetails = null,
  twitchBadges = null,
  kickBadges = [],
  badgeInfo = null,
) {
  if (username && ignoredUsers.includes(username.toLowerCase())) {
    return;
  }

  if (typeof checkAndAlertBannedWord === "function" && checkAndAlertBannedWord(platform, username, rawText)) {
    return;
  }

  checkEmoteTrigger(rawText);
  const safeText = sanitizeChatMessage(rawText);

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${platform}`;

  const butterflySpan = document.createElement("span");
  butterflySpan.className = "chat-butterfly";
  butterflySpan.textContent = "🦋";
  messageDiv.appendChild(butterflySpan);

  const headerDiv = document.createElement("div");
  headerDiv.className = "message-header";

  const badge = document.createElement("span");
  badge.className = `badge ${platform.toLowerCase()}`;
  badge.textContent = platform;
  headerDiv.appendChild(badge);

  if (platform === "Twitch" && twitchBadges) {
    renderTwitchBadges(twitchBadges, badgeInfo, headerDiv);
  } else if (platform === "Kick" && kickBadges.length > 0) {
    renderKickBadges(kickBadges, headerDiv);
  }

  let isPrismana = false;
  if (username && username.toLowerCase() === "masster_tea") {
    isPrismana = true;
  }

  const modNames = [
    "aviva_zee",
    "bobcat452",
    "caffeinatedskwerl",
    "cloudbot",
    "dee_monkeey",
    "dissonanceprime",
    "ferric_hehrtool",
    "forgebiblebot",
    "gfunkrailroad",
    "hey_its_jean",
    "howdymanhall",
    "lionwarrior79",
    "nightbot",
    "officedemon",
    "opacoley",
    "phoenragon",
    "remnantrd",
    "rogue_steve6",
    "rusher_gamesyt",
    "ryvur",
    "sery_bot",
    "streamelements",
    "streamlabs",
    "tangiabot",
    "theondisciple",
    "unhinged_mrs_krisusten",
    "zacchaeus12_2",
  ];
  let isMod = false;
  const cleanUsername = username ? username.trim().toLowerCase() : "";
  if (cleanUsername && modNames.includes(cleanUsername)) {
    isMod = true;
  }

  if (!isMod && platform === "Twitch" && twitchBadges) {
    if (
      typeof twitchBadges === "string" &&
      twitchBadges.toLowerCase().includes("moderator")
    ) {
      isMod = true;
    }
  }
  if (!isMod && platform === "Kick" && Array.isArray(kickBadges)) {
    if (
      kickBadges.some(
        (b) => typeof b === "string" && b.toLowerCase().includes("mod"),
      )
    ) {
      isMod = true;
    }
  }

  let isBroadcaster = false;
  if (username && username.toLowerCase() === "sassinatorsteph") {
    isBroadcaster = true;
  }

  if (isPrismana) {
    messageDiv.classList.add("prismana-rare");
  }

  if (isMod) {
    messageDiv.classList.add("moderator");
  }

  if (isBroadcaster) {
    messageDiv.classList.add("broadcaster");
  }

  const userSpan = document.createElement("span");
  userSpan.className = "username";
  let resolvedColor = color;
  if (
    !resolvedColor ||
    resolvedColor.toLowerCase() === "#b19cd9" ||
    resolvedColor.toLowerCase() === "rgb(177, 156, 217)" ||
    resolvedColor.toLowerCase() === "rgb(177,156,217)"
  ) {
    resolvedColor = "#ffffff";
  }

  userSpan.style.color = resolvedColor;
  userSpan.textContent = `${username}:`;
  headerDiv.appendChild(userSpan);

  messageDiv.appendChild(headerDiv);

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  if (platform === "Twitch") {
    renderTwitchEmotes(safeText, emotesData || "", contentDiv);
  } else if (platform === "Kick") {
    renderKickEmotes(safeText, contentDiv);
  } else if (platform === "YouTube") {
    renderYouTubeEmotes(safeText, ytDetails, contentDiv);
  } else {
    contentDiv.textContent = ` ${safeText}`;
  }

  messageDiv.appendChild(contentDiv);

  chatContainer.appendChild(messageDiv);

  // Auto-scroll only if auto-scroll is ON (isScrollingEnabled is true)
  if (isScrollingEnabled) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const isObsBrowser = urlParams.get("hideconfig") === "true";

  if (urlParams.get("logged_in") === "true") {
    const banner = document.createElement("div");
    banner.style.cssText =
      "background: #2ed573; color: #fff; padding: 12px; text-align: center; font-weight: bold; font-family: sans-serif; position: fixed; top: 0; left: 0; width: 100%; z-index: 99999; box-shadow: 0 4px 6px rgba(0,0,0,0.2); transition: opacity 0.5s ease;";
    banner.textContent =
      "🎉 Successfully authenticated and connected to platform! Tokens saved to Redis.";
    document.body.prepend(banner);

    // Fade out and remove after 5 seconds
    setTimeout(() => {
      banner.style.opacity = "0";
      setTimeout(() => banner.remove(), 500);
    }, 5000);
  }

  if (isObsBrowser) {
    const MAX_OBS_MESSAGES = 10; // Adjust your preferred message limit here
    while (chatContainer.children.length > MAX_OBS_MESSAGES) {
      chatContainer.removeChild(chatContainer.firstChild);
    }
  }
}

/* Helper function to generate fallback styled text or images for user badges */
function createFallbackBadgeImage(
  imgSrc,
  altText,
  fallbackText,
  fallbackStyle,
) {
  const wrapper = document.createElement("span");
  wrapper.style.display = "inline-block";
  wrapper.style.marginRight = "6px";
  wrapper.style.verticalAlign = "middle";

  const textSpan = document.createElement("span");
  textSpan.className = "chat-badge-text";
  textSpan.style.cssText = fallbackStyle;
  textSpan.textContent = fallbackText;

  if (imgSrc) {
    const img = document.createElement("img");
    img.className = "chat-badge-img";
    img.src = imgSrc;
    img.alt = altText;

    img.onerror = function () {
      img.remove();
      textSpan.style.display = "inline-block";
    };
    textSpan.style.display = "none";
    wrapper.appendChild(img);
  } else {
    textSpan.style.display = "inline-block";
  }

  wrapper.appendChild(textSpan);
  return wrapper;
}

/* Applies custom color and opacity selections to CSS variables and localStorage */
function applyColor(
  pickerId,
  sliderId,
  textInputId,
  storageHexKey,
  storageOpacityKey,
  cssVariable,
  settingName,
) {
  const hex = document.getElementById(pickerId).value;
  const opacity = document.getElementById(sliderId).value;

  localStorage.setItem(storageHexKey, hex);
  localStorage.setItem(storageOpacityKey, opacity);

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const rgbaString = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  document.getElementById(textInputId).value = rgbaString;

  document.documentElement.style.setProperty(cssVariable, rgbaString);
}

/* Updates user header box background styling */
function updateUserBoxColor() {
  applyColor(
    "userbox-color-picker",
    "userbox-opacity-slider",
    "userbox-color-input",
    "savedUserBoxHex",
    "savedUserBoxOpacity",
    "--header-bg",
    "user_box_color",
  );
}

/* Updates message content box background styling */
function updateMsgBoxColor() {
  applyColor(
    "msgbox-color-picker",
    "msgbox-opacity-slider",
    "msgbox-color-input",
    "savedMsgBoxHex",
    "savedMsgBoxOpacity",
    "--message-bg",
    "msg_box_color",
  );
}

/* Updates chat message text color styling */
function updateTextColor() {
  const hex = document.getElementById("textcolor-picker").value;
  localStorage.setItem("savedTextHex", hex);

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const rgbaString = `rgba(${r}, ${g}, ${b}, 1)`;
  document.documentElement.style.setProperty("--text-color", rgbaString);
}

/* Saves current settings to the cloud backend */
async function saveCurrentSettingsToCloud() {
  try {
    const settingsData = {
      twitchChannel: document.getElementById("twitch-channel")?.value || "",
      kickChannel: document.getElementById("kick-channel")?.value || "",
      ytHandle: document.getElementById("yt-handle")?.value || "",
      ytApiKey: window.YOUTUBE_API_KEY || "",
      pinnedAnnouncement: document.getElementById("pinned-input")?.value || "",
      userboxColor:
        document.getElementById("userbox-color-picker")?.value || "",
      userboxOpacity:
        document.getElementById("userbox-opacity-slider")?.value || "",
      msgboxColor: document.getElementById("msgbox-color-picker")?.value || "",
      msgboxOpacity:
        document.getElementById("msgbox-opacity-slider")?.value || "",
      textColor: document.getElementById("textcolor-picker")?.value || "",
      timestamp: new Date().toISOString(),
    };

    document.querySelectorAll(".emote-toggle").forEach((cb) => {
      settingsData[cb.id] = cb.checked;
    });

    const response = await fetch(`${API_BASE}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsData),
    });

    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.statusText}`);
    }

    const result = await response.json();
    sendDiscordLog("info", "Settings successfully saved to cloud:", result);
  } catch (err) {
    sendDiscordLog("error", "Error saving settings to cloud:", err);
  }
}

/* Fetch saved settings from Redis and apply them to the UI on page load */
async function loadSettingsOnStartup() {
  try {
    const response = await fetch(`${API_BASE}/api/settings`);
    if (!response.ok) throw new Error("Failed to fetch settings from cloud");

    const data = await response.json();
    const settings = data.settings || data;
    if (!settings || Object.keys(settings).length === 0) return;

    if (settings.twitchChannel) {
      const el = document.getElementById("twitch-channel");
      if (el) el.value = settings.twitchChannel;
    }
    if (settings.kickChannel) {
      const el = document.getElementById("kick-channel");
      if (el) el.value = settings.kickChannel;
    }
    if (settings.ytHandle) {
      const el = document.getElementById("yt-handle");
      if (el) el.value = settings.ytHandle;
    }
    if (settings.ytApiKey || settings.ytApiKeys) {
      const rawKeys = settings.ytApiKeys || settings.ytApiKey;

      window.YOUTUBE_API_KEYS = Array.isArray(rawKeys)
        ? rawKeys
        : rawKeys
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);

      window.YOUTUBE_API_KEY = window.YOUTUBE_API_KEYS[0] || "";

      const el = document.getElementById("yt-api-key");
      if (el) el.value = window.YOUTUBE_API_KEY;
    }

    if (settings.userboxColor) {
      const el = document.getElementById("userbox-color-picker");
      if (el) el.value = settings.userboxColor;
    }

    const userboxOpacityVal = settings.userboxOpacity || "0.9";
    const userboxSlider = document.getElementById("userbox-opacity-slider");
    if (userboxSlider) {
      userboxSlider.value = userboxOpacityVal;
    }

    if (settings.msgboxColor) {
      const el = document.getElementById("msgbox-color-picker");
      if (el) el.value = settings.msgboxColor;
    }

    const msgboxOpacityVal = settings.msgboxOpacity || "0.6";
    const msgboxSlider = document.getElementById("msgbox-opacity-slider");
    if (msgboxSlider) {
      msgboxSlider.value = msgboxOpacityVal;
    }

    if (settings.textColor) {
      const el = document.getElementById("textcolor-picker");
      if (el) el.value = settings.textColor;
    }

    Object.keys(settings).forEach((key) => {
      const checkbox = document.getElementById(key);
      if (checkbox && checkbox.type === "checkbox") {
        checkbox.checked = settings[key];
      }
    });

    if (typeof updateUserBoxColor === "function") updateUserBoxColor();
    if (typeof updateMsgBoxColor === "function") updateMsgBoxColor();
    if (typeof updateTextColor === "function") updateTextColor();

    if (settings.pinnedAnnouncement) {
      const el = document.getElementById("pinned-input");
      if (el) el.value = settings.pinnedAnnouncement;
      setPinnedAnnouncement(settings.pinnedAnnouncement);
    }

    sendDiscordLog(
      "info",
      "Loaded and applied cloud settings on startup:",
      settings,
    );
  } catch (err) {
    sendDiscordLog("error", "Error loading settings on startup:", err);
  }
}

/* Master startChat function combining individual platform initialization */
async function startChat() {
  const twitchChan = document.getElementById("twitch-channel").value.trim();
  const kickChan = document.getElementById("kick-channel").value.trim();
  const ytHandle = document.getElementById("yt-handle").value.trim();
  if (twitchChan) localStorage.setItem("stream_twitch_channel", twitchChan);
  if (kickChan) localStorage.setItem("stream_kick_channel", kickChan);
  if (ytHandle) localStorage.setItem("stream_yt_handle", ytHandle);

  chatContainer.innerHTML = "";

  if (typeof twitchWs !== "undefined" && twitchWs) {
    twitchWs.onclose = null;
    twitchWs.close();
  }
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }

  ytTimeouts.forEach((t) => clearTimeout(t));
  ytTimeouts = [];

  if (twitchChan && typeof initTwitchChat === "function") initTwitchChat(twitchChan);
  if (kickChan && typeof initKickChat === "function") initKickChat(kickChan);
  if (ytHandle && typeof initYouTubeChat === "function") initYouTubeChat(ytHandle);
}

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

async function startChatWithRetry() {
  await startChat();

  const twitchChan = document.getElementById("twitch-channel")?.value.trim();
  const needsTwitchRetry =
    twitchChan && (typeof twitchWs === "undefined" || !twitchWs || twitchWs.readyState !== WebSocket.OPEN);

  if (needsTwitchRetry && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    sendDiscordLog(
      "warning",
      `[Auto-Reconnect] Retrying connection attempt ${reconnectAttempts}...`,
    );
    setTimeout(startChatWithRetry, 3000);
  } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    sendDiscordLog(
      "error",
      "[Auto-Reconnect] Max reconnection attempts reached.",
    );
  }
}

/* DOM Content Loaded Event Handlers */
window.addEventListener("DOMContentLoaded", async () => {
  initializeEnvironment();
  initButterflies();
  initEmoteToggles();
  await loadSettingsOnStartup();

  document.getElementById("twitch-oauth-btn")?.addEventListener("click", () => {
    window.location.href = `${API_BASE}/api/auth/twitch`;
  });

  // YouTube OAuth Handler
  document.getElementById("yt-oauth-btn")?.addEventListener("click", () => {
    window.location.href = `${API_BASE}/api/auth/youtube`;
  });

  const savedAnnouncement = localStorage.getItem("stream_pinned_announcement");
  const pinnedInput = document.getElementById("pinned-input");

  if (savedAnnouncement) {
    setPinnedAnnouncement(savedAnnouncement);
    if (pinnedInput) pinnedInput.value = savedAnnouncement;
  }

  pinnedInput?.addEventListener("input", (e) => {
    const text = e.target.value;
    setPinnedAnnouncement(text);
    clearTimeout(window.announcementSaveTimeout);
    window.announcementSaveTimeout = setTimeout(() => {
      saveCurrentSettingsToCloud();
    }, 1000);
  });

  pinnedInput?.addEventListener("blur", (e) => {
    clearTimeout(window.announcementSaveTimeout);
    setPinnedAnnouncement(e.target.value);
    saveCurrentSettingsToCloud();
  });

  // Setup Auto-Scroll state and toggle button
  isScrollingEnabled = true; // Default to ON
  const scrollBtn = document.getElementById("toggle-scroll-btn");
  if (scrollBtn) scrollBtn.textContent = "Auto-Scroll: ON";

  scrollBtn?.addEventListener("click", () => {
    isScrollingEnabled = !isScrollingEnabled;
    scrollBtn.textContent = `Auto-Scroll: ${isScrollingEnabled ? "ON" : "OFF"}`;

    if (isScrollingEnabled) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  // Reliable scroll listener: updates auto-scroll toggle based on whether user is at bottom or scrolled up
  chatContainer.addEventListener("scroll", () => {
    const currentScrollTop = chatContainer.scrollTop;
    const maxScrollTop =
      chatContainer.scrollHeight - chatContainer.clientHeight;

    const isAtBottom = currentScrollTop >= maxScrollTop - 10;

    if (isAtBottom) {
      isScrollingEnabled = true;
      if (scrollBtn) scrollBtn.textContent = "Auto-Scroll: ON";
    } else {
      isScrollingEnabled = false;
      if (scrollBtn) scrollBtn.textContent = "Auto-Scroll: OFF";
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("hideconfig") === "true") {
    const configBar = document.getElementById("config-bar");
    if (configBar) configBar.style.display = "none";

    let lastSettingsString = "";

    async function pollCloudSettings() {
      try {
        const response = await fetch(`${API_BASE}/api/settings`);
        if (response.ok) {
          const settings = await response.json();
          const currentString = JSON.stringify(settings);

          if (lastSettingsString && currentString !== lastSettingsString) {
            sendDiscordLog(
              "info",
              "[OBS Sync] New settings detected from browser control panel. Refreshing chat...",
            );
            await loadSettingsOnStartup();
            startChatWithRetry();
          }
          lastSettingsString = currentString;
        }
      } catch (err) {
        sendDiscordLog("error", "Error polling cloud settings:", err);
      }
    }

    loadSettingsOnStartup().then(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          lastSettingsString = JSON.stringify(data);
        }
      } catch (e) {}

      startChatWithRetry();

      setInterval(pollCloudSettings, 5000);
    });

    setInterval(() => {
      if (performance && performance.memory) {
        const usedHeapMB = performance.memory.usedJSHeapSize / (1024 * 1024);
        if (usedHeapMB > 300) {
          sendDiscordLog(
            "warning",
            `[OBS Watchdog] High memory usage detected (${usedHeapMB.toFixed(2)} MB). Reloading browser source...`,
          );
          window.location.reload();
        }
      }
    }, 15000);

    setInterval(() => {
      sendDiscordLog(
        "info",
        "[OBS Watchdog] Scheduled periodic browser source refresh to prevent memory fatigue.",
      );
      window.location.reload();
    }, 7200000);
  }

  // Clear Pinned Announcement Handler
  document
    .getElementById("clearAnnouncementBtn")
    ?.addEventListener("click", async () => {
      localStorage.removeItem("stream_pinned_announcement");

      const pinnedInput = document.getElementById("pinned-input");
      if (pinnedInput) pinnedInput.value = "";
      setPinnedAnnouncement("");

      try {
        const response = await fetch(`${API_BASE}/api/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pinnedAnnouncement: "",
            action: "clear_announcement",
          }),
        });
        if (response.ok) {
          sendDiscordLog(
            "info",
            "Cloud pinned announcement cleared successfully.",
          );
        } else {
          sendDiscordLog("error", "Failed to clear cloud pinned announcement.");
        }
      } catch (err) {
        sendDiscordLog(
          "error",
          "Error communicating with cloud backend for announcement clearing:",
          err,
        );
      }
    });

  document
    .getElementById("clearColorsBtn")
    ?.addEventListener("click", async () => {
      const choice = prompt(
        "Where would you like to clear color settings?\nType: 'local', 'cloud', or 'both'",
      )?.toLowerCase();

      if (!choice) return;

      if (choice === "local" || choice === "both") {
        localStorage.removeItem("savedUserBoxHex");
        localStorage.removeItem("savedUserBoxOpacity");
        localStorage.removeItem("savedMsgBoxHex");
        localStorage.removeItem("savedMsgBoxOpacity");
        localStorage.removeItem("savedTextHex");
      }

      if (choice === "cloud" || choice === "both") {
        try {
          await fetch(`${API_BASE}/api/settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "clear_colors" }),
          });
        } catch (err) {
          sendDiscordLog("error", "Failed to clear cloud colors:", err);
        }
      }

      window.location.reload();
    });

  document
    .getElementById("clearEmotesBtn")
    ?.addEventListener("click", async () => {
      const choice = prompt(
        "Where would you like to clear emote settings?\nType: 'local', 'cloud', or 'both'",
      )?.toLowerCase();

      if (!choice) return;

      if (choice === "local" || choice === "both") {
        Object.keys(emoteTriggers).forEach((keyword) => {
          localStorage.removeItem(`emote_toggle_${keyword}`);
        });
      }

      if (choice === "cloud" || choice === "both") {
        try {
          await fetch(`${API_BASE}/api/settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "clear_emotes" }),
          });
        } catch (err) {
          sendDiscordLog("error", "Failed to clear cloud emotes:", err);
        }
      }

      window.location.reload();
    });
});

/* Updates and displays the pinned announcement bar */
function setPinnedAnnouncement(text) {
  const bar = document.getElementById("pinned-announcement-bar");
  const textSpan = document.getElementById("announcement-text");

  if (!bar || !textSpan) return;

  if (text && text.trim().length > 0) {
    textSpan.textContent = text;
    bar.classList.add("active");
    localStorage.setItem("stream_pinned_announcement", text);
  } else {
    textSpan.textContent = "";
    bar.classList.remove("active");
    localStorage.removeItem("stream_pinned_announcement");
  }
}

function getPlatformBadge(source) {
  const srcLower = source ? source.toLowerCase() : "";
  switch (srcLower) {
    case "twitch":
      return '<span class="badge twitch">Twitch</span>';
    case "youtube":
      return '<span class="badge youtube">YouTube</span>';
    case "kick":
      return '<span class="badge kick">Kick</span>';
    default:
      return `<span class="badge ${srcLower}">${source}</span>`;
  }
}

async function sendDiscordLog(level, message, error = null) {
  const formattedMessage = `🛠️ **[${level.toUpperCase()}]** ${message} ${error ? `\n> \`${error.message || error}\`` : ""}`;

  if (!window.DISCORD_WEBHOOK_URL) {
    console[level](message, error || "");
    return;
  }

  try {
    const res = await fetch(window.DISCORD_WEBHOOK_URL, {
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

/* --- REAL-TIME SERVER-SENT EVENTS LISTENER --- */
const eventSource = new EventSource(`${API_BASE}/events`);

eventSource.onmessage = function(event) {
  try {
    const data = JSON.parse(event.data);
    
    const formattedType = data.type ? data.type.replace(/^channel\./, '').replace(/\./g, ' ') : 'event';
    const eventMessageText = data.message || "Triggered an event!";
    
    appendMessage(
      'Twitch',
      data.user || 'TwitchUser',
      `⚡ [${formattedType.toUpperCase()}] ${eventMessageText}`,
      '#9146ff'
    );
  } catch (err) {
    console.error("Failed to parse SSE message data:", err);
  }
};

eventSource.onerror = function(err) {
  console.error("SSE connection lost. Browser will auto-reconnect...", err);
};