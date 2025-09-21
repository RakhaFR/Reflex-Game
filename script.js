      let score = 0;
      let penaltyTimer = null;
      let holdTimer = null; // <<< baru
      let spawning = false;
      const buttons = ["greenBtn", "redBtn", "bonusBtn"]; // hold gak ikut random
      let countdownInterval = null;
      let combo = 0;

      function startCountdown(duration, spanId, onEnd) {
        const span = document.getElementById(spanId);
        let timeLeft = duration;
        span.textContent = timeLeft;

        if (countdownInterval) clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
          timeLeft--;
          span.textContent = timeLeft;
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            span.textContent = "";
            if (onEnd) onEnd();
          }
        }, 1000);
      }

      function stopCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);
        document
          .querySelectorAll(".countdown")
          .forEach((el) => (el.textContent = ""));
      }

      function updateScore(val) {
        score += val;
        document.getElementById("score").textContent = score;
      }

      function hideAllButtons() {
        ["greenBtn", "redBtn", "bonusBtn", "holdBtn"].forEach((id) => {
          document.getElementById(id).style.display = "none";
        });
      }

      function clearAllTimers() {
        if (penaltyTimer) {
          clearTimeout(penaltyTimer);
          penaltyTimer = null;
        }
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        spawning = false;
      }

      // Spawn tombol utama (hijau/merah/bonus)
      function spawnRandomButton() {
        if (spawning) return;
        spawning = true;

        hideAllButtons();
        stopCountdown();

        const randId = buttons[Math.floor(Math.random() * buttons.length)];
        const btn = document.getElementById(randId);
        btn.style.display = "block";

        // Hijau & Bonus → penalti kalau terlewat (5s)
        // Hijau & Bonus → penalti kalau terlewat (5s)
        if (randId === "greenBtn" || randId === "bonusBtn") {
          penaltyTimer = setTimeout(() => {
            updateScore(-1);
            updateCombo("reset"); // reset combo
            // mainkan suara salah
            const wrong = document.getElementById("soundRed");
            wrong.currentTime = 0;
            wrong.play();
            nextWithHold();
          }, 5000);
          startCountdown(5, randId === "greenBtn" ? "cdGreen" : "cdBonus");
        }

        // Merah → auto next setelah 3s (tanpa penalti)
        if (randId === "redBtn") {
          penaltyTimer = setTimeout(() => {
            nextWithHold();
          }, 3000);
          startCountdown(3, "cdRed");
        }
      }

      // Setelah tombol selesai → tampil Hold → lalu tombol berikutnya
      function nextWithHold() {
        if (penaltyTimer) {
          clearTimeout(penaltyTimer);
          penaltyTimer = null;
        }
        hideAllButtons();
        stopCountdown();

        const holdBtn = document.getElementById("holdBtn");
        holdBtn.style.display = "block";
        startCountdown(2, "cdHold"); // hold 2 detik

        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        holdTimer = setTimeout(() => {
          hideAllButtons();
          spawning = false;
          holdTimer = null;
          stopCountdown();
          spawnRandomButton();
        }, 2000);
      }

      // Start & Exit
      function startBasicMode() {
        clearAllTimers(); // <<< reset dulu biar bersih
        spawning = false;

        document.getElementById("lobby").classList.remove("active");
        document.getElementById("basicGame").classList.add("active");
        score = 0;
        document.getElementById("score").textContent = score;

        hideAllButtons();
        spawnRandomButton();
      }

      function exitBasicMode() {
        clearAllTimers();
        hideAllButtons();

        // reset combo
        combo = 0;
        document.getElementById("combo").textContent = combo;
        document
          .getElementById("comboContainer")
          .classList.remove("show", "combo-big", "combo-glow");

        document.getElementById("basicGame").classList.remove("active");
        document.getElementById("home").classList.add("active");
      }

      // === EVENT LISTENERS ===
      document.getElementById("playBasicBtn").addEventListener("click", () => {
        playSound();
        startBasicMode();
      });
      document.getElementById("exitBasicBtn").addEventListener("click", () => {
        playSound();
        exitBasicMode();
      });

      // Tombol Hijau
      document.getElementById("greenBtn").addEventListener("click", () => {
        updateScore(1);
        triggerEffects("soundGreen", "green");
        updateCombo(1);
        if (penaltyTimer) {
          clearTimeout(penaltyTimer);
          penaltyTimer = null;
        }
        nextWithHold();
      });

      document.getElementById("redBtn").addEventListener("click", () => {
        updateScore(-1);
        triggerEffects("soundRed", "red");
        updateCombo("reset");
        if (penaltyTimer) {
          clearTimeout(penaltyTimer);
          penaltyTimer = null;
        }
        nextWithHold();
      });

      // Tombol Bonus
      document.getElementById("bonusBtn").addEventListener("click", () => {
        updateScore(3);
        triggerEffects("soundBonus", "bonus");
        updateCombo(1);
        if (penaltyTimer) {
          clearTimeout(penaltyTimer);
          penaltyTimer = null;
        }
        nextWithHold();
      });

      function playSound() {
        const sound = document.getElementById("clickSound");
        sound.currentTime = 0; // biar bisa dipencet cepat2
        sound.play();
      }
      function goToLobby() {
        document.getElementById("home").classList.remove("active");
        document.getElementById("lobby").classList.add("active");
      }
      function goToHome() {
        document.getElementById("lobby").classList.remove("active");
        document.getElementById("home").classList.add("active");
      }

      // Efek Shake & Flash
      function triggerEffects(soundId, flashColor) {
        // Mainkan sound
        const sfx = document.getElementById(soundId);
        sfx.currentTime = 0;
        sfx.play();

        // Flash overlay berwarna
        const flash = document.getElementById("flashOverlay");
        flash.className = ""; // reset class
        flash.classList.add("active", flashColor);
        setTimeout(() => {
          flash.classList.remove("active", flashColor);
        }, 200);

        // Shake layar penuh
        const game = document.getElementById("basicGame");
        game.classList.add("shake");
        setTimeout(() => game.classList.remove("shake"), 400);
      }

      function updateCombo(change) {
        const comboText = document.getElementById("combo");
        const comboBox = document.getElementById("comboContainer");

        if (change === "reset") {
          combo = 0;
          comboText.textContent = "x0";

          // kasih efek reset
          comboBox.classList.remove("pop", "combo-big", "combo-glow");
          comboBox.classList.add("show"); // tetap visible sebentar
          setTimeout(() => {
            comboBox.classList.remove("show");
            comboBox.style.opacity = 0; // baru fade out
          }, 200);
        } else {
          combo += change;
          comboText.textContent = "x" + combo;

          // pastikan visible
          comboBox.style.opacity = 1;

          // trigger pop animasi
          comboBox.classList.add("pop");
          comboBox.classList.remove("show");

          if (combo >= 5) comboBox.classList.add("combo-big");
          if (combo >= 10) comboBox.classList.add("combo-glow");

          setTimeout(() => {
            comboBox.classList.remove("pop");
            comboBox.classList.add("show");
          }, 300);
        }
      }
