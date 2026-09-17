// Aniimo Launch Target: Sept 16, 2026, 10:00 UTC+8 (02:00 UTC)
const launchDate = new Date("2026-09-16T05:30:00Z").getTime();

async function fetchCountdownSettings() {
  try {
    const response = await fetch("/api/settings");
    if (response.ok) {
      const settings = await response.json();
      // If your backend settings include a custom launch time, update it here:
      if (settings.launchTargetTime) {
        const customTime = new Date(settings.launchTargetTime).getTime();
        if (!isNaN(customTime)) {
          launchDate = customTime;
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch countdown sync from backend:", err);
  }
}

function updateCountdown() {
  const now = new Date().getTime();
  const distance = launchDate - now;

  const timerElement = document.getElementById("countdown-timer");
  if (!timerElement) return;

  if (distance < 0) {
    document.getElementById("countdown-timer").innerHTML = "🚀 LIVE NOW IN IDYLL!";
    return;
  }
  const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById("hours").innerText = String(h).padStart(2, '0');
  document.getElementById("minutes").innerText = String(m).padStart(2, '0');
  document.getElementById("seconds").innerText = String(s).padStart(2, '0');
}

// Check backend settings on startup
fetchCountdownSettings();

// Periodically check the backend for updated countdown targets (e.g., every 30 seconds)
setInterval(fetchCountdownSettings, 3000);

setInterval(updateCountdown, 1000);
updateCountdown();