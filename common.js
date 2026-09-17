/* Global references and state variables */
const chatContainer = document.getElementById("chat-container");
let ytTimeouts = [];
let twitchWs = null;
let pusherInstance = null;
const seenKickIds = new Set();
let isScrollingEnabled = false;

// Configuration mapping chat trigger keywords to specific symbol animations
const emoteTriggers = {
  "!aniimo": ["https://kg-web-cdn.akamaized.net/master/official-website/worldx_office_frontend/images/aniimo/comnunity_followus_aniimo_bulbly_emoji_pagemark.webp", "https://kg-web-cdn.akamaized.net/master/official-website/worldx_office_frontend/images/aniimo/comnunity_followus_aniimo_nimbi_emoji_pagemark.webp", "🌟"],
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
  "!marker": [
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
  lol:["images/su_lol_emoji.png"],
  blep: ["images/su_blep_emoji.png"],
  love: ["images/su_love_emoji.png"],
  please: ["images/su_please_emoji.png"],
  hi:["images/su_hi_emoji.png"],
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
    // Match the exact ID format used in local storage / Redis keys
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

/* Generates a visual falling particle burst effect using a random mix of the provided emojis or images */
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
  checkEmoteTrigger(rawText);
  const safeText = sanitizeChatMessage(rawText);

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${platform}`;

  // const butterflySpan = document.createElement("span");
  // butterflySpan.className = "chat-butterfly";
  // butterflySpan.textContent = "🦋";
  // messageDiv.appendChild(butterflySpan);

  const aniimoIconSpan = document.createElement("span");
  aniimoIconSpan.className = "chat-aniimo-icon";
  
  const aniimoImg = document.createElement("img");
  aniimoImg.className = "aniimo-img"
  aniimoImg.src = "https://worldx-website-cdn.aniimo.com/official-website/worldx/wiki_stage/init/Wiki_Aniimo_10171.png";
  aniimoImg.alt = "Aniimo Icon";
  
  aniimoIconSpan.appendChild(aniimoImg);
  messageDiv.appendChild(aniimoIconSpan);

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

  // Inside appendMessage, replace the random check with this logic:
  let isPrismana = false;

  // Guaranteed Prismana for Masster_tea
  if (username && username.toLowerCase() === "masster_tea") {
    isPrismana = true;
  } else {
    // Check if user is a VIP (e.g., via Twitch badges or platform metadata)
    const isVip =
      (twitchBadges &&
        (twitchBadges.includes("vip") || twitchBadges.hasOwnProperty("vip"))) ||
      (badgeInfo && badgeInfo.includes("vip"));

    // Higher chance for VIPs (e.g., 20%), standard chance for others (e.g., 5%)
    const prismanaChance = isVip ? .2 : 0.05;

    if (Math.random() < prismanaChance) {
      isPrismana = true;
    }
  }

  if (isPrismana) {
    messageDiv.classList.add("prismana-rare");
  }

  const pathfinderSpan = document.createElement("span");
  pathfinderSpan.className = "pathfinder-tag";
  pathfinderSpan.textContent = "Pathfinder";
  headerDiv.appendChild(pathfinderSpan);

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

  if (!isScrollingEnabled) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  // const MAX_MESSAGES = 20;
  // while (chatContainer.children.length > MAX_MESSAGES) {
  //   chatContainer.removeChild(chatContainer.firstChild);
  // }
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
    // 1. Collect all current values from your configuration inputs
    const settingsData = {
      twitchChannel: document.getElementById("twitch-channel")?.value || "",
      kickChannel: document.getElementById("kick-channel")?.value || "",
      ytHandle: document.getElementById("yt-handle")?.value || "",
      ytApiKey: document.getElementById("yt-api-key")?.value || "",
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

    // Automatically grab all emote toggles using their class and ID
    document.querySelectorAll(".emote-toggle").forEach((cb) => {
      settingsData[cb.id] = cb.checked;
    });

    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsData),
    });

    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.statusText}`);
    }

    const result = await response.json();
    console.info("Settings successfully saved to cloud:", result);
  } catch (err) {
    console.error("Error saving settings to cloud:", err);
  }
}

/* Fetch saved settings from Redis and apply them to the UI on page load */
async function loadSettingsOnStartup() {
  try {
    const response = await fetch("/api/settings");
    if (!response.ok) throw new Error("Failed to fetch settings from cloud");

    const settings = await response.json();
    if (!settings || Object.keys(settings).length === 0) return;

    // 1. Populate text inputs if they exist in saved settings
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
    if (settings.ytApiKey) {
      const el = document.getElementById("yt-api-key");
      if (el) el.value = settings.ytApiKey;
    }

    // 2. Populate color pickers and sliders
    // 2. Populate color pickers and sliders with proper CSS-matching fallbacks
    if (settings.userboxColor) {
      const el = document.getElementById("userbox-color-picker");
      if (el) el.value = settings.userboxColor;
    }

    // Explicitly handle opacity fallback to match your CSS (0.9)
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

    // 3. Populate emote wall checkboxes dynamically
    Object.keys(settings).forEach((key) => {
      const checkbox = document.getElementById(key);
      if (checkbox && checkbox.type === "checkbox") {
        checkbox.checked = settings[key];
      }
    });

    // Trigger any color/styling update functions your app uses
    if (typeof updateUserBoxColor === "function") updateUserBoxColor();
    if (typeof updateMsgBoxColor === "function") updateMsgBoxColor();
    if (typeof updateTextColor === "function") updateTextColor();

    if (settings.pinnedAnnouncement) {
      const el = document.getElementById("pinned-input");
      if (el) el.value = settings.pinnedAnnouncement;
      setPinnedAnnouncement(settings.pinnedAnnouncement);
    }

    console.info("Loaded and applied cloud settings on startup:", settings);
  } catch (err) {
    console.error("Error loading settings on startup:", err);
  }
}

/* Master startChat function combining individual platform initialization */
async function startChat() {
  const twitchChan = document.getElementById("twitch-channel").value.trim();
  const kickChan = document.getElementById("kick-channel").value.trim();
  const ytHandle = document.getElementById("yt-handle").value.trim();
  const ytKeyInput = document.getElementById("yt-api-key").value.trim();
  if (twitchChan) localStorage.setItem("stream_twitch_channel", twitchChan);
  if (kickChan) localStorage.setItem("stream_kick_channel", kickChan);
  if (ytHandle) localStorage.setItem("stream_yt_handle", ytHandle);
  if (ytKeyInput) localStorage.setItem("stream_yt_key", ytKeyInput);

  chatContainer.innerHTML = "";

  setInterval(() => {
    //console.clear();
  }, 6000); // Clears every 1 minute
  if (twitchWs) {
    twitchWs.onclose = null;
    twitchWs.close();
    twitchWs = null;
  }
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }

  ytTimeouts.forEach((t) => clearTimeout(t));
  ytTimeouts = [];
  if (twitchWs) twitchWs.close();
  if (pusherInstance) pusherInstance.disconnect();

  if (twitchChan) initTwitchChat(twitchChan);
  if (kickChan) initKickChat(kickChan);
  if (ytHandle) initYouTubeChat(ytHandle);
}
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

async function startChatWithRetry() {
  await startChat();

  // Check if Twitch or YouTube failed to initialize and retry
  const twitchChan = document.getElementById("twitch-channel")?.value.trim();
  const ytHandle = document.getElementById("yt-handle")?.value.trim();

  const needsTwitchRetry =
    twitchChan && (!twitchWs || twitchWs.readyState !== WebSocket.OPEN);

  if (needsTwitchRetry && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.warn(
      `[Auto-Reconnect] Retrying connection attempt ${reconnectAttempts}...`,
    );
    setTimeout(startChatWithRetry, 3000);
  } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error("[Auto-Reconnect] Max reconnection attempts reached.");
  }
}

/* DOM Content Loaded Event Handlers */
window.addEventListener("DOMContentLoaded", () => {
  initButterflies();
  initEmoteToggles();
  loadSettingsOnStartup();

  const savedAnnouncement = localStorage.getItem("stream_pinned_announcement");
  const pinnedInput = document.getElementById("pinned-input");

  if (savedAnnouncement) {
    setPinnedAnnouncement(savedAnnouncement);
    if (pinnedInput) pinnedInput.value = savedAnnouncement;
  } else if (!pinnedInput?.value || pinnedInput.value === "") {
    // setPinnedAnnouncement("Your message here!");
    // if (pinnedInput) pinnedInput.value = "Your message here!";
  }

  pinnedInput?.addEventListener("input", (e) => {
    const text = e.target.value;
    setPinnedAnnouncement(text);
    clearTimeout(window.announcementSaveTimeout);
    window.announcementSaveTimeout = setTimeout(() => {
      saveCurrentSettingsToCloud();
    }, 1000); // Debounce by 500ms / 1s or save on change
  });

  // Force immediate save when clicking away or pressing enter
  pinnedInput?.addEventListener("blur", (e) => {
    clearTimeout(window.announcementSaveTimeout);
    setPinnedAnnouncement(e.target.value);
    saveCurrentSettingsToCloud();
  });

  // Ensure button text matches initial 'OFF' state
  const scrollBtn = document.getElementById("toggle-scroll-btn");
  if (scrollBtn) scrollBtn.textContent = "Scrolling: OFF";

  /* Manual toggle button click */
  scrollBtn?.addEventListener("click", () => {
    isScrollingEnabled = !isScrollingEnabled;
    scrollBtn.textContent = `Scrolling: ${isScrollingEnabled ? "ON" : "OFF"}`;

    if (isScrollingEnabled) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  let lastScrollTop = chatContainer.scrollTop;
  let isUserScrolling = false;

  chatContainer.addEventListener("pointerdown", () => {
    isUserScrolling = true;
  });

  chatContainer.addEventListener(
    "wheel",
    () => {
      isUserScrolling = true;
    },
    { passive: true },
  );

  chatContainer.addEventListener("scroll", () => {
    const currentScrollTop = chatContainer.scrollTop;
    const isAtBottom =
      currentScrollTop + chatContainer.clientHeight >=
      chatContainer.scrollHeight - 5;

    if (isUserScrolling) {
      // If user scrolls UP, set to ON
      if (currentScrollTop < lastScrollTop) {
        isScrollingEnabled = true;
        if (scrollBtn) scrollBtn.textContent = "Scrolling: ON";
      }
      // If user scrolls down to the BOTTOM, set to OFF (without locking overflow)
      else if (isAtBottom) {
        isScrollingEnabled = false;
        if (scrollBtn) scrollBtn.textContent = "Scrolling: OFF";
      }
    }

    lastScrollTop = currentScrollTop;
  });

  chatContainer.addEventListener("pointerup", () => {
    isUserScrolling = false;
  });

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("hideconfig") === "true") {
    document.getElementById("config-bar").style.display = "none";

    let lastSettingsString = "";

    async function pollCloudSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const settings = await response.json();
          const currentString = JSON.stringify(settings);

          if (lastSettingsString && currentString !== lastSettingsString) {
            console.info(
              "[OBS Sync] New settings detected from browser control panel. Refreshing chat...",
            );
            await loadSettingsOnStartup();
            startChatWithRetry();
          }
          lastSettingsString = currentString;
        }
      } catch (err) {
        console.error("Error polling cloud settings:", err);
      }
    }

    // Initial load and start
    loadSettingsOnStartup().then(async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          lastSettingsString = JSON.stringify(data);
        }
      } catch (e) {}

      startChatWithRetry();

      // Poll cloud settings every 5 seconds for changes triggered by the control panel
      setInterval(pollCloudSettings, 5000);
    });
  }

  // Clear Color Settings Handler
  document
    .getElementById("clearColorsBtn")
    ?.addEventListener("click", async () => {
      const choice = prompt(
        "Where would you like to clear color settings?\nType: 'local', 'cloud', or 'both'",
      ).toLowerCase();

      if (choice === "local" || choice === "both") {
        localStorage.removeItem("savedUserBoxHex");
        localStorage.removeItem("savedUserBoxOpacity");
        localStorage.removeItem("savedMsgBoxHex");
        localStorage.removeItem("savedMsgBoxOpacity");
        localStorage.removeItem("savedTextHex");
        console.info("Local color settings cleared.");
      }

      if (choice === "cloud" || choice === "both") {
        try {
          const res = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "clear_colors" }),
          });
          if (res.ok) console.info("Cloud color settings cleared.");
        } catch (err) {
          console.error("Failed to clear cloud colors:", err);
        }
      }

      // Optional: reload page to reflect changes
      window.location.reload();
    });

  // Clear Emote Settings Handler
  document
    .getElementById("clearEmotesBtn")
    ?.addEventListener("click", async () => {
      const choice = prompt(
        "Where would you like to clear emote settings?\nType: 'local', 'cloud', or 'both'",
      ).toLowerCase();

      if (choice === "local" || choice === "both") {
        Object.keys(emoteTriggers).forEach((keyword) => {
          localStorage.removeItem(`emote_toggle_${keyword}`);
        });
        console.info("Local emote settings cleared.");
      }

      if (choice === "cloud" || choice === "both") {
        try {
          const res = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "clear_emotes" }),
          });
          if (res.ok) console.info("Cloud emote settings cleared.");
        } catch (err) {
          console.error("Failed to clear cloud emotes:", err);
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
