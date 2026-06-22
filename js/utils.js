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

// Disesuaikan agar aman mendukung struktur multi-halaman (lobby.html / index.html)
function goToLobby() {
  if (document.getElementById("lobby")) {
    document.getElementById("home")?.classList.remove("active");
    document.getElementById("lobby").classList.add("active");
  } else {
    window.location.href = "lobby.html";
  }
}

function goToHome() {
  if (document.getElementById("home")) {
    document.getElementById("lobby")?.classList.remove("active");
    document.getElementById("home").classList.add("active");
  } else {
    window.location.href = "index.html"; // atau lokasi main menu lu
  }
}

// ============================================
// DIFFICULTY SYSTEM — GLOBAL STATE
// ============================================
// Dipakai oleh time-attack dan versus mode.
// Basic mode pakai BM_DIFF config sendiri (basic-mode.js).
let currentDifficulty = "normal";

const DIFF_SETTINGS = {
  normal:  { greenTime: 5,   redTime: 3,   bonusTime: 5,   freezeTime: 5   },
  medium:  { greenTime: 3,   redTime: 3,   bonusTime: 3,   freezeTime: 3   },
  hard:    { greenTime: 1.5, redTime: 1.5, bonusTime: 1.5, freezeTime: 1.5 },
  extreme: { greenTime: 1,   redTime: 1,   bonusTime: 1,   freezeTime: 1   },
};

function getDiff() {
  return DIFF_SETTINGS[currentDifficulty] ?? DIFF_SETTINGS.normal;
}

// ============================================
// PARTICLE BURST SYSTEM
// ============================================
// Sebagian halaman (mis. index.html) gak punya <canvas id="particleCanvas">
// di HTML-nya — dulu ini bikin baris di bawah crash (null.getContext)
// dan diam-diam ngebunuh SISA file utils.js ini (playSound dkk masih
// kepanggil krn hoisting, tapi semua efek partikel/shake/flash mati).
// Sekarang kalau canvas-nya gak ada, kita buat sendiri.
let canvas = document.getElementById("particleCanvas");
if (!canvas) {
  canvas = document.createElement("canvas");
  canvas.id = "particleCanvas";
  document.body.appendChild(canvas);
}
const ctx = canvas.getContext("2d");
canvas.style.position = "fixed";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.pointerEvents = "none";
canvas.style.zIndex = "9998";

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let particles = [];

class Particle {
  constructor(x, y, color, type) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.type = type || "circle";
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 3;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - Math.random() * 4;
    this.life = 1;
    this.decay = Math.random() * 0.03 + 0.02;
    this.size = Math.random() * 10 + 4;
    this.gravity = 0.25;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.97;
    this.life -= this.decay;
    this.size *= 0.97;
    this.rotation += this.rotSpeed;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    if (this.type === "star") {
      drawStar(ctx, 0, 0, 5, this.size, this.size / 2);
    } else if (this.type === "square") {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
  ctx.fill();
}

function burstParticles(x, y, colorPalette, count, types) {
  const t = types || ["circle", "square", "star"];
  for (let i = 0; i < (count || 28); i++) {
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    const type = t[Math.floor(Math.random() * t.length)];
    particles.push(new Particle(x, y, color, type));
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.life > 0);
  particles.forEach((p) => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// Get button center coords
function getBtnCenter(btnEl) {
  if (!btnEl) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = btnEl.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Color palettes per type
const PALETTES = {
  green: ["#00ff88", "#00c851", "#a8ffcb", "#fff", "#00ff00"],
  red: ["#ff4444", "#ff0000", "#ff8888", "#fff", "#cc0000"],
  bonus: ["#ffe500", "#fff533", "#ff9500", "#fff", "#ffcc00", "#ff6600"],
  freeze: ["#00d4ff", "#a0f0ff", "#ffffff", "#00bfff", "#7fffff"],
  hold: ["#aaaaaa", "#ffffff", "#cccccc"],
};

// ============================================
// ENHANCED EFFECTS (settings-aware)
// ============================================
function triggerEffects(soundId, flashColor, gameScreenId, btnEl) {
  const sets = typeof getSettings === "function" ? getSettings() : null;

  const sfx = document.getElementById(soundId);
  if (sfx) {
    sfx.currentTime = 0;
    sfx.play().catch(() => {});
  }

  // Flash overlay — respects setting
  if (!sets || sets.screenFlashEnabled) {
    const flash = document.getElementById("flashOverlay");
    if (flash) {
      flash.className = "";
      // Menambahkan class dinamis sesuai warna (green, red, bonus)
      flash.classList.add("active", flashColor);
      setTimeout(() => flash.classList.remove("active", flashColor), 220);
    }
  }

  // Shake screen - Menambahkan kelas getar arcade pada container game
  const screen = document.getElementById(gameScreenId);
  if (screen) {
    screen.classList.add("shake");
    setTimeout(() => screen.classList.remove("shake"), 250); // Getaran cepat 250ms agar responsif
  }

  // Particle burst — respects setting
  if (!sets || sets.particleEffectEnabled) {
    let pos = btnEl
      ? getBtnCenter(btnEl)
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const palette = PALETTES[flashColor] || PALETTES.green;
    burstParticles(pos.x, pos.y, palette, 32);
  }

  // Efek cahaya & animasi pop pada tombol yang ditekan
  if (btnEl) {
    btnEl.classList.add("btn-arcade-hit");
    setTimeout(() => btnEl.classList.remove("btn-arcade-hit"), 250);
  }
}


// Freeze-specific effect
function triggerFreezeEffect(btnEl) {
  const sets = typeof getSettings === "function" ? getSettings() : null;

  if (!sets || sets.screenFlashEnabled) {
    const flash = document.getElementById("flashOverlay");
    flash.className = "";
    flash.classList.add("active", "blue");
    setTimeout(() => flash.classList.remove("active", "blue"), 300);
  }

  if (!sets || sets.particleEffectEnabled) {
    let pos = getBtnCenter(btnEl);
    burstParticles(pos.x, pos.y, PALETTES.freeze, 40, ["circle", "star"]);
  }

  if (btnEl) {
    btnEl.classList.add("btn-freeze-hit");
    setTimeout(() => btnEl.classList.remove("btn-freeze-hit"), 600);
  }
}

// ============================================
// COUNTDOWN OVERLAY 3..2..1..GO!
// ============================================
let isCountdownRunning = false;

function showCountdownThen(callback) {
  if (isCountdownRunning) return;
  isCountdownRunning = true;

  const overlay = document.getElementById("countdownOverlay");
  const text = document.getElementById("countdownText");
  const snd = document.getElementById("countdownSound");

  const steps = ["3", "2", "1", "GO!"];
  let i = 0;

  overlay.classList.add("active");

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
    text.className =
      current === "GO!" ? "countdown-num go" : "countdown-num pop-in";

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