// ============================================
// SHARED UTILITIES
// ============================================

function playSound() {
  const sound = document.getElementById("clickSound");
  if (!sound) return;
  sound.pause();
  sound.currentTime = 0;
  sound.volume = 1;
  sound.play().catch((err) => console.log(err));
}

function goToLobby() {
  document.getElementById("home").classList.remove("active");
  document.getElementById("lobby").classList.add("active");
}

function goToHome() {
  document.getElementById("lobby").classList.remove("active");
  document.getElementById("home").classList.add("active");
}

function triggerEffects(soundId, flashColor, gameScreenId) {
  const sfx = document.getElementById(soundId);
  sfx.currentTime = 0;
  sfx.play().catch(() => {});

  const flash = document.getElementById("flashOverlay");
  flash.className = "";
  flash.classList.add("active", flashColor);
  setTimeout(() => flash.classList.remove("active", flashColor), 200);

  document.getElementById(gameScreenId).classList.add("shake");
  setTimeout(() => document.getElementById(gameScreenId).classList.remove("shake"), 400);
}

// ============================================
// COUNTDOWN OVERLAY 3..2..1..GO!
// ============================================
let isCountdownRunning = false;

function showCountdownThen(callback) {

  if (isCountdownRunning) return;
  isCountdownRunning = true;

  const overlay = document.getElementById("countdownOverlay");
  const text    = document.getElementById("countdownText");
  const snd     = document.getElementById("countdownSound");

  const steps = ["3", "2", "1", "GO!"];
  let i = 0;

  overlay.classList.add("active");

  // 🔥 PLAY SEKALI DI AWAL
  if (snd) {
    snd.pause();
    snd.currentTime = 0;
    snd.play().catch(() => {});
  }

  function showStep() {
    const current = steps[i];

    text.textContent = current;
    text.className = "";
    void text.offsetWidth;
    text.className = current === "GO!"
      ? "countdown-num go"
      : "countdown-num pop-in";

    i++;

    if (i < steps.length) {
      setTimeout(showStep, 1000);
    } else {
      setTimeout(() => {
        overlay.classList.remove("active");
        isCountdownRunning = false;
        callback();
      }, 900);
    }
  }

  showStep();
}

