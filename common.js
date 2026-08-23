/* Global references and state variables */
const chatContainer = document.getElementById("chat-container");
let ytTimeouts = [];
let twitchWs = null;
let pusherInstance = null;
const seenKickIds = new Set();

// Configuration mapping chat trigger keywords to specific symbol animations
const emoteTriggers = {
  prayer: ["🙏"],
  praise: ["🙌"],
  "!cornbread": [
    "https://static.vecteezy.com/system/resources/previews/044/755/342/non_2x/cornbread-against-transparent-background-free-png.png",
  ],
  "!brit": ["🇬🇧"],
  hug: ["https://files.kick.com/emotes/980711/fullsize"],
  grounded: ["https://files.kick.com/emotes/980532/fullsize"],
  bonk: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_d22eb06192f3427e956d4a6373053c06/default/dark/4.0",
  ],
  "!marker": [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_1131b76bea8142718a730799625cf0aa/default/dark/4.0",
  ],
  "!clip": [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_1131b76bea8142718a730799625cf0aa/default/dark/4.0",
  ],
  lurk: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_0bcbac13d1224d548c34c03b84a4e06e/default/dark/4.0",
  ],
  ban: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_cbd1abdccdc740e4a1de4826e9e971b9/default/dark/4.0",
  ],
  shank: [
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
  zacchaeus: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_b59ee2a0f92240739c2677741743f1b1/default/dark/4.0",
    "🐟",
  ],
  zack: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_0dc70c172b92455fa78bca049f53f4dc/default/dark/4.0",
  ],
  moonbunny: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_1ea5fcaba3d2493580ca78b078d15342/default/dark/4.0",
  ],
  pree: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_c26721bf8e8f4c9aacdd24bb99715fba/default/dark/4.0",
  ],
  ladyB: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_1a37058d6d0b4899bb886e0fb68fdf81/default/dark/4.0",
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_1f965d1b405d4c2fa8b1b39558ef8477/default/dark/4.0",
  ],
  trevor: ["😏"],
  matthew: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_825b6831bbb94e51aa5ba4cf77f0c460/default/dark/4.0",
  ],
  prime: ["👨🏻‍💼", "⛪"],
  garrett: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_c3d3aaf3f5ea4401a7f1d2a6e45b80bf/default/light/3.0",
  ],
  masster_tea: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_e775c069d9a549cdb6a57441afe27819/default/dark/4.0",
  ],
  master_tea: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_e775c069d9a549cdb6a57441afe27819/default/dark/4.0",
  ],
  rusher: [
    "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.gnc.com%2Fdw%2Fimage%2Fv2%2FBBLB_PRD%2Fon%2Fdemandware.static%2F-%2FSites-master-catalog-gnc%2Fdefault%2Fdwd782e08f%2Fhi-res%2F561570_Alani_Energy_Drink_Cherry_Twist_Can_Front.png%3Fsw%3D1500%26sh%3D1500%26sm%3Dfit&f=1&nofb=1&ipt=10c15a47e7904ac9e7e2cb370e8f96d6cf04397b00acefb7bc3ac5366113301d",
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a2dfbbbbf66f4a75b0f53db841523e6c/default/dark/4.0",
  ],
  remmant: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a2dfbbbbf66f4a75b0f53db841523e6c/default/dark/4.0",
  ],
  coley: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a2dfbbbbf66f4a75b0f53db841523e6c/default/dark/4.0",
  ],
  opacoley: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a2dfbbbbf66f4a75b0f53db841523e6c/default/dark/4.0",
  ],
  squel: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a2dfbbbbf66f4a75b0f53db841523e6c/default/dark/4.0",
    "☕",
  ],
  phoen: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a2dfbbbbf66f4a75b0f53db841523e6c/default/dark/4.0",
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_37559746f37b42a09bb1b49da9e1db4d/default/dark/4.0",
  ],
  jean: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a2dfbbbbf66f4a75b0f53db841523e6c/default/dark/4.0",
    "🦆",
    "https://emojipedia.org/_next/image?url=https%3A%2F%2Fis.zobj.net%2Fimage-server%2Fv1%2Fimages%3Fr%3DVp1vIZBSLfzih5Pc5Gslhpcjb0ml-ZLJZq7edYdR-_cfeeq6ov8F67gADNjTGbRTdIAyYSJZeIJHeOWQmR5MVQjis3P4bFgrAAeDKT4WXfD1jNJmIvVuaGTLbHsJytfy-7KcyHMhpIaFICug1MMQ23hwvW1Wz5IVqBpBk-_NmZYqQhA_HzCOoemtgPB9eTJIiu8A99pC7fFBS-2L4SCbCSVhH-xrmLSAf0Kay2ZrYifAPbKWghFKRnXJb84&w=256&q=75",
  ],
  mod: [
    "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_a2dfbbbbf66f4a75b0f53db841523e6c/default/dark/4.0",
  ],
};

/* Automatically generate checkboxes from emoteTriggers and load saved states */
function initEmoteToggles() {
  const container = document.getElementById('emote-toggles-container');
  if (!container) return;

  const existingToggles = container.querySelectorAll('.emote-toggle-label');
  existingToggles.forEach(el => el.remove());

  Object.keys(emoteTriggers).forEach(keyword => {
    const label = document.createElement('label');
    label.className = 'emote-toggle-label';
    label.style.cssText = 'display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 12px; color: var(--text-color, #fff);';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'emote-toggle';
    checkbox.dataset.keyword = keyword;

    const savedState = localStorage.getItem(`emote_toggle_${keyword}`);
    checkbox.checked = savedState !== null ? savedState === 'true' : true;

    checkbox.addEventListener('change', () => {
      localStorage.setItem(`emote_toggle_${keyword}`, checkbox.checked);
    });

    const displayName = keyword.replace(/^!/, '');
    const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + formattedName));
    container.appendChild(label);
  });
}

/* Scans incoming chat text for mapped emote trigger keywords if enabled */
function checkEmoteTrigger(messageText) {
  const lowerText = messageText.trim().toLowerCase();
  for (const [keyword, values] of Object.entries(emoteTriggers)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      const checkbox = document.querySelector(`.emote-toggle[data-keyword="${keyword}"]`);
      
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

document.addEventListener('DOMContentLoaded', () => {
  initEmoteToggles();
});

/* Helper function to determine if a string is an image URL/path */
function isImageUrl(str) {
  return (
    str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("/") ||
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

/* Event listener initializing butterflies and loading saved configuration parameters upon page load */
window.addEventListener("DOMContentLoaded", () => {
  initButterflies();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("hideconfig") === "true") {
    document.getElementById("config-bar").style.display = "none";
    startChat();
  }

  const savedTwitchChannel = localStorage.getItem("stream_twitch_channel");
  if (savedTwitchChannel)
    document.getElementById("twitch-channel").value = savedTwitchChannel;

  const savedKickChannel = localStorage.getItem("stream_kick_channel");
  if (savedKickChannel)
    document.getElementById("kick-channel").value = savedKickChannel;

  const savedYtHandle = localStorage.getItem("stream_yt_handle");
  if (savedYtHandle)
    document.getElementById("yt-handle").value = savedYtHandle;

  const savedYtKey = localStorage.getItem("stream_yt_key");
  if (savedYtKey)
    document.getElementById("yt-api-key").value = savedYtKey;
});

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

  const userSpan = document.createElement("span");
  userSpan.className = "username";
  userSpan.style.color =
    color && color.toLowerCase() === "#000000" ? "#ffffff" : color;
  userSpan.textContent = `${username}:`;
  headerDiv.appendChild(userSpan);

  messageDiv.appendChild(headerDiv);

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  if (platform === "Twitch" && emotesData) {
    renderTwitchEmotes(safeText, emotesData, contentDiv);
  } else if (platform === "Kick") {
    renderKickEmotes(safeText, contentDiv);
  } else if (platform === "YouTube") {
    renderYouTubeEmotes(safeText, ytDetails, contentDiv);
  } else {
    contentDiv.textContent = ` ${safeText}`;
  }

  messageDiv.appendChild(contentDiv);

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
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

/* Loads saved custom color preferences from localStorage on DOM content load */
window.addEventListener("DOMContentLoaded", () => {
  const savedUserHex = localStorage.getItem("savedUserBoxHex");
  const savedUserOpacity = localStorage.getItem("savedUserBoxOpacity");
  if (savedUserHex && savedUserOpacity) {
    document.getElementById("userbox-color-picker").value = savedUserHex;
    document.getElementById("userbox-opacity-slider").value = savedUserOpacity;
    updateUserBoxColor();
  }

  const savedMsgHex = localStorage.getItem("savedMsgBoxHex");
  const savedMsgOpacity = localStorage.getItem("savedMsgBoxOpacity");
  if (savedMsgHex && savedMsgOpacity) {
    document.getElementById("msgbox-color-picker").value = savedMsgHex;
    document.getElementById("msgbox-opacity-slider").value = savedMsgOpacity;
    updateMsgBoxColor();
  }

  const savedTextHex = localStorage.getItem("savedTextHex");
  if (savedTextHex) {
    document.getElementById("textcolor-picker").value = savedTextHex;
    updateTextColor();
  }
});

function clearAllCookies() {
  localStorage.removeItem("savedBackgroundColor");
  localStorage.removeItem("savedTheme");
  localStorage.clear();
  console.log("Saved colors and preferences have been cleared.");
  location.reload();
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
  ytTimeouts.forEach((t) => clearTimeout(t));
  ytTimeouts = [];
  if (twitchWs) twitchWs.close();
  if (pusherInstance) pusherInstance.disconnect();

  if (twitchChan) initTwitchChat(twitchChan);
  if (kickChan) initKickChat(kickChan);
  if (ytHandle) initYouTubeChat(ytHandle);
}