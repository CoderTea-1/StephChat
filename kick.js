/* Parses and renders Kick chat badges */
function renderKickBadges(badgesArray, container) {
  try {
    badgesArray.forEach((badge) => {
      if (!badge) return;

      let badgeType = "";
      let badgeText = "";

      if (typeof badge === "string") {
        badgeType = badge;
        badgeText = badge;
      } else if (typeof badge === "object") {
        badgeType = badge.type || badge.name || badge.title || "";
        badgeText =
          badge.text || badge.name || badge.title || badge.type || "";
      }

      const stringBadgeText = String(badgeText).trim();
      if (
        !stringBadgeText ||
        /^\d{4}$/.test(stringBadgeText) ||
        stringBadgeText.length > 20
      ) {
        return;
      }

      const lowerType = String(badgeType).toLowerCase();
      const lowerText = stringBadgeText.toLowerCase();

      if (
        lowerType.includes("gifter") ||
        lowerType.includes("gift") ||
        lowerType.includes("cheer") ||
        lowerType.includes("bits")
      ) {
        return;
      }

      let fallbackText = stringBadgeText.toUpperCase();
      let fallbackStyle =
        "font-size:11px; padding:3px 6px; border-radius:4px; font-weight:bold; color:#ffffff; display:inline-block;";

      if (
        lowerType.includes("subscriber") ||
        lowerType.includes("sub") ||
        lowerText.includes("subscriber") ||
        lowerText.includes("sub")
      ) {
        fallbackText = "SUB";
        fallbackStyle += "background:#9146FF;";
      } else if (
        lowerType.includes("moderator") ||
        lowerType.includes("mod")
      ) {
        fallbackText = "MOD";
        fallbackStyle += "background:#0000FF;";
      } else if (lowerType.includes("vip")) {
        fallbackText = "VIP";
        fallbackStyle += "background:#e0115f;";
      } else if (
        lowerType.includes("broadcaster") ||
        lowerType.includes("streamer")
      ) {
        fallbackText = "HOST";
        fallbackStyle += "background:#53fc18; color:#0b1a05;";
      } else {
        return;
      }

      const badgeElement = createFallbackBadgeImage(
        "",
        fallbackText,
        fallbackText,
        fallbackStyle,
      );
      container.appendChild(badgeElement);
    });
  } catch (e) {
    console.error("Kick Badge Error:", e);
  }
}

/* Parses Kick custom emote shorthand syntax [emote:id:name] into images */
function renderKickEmotes(text, container) {
  container.textContent = " ";
  const regex = /\[emote:(\d+):([^\]]+)\]/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      container.appendChild(
        document.createTextNode(text.substring(lastIdx, match.index)),
      );
    }
    const emoteId = match[1];
    const emoteName = match[2];
    const img = document.createElement("img");
    img.src = `https://files.kick.com/emotes/${emoteId}/fullsize`;
    img.alt = emoteName;
    img.title = emoteName;
    img.className = "chat-emote";
    container.appendChild(img);

    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    container.appendChild(
      document.createTextNode(text.substring(lastIdx)),
    );
  }
}

/* Kick Chat Initialization */
async function initKickChat(kickChan) {
  try {
    const res = await fetch(
      `https://kick.com/api/v2/channels/${encodeURIComponent(kickChan)}`,
    );
    const channelData = await res.json();
    const kickId = channelData.chatroom?.id;

    if (kickId) {
      Pusher.logToConsole = false;
      pusherInstance = new Pusher("32cbd69e4b950bf97679", {
        cluster: "us2",
        wsHost: "ws-us2.pusher.com",
        forceTLS: true,
        enabledTransports: ["ws", "wss"],
      });
      const channel = pusherInstance.subscribe(
        `chatrooms.${kickId}.v2`,
      );
      channel.bind("App\\Events\\ChatMessageEvent", (data) => {
        if (data && data.sender) {
          if (data.id) {
            if (seenKickIds.has(data.id)) return;
            seenKickIds.add(data.id);
            if (seenKickIds.size > 500) {
              const firstItem = seenKickIds.values().next().value;
              seenKickIds.delete(firstItem);
            }
          }
          appendMessage(
            "Kick",
            data.sender.username,
            data.content,
            "#53fc18",
          );
        }
      });
    }
  } catch (err) {
    console.error("Kick Connection Error:", err);
  }
}