// ============================================================
// REFLEXRHYTHM — CENTRALIZED GAME DATA
// Sumber kebenaran tunggal untuk seluruh data permainan
// ============================================================

export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  src: string;
  duration: number;
  bg: string;
  art: string;
  difficulties: string[];
  color: string;
  role: string;
  titleClass: string;
  desc: string;
}

export interface GameMode {
  id: "basic" | "notoriginal";
  label: string;
  shortLabel: string;
  desc: string;
  engine: string;
}

export interface DifficultyConfig {
  label: string;
  color: string;
  noteCount: number;
  windowMs: number;
  perfectMs: number;
  goodMs: number;
  spawnIntervalMs: number;
}

export interface BannerSkin {
  id: string;
  label: string;
  accent: string;
  svg: string;
}

export interface OgGame {
  title: string;
  desc: string;
  tag: string;
  img: string;
  url: string;
  comingSoon?: boolean;
}

export interface UpdateLogChange {
  type: "add" | "upd" | "fix";
  text: string;
}

export interface UpdateLog {
  version: string;
  date: string;
  badgeClass: "yellow" | "cyan" | "pink" | "magenta";
  bannerImg: string;
  changes: UpdateLogChange[];
}

export interface NoteType {
  id: "hit" | "avoid" | "bonus";
  color: string;
  ring: string;
  scoreBase: number;
  weight: number;
}

// ============================================================
// A. BASIC MODE TRACKS (6 Tracks)
// ============================================================
export const BM_TRACKS: Track[] = [
  {
    id: "PIXEL_PANIC",
    title: "PIXEL PANIC",
    artist: "REFLEXRHYTHM",
    bpm: 120,
    src: "/assets/music/Pixel_Panic.mp3",
    duration: 60,
    bg: "/assets/video/kamia-live2d.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["normal", "medium", "hard"],
    color: "#ff2d78",
    role: "// BASIC MODE — NORMAL REFLEX",
    titleClass: "title-basic",
    desc: "120 BPM Groove Santai. Cocok untuk mengasah akurasi ketukan dan membangun ritme permainanmu.",
  },
  {
    id: "pixel_panic",
    title: "PIXEL PANIC PARTY",
    artist: "REFLEXRHYTHM",
    bpm: 140,
    src: "/assets/music/Pixel_Panic_Party.mp3",
    duration: 60,
    bg: "/assets/video/ocean-live2d.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["medium", "hard"],
    color: "#00e5ff",
    role: "// BASIC MODE — MEDIUM REFLEX",
    titleClass: "title-basic",
    desc: "140 BPM Energetik. Ketukan mulai memanas, pastikan sinkronisasi mata dan tanganmu berada di performa terbaik.",
  },
  {
    id: "DanceGo",
    title: "DANCE GO",
    artist: "REFLEXRHYTHM",
    bpm: 160,
    src: "/assets/music/DanceGo.mp3",
    duration: 204,
    bg: "/assets/video/silia-live2d.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["medium", "hard"],
    color: "#383838",
    role: "// BASIC MODE — MEDIUM REFLEX",
    titleClass: "title-basic",
    desc: "160 BPM Cepat. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "tripleAtStore",
    title: "TRIPLE AT STORE",
    artist: "REFLEXRHYTHM",
    bpm: 175,
    src: "/assets/music/tripleAtStore.mp3",
    duration: 264,
    bg: "/assets/video/tripleAtStore.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["medium", "hard"],
    color: "#e6a5dd",
    role: "// BASIC MODE — HARD REFLEX",
    titleClass: "title-basic",
    desc: "175 BPM Cepat. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "CoinRush",
    title: "COIN RUSH",
    artist: "REFLEXRHYTHM",
    bpm: 175,
    src: "/assets/music/CoinRush.mp3",
    duration: 202,
    bg: "/assets/video/CoinRush.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["medium", "hard"],
    color: "#fc74d4",
    role: "// BASIC MODE — HARD REFLEX",
    titleClass: "title-basic",
    desc: "175 BPM Cepat. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "ClockworkAurora",
    title: "CLOCKWORK AURORA",
    artist: "REFLEXRHYTHM",
    bpm: 185,
    src: "/assets/music/ClockworkAurora.mp3",
    duration: 185,
    bg: "/assets/video/ClockworkAurora.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["medium", "hard", "extreme"],
    color: "#1d2252",
    role: "// BASIC MODE — EXTREME REFLEX",
    titleClass: "title-basic",
    desc: "185 BPM Cepat. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
];

// ============================================================
// B. NOT ORIGINAL MODE TRACKS (15 Tracks)
// ============================================================
export const NOM_TRACKS: Track[] = [
  {
    id: "lightning-moment",
    title: "Lightning Moment",
    artist: "DJ芥末",
    bpm: 145,
    src: "/assets/music/lightning-moment.mp3",
    duration: 60,
    bg: "/assets/video/lightning-moment.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["normal", "medium", "hard"],
    color: "#0051e8",
    role: "// N.O.M STYLE — MEDIUM SPEED",
    titleClass: "title-notoriginal",
    desc: "145 BPM Energetik. Ketukan mulai memanas, pastikan sinkronisasi mata dan tanganmu berada di performa terbaik.",
  },
  {
    id: "masih-adakah-waktu",
    title: "masih_adakah_waktu?",
    artist: "Dyolow",
    bpm: 155,
    src: "/assets/music/masih-adakah-waktu.mp3",
    duration: 204,
    bg: "/assets/video/masih-adakah-waktu.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["normal", "medium", "hard"],
    color: "#00bbe6",
    role: "// N.O.M STYLE — MEDIUM SPEED",
    titleClass: "title-notoriginal",
    desc: "155 BPM Energetik. Ketukan mulai memanas, pastikan sinkronisasi mata dan tanganmu berada di performa terbaik.",
  },
  {
    id: "mv-abm-yararara",
    title: "MV-BM-YARARARA",
    artist: "ABM (AnythingBecomeMoe / エビモエ)",
    bpm: 180,
    src: "/assets/music/mv-abm-yararara.mp3",
    duration: 156,
    bg: "/assets/video/mv-abm-yararara.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["hard", "extreme"],
    color: "#c70000",
    role: "// N.O.M STYLE — EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "180 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "oliver-tree-miss-you-bemax-cover-remix",
    title: "Miss You (Bemax Cover) [Remix]",
    artist: "Oliver Tree & Bemax Remix",
    bpm: 180,
    src: "/assets/music/oliver-tree-miss-you-bemax-cover-remix.mp3",
    duration: 180,
    bg: "/assets/video/oliver-tree-miss-you-bemax-cover-remix.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["hard", "extreme"],
    color: "#F7345B",
    role: "// N.O.M STYLE — EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "180 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "can-you-feel-the-fury",
    title: "Can You Feel The Fury?",
    artist: "Ft. MrGoodbarz, Martin T",
    bpm: 190,
    src: "/assets/music/can-you-feel-the-fury.mp3",
    duration: 67,
    bg: "/assets/video/can-you-feel-the-fury.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["hard", "extreme"],
    color: "#f2c224",
    role: "// N.O.M STYLE — EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "190 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "funk-abnormal-dj-v12-slowed-reverb",
    title: "Funk Abnormal (Slowed & Reverb)",
    artist: "DJ V12",
    bpm: 180,
    src: "/assets/music/funk-abnormal-dj-v12-slowed-reverb.mp3",
    duration: 101,
    bg: "/assets/video/funk-abnormal-dj-v12-slowed-reverb.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["hard", "extreme"],
    color: "#E9AC5E",
    role: "// N.O.M STYLE — EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "180 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "aria-freaks-stadium",
    title: "Aria Freaks Stadium",
    artist: "NightSoundClouds",
    bpm: 180,
    src: "/assets/music/aria-freaks-stadium.mp3",
    duration: 101,
    bg: "/assets/video/aria-freaks-stadium.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["hard", "extreme"],
    color: "#222222",
    role: "// N.O.M STYLE — EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "180 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "bang-bang-bang-chainsaw-man",
    title: "bang-bang-bang-chainsaw-man",
    artist: "@starxrayne & @JamsDX",
    bpm: 150,
    src: "/assets/music/bang-bang-bang-chainsaw-man-song.mp3",
    duration: 180,
    bg: "/assets/video/bang-bang-bang-chainsaw-man-song.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["medium", "hard", "extreme"],
    color: "#7d7d7d",
    role: "// N.O.M STYLE — HARD SPEED",
    titleClass: "title-notoriginal",
    desc: "150 BPM Energetik. Ketukan mulai memanas, pastikan sinkronisasi mata dan tanganmu berada di performa terbaik.",
  },
  {
    id: "bike",
    title: "Bike",
    artist: "Tanger",
    bpm: 180,
    src: "/assets/music/bike.mp3",
    duration: 102,
    bg: "/assets/video/bike.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["medium", "hard", "extreme"],
    color: "#ff8c00",
    role: "// N.O.M STYLE — HARD SPEED",
    titleClass: "title-notoriginal",
    desc: "180 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "odetari-keep-up",
    title: "Keep Up",
    artist: "Odetari",
    bpm: 190,
    src: "/assets/music/odetari-keep-up.mp3",
    duration: 136,
    bg: "/assets/video/odetari-keep-up.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["hard", "extreme"],
    color: "#5b24ff",
    role: "// N.O.M STYLE — HARD SPEED",
    titleClass: "title-notoriginal",
    desc: "190 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "ariana-grande-bye-altare-remix",
    title: "Ariana Grande - Bye",
    artist: "Ariana Grande & Altare Remix",
    bpm: 160,
    src: "/assets/music/ariana-grande-bye-altare-remix.mp3",
    duration: 180,
    bg: "/assets/video/ariana-grande-bye-altare-remix.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["medium", "hard"],
    color: "#380057",
    role: "// N.O.M STYLE — MEDIUM SPEED",
    titleClass: "title-notoriginal",
    desc: "160 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "lxngvx-montagem-mysterious-game",
    title: "Montagem Mysterious Game",
    artist: "Lxngvx",
    bpm: 195,
    src: "/assets/music/lxngvx-montagem-mysterious-game.mp3",
    duration: 103,
    bg: "/assets/video/lxngvx-montagem-mysterious-game.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["medium", "hard", "extreme"],
    color: "#66ffed",
    role: "// N.O.M STYLE — EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "195 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "creepy-nuts-bling-bang-bang-born",
    title: "Bling Bang Bang Born",
    artist: "Creepy Nuts",
    bpm: 170,
    src: "/assets/music/creepy-nuts-bling-bang-bang-born-x-tv-anime-matusiyuru-mashle-collaboration.mp3",
    duration: 172,
    bg: "/assets/video/creepy-nuts-bling-bang-bang-born-x-tv-anime-matusiyuru-mashle-collaboration.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["medium", "hard", "extreme"],
    color: "#edd900",
    role: "// N.O.M STYLE — HARD SPEED",
    titleClass: "title-notoriginal",
    desc: "170 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "cry-for-me-ironmouse",
    title: "Cry for Me",
    artist: "Ironmouse",
    bpm: 165,
    src: "/assets/music/cry-for-me-ironmouse.mp3",
    duration: 195,
    bg: "/assets/video/cry-for-me-ironmouse.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["medium", "hard"],
    color: "#fa46dc",
    role: "// N.O.M STYLE — HARD SPEED",
    titleClass: "title-notoriginal",
    desc: "165 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "blksmiith-sr20det",
    title: "SR20DET",
    artist: "BLKSMIITH",
    bpm: 200,
    src: "/assets/music/blksmiith-sr20det.mp3",
    duration: 278,
    bg: "/assets/video/blksmiith-sr20det.mp4",
    art: "/assets/picture/new-logo.png",
    difficulties: ["extreme"],
    color: "#212121",
    role: "// N.O.M STYLE — ONLY EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "200 BPM Ketukan Tanpa Ampun. Kecepatan murni yang akan membakar jarimu. Jangan berkedip, pastikan keybind-mu sudah siap.",
  },
];

// ============================================================
// C. GAME MODES
// ============================================================
export const BM_GAME_MODES: GameMode[] = [
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
  },
];

// ============================================================
// D. DIFFICULTY CONFIGURATIONS
// ============================================================
export const BM_DIFF: Record<string, DifficultyConfig> = {
  normal: {
    label: "NORMAL",
    color: "#00ff88",
    noteCount: 1,
    windowMs: 3800,
    perfectMs: 500,
    goodMs: 1000,
    spawnIntervalMs: 1800,
  },
  medium: {
    label: "MEDIUM",
    color: "#ffe500",
    noteCount: 2,
    windowMs: 2600,
    perfectMs: 350,
    goodMs: 700,
    spawnIntervalMs: 1300,
  },
  hard: {
    label: "HARD",
    color: "#ff6644",
    noteCount: 3,
    windowMs: 1700,
    perfectMs: 220,
    goodMs: 480,
    spawnIntervalMs: 950,
  },
  extreme: {
    label: "EXTREME",
    color: "#ff00ff",
    noteCount: 4,
    windowMs: 1100,
    perfectMs: 130,
    goodMs: 280,
    spawnIntervalMs: 650,
  },
};

export const NOM_DIFF: Record<string, DifficultyConfig> = {
  normal: {
    label: "NORMAL",
    color: "#00ff88",
    noteCount: 1,
    windowMs: 3800,
    perfectMs: 500,
    goodMs: 1000,
    spawnIntervalMs: 1800,
  },
  medium: {
    label: "MEDIUM",
    color: "#ffe500",
    noteCount: 2,
    windowMs: 2200,
    perfectMs: 300,
    goodMs: 600,
    spawnIntervalMs: 1100,
  },
  hard: {
    label: "HARD",
    color: "#ff6644",
    noteCount: 3,
    windowMs: 1400,
    perfectMs: 180,
    goodMs: 400,
    spawnIntervalMs: 800,
  },
  extreme: {
    label: "EXTREME",
    color: "#ff00ff",
    noteCount: 4,
    windowMs: 950,
    perfectMs: 100,
    goodMs: 220,
    spawnIntervalMs: 550,
  },
};

// ============================================================
// E. SPAWN ZONES (20 Safe Screen Positions)
// ============================================================
export const BM_ZONES = [
  // Baris 1 — atas
  { x: 10, y: 14 }, { x: 28, y: 12 }, { x: 46, y: 15 }, { x: 64, y: 12 }, { x: 82, y: 16 },
  // Baris 2 — atas-tengah
  { x: 16, y: 32 }, { x: 36, y: 30 }, { x: 56, y: 33 }, { x: 76, y: 30 }, { x: 89, y: 35 },
  // Baris 3 — tengah-bawah
  { x: 8,  y: 50 }, { x: 30, y: 52 }, { x: 50, y: 49 }, { x: 70, y: 53 }, { x: 90, y: 50 },
  // Baris 4 — bawah
  { x: 18, y: 70 }, { x: 40, y: 73 }, { x: 60, y: 71 }, { x: 80, y: 74 }, { x: 50, y: 78 },
];

export const BM_NOTE_TYPES: NoteType[] = [
  { id: "hit",   color: "#00ff88", ring: "rgba(0,255,136,0.65)", scoreBase: 100, weight: 5 },
  { id: "avoid", color: "#ff4444", ring: "rgba(255,68,68,0.65)", scoreBase: 0,   weight: 3 },
  { id: "bonus", color: "#ffe500", ring: "rgba(255,229,0,0.65)", scoreBase: 300, weight: 2 },
];

export const NOM_NOTE_TYPES: NoteType[] = [
  { id: "hit",   color: "#00ff88", ring: "rgba(0,255,136,0.65)", scoreBase: 100, weight: 5 },
  { id: "avoid", color: "#ff4444", ring: "rgba(255,68,68,0.65)", scoreBase: 0,   weight: 3 },
  { id: "bonus", color: "#ffe500", ring: "rgba(255,229,0,0.65)", scoreBase: 350, weight: 2 },
];

// ============================================================
// F. BANNER SKINS (8 Animated SVG Card Skins)
// ============================================================
export const BANNER_SKINS: BannerSkin[] = [
  {
    id: "arcade-spark",
    label: "Arcade Spark",
    accent: "#00aaff",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <linearGradient id="as1_w" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#001433"/><stop offset="100%" stop-color="#000d22"/></linearGradient>
        <filter id="asGlow_w"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="80" fill="url(#as1_w)"/>
      <path d="M0,8 Q50,3 100,8 Q150,13 200,8 Q250,3 300,8 Q350,13 400,8" stroke="#00aaff" stroke-width="0.8" fill="none" opacity="0.15"/>
      <path d="M0,18 Q50,13 100,18 Q150,23 200,18 Q250,13 300,18 Q350,23 400,18" stroke="#00aaff" stroke-width="0.8" fill="none" opacity="0.18"/>
      <path d="M0,30 Q50,25 100,30 Q150,35 200,30 Q250,25 300,30 Q350,35 400,30" stroke="#00aaff" stroke-width="0.8" fill="none" opacity="0.12"/>
      <path d="M150,0 L135,28 L148,28 L130,58 L150,32 L137,32 L155,0Z" fill="#ff6a00" opacity="0.85" filter="url(#asGlow_w)"/>
      <path d="M260,5 L247,32 L258,32 L242,62 L262,36 L251,36 L265,5Z" fill="#ff8c00" opacity="0.75" filter="url(#asGlow_w)"/>
      <polygon points="80,38 84,44 80,50 76,44" fill="#00ccff" opacity="0.7"/>
      <polygon points="200,18 204,24 200,30 196,24" fill="#00ccff" opacity="0.7"/>
      <polygon points="310,50 314,56 310,62 306,56" fill="#00ccff" opacity="0.65"/>
    </svg>`,
  },
  {
    id: "cosmic-nebula",
    label: "Cosmic Nebula",
    accent: "#c084fc",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <radialGradient id="nb1_w" cx="30%" cy="60%" r="60%"><stop offset="0%" stop-color="#9b30ff" stop-opacity="0.9"/><stop offset="60%" stop-color="#3b0764" stop-opacity="0.8"/><stop offset="100%" stop-color="#0a0014" stop-opacity="1"/></radialGradient>
        <radialGradient id="nb2_w" cx="75%" cy="40%" r="50%"><stop offset="0%" stop-color="#ff8fce" stop-opacity="0.8"/><stop offset="70%" stop-color="#6b21a8" stop-opacity="0.4"/><stop offset="100%" stop-color="#0a0014" stop-opacity="0"/></radialGradient>
        <filter id="nbBlur_w"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="400" height="80" fill="#06000f"/>
      <ellipse cx="120" cy="50" rx="140" ry="55" fill="url(#nb1_w)" filter="url(#nbBlur_w)"/>
      <ellipse cx="300" cy="30" rx="120" ry="48" fill="url(#nb2_w)" filter="url(#nbBlur_w)"/>
      <circle cx="20" cy="10" r="1" fill="white" opacity="0.7"/><circle cx="50" cy="5" r="0.8" fill="white" opacity="0.6"/>
      <circle cx="90" cy="20" r="1.5" fill="white" opacity="0.8"/><circle cx="170" cy="35" r="0.8" fill="white" opacity="0.5"/>
      <circle cx="240" cy="6" r="1" fill="white" opacity="0.7"/><circle cx="310" cy="8" r="0.8" fill="white" opacity="0.6"/>
      <circle cx="55" cy="15" r="2" fill="white" opacity="0.9"/><circle cx="330" cy="55" r="1.5" fill="#ffccee" opacity="0.8"/>
    </svg>`,
  },
  {
    id: "cyber-leopard",
    label: "Cyber Leopard",
    accent: "#ff00aa",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs><radialGradient id="cl1_w" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#2d0059"/><stop offset="100%" stop-color="#0f0020"/></radialGradient></defs>
      <rect width="400" height="80" fill="url(#cl1_w)"/>
      <ellipse cx="30" cy="14" rx="14" ry="9" fill="#ff00aa" opacity="0.5"/>
      <ellipse cx="80" cy="38" rx="18" ry="11" fill="#ff00aa" opacity="0.6"/>
      <ellipse cx="140" cy="10" rx="12" ry="8" fill="#ff00aa" opacity="0.55"/>
      <ellipse cx="200" cy="50" rx="16" ry="10" fill="#ff00aa" opacity="0.5"/>
      <ellipse cx="260" cy="18" rx="14" ry="9" fill="#ff00aa" opacity="0.6"/>
      <ellipse cx="320" cy="42" rx="18" ry="11" fill="#ff00aa" opacity="0.55"/>
      <ellipse cx="370" cy="14" rx="12" ry="8" fill="#ff00aa" opacity="0.5"/>
      <ellipse cx="80" cy="38" rx="9" ry="5.5" fill="#0f0020" opacity="0.85"/>
      <ellipse cx="200" cy="50" rx="8" ry="5" fill="#0f0020" opacity="0.85"/>
      <ellipse cx="320" cy="42" rx="9" ry="5.5" fill="#0f0020" opacity="0.85"/>
      <rect width="400" height="80" fill="url(#cl1_w)" opacity="0.3"/>
    </svg>`,
  },
  {
    id: "crimson-magma",
    label: "Crimson Magma",
    accent: "#00ffff",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <radialGradient id="cm1_w" cx="50%" cy="80%" r="70%"><stop offset="0%" stop-color="#4a0000"/><stop offset="100%" stop-color="#0a0000"/></radialGradient>
        <filter id="cmGlow_w"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="80" fill="url(#cm1_w)"/>
      <path d="M50,14 L80,30 L110,20 L140,42 L170,26 L200,48 L230,34 L260,55 L290,36 L320,58 L350,40 L380,62" stroke="#1a0000" stroke-width="2.5" fill="none" opacity="0.8"/>
      <polygon points="60,46 40,72 80,72" fill="#00ffff" opacity="0.22" filter="url(#cmGlow_w)" stroke="#00ffff" stroke-width="0.5"/>
      <polygon points="80,36 62,60 100,60" fill="#00ffff" opacity="0.28" filter="url(#cmGlow_w)" stroke="#00ffff" stroke-width="0.5"/>
      <polygon points="200,52 182,76 220,76" fill="#00ffff" opacity="0.22" filter="url(#cmGlow_w)" stroke="#00ffff" stroke-width="0.5"/>
      <polygon points="330,40 312,65 350,65" fill="#00ffff" opacity="0.28" filter="url(#cmGlow_w)" stroke="#00ffff" stroke-width="0.5"/>
      <path d="M100,40 Q120,32 140,44 Q160,52 180,40" stroke="#8b0000" stroke-width="1.5" fill="none" opacity="0.8" filter="url(#cmGlow_w)"/>
    </svg>`,
  },
  {
    id: "cyberpunk-sunset",
    label: "Cyberpunk Sunset",
    accent: "#00ffff",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <linearGradient id="cs1_w" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#c8823a"/><stop offset="50%" stop-color="#e05a6f"/><stop offset="100%" stop-color="#c44060"/></linearGradient>
        <filter id="csGlow_w"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="80" fill="url(#cs1_w)"/>
      <path d="M30,6 Q60,20 40,34 Q20,40 50,54 L0,80 L0,0Z" fill="#0a0005" opacity="0.85"/>
      <path d="M300,80 Q320,65 310,50 Q295,38 315,24 Q330,14 320,0 L400,0 L400,80Z" fill="#0a0005" opacity="0.8"/>
      <path d="M60,0 Q62,10 58,20 L56,32" stroke="#050005" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M160,0 Q163,14 159,26 L157,38" stroke="#050005" stroke-width="3" fill="none" opacity="0.7"/>
      <rect x="90" y="16" width="6" height="2" fill="#00ffff" opacity="0.75" filter="url(#csGlow_w)"/>
      <rect x="130" y="42" width="8" height="2" fill="#00ffff" opacity="0.72" filter="url(#csGlow_w)"/>
      <rect x="180" y="28" width="5" height="2" fill="#00ffff" opacity="0.8" filter="url(#csGlow_w)"/>
      <rect x="260" y="20" width="9" height="2" fill="#00ffff" opacity="0.76" filter="url(#csGlow_w)"/>
      <circle cx="115" cy="30" r="1.5" fill="#00ffff" opacity="0.8" filter="url(#csGlow_w)"/>
      <circle cx="240" cy="60" r="1.5" fill="#00ffff" opacity="0.8" filter="url(#csGlow_w)"/>
    </svg>`,
  },
  {
    id: "bio-acid",
    label: "Bio-Acid Slime",
    accent: "#39ff14",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <radialGradient id="ac1_w" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#39ff14" stop-opacity="0.4"/><stop offset="100%" stop-color="#050f00" stop-opacity="1"/></radialGradient>
        <filter id="acBlur_w"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <rect width="400" height="80" fill="#020802"/>
      <ellipse cx="80" cy="60" rx="100" ry="42" fill="#1a3300" opacity="0.9"/>
      <ellipse cx="200" cy="20" rx="120" ry="35" fill="#0d1f00" opacity="0.8"/>
      <ellipse cx="340" cy="55" rx="90" ry="38" fill="#162b00" opacity="0.9"/>
      <path d="M0,46 Q50,28 100,55 Q150,74 200,40 Q250,14 300,46 Q350,68 400,36 L400,80 L0,80Z" fill="#0a1800" opacity="0.9"/>
      <ellipse cx="60" cy="58" rx="25" ry="10" fill="#39ff14" opacity="0.25" filter="url(#acBlur_w)"/>
      <ellipse cx="200" cy="28" rx="30" ry="12" fill="#7fff00" opacity="0.2" filter="url(#acBlur_w)"/>
      <ellipse cx="350" cy="48" rx="20" ry="8" fill="#39ff14" opacity="0.3" filter="url(#acBlur_w)"/>
      <path d="M100,0 Q102,14 98,24 Q96,30 100,34" stroke="#39ff14" stroke-width="1.5" fill="none" opacity="0.5"/>
      <circle cx="100" cy="36" r="3" fill="#39ff14" opacity="0.6"/>
    </svg>`,
  },
  {
    id: "pastel-twilight",
    label: "Pastel Twilight",
    accent: "#a78bfa",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <linearGradient id="pt1_w" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2d1b69"/><stop offset="50%" stop-color="#7c3aed" stop-opacity="0.7"/><stop offset="100%" stop-color="#f5f0e8"/></linearGradient>
      </defs>
      <rect width="400" height="80" fill="url(#pt1_w)"/>
      <path d="M20,52 Q35,43 55,48 Q60,40 80,43 Q95,36 110,43 Q115,48 100,54Z" fill="#c4b5fd" opacity="0.3"/>
      <path d="M200,60 Q220,50 245,55 Q250,45 275,49 Q290,42 310,49 Q315,55 295,60Z" fill="#ddd6fe" opacity="0.25"/>
      <g transform="translate(30,14)"><line x1="-3" y1="0" x2="3" y2="0" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/><line x1="0" y1="-3" x2="0" y2="3" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/></g>
      <g transform="translate(90,7)"><line x1="-3" y1="0" x2="3" y2="0" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/><line x1="0" y1="-3" x2="0" y2="3" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/></g>
      <g transform="translate(160,20)"><line x1="-3" y1="0" x2="3" y2="0" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/><line x1="0" y1="-3" x2="0" y2="3" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/></g>
      <g transform="translate(290,15)"><line x1="-3" y1="0" x2="3" y2="0" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/><line x1="0" y1="-3" x2="0" y2="3" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/></g>
      <circle cx="70" cy="23" r="1.5" fill="#f5f0e8" opacity="0.8"/>
      <circle cx="200" cy="36" r="1.5" fill="#f5f0e8" opacity="0.8"/>
      <circle cx="330" cy="20" r="1.5" fill="#f5f0e8" opacity="0.8"/>
    </svg>`,
  },
  {
    id: "dark-bramble",
    label: "Dark Bramble",
    accent: "#ff2d78",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <radialGradient id="db1_w" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#2d1b3d"/><stop offset="100%" stop-color="#0a0010"/></radialGradient>
        <filter id="dbGlow_w"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="80" fill="url(#db1_w)"/>
      <ellipse cx="100" cy="55" rx="130" ry="42" fill="#1a0d2e" opacity="0.7"/>
      <ellipse cx="300" cy="28" rx="120" ry="35" fill="#22103a" opacity="0.6"/>
      <path d="M0,40 Q40,26 60,40 Q70,32 85,40 Q95,34 110,40" stroke="#0d0018" stroke-width="3" fill="none" opacity="0.9"/>
      <path d="M300,0 Q320,16 310,28 Q305,36 318,45 Q325,52 315,64" stroke="#0d0018" stroke-width="2.5" fill="none" opacity="0.9"/>
      <path d="M55,43 Q58,40 62,43" stroke="#ff2d78" stroke-width="1.5" fill="none" opacity="0.7" filter="url(#dbGlow_w)"/>
      <path d="M310,48 Q313,45 317,48" stroke="#ff2d78" stroke-width="1.5" fill="none" opacity="0.6" filter="url(#dbGlow_w)"/>
      <ellipse cx="200" cy="62" rx="40" ry="14" fill="#4a0020" opacity="0.4" filter="url(#dbGlow_w)"/>
      <circle cx="20" cy="20" r="2" fill="#ff2d78" opacity="0.35" filter="url(#dbGlow_w)"/>
      <circle cx="80" cy="65" r="2" fill="#ff2d78" opacity="0.45" filter="url(#dbGlow_w)"/>
      <circle cx="350" cy="55" r="2" fill="#ff2d78" opacity="0.4" filter="url(#dbGlow_w)"/>
    </svg>`,
  },
];

// ============================================================
// G. OTHER GAMES (Modal PS5 Cards)
// ============================================================
export const OG_GAMES: OgGame[] = [
  {
    title: "Plenger RnG",
    desc: "Koleksi semua foto yang ada di game dan pamerkan ke teman mu!",
    tag: "CASUAL • SIMULATION",
    img: "/assets/picture/OG-GAMES/plengerRNG.jpg",
    url: "https://rakhafr.github.io/PlengerRnG/",
  },
  {
    title: "The Survey",
    desc: "Sebuah visual novel yang menceritakan seorang yang berjuang keluar dari isolasi diri selama 8 bulan.",
    tag: "VISUAL NOVEL • STORY",
    img: "/assets/picture/OG-GAMES/TheSurvey.png",
    url: "https://rakhafr.github.io/TheSurvey/",
  },
  {
    title: "Geotrade",
    desc: "Buat perusahaan mu dan tingkatkan jaringan antar kota, jangan sampai pasokan habis!",
    tag: "CASUAL • SANDBOX",
    img: "/assets/picture/OG-GAMES/geoTrade.png",
    url: "#",
    comingSoon: true,
  },
];

// ============================================================
// H. UPDATE LOGS
// ============================================================
export const UPDATE_LOGS: UpdateLog[] = [
  {
    version: "Pre-Test",
    date: "28 MEI 2026",
    badgeClass: "yellow",
    bannerImg: "/assets/picture/pre-test.png",
    changes: [
      { type: "upd", text: "Penataan ulang layout menu & gameplay dengan konsep *Stylized Arcade Interface*. Masih tahap pre-test kemungkinan data anda bakal hilang di update selanjutnya.." },
      { type: "add", text: "Integrasi Not Original Mode (NOM_TRACKS) ke dalam sistem lobby." },
      { type: "add", text: "Mengimplementasikan stylized loading screen bertema ReflexRHYTHM." },
      { type: "fix", text: "Memperbaiki bug audio preview yang tumpang tindih saat mengganti trek lagu dengan cepat." },
      { type: "upd", text: "Mengoptimalkan visualizer canvas agar lebih ringan di seluruh resolusi layar." },
    ],
  },
];

// ============================================================
// I. PROFILE DEFAULT DATA
// ============================================================
export const PROFILE_DEFAULT = {
  identity: {
    username: "Player",
    avatar: "default",
    bannerSkin: "arcade-spark",
  },
  stats: {
    totalGamesPlayed: 0,
    totalClicks: 0,
    totalWrongClicks: 0,
    totalBonusTriggered: 0,
    totalFreezeUsed: 0,
    lifetimeScore: 0,
    basic: { clicks: 0, wrongClicks: 0, gamesPlayed: 0 },
    notoriginal: { clicks: 0, wrongClicks: 0, gamesPlayed: 0 },
    records: {
      highestBasicScore: 0,
      highestNotOriginalScore: 0,
      longestCombo: 0,
      fastestReactionTime: 0,
    },
  },
  settings: {
    masterVolume: 100,
    sfxEnabled: true,
    countdownSoundEnabled: true,
    particleEffectEnabled: true,
    comboAnimationEnabled: true,
    mouseClickEnabled: true,
    keybinds: ["q", "w", "e", "r"],
  },
};
