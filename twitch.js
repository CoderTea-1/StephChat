// ==========================================
// CUSTOM TIER & TENURE SUB BADGE CONFIG
// ==========================================
const TWITCH_CUSTOM_SUB_BADGES = {
  1000: {
    1: "https://static-cdn.jtvnw.net/badges/v1/76944067-c338-4bae-ac48-9ba8e41b2ac9/3",
    2: "https://static-cdn.jtvnw.net/badges/v1/07c5af2b-64d4-4a95-af78-985a431b193b/3",
    3: "https://static-cdn.jtvnw.net/badges/v1/1be69220-6ecc-457a-83e5-26b423bf7206/3",
    6: "https://static-cdn.jtvnw.net/badges/v1/6e99ee74-a597-40f3-8cff-344a2f24f8c2/3",
    9: "https://static-cdn.jtvnw.net/badges/v1/0fb449ae-4119-40cb-bde6-769175d81fe1/3",
    12: "https://static-cdn.jtvnw.net/badges/v1/b6da6872-f2f1-4ecc-ad8a-98daee453094/3",
  },
  2000: {
    3: "https://static-cdn.jtvnw.net/badges/v1/9bde5f43-f400-4b44-b835-9cb683cc4eb4/3",
    6: "https://static-cdn.jtvnw.net/badges/v1/40bd7b04-21f9-432e-a07e-af0d9d7aa03c/3",
    12: "https://static-cdn.jtvnw.net/badges/v1/8520b1c4-a7e7-4351-ac76-9607b6429b3c/3",
  },
  3000: {
    9: "https://static-cdn.jtvnw.net/badges/v1/280cadb1-4d04-456d-8183-4dac1420f395/3",
    12: "https://static-cdn.jtvnw.net/badges/v1/1e5586b1-044c-4afe-a888-1c2a5e9a0f65/3",
  },
};

const TWITCH_SPECIAL_BADGES = {
  "10_gift_subs": "https://static-cdn.jtvnw.net/badges/v1/d333288c-65d7-4c7b-b691-cdd7b3484bf8/3",
  "100_gift_subs": "https://static-cdn.jtvnw.net/badges/v1/8343ada7-3451-434e-91c4-e82bdcf54460/2",
  "2000_gift_subs": "https://static-cdn.jtvnw.net/badges/v1/4e8b3a32-1513-44ad-8a12-6c90232c77f9/2",
  "25_gift_subs": "https://static-cdn.jtvnw.net/badges/v1/052a5d41-f1cc-455c-bc7b-fe841ffaf17f/2",
  bits_leader_1: "https://static-cdn.jtvnw.net/badges/v1/8bedf8c3-7a6d-4df2-b62f-791b96a5dd31/2",
  bits_leader_2: "https://static-cdn.jtvnw.net/badges/v1/f04baac7-9141-4456-a0e7-6301bcc34138/2",
  bits_leader_3: "https://static-cdn.jtvnw.net/badges/v1/f1d2aab6-b647-47af-965b-84909cf303aa/2",
  clip_leader_2: "https://static-cdn.jtvnw.net/badges/v1/9eddf7ab-aa46-4798-abe2-710db1043254/2",
  former_hype_train_conductor: "https://static-cdn.jtvnw.net/badges/v1/9c8d038a-3a29-45ea-96d4-5031fb1a7a81/2",
  former_train_conductor: "https://static-cdn.jtvnw.net/badges/v1/9c8d038a-3a29-45ea-96d4-5031fb1a7a81/3",
  current_hype_train_conductor: "https://static-cdn.jtvnw.net/badges/v1/fae4086c-3190-44d4-83c8-8ef0cbe1a515/3",
  founders_badge: "https://static-cdn.jtvnw.net/badges/v1/511b78a9-ab37-472f-9569-457753bbe7d3/2",
  gifter_leader_1: "https://static-cdn.jtvnw.net/badges/v1/21656088-7da2-4467-acd2-55220e1f45ad/2",
  gifter_leader_2: "https://static-cdn.jtvnw.net/badges/v1/0d9fe96b-97b7-4215-b5f3-5328ebad271c/2",
  gifter_leader_3: "https://static-cdn.jtvnw.net/badges/v1/4c6e4497-eed9-4dd3-ac64-e0599d0a63e5/2",
  lead_mod: "https://static-cdn.jtvnw.net/badges/v1/0822047b-65e0-46f2-94a9-d1091d685d33/3",
  verified: "https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/3",
};

const TWITCH_MILESTONE_CHEER_BADGES = {
  100: "https://static-cdn.jtvnw.net/badges/v1/9da789c1-5cbc-428c-85ad-995f881aad1f/2",
  1000: "https://static-cdn.jtvnw.net/badges/v1/9a6683a1-6965-4490-af4d-af8670952fa5/3",
  5000: "https://static-cdn.jtvnw.net/badges/v1/7debff95-bf6f-4b4a-88f3-7b643915ce7e/2",
  10000: "https://static-cdn.jtvnw.net/badges/v1/5ae8d57a-44c9-4918-a785-c099b6000712/2",
  25000: "https://static-cdn.jtvnw.net/badges/v1/783dd71d-c40f-43e2-92bb-47c79cb601fd/2",
  50000: "https://static-cdn.jtvnw.net/badges/v1/10608d86-9573-4d8f-8ea7-a9995c4b062a/2",
  75000: "https://static-cdn.jtvnw.net/badges/v1/d8839812-358d-4160-9436-48f2fdd6f031/2",
  100000: "https://static-cdn.jtvnw.net/badges/v1/3ebbb569-3503-4ca1-a8de-646d6b5b743a/2",
};

const TWITCH_CUSTOM_CHEER_BADGES = {
  1: "https://static-cdn.jtvnw.net/badges/v1/9da789c1-5cbc-428c-85ad-995f881aad1f/2",
  1000: "https://static-cdn.jtvnw.net/badges/v1/9da789c1-5cbc-428c-85ad-995f881aad1f/2",
  5000: "https://static-cdn.jtvnw.net/badges/v1/7debff95-bf6f-4b4a-88f3-7b643915ce7e/2",
};

const TWITCH_CUSTOM_GIFTER_BADGES = {
  1: "https://static-cdn.jtvnw.net/badges/v1/052a5d41-f1cc-455c-bc7b-fe841ffaf17f/2",
  25: "https://static-cdn.jtvnw.net/badges/v1/052a5d41-f1cc-455c-bc7b-fe841ffaf17f/2",
  100: "https://static-cdn.jtvnw.net/badges/v1/8343ada7-3451-434e-91c4-e82bdcf54460/2",
};

/* Parses and renders Twitch chat badges with fallback text styling */
function renderTwitchBadges(badgesString, badgeInfoString, container) {
  try {
    let subMonths = "1";
    let cheerBits = "0";
    let giftCount = "0";

    if (badgeInfoString) {
      badgeInfoString.split(",").forEach((pair) => {
        const [key, val] = pair.split("/");
        if (key === "subscriber") {
          subMonths = val;
        } else if (key === "bits") {
          cheerBits = val;
        } else if (
          key === "anongiftcount" ||
          key === "gift-redeemed" ||
          key === "msg-param-mass-gift-count" ||
          key === "badge-count"
        ) {
          giftCount = val;
        }
      });
    }

    badgesString.split(",").forEach((badgePair) => {
      const [badgeName, badgeVersion] = badgePair.split("/");
      if (!badgeName) return;

      let imgSrc = "";
      let altText = "";
      let fallbackText = "";
      let fallbackStyle =
        "font-size:11px; padding:3px 6px; border-radius:4px; font-weight:bold; color:#ffffff; display:inline-block;";

      if (badgeName === "subscriber") {
        if (subMonths === "1" && parseInt(badgeVersion) > 3) {
          subMonths = badgeVersion;
        }

        let tierKey = "1000";
        if (badgeVersion === "2000") tierKey = "2000";
        else if (badgeVersion === "3000") tierKey = "3000";
        else if (
          parseInt(badgeVersion) >= 2000 &&
          parseInt(badgeVersion) < 3000
        )
          tierKey = "2000";
        else if (parseInt(badgeVersion) >= 3000) tierKey = "3000";

        if (
          (badgeVersion === "2" || badgeVersion === "3") &&
          subMonths === "1"
        ) {
          subMonths = badgeVersion;
        }

        altText = `Subscriber Tier ${tierKey} (${subMonths} mos)`;
        fallbackText = `SUB ${subMonths}`;
        fallbackStyle += "background:#9146FF;";

        const tierObj =
          TWITCH_CUSTOM_SUB_BADGES[tierKey] ||
          TWITCH_CUSTOM_SUB_BADGES["1000"];
        if (tierObj && typeof tierObj === "object") {
          const availableMonths = Object.keys(tierObj)
            .map(Number)
            .sort((a, b) => b - a);
          const matchedMonthKey =
            availableMonths.find((m) => parseInt(subMonths) >= m) ||
            availableMonths[availableMonths.length - 1];
          imgSrc = tierObj[matchedMonthKey] || "";
        }
      } else if (badgeName === "founder") {
        altText = `Founder #${badgeVersion}`;
        fallbackText = `FOUNDER ${badgeVersion}`;
        fallbackStyle += "background:#8A2BE2;";
        imgSrc =
          TWITCH_SPECIAL_BADGES["founders_badge"] ||
          `https://static-cdn.jtvnw.net/badges/v1/5dbc9db9-9391-4950-83ef-2f6e1e6992d1/3`;
      } else if (badgeName === "bits" || badgeName === "cheer") {
        let bitsAmount = cheerBits !== "0" ? cheerBits : badgeVersion;
        altText = `Cheer ${bitsAmount} Bits`;
        fallbackText = `BITS ${bitsAmount}`;
        fallbackStyle += "background:#1db954; color:#0b1a05;";

        if (
          TWITCH_MILESTONE_CHEER_BADGES &&
          TWITCH_MILESTONE_CHEER_BADGES[bitsAmount]
        ) {
          imgSrc = TWITCH_MILESTONE_CHEER_BADGES[bitsAmount];
        } else {
          const availableBits = Object.keys(TWITCH_MILESTONE_CHEER_BADGES)
            .map(Number)
            .sort((a, b) => b - a);
          const matchedBitKey =
            availableBits.find((b) => parseInt(bitsAmount) >= b) ||
            availableBits[availableBits.length - 1];
          imgSrc =
            TWITCH_MILESTONE_CHEER_BADGES[matchedBitKey] ||
            TWITCH_MILESTONE_CHEER_BADGES["100"];
        }
      } else if (
        badgeName === "sub-gifter" ||
        badgeName === "gifter" ||
        badgeName === "sub_gifter" ||
        badgeName === "glhf-pledge"
      ) {
        let gifts = giftCount !== "0" ? giftCount : badgeVersion;
        altText = `Sub Gifter (${gifts} gifted)`;
        fallbackText = `GIFTER ${gifts}`;
        fallbackStyle += "background:#ff4500;";

        let giftKeyLookup = `${gifts}_gift_subs`;
        if (
          TWITCH_SPECIAL_BADGES &&
          TWITCH_SPECIAL_BADGES[giftKeyLookup]
        ) {
          imgSrc = TWITCH_SPECIAL_BADGES[giftKeyLookup];
        } else {
          const availableGifts = Object.keys(TWITCH_CUSTOM_GIFTER_BADGES)
            .map(Number)
            .sort((a, b) => b - a);
          const matchedGiftKey =
            availableGifts.find((g) => parseInt(gifts) >= g) ||
            availableGifts[availableGifts.length - 1];
          imgSrc =
            TWITCH_CUSTOM_GIFTER_BADGES[matchedGiftKey] ||
            TWITCH_CUSTOM_GIFTER_BADGES["1"];
        }
      } else if (
        badgeName === "bits-leader" ||
        badgeName === "bits_leader"
      ) {
        altText = `Bits Leader #${badgeVersion}`;
        fallbackText = `BITS LEADER`;
        fallbackStyle += "background:#10b981;";
        imgSrc =
          TWITCH_SPECIAL_BADGES[`bits_leader_${badgeVersion}`] ||
          TWITCH_SPECIAL_BADGES["bits_leader_1"] ||
          `https://static-cdn.jtvnw.net/badges/v1/7085bca3-d9d1-4209-88dd-7d84f885dfb5/3`;
      } else if (
        badgeName === "sub-gift-leader" ||
        badgeName === "sub-gifter-leader" ||
        badgeName === "gifter-leader" ||
        badgeName === "gifter_leader"
      ) {
        altText = `Gift Sub Leader #${badgeVersion}`;
        fallbackText = `GIFTER LEADER`;
        fallbackStyle += "background:#f97316;";
        imgSrc =
          TWITCH_SPECIAL_BADGES[`gifter_leader_${badgeVersion}`] ||
          TWITCH_SPECIAL_BADGES["gifter_leader_2"] ||
          `https://static-cdn.jtvnw.net/badges/v1/e34f99f4-6240-41f2-b349-2e1d5c2abf6c/3`;
      } else if (
        badgeName === "clips-leader" ||
        badgeName === "clips_leader"
      ) {
        altText = `Clips Leader #${badgeVersion}`;
        fallbackText = `CLIPS LEADER`;
        fallbackStyle += "background:#06b6d4;";
        imgSrc =
          TWITCH_SPECIAL_BADGES[`clip_leader_${badgeVersion}`] ||
          TWITCH_SPECIAL_BADGES["clip_leader_2"] ||
          `https://static-cdn.jtvnw.net/badges/v1/004d80a1-4321-4f11-9f93-cbcf00d83b63/3`;
      } else if (badgeName === "broadcaster") {
        imgSrc =
          "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3";
        altText = "Broadcaster";
        fallbackText = "HOST";
        fallbackStyle += "background:#53fc18; color:#0b1a05;";
      } else if (
        badgeName === "lead_moderator" ||
        badgeName === "lead-moderator"
      ) {
        imgSrc =
          TWITCH_SPECIAL_BADGES["lead_mod"] ||
          "https://static-cdn.jtvnw.net/badges/v1/861dbe71-bdf7-417d-ace3-500e263c9372/3";
        altText = "Lead Moderator";
        fallbackText = "LEAD MOD";
        fallbackStyle += "background:#00a699;";
      } else if (badgeName === "moderator") {
        imgSrc =
          "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3";
        altText = "Moderator";
        fallbackText = "MOD";
        fallbackStyle += "background:#0000FF;";
      } else if (badgeName === "vip") {
        imgSrc =
          "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3";
        altText = "VIP";
        fallbackText = "VIP";
        fallbackStyle += "background:#e0115f;";
      } else if (
        badgeName === "bot" ||
        badgeName === "chat-bot" ||
        badgeName === "chatbot" ||
        badgeName === "twitchbot"
      ) {
        imgSrc =
          "https://static-cdn.jtvnw.net/badges/v1/3ffa9565-c35b-4cad-800b-041e60659cf2/3";
        altText = "Chat Bot";
        fallbackText = "BOT";
        fallbackStyle += "background:#6441a5;";
      } else if (badgeName === "verified") {
        imgSrc =
          TWITCH_SPECIAL_BADGES["verified"] ||
          "https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/3";
        altText = "Verified";
        fallbackText = "VERIFIED";
        fallbackStyle += "background:#3b82f6;";
      } else if (
        badgeName === "sub-train-conductor" ||
        badgeName === "hype-train" ||
        badgeName === "conductor"
      ) {
        altText = `Hype Train Conductor #${badgeVersion}`;
        fallbackText = `TRAIN CONDUCTOR`;
        fallbackStyle += "background:#ff00ff;";
        imgSrc =
          TWITCH_SPECIAL_BADGES["former_train_conductor"] ||
          TWITCH_SPECIAL_BADGES["former_hype_train_conductor"] ||
          "";
      } else {
        return;
      }

      const badgeElement = createFallbackBadgeImage(
        imgSrc,
        altText,
        fallbackText,
        fallbackStyle,
      );
      container.appendChild(badgeElement);
    });
  } catch (e) {
    console.error("Twitch Badge Error:", e);
  }
}

/* Replaces text substrings with animated Twitch emote images based on metadata tags */
function renderTwitchEmotes(text, emotesString, container) {
  try {
    const emoteMap = [];
    const cleanEmotesStr = emotesString
      .replace(/\\:/g, ":")
      .replace(/\\=/g, "=");

    cleanEmotesStr.split("/").forEach((emoteGroup) => {
      if (!emoteGroup) return;
      const parts = emoteGroup.split(":");
      if (parts.length < 2) return;
      const id = parts[0];
      parts[1].split(",").forEach((loc) => {
        const range = loc.split("-");
        if (range.length === 2) {
          const start = parseInt(range[0], 10);
          const end = parseInt(range[1], 10);
          if (!isNaN(start) && !isNaN(end)) {
            emoteMap.push({ start, end, id });
          }
        }
      });
    });

    if (emoteMap.length === 0) {
      container.textContent = ` ${text}`;
      return;
    }

    emoteMap.sort((a, b) => a.start - b.start);

    let lastIdx = 0;
    container.textContent = " ";

    emoteMap.forEach((emote) => {
      if (emote.start > lastIdx) {
        container.appendChild(
          document.createTextNode(text.substring(lastIdx, emote.start)),
        );
      }
      const emoteCode = text.substring(emote.start, emote.end + 1);
      const img = document.createElement("img");
      img.src = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/animated/dark/3.0`;
      img.alt = emoteCode;
      img.title = emoteCode;
      img.className = "chat-emote";

      img.onerror = function () {
        this.src = `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/static/dark/3.0`;
      };

      container.appendChild(img);
      lastIdx = emote.end + 1;
    });

    if (lastIdx < text.length) {
      container.appendChild(
        document.createTextNode(text.substring(lastIdx)),
      );
    }
  } catch (e) {
    console.error("Twitch Emote Error:", e);
    container.textContent = ` ${text}`;
  }
}

/* Twitch Chat Initialization */
function initTwitchChat(twitchChan) {
  twitchWs = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
  twitchWs.onopen = () => {
    twitchWs.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
    twitchWs.send(
      "NICK justinfan" + Math.floor(Math.random() * 89999 + 10000),
    );
    twitchWs.send(`JOIN #${twitchChan.toLowerCase()}`);
  };
  twitchWs.onmessage = (event) => {
    const data = event.data;
    if (data.startsWith("PING")) {
      twitchWs.send("PONG :tmi.twitch.tv");
    } else if (data.includes("PRIVMSG")) {
      try {
        const tagsPart = data.substring(0, data.indexOf("PRIVMSG"));
        const userMatch = tagsPart.match(/display-name=([^;]*)/);
        const colorMatch = tagsPart.match(/color=([^;]*)/);
        const emotesMatch = tagsPart.match(/emotes=([^;]*)/);
        const badgesMatch = tagsPart.match(/badges=([^;]*)/);
        const badgeInfoMatch = tagsPart.match(/badge-info=([^;]*)/);

        const username =
          userMatch && userMatch[1] ? userMatch[1] : "Unknown";
        const color =
          colorMatch && colorMatch[1] ? colorMatch[1] : "#b19cd9";
        const emotesData =
          emotesMatch && emotesMatch[1] && emotesMatch[1] !== ":"
            ? emotesMatch[1]
            : null;
        const twitchBadges =
          badgesMatch && badgesMatch[1] && badgesMatch[1] !== ":"
            ? badgesMatch[1]
            : null;
        const badgeInfo =
          badgeInfoMatch &&
          badgeInfoMatch[1] &&
          badgeInfoMatch[1] !== ":"
            ? badgeInfoMatch[1]
            : null;

        const msgIndex = data.indexOf("PRIVMSG");
        const trailingIndex = data.indexOf(" :", msgIndex);
        const msgText =
          trailingIndex !== -1
            ? data.substring(trailingIndex + 2).trim()
            : "";

        appendMessage(
          "Twitch",
          username,
          msgText,
          color,
          emotesData,
          null,
          twitchBadges,
          [],
          badgeInfo,
        );
      } catch (e) {
        console.error("Twitch parsing error:", e);
      }
    }
  };
}