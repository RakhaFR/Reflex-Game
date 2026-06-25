// ============================================================
// REFLEXRYTHM — GAME MODES CONFIGURATION
// Pusat data mode game untuk Switcher Lobby & Router Engine
// ============================================================

// ============================================================
// A2. GAME MODES — buat tombol PREV/NEXT di lobby
// ============================================================
// Next/Prev sekarang switch MODE (bukan track lagi). Track switching
// pindah ke Arrow Up/Down keyboard.
// Tambah mode baru di sini, misal "Not Origin Music" atau "Triple Tap
// Rush" — id harus unik. `engine` adalah nama function start untuk
// mode itu (mis. startBasicMode, startTripleTapMode, dst — bikin sendiri
// function-nya nanti kalau mode itu sudah siap).

const BM_GAME_MODES = [
  {
    id: "basic",
    label: "BASIC MODE",
    shortLabel: "BASIC",
    desc: "Mode standar OSU-style: tekan key sebelum ring habis.",
    engine: "startBasicMode",
  },
  {
    id: "notoriginal",
    label: "NOT ORIGINAL MODE",
    shortLabel: "N.O.M",
    desc: "Uji batas refleksmu menggunakan aransemen lagu eksternal non-original tempo tinggi.",
    engine: "startNotOriginalEngine", 
  }
];


const savedModeIdx = parseInt(localStorage.getItem("rhg_active_mode"));
let bmGameModeIdx = (!isNaN(savedModeIdx) && savedModeIdx >= 0 && savedModeIdx < BM_GAME_MODES.length) ? savedModeIdx : 0; // Index global mode aktif