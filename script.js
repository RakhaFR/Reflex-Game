const inputNama = document.getElementById("inputNama");
const tombol = document.getElementById("tombol");
const skorEl = document.getElementById("skor");
const feedback = document.getElementById("feedback");
const labelSkor = document.getElementById("label-skor");
const gameplay = document.getElementById("gameplay");
const lobby = document.getElementById("lobby");
const progressBar = document.getElementById("progress-bar");
const progressInner = document.getElementById("progress-inner");
const leaderboardBody = document.getElementById("leaderboardBody");
const countdownEl = document.getElementById("countdown");
const soundBenar = document.getElementById("soundBenar");
const soundSalah = document.getElementById("soundSalah");
const countdownSound = document.getElementById("countdownSound");
const uiClickSound = document.getElementById("uiClickSound");

// === Vars untuk Versus Mode ===
const versusContainer = document.getElementById("versusContainer");
const versusArea = document.getElementById("versusArea");
const btnP1 = document.getElementById("btnP1");
const btnP2 = document.getElementById("btnP2");
const skorP1El = document.getElementById("skorP1");
const skorP2El = document.getElementById("skorP2");

let skorP1 = 0;
let skorP2 = 0;
let versusFirstClick = null; // 'p1' | 'p2'
let versusActive = false; // apakah ronde versus saat ini menerima input
let vsHijauTimeout = null;
let vsMerahTimeout = null;
let vsRoundTimeout = null;

let skor = 0;
let status = "menunggu";
let mode = "normal";
let modeHardcore = false;
let waktu = 10;
let timerInterval = null;
let merahTimeout = null;
let hijauTimeout = null;
let gameBerakhir = false;
let namaPengguna = "";

function tampilkanRadioVersus() {
  const wrapper = document.getElementById("versus-radio-wrapper");
  const sedangTampil = !wrapper.classList.contains("hidden");
  if (sedangTampil) wrapper.classList.add("hidden");
  else wrapper.classList.remove("hidden");
}

function sembunyikanRadioTime() {
  const wrapper = document.getElementById("waktu-radio-wrapper");
  const btnMulai = document.getElementById("btnMulaiTime");
  wrapper?.classList.add("hidden");
  btnMulai?.classList.add("hidden");
}

function resetVersusState() {
  clearTimeout(vsHijauTimeout);
  clearTimeout(vsMerahTimeout);
  clearTimeout(vsRoundTimeout);
  versusFirstClick = null;
  versusActive = false;
  btnP1.onclick = null;
  btnP2.onclick = null;
}

window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loading-screen").style.display = "none";
    lobby.classList.remove("hidden");

    const storedName = localStorage.getItem("username");
    if (storedName) {
      namaPengguna = storedName;
      document.getElementById("usernameDisplay").innerText =
        "👤 Username: " + namaPengguna;
      document.getElementById("inputNama").style.display = "none"; // sembunyikan input kalau sudah isi
    }

    // const best = localStorage.getItem("bestScore") || 0;
    // document.getElementById("skorLobby").innerText = best;
  }, 3000);
});

document.addEventListener("keydown", (e) => {
  if (!mode || !mode.startsWith("versus")) return;
  // gunakan a / l (case-insensitive)
  const k = e.key.toLowerCase();
  if (k === "a") handleVersusClick("p1");
  if (k === "l") handleVersusClick("p2");
});

function handleVersusClick(player) {
  if (!versusActive) return; // kalau belum aktif, ignore
  // ignore double clicks after first
  if (versusFirstClick) return;

  if (status === "versus_hijau") {
    versusFirstClick = player;
    if (player === "p1") {
      skorP1++;
      skorP1El.innerText = skorP1;
      feedback.innerText = "✅ P1 menang ronde ini!";
      soundBenar.play();
      btnP1.classList.add("vs-win-flash");
      setTimeout(() => btnP1.classList.remove("vs-win-flash"), 500);
    } else {
      skorP2++;
      skorP2El.innerText = skorP2;
      feedback.innerText = "✅ P2 menang ronde ini!";
      soundBenar.play();
      btnP2.classList.add("vs-win-flash");
      setTimeout(() => btnP2.classList.remove("vs-win-flash"), 500);
    }
  } else if (status === "versus_merah") {
    // klik merah -> penalti pada yang klik
    if (player === "p1") {
      skorP1--;
      skorP1El.innerText = skorP1;
      feedback.innerText = "❌ P1 klik merah!";
      soundSalah.play();
      btnP1.classList.add("shake");
      setTimeout(() => btnP1.classList.remove("shake"), 400);
    } else {
      skorP2--;
      skorP2El.innerText = skorP2;
      feedback.innerText = "❌ P2 klik merah!";
      soundSalah.play();
      btnP2.classList.add("shake");
      setTimeout(() => btnP2.classList.remove("shake"), 400);
    }
  }
  // setelah aksi, disable both and lanjut
  versusActive = false;
  clearTimeout(vsHijauTimeout);
  clearTimeout(vsMerahTimeout);

  // reset visuals quickly
  btnP1.disabled = true;
  btnP2.disabled = true;
  btnP1.style.backgroundColor = "";
  btnP2.style.backgroundColor = "";

  // lanjut ke ronde berikutnya
  setTimeout(() => {
    lanjutSetelahKlik(); // akan memanggil mulaiRonde() kembali
  }, 300);
}

function spawnVersusRound() {
  resetVersusState();
  status = "versus_wait";
  // teks sementara
  btnP1.innerText = "Menunggu...";
  btnP2.innerText = "Menunggu...";
  btnP1.disabled = true;
  btnP2.disabled = true;

  // jeda sebelum berubah jadi hijau/merah
  const jeda = modeHardcore ? 300 : Math.floor(Math.random() * 2000) + 800;

  vsRoundTimeout = setTimeout(() => {
    // power-up not used in vs (optional later)
    const isHijau = Math.random() < 0.5;
    if (isHijau) {
      status = "versus_hijau";
      versusActive = true;
      btnP1.innerText = "KLIK!";
      btnP2.innerText = "KLIK!";
      btnP1.style.backgroundColor = "green";
      btnP2.style.backgroundColor = "green";
      btnP1.disabled = false;
      btnP2.disabled = false;

      // jika pemain tidak klik dalam batas waktu => penalti / lanjut
      const waktuHijau = modeHardcore ? 500 : 2000;
      vsHijauTimeout = setTimeout(() => {
        if (!versusFirstClick) {
          // tidak ada yang klik, penalti kecil (pilih tidak penalti, atau lanjut)
          feedback.innerText = "⏱️ Tidak ada yang klik — lanjut!";
          soundSalah.play();
        }
        // reset visual
        btnP1.style.backgroundColor = "";
        btnP2.style.backgroundColor = "";
        versusActive = false;
        lanjutSetelahKlik();
      }, waktuHijau);
    } else {
      status = "versus_merah";
      versusActive = true;
      btnP1.innerText = "JANGAN KLIK!";
      btnP2.innerText = "JANGAN KLIK!";
      btnP1.style.backgroundColor = "red";
      btnP2.style.backgroundColor = "red";
      btnP1.disabled = false;
      btnP2.disabled = false;

      // jika tombol merah tidak di-klik, ronde berakhir setelah timeout
      const waktuMerah = modeHardcore
        ? Math.floor(Math.random() * 1000) + 1000
        : 1200;
      vsMerahTimeout = setTimeout(() => {
        // tidak ada yang klik => aman (tidak penalti)
        versusActive = false;
        btnP1.style.backgroundColor = "";
        btnP2.style.backgroundColor = "";
        lanjutSetelahKlik();
      }, waktuMerah);
    }

    // set onclick handlers (first-click wins for hijau, click on merah gives penalty)
    btnP1.onclick = () => handleVersusClick("p1");
    btnP2.onclick = () => handleVersusClick("p2");
  }, jeda);
}

// Saat halaman pertama kali load
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loading-screen").style.display = "none";
    lobby.classList.remove("hidden");

    // cek username di localStorage
    const storedName = localStorage.getItem("username");
    if (storedName) {
      namaPengguna = storedName;
      document.getElementById("usernameDisplay").innerText =
        "👤 Username: " + namaPengguna;
      document.getElementById("inputNama").style.display = "none"; // sembunyikan input kalau sudah punya nama
    }
  }, 3000);
});

function mulaiTimerVersus() {
  let sisa = waktu;
  progressBar.classList.remove("hidden");
  progressInner.style.width = "100%";

  timerInterval = setInterval(() => {
    sisa--;
    progressInner.style.width = `${(sisa / waktu) * 100}%`;
    feedback.innerText = `⏱️ Sisa Waktu: ${sisa} detik`;

    if (sisa <= 0) {
      clearInterval(timerInterval);
      akhirVersusGame();
    }
  }, 1000);
}

function akhirVersusGame() {
  gameBerakhir = true;
  versusActive = false;

  let hasil = "";
  if (skorP1 > skorP2) hasil = "Player 1 Menang | Player 2 Kalah";
  else if (skorP2 > skorP1) hasil = "Player 2 Menang | Player 1 Kalah";
  else hasil = "Seri! 🎉";

  document.getElementById("versusResultText").innerText = hasil;
  document.getElementById("versusPopup").classList.remove("hidden");
}

// dipanggil saat mulai game
function mulaiGame(pilihMode) {
  // kalau belum ada username, ambil dari input
  let storedName = localStorage.getItem("username");
  if (!storedName) {
    storedName = inputNama.value.trim();
    if (!storedName) {
      alert("Ups! Harap MASUKKAN NAMA..");
      return;
    }
    localStorage.setItem("username", storedName);
  }
  namaPengguna = storedName;
  document.getElementById("usernameDisplay").innerText =
    "👤 Username: " + namaPengguna;

  // info mode
  document.getElementById("info-mode").classList.remove("hidden");
  document.getElementById(
    "info-mode"
  ).innerText = `Mode: ${pilihMode.toUpperCase()}${
    modeHardcore ? " (Hardcore)" : ""
  }`;

  // lanjut ke logika game (reset skor, countdown, dsb)
  mode = modeHardcore ? pilihMode + "_hardcore" : pilihMode;
  if (!mode) mode = "normal";
  if (pilihMode === "time") {
    const radio = document.querySelector('input[name="plan"]:checked');
    waktu = radio ? parseInt(radio.value) : 60;
  }

  skor = 0;
  skorEl.innerText = skor;
  feedback.innerText = "";
  gameBerakhir = false;
  progressBar.classList.add("hidden");

  document.getElementById("waktu-radio-wrapper")?.classList.add("hidden");
  document.getElementById("btnMulaiTime")?.classList.add("hidden");

  lobby.classList.add("hidden");
  gameplay.classList.remove("hidden");

  // hide single-player tombol when versus; show vs UI
  if (pilihMode === "versus") {
    const radio = document.querySelector('input[name="planVersus"]:checked');
    waktu = radio ? parseInt(radio.value) : 60;
    mulaiTimerVersus(); // <- mulai hitung mundur
    document.getElementById("usernameDisplay").classList.add("hidden");
    document.getElementById("label-skor").classList.add("hidden");
    document.getElementById("skor").classList.add("hidden");
    // show versus area
    versusContainer.classList.remove("hidden");
    document.getElementById("tombol").classList.add("hidden");
    // reset scores
    skorP1 = 0;
    skorP2 = 0;
    skorP1El.innerText = skorP1;
    skorP2El.innerText = skorP2;

    // apply theme classes to versusArea
    const skin = document.getElementById("pilihSkin").value;
    versusArea.classList.remove("futuristic", "hardcore");
    if (skin === "futuristic") versusArea.classList.add("futuristic");
    if (skin === "hardcore") versusArea.classList.add("hardcore");
  } else {
    document.getElementById("usernameDisplay").classList.remove("hidden");
    document.getElementById("label-skor").classList.remove("hidden");
    document.getElementById("skor").classList.remove("hidden");
    versusContainer.classList.add("hidden");
    document.getElementById("tombol").classList.remove("hidden");
  }

  tombol.disabled = true;
  tombol.innerText = "Menunggu...";
  tombol.style.backgroundColor = "#555";

  btnLobby.classList.add("hidden");

  // countdown 3..2..1
  countdownEl.classList.remove("hidden");
  let hitung = 3;
  countdownEl.innerText = `${hitung}...`;
  countdownSound.play();

  const countdownInterval = setInterval(() => {
    hitung--;
    if (hitung > 0) {
      countdownEl.innerText = `${hitung}...`;
      countdownSound.play();
    } else if (hitung === 0) {
      countdownEl.innerText = "MULAI!";
      countdownSound.play();
    } else {
      clearInterval(countdownInterval);
      countdownEl.classList.add("hidden");
      btnLobby.classList.remove("hidden");

      if (mode.startsWith("versus")) {
        // deteksi device
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(
          navigator.userAgent
        );
        const notifEl = document.getElementById("versusNotif");
        notifEl.innerText = isMobile
          ? "📱 Klik layar box yang sudah di sediakan"
          : "💻 Player 1 tekan keyboard [A], Player 2 tekan keyboard [L]";
        notifEl.classList.remove("hidden");

        // sembunyikan notifikasi setelah 7 detik, lalu mulai ronde pertama
        setTimeout(() => {
          notifEl.classList.add("hidden");
          spawnVersusRound();
        }, 7000);
      } else {
        if (mode.includes("time")) mulaiTimer();
        mulaiRonde();
      }
    }
  }, 1000);
}

function tampilkanRadioWaktu() {
  const wrapper = document.getElementById("waktu-radio-wrapper");
  const btnMulai = document.getElementById("btnMulaiTime");
  const sedangTampil = !wrapper.classList.contains("hidden");

  if (sedangTampil) {
    wrapper.classList.add("hidden");
    btnMulai.classList.add("hidden");
  } else {
    wrapper.classList.remove("hidden");
    btnMulai.classList.remove("hidden");
  }
}

function updateBestScoreLobby() {
  const dataBest = JSON.parse(localStorage.getItem("bestScores") || "{}");

  document.getElementById("bestNormal").innerText = dataBest["normal"] || 0;
  document.getElementById("bestTime").innerText = dataBest["time"] || 0;
  document.getElementById("bestNormalHardcore").innerText =
    dataBest["normal_hardcore"] || 0;
  document.getElementById("bestTimeHardcore").innerText =
    dataBest["time_hardcore"] || 0;
}

function mulaiTimer() {
  let sisa = waktu;

  // Reset dan atur tema
  progressBar.classList.remove("futuristic", "hardcore", "hidden");
  progressInner.classList.remove("futuristic", "hardcore");

  const skin = document.getElementById("pilihSkin").value;
  if (skin === "futuristic") {
    progressBar.classList.add("futuristic");
    progressInner.classList.add("futuristic");
  } else if (skin === "hardcore") {
    progressBar.classList.add("hardcore");
    progressInner.classList.add("hardcore");
  }

  // Atur progress awal
  progressInner.style.width = "100%";

  // Format waktu awal
  const menitAwal = Math.floor(sisa / 60);
  const detikAwal = sisa % 60;
  feedback.innerText =
    menitAwal > 0
      ? `⏱️ Waktu: ${menitAwal}:${detikAwal.toString().padStart(2, "0")}`
      : `⏱️ Waktu: ${detikAwal} detik`;

  // Jalankan timer
  timerInterval = setInterval(() => {
    sisa--;
    const menit = Math.floor(sisa / 60);
    const detik = sisa % 60;
    feedback.innerText =
      menit > 0
        ? `⏱️ Waktu: ${menit}:${detik.toString().padStart(2, "0")}`
        : `⏱️ Waktu: ${detik} detik`;

    progressInner.style.width = `${(sisa / waktu) * 100}%`;
    if (sisa <= 0) {
      clearInterval(timerInterval);
      akhirGame();
    }
  }, 1000);
}

function mulaiRonde() {
  if (gameBerakhir) return;

  // 🧹 Bersihkan sisa ronde sebelumnya
  tombol.onclick = null;
  clearTimeout(hijauTimeout);
  clearTimeout(merahTimeout);

  const jeda = modeHardcore ? 300 : Math.floor(Math.random() * 3000) + 1000;
  status = "menunggu";
  tombol.disabled = true;
  tombol.innerText = "Menunggu...";
  tombol.style.backgroundColor = "#555";

  setTimeout(() => {
    if (gameBerakhir) return;

    // 🎁 Power-Up Chance
    if (Math.random() < 0.1) {
      spawnPowerUp();
      return; // 🚨 stop biar hijau/merah gak ikut
    }

    // 🎯 Kalau bukan power-up
    const isHijau = Math.random() < 0.5;
    if (isHijau) spawnHijau();
    else spawnMerah();
  }, jeda);
}

function spawnPowerUp() {
  tombol.onclick = null;
  clearTimeout(hijauTimeout);
  clearTimeout(merahTimeout);

  status = "powerup";
  const tipe = Math.random() < 0.5 ? "blue" : "gold";
  tombol.innerText = tipe === "blue" ? "❄️ Freeze!" : "💰 Bonus!";
  tombol.style.backgroundColor = tipe === "blue" ? "blue" : "gold";
  tombol.disabled = false;

  tombol.onclick = () => {
    // 🚨 khusus power-up, jangan ikut logika merah/hijau
    if (status !== "powerup") return;

    tombol.classList.add("shake");
    setTimeout(() => tombol.classList.remove("shake"), 400);

    if (tipe === "blue" && mode.includes("time")) {
      waktu += 2;
      feedback.innerText = "❄️ Freeze! Waktu +2 detik";
      document.body.classList.add("flash-blue");
      setTimeout(() => document.body.classList.remove("flash-blue"), 500);
      document.getElementById("soundFreeze").play();
    } else if (tipe === "gold") {
      skor += 3;
      feedback.innerText = "💰 Bonus! +3 poin";
      document.body.classList.add("flash-gold");
      setTimeout(() => document.body.classList.remove("flash-gold"), 500);
      document.getElementById("soundBonus").play();
    }

    skorEl.innerText = skor;
    lanjutSetelahKlik();
  };
}

function spawnHijau() {
  tombol.onclick = null;
  clearTimeout(hijauTimeout);
  clearTimeout(merahTimeout);
  status = "hijau";
  tombol.innerText = "Klik!";
  tombol.style.backgroundColor = "green";
  tombol.disabled = false;

  const waktuHijau = modeHardcore ? 500 : 2000;
  hijauTimeout = setTimeout(() => {
    if (gameBerakhir) return;
    feedback.innerText = "⏱️ Terlambat! Kamu tidak klik tombol hijau.";
    soundSalah.play();
    skor--;
    skorEl.innerText = skor;
    lanjutSetelahKlik();
  }, waktuHijau);
}

function spawnMerah() {
  tombol.onclick = null;
  clearTimeout(hijauTimeout);
  clearTimeout(merahTimeout);
  status = "merah";
  tombol.innerText = "Klik!";
  tombol.style.backgroundColor = "red";
  tombol.disabled = false;

  const waktuMerah = modeHardcore
    ? Math.floor(Math.random() * 1000) + 1000
    : 1200;

  merahTimeout = setTimeout(() => lanjutSetelahKlik(), waktuMerah);
}

tombol.addEventListener("click", () => {
  if (mode.startsWith("versus")) return; // ignore if versus active (we use btnP1/btnP2)
  if (merahTimeout) clearTimeout(merahTimeout);
  if (hijauTimeout) clearTimeout(hijauTimeout);

  tombol.classList.add("shake");
  setTimeout(() => tombol.classList.remove("shake"), 400);

  if (status === "hijau") {
    // ✅ Klik benar
    skor++;
    feedback.innerText = "✅ Bagus! Kamu cepat!";
    soundBenar.play();
    document.body.classList.add("flash-screen");
    setTimeout(() => document.body.classList.remove("flash-screen"), 500);

    skorEl.innerText = skor;
    lanjutSetelahKlik();
  } else if (status === "merah") {
    // ❌ Klik salah
    skor--;
    feedback.innerText = "❌ Salah! Jangan klik saat merah.";
    soundSalah.play();

    skorEl.innerText = skor;
    lanjutSetelahKlik();
  } else if (status === "powerup") {
    // 🎁 Power-up ditangani di spawnPowerUp(),
    // jadi abaikan supaya gak dianggap salah
    return;
  }
});

function lanjutSetelahKlik() {
  tombol.disabled = true;
  tombol.innerText = "Menunggu...";
  tombol.style.backgroundColor = "#555";
  status = "menunggu";

  if (mode.startsWith("versus")) {
    // delay kecil lalu spawn next versus round
    setTimeout(() => {
      if (!gameBerakhir) spawnVersusRound();
    }, 350);
  } else {
    // single player
    mulaiRonde();
  }
}

function akhirGame() {
  tombol.disabled = true;
  tombol.innerText = "Selesai";
  tombol.style.backgroundColor = "#333";
  gameBerakhir = true;
  feedback.innerText = `Permainan selesai! Skor: ${skor}`;

  // simpan skor terbaik
  let dataBest = JSON.parse(localStorage.getItem("bestScores") || "{}");
  let best = dataBest[mode] || 0;

  if (skor > best) {
    dataBest[mode] = skor;
    localStorage.setItem("bestScores", JSON.stringify(dataBest));
  }

  updateBestScoreLobby();
}

function rematchVersus() {
  // ✅ sembunyikan popup dulu
  document.getElementById("versusPopup").classList.add("hidden");

  // ✅ reset skor
  skorP1 = 0;
  skorP2 = 0;
  skorP1El.innerText = skorP1;
  skorP2El.innerText = skorP2;

  // ✅ reset status game
  gameBerakhir = false;
  feedback.innerText = "";

  // ✅ reset timer lama kalau ada
  clearInterval(timerInterval);

  // ambil durasi baru dari radio button
  const radio = document.querySelector('input[name="planVersus"]:checked');
  waktu = radio ? parseInt(radio.value) : 60;

  // ✅ tampilkan countdown 3..2..1.. MULAI!
  countdownEl.classList.remove("hidden");
  let hitung = 3;
  countdownEl.innerText = `${hitung}...`;
  countdownSound.play();

  const countdownInterval = setInterval(() => {
    hitung--;
    if (hitung > 0) {
      countdownEl.innerText = `${hitung}...`;
      countdownSound.play();
    } else if (hitung === 0) {
      countdownEl.innerText = "MULAI!";
      countdownSound.play();
    } else {
      clearInterval(countdownInterval);
      countdownEl.classList.add("hidden");

      // ✅ mulai ulang timer & ronde pertama
      mulaiTimerVersus();
      spawnVersusRound();
    }
  }, 1000);
}

function kembaliKeLobby() {
  // simpan skor terbaik dulu
  if (!gameBerakhir && namaPengguna) {
    let dataBest = JSON.parse(localStorage.getItem("bestScores") || "{}");
    let best = dataBest[mode] || 0;
    if (skor > best) {
      dataBest[mode] = skor;
      localStorage.setItem("bestScores", JSON.stringify(dataBest));
    }
  }

  gameplay.classList.add("hidden");
  lobby.classList.remove("hidden");

  if (merahTimeout) clearTimeout(merahTimeout);
  if (hijauTimeout) clearTimeout(hijauTimeout);
  if (timerInterval) clearInterval(timerInterval);

  updateBestScoreLobby(); // tampilkan highscore terbaru

  console.log("Mode:", mode, "Skor terakhir:", skor);

  // ✅ reset skor single player
  skor = 0;
  skorEl.innerText = skor;
  gameBerakhir = true;
  feedback.innerText = "";
  progressBar.classList.add("hidden");

  // ✅ reset skor versus
  skorP1 = 0;
  skorP2 = 0;
  skorP1El.innerText = skorP1;
  skorP2El.innerText = skorP2;

  // ✅ pastikan popup versus disembunyikan
  document.getElementById("versusPopup").classList.add("hidden");
}

// function tampilkanLeaderboard() {
//   const modeDipilih = document.getElementById("filterMode").value;
//   let data = JSON.parse(localStorage.getItem("leaderboard") || '{}');
//   const daftar = data[modeDipilih] || [];
//   leaderboardBody.innerHTML = daftar.map((d, i) =>
//     `<tr><td>${i + 1}</td><td>${d.nama}</td><td>${d.skor}</td></tr>`
//   ).join("");
// }

// document.addEventListener("DOMContentLoaded", tampilkanLeaderboard);

// function updateFilterLeaderboardDropdown() {
//   const select = document.getElementById("filterMode");
//   select.innerHTML = ""; // hapus semua opsi lama

//   if (modeHardcore) {
//     select.innerHTML += `<option value="normal_hardcore">Biasa - Hardcore</option>`;
//     select.innerHTML += `<option value="time_hardcore">Time Attack - Hardcore</option>`;
//   } else {
//     select.innerHTML += `<option value="normal">Mode Biasa</option>`;
//     select.innerHTML += `<option value="time">Time Attack</option>`;
//   }

//   // tampilkanLeaderboard(); // update tampilan data juga
// }

// document.addEventListener("DOMContentLoaded", () => {
//   // tampilkanLeaderboard();
//   updateFilterLeaderboardDropdown(); // ← tambahkan ini
// });

function gantiSkin(skin) {
  modeHardcore = skin === "hardcore";

  document.querySelectorAll(".btn").forEach((btn) => {
    btn.classList.remove("futuristic", "hardcore");
    if (skin !== "default") btn.classList.add(skin);
  });

  document.querySelectorAll(".vs-btn").forEach((b) => {
    b.classList.remove("futuristic", "hardcore");
    if (skin !== "default") b.classList.add(skin);
  });
  document
    .querySelector(".versus-area")
    ?.classList.remove("futuristic", "hardcore");
  if (skin !== "default")
    document.querySelector(".versus-area")?.classList.add(skin);

  const leaderboard = document.querySelector(".leaderboard");
  const selects = document.querySelectorAll("select, option");
  const inputNama = document.getElementById("inputNama");
  const judulSkor = document.getElementById("judul-skor");
  const progressBar = document.getElementById("progress-bar");
  const countdown = document.getElementById("countdown");

  [
    leaderboard,
    ...selects,
    inputNama,
    judulSkor,
    progressBar,
    countdown,
  ].forEach((el) => {
    if (el) {
      el.classList.remove("futuristic", "hardcore");
      if (skin !== "default") el.classList.add(skin);
    }
  });
  // updateFilterLeaderboardDropdown();

  const packageContainer = document.querySelector(".package-container");
  const radioLabels = document.querySelectorAll(".package-tab");
  const tabWrapper = document.querySelector(".package-tab-wrapper");
  if (tabWrapper) {
    tabWrapper.classList.remove("futuristic", "hardcore");
    if (skin !== "default") tabWrapper.classList.add(skin);
  }

  // if (packageContainer) {
  //   packageContainer.classList.remove('futuristic', 'hardcore');
  //   if (skin !== 'default') packageContainer.classList.add(skin);

  //   // Donasi skin theme
  //   const donateForm = document.querySelector('.plan-chooser');
  //   const donateLabels = document.querySelectorAll('.plan-option label');
  //   const donateBtn = document.querySelector('.choose-btn');
  //   const donateInput = document.getElementById('jumlahBebas');

  //   [donateForm, donateBtn, donateInput, ...donateLabels].forEach(el => {
  //     el.classList.remove('futuristic', 'hardcore');
  //     if (skin !== 'default') el.classList.add(skin);
  //   });
  // }

  radioLabels.forEach((label) => {
    label.classList.remove("futuristic", "hardcore");
    if (skin !== "default") label.classList.add(skin);
  });

  // ✅ sinkronkan dropdown dengan tema yang dipilih
  const selectTema = document.getElementById("pilihSkin");
  if (selectTema) {
    selectTema.value = skin;
  }

  // (opsional) simpan pilihan tema ke localStorage
  localStorage.setItem("skin", skin);
}

window.addEventListener("load", () => {
  const savedSkin = localStorage.getItem("skin") || "default";
  gantiSkin(savedSkin);
});

window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loading-screen").style.display = "none";
    lobby.classList.remove("hidden");

    // radio waktu dan tombol Time Attack sembunyi dulu
    document.getElementById("waktu-radio-wrapper")?.classList.add("hidden");
    document.getElementById("btnMulaiTime")?.classList.add("hidden");

    // Tampilkan donate section
    document.getElementById("donate-section")?.classList.remove("hidden");
  }, 3000);
});

const radioDonasi = document.querySelectorAll('input[name="donasi"]');
const inputBebas = document.getElementById("jumlahBebas");
const inputWrapper = document.getElementById("bebas-input-wrapper");

radioDonasi.forEach((radio) => {
  radio.addEventListener("change", () => {
    if (radio.id === "bebas") {
      inputWrapper.classList.remove("hidden");
      inputBebas.focus();
    } else {
      inputWrapper.classList.add("hidden");
      inputBebas.value = "";
    }
  });
});

function prosesDonasi() {
  const selected = document.querySelector('input[name="donasi"]:checked');
  if (!selected) return alert("Pilih salah satu opsi donasi.");

  if (selected.id === "bebas") {
    const val = parseInt(inputBebas.value);
    if (!val || val < 1000) {
      return alert("Masukkan jumlah donasi minimal Rp1000.");
    }
    alert(`Terima kasih atas donasi sebesar Rp${val.toLocaleString()} ❤️`);
  } else {
    alert("Terima kasih atas dukungannya! ❤️");
  }
}
