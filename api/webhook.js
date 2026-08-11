import Pusher from "pusher";

const pusher = new Pusher({
  app_id: "2185360",
  key: "cb87faabd5d085eb1b2d",
  secret: "59295a058f7224a8a822",
  cluster: "mt1",
  useTLS: true,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");

  // 1. Answer Twitch's handshake challenge when you first connect
  if (req.headers["twitch-eventsub-message-type"] === "webhook_callback_verification") {
    return res.status(200).send(req.body.challenge);
  }

  // 2. When a real event happens (like a sub)
  if (req.headers["twitch-eventsub-message-type"] === "notification") {
    const eventData = req.body.event;
    
    // Broadcast it to your frontend via Pusher
    pusher.trigger("stream-channel", "new-event", {
      message: eventData,
    });
  }

  res.status(200).send("OK");
}