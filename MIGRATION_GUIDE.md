# 🎮 ReflexRHYTHM — Panduan Migrasi Next.js

## ⚡ STEP 1 — Install Next.js di folder yang ada

Buka terminal, `cd` ke folder project:

```
cd "D:\RAKHA\Project programming\projek game\Reflex Game"
```

Jalankan (titik `.` = install di folder ini langsung, tanpa buat folder baru):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"
```

> Kalau ada prompt "Overwrite existing files?", pilih **Yes** untuk semua — file kita yang di sini sudah siap.

---

## 📁 STEP 2 — Paste file hasil migrasi ini

Salin semua file dari folder ini ke posisi yang sesuai di project kamu.
Berikut mapping lengkapnya:

```
DARI SINI                  → PASTE KE SANA
─────────────────────────────────────────────────────────────
package.json               → (replace yang di-generate Next.js)
next.config.js             → (replace yang di-generate Next.js)
tailwind.config.ts         → (replace yang di-generate Next.js)
postcss.config.js          → (replace yang di-generate Next.js)
tsconfig.json              → (replace yang di-generate Next.js)

app/globals.css            → app/globals.css
app/layout.tsx             → app/layout.tsx
app/page.tsx               → app/page.tsx
app/lobby/page.tsx         → app/lobby/page.tsx
app/game/page.tsx          → app/game/page.tsx

components/MainMenu.tsx    → components/MainMenu.tsx
components/Lobby.tsx       → components/Lobby.tsx
components/GameArena.tsx   → components/GameArena.tsx

lib/gameData.ts            → lib/gameData.ts
lib/profile.ts             → lib/profile.ts
```

---

## 📦 STEP 3 — Pindahkan assets ke /public

Folder `public/` di Next.js = folder root untuk static files.

```
DARI (vanilla)             → KE (Next.js public/)
─────────────────────────────────────────────────────────────
assets/                    → public/assets/
  music/                   →   music/
  video/                   →   video/
  audio/                   →   audio/
  picture/                 →   picture/

js/utils.js                → public/js/utils.js
js/profile.js              → public/js/profile.js
js/game-mode.js            → public/js/game-mode.js
js/basic-mode.js           → public/js/basic-mode.js
js/notoriginal-mode.js     → public/js/notoriginal-mode.js
js/loading.js              → public/js/loading.js     (optional)
js/popups.js               → public/js/popups.js      (optional)
```

> **PENTING:** Game engine (basic-mode.js & notoriginal-mode.js) tetap pakai
> file vanilla yang ada di `/public/js/`. Mereka di-load secara dinamis oleh
> `GameArena.tsx` saat halaman game dibuka. Kamu **tidak** perlu convert JS
> engine itu ke TypeScript — cukup pindahkan ke public/js/.

---

## 🔧 STEP 4 — Install dependencies

```bash
npm install
```

---

## 🚀 STEP 5 — Jalankan dev server

```bash
npm run dev
```

Buka browser: **http://localhost:3000**

---

## 🗑️ STEP 6 — Hapus file vanilla (setelah Next.js jalan)

Setelah kamu cek semua halaman berjalan normal, hapus file-file ini:

```
❌ index.html
❌ lobby.html
❌ game.html
❌ css/             (semua CSS vanilla — udah jadi globals.css + Tailwind)
❌ aos/             (tidak dipakai sama sekali)
```

Yang **JANGAN** dihapus:

```
✅ js/              (tetap dipakai oleh engine, sudah dipindah ke public/js/)
✅ assets/          (tetap dipakai, sudah dipindah ke public/assets/)
✅ .git/            (version control, jangan sentuh)
✅ semua file Next.js baru
```

---

## 🏗️ Struktur Akhir Folder

```
Reflex Game/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx              ← Main Menu
│   ├── lobby/
│   │   └── page.tsx          ← Lobby
│   └── game/
│       └── page.tsx          ← Game Arena
├── components/
│   ├── MainMenu.tsx
│   ├── Lobby.tsx
│   └── GameArena.tsx
├── lib/
│   ├── gameData.ts           ← semua data (tracks, banners, dll)
│   └── profile.ts            ← localStorage profile system
├── public/
│   ├── assets/               ← pindahan dari assets/
│   │   ├── music/
│   │   ├── video/
│   │   ├── audio/
│   │   └── picture/
│   └── js/                   ← pindahan dari js/
│       ├── utils.js
│       ├── profile.js
│       ├── game-mode.js
│       ├── basic-mode.js
│       └── notoriginal-mode.js
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .git/
```

---

## ⚙️ Cara Kerja Arsitektur Ini

### Navigasi

- **/** → `app/page.tsx` → `components/MainMenu.tsx`
- **/lobby** → `app/lobby/page.tsx` → `components/Lobby.tsx`
- **/game?mode=basic&track=0&diff=normal** → `app/game/page.tsx` → `components/GameArena.tsx`

### Game Engine Strategy

`GameArena.tsx` menggunakan strategi **script injection**:

1. Params game (mode, track, diff) disimpan ke `sessionStorage`
2. File JS vanilla (`basic-mode.js` / `notoriginal-mode.js`) di-load dinamis via `<script>` tag
3. Engine function (`startBasicMode` / `startNotOriginalEngine`) dipanggil setelah scripts loaded
4. DOM elements yang dibutuhkan engine (dengan ID yang sama persis) sudah disiapkan oleh `GameEngineDOM` component

### Data Flow

- `lib/gameData.ts` = sumber kebenaran tunggal untuk semua data (tracks, modes, banners, OG games, logs)
- `lib/profile.ts` = wrapper TypeScript untuk localStorage profile system
- Component React tidak perlu tahu tentang vanilla JS — mereka hanya render DOM yang dibutuhkan

---

## 🐛 Troubleshooting

### "Cannot find module @/components/..."

Pastikan `tsconfig.json` punya `"paths": { "@/*": ["./*"] }`

### Engine tidak berjalan setelah klik PLAY

1. Cek apakah file ada di `public/js/basic-mode.js`
2. Buka DevTools → Console, lihat error
3. Cek apakah `startBasicMode` / `startNotOriginalEngine` terdefinisi di `window`

### Audio tidak jalan

Semua audio element di-inject otomatis oleh `GameArena.tsx` dengan ID yang sama seperti di vanilla game. Pastikan file audio ada di `public/assets/audio/`.

### Video background tidak muncul

Pastikan file video ada di `public/assets/video/`. Path di `BM_TRACKS` menggunakan `assets/video/...` (tanpa leading slash) — Next.js otomatis resolve dari `/public/`.

### `useSearchParams()` error di Next.js

Sudah ditangani dengan `Suspense` wrapper di `GameArena.tsx`. Ini required behavior Next.js 14.

---

## 🎯 Mau Nambah Track Baru?

Cukup edit `lib/gameData.ts`, tambah object baru ke `BM_TRACKS` atau `NOM_TRACKS`:

```typescript
{
  id: "nama-unik-track",
  title: "NAMA TRACK",
  artist: "ARTIST",
  bpm: 150,
  src: "assets/music/nama-file.mp3",   // taruh di public/assets/music/
  duration: 180,
  bg: "assets/video/nama-file.mp4",    // taruh di public/assets/video/
  art: "assets/picture/new-logo.png",
  difficulties: ["normal", "medium", "hard"],
  color: "#ff2d78",
  role: "// BASIC MODE — MEDIUM REFLEX",
  titleClass: "title-basic",
  desc: "Deskripsi singkat track ini.",
},
```

Tidak perlu edit HTML apapun — lobby render otomatis dari data ini.

---

Made with ❤️ for ReflexRHYTHM // Rakha Fr
