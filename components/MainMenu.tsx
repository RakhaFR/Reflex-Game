"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { OG_GAMES, UPDATE_LOGS } from "@/lib/gameData";
import { playSfx } from "@/lib/profile";

export default function MainMenu() {
  const router = useRouter();
  const [isOtherGamesOpen, setIsOtherGamesOpen] = useState(false);
  const [isUpdateLogOpen, setIsUpdateLogOpen] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    document.body.className = "main-menu-page";

    // Setup background music autoplay with user interaction unlock
    const bg = bgMusicRef.current;
    if (bg) {
      bg.volume = 0.4;
      const playPromise = bg.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const unlockAudio = () => {
            if (bgMusicRef.current) {
              bgMusicRef.current.play().catch(() => {});
            }
            window.removeEventListener("click", unlockAudio);
            window.removeEventListener("keydown", unlockAudio);
            window.removeEventListener("touchstart", unlockAudio);
          };
          window.addEventListener("click", unlockAudio);
          window.addEventListener("keydown", unlockAudio);
          window.addEventListener("touchstart", unlockAudio);
        });
      }
    }

    return () => {
      document.body.className = "";
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    };
  }, []);

  const handleNavigateLobby = (e: React.MouseEvent) => {
    e.preventDefault();
    playSfx("clickSound");
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
    }
    router.push("/lobby");
  };

  const handleOpenOtherGames = () => {
    playSfx("clickSound");
    setIsOtherGamesOpen(true);
  };

  const handleCloseOtherGames = () => {
    playSfx("clickSound");
    setIsOtherGamesOpen(false);
  };

  const handleOpenUpdateLog = () => {
    playSfx("clickSound");
    setIsUpdateLogOpen(true);
  };

  const handleCloseUpdateLog = () => {
    playSfx("clickSound");
    setIsUpdateLogOpen(false);
  };

  return (
    <>
      {/* BACKGROUND LIVE2D VIDEO FOR MAIN MENU */}
      <div className="menu-video-bg">
        <video autoPlay loop muted playsInline>
          <source src="/assets/video/lobby.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay"></div>
      </div>

      {/* MAIN INTERFACE LAYOUT */}
      <main className="menu-layout">
        {/* BRANDING TITLE */}
        <header className="menu-header">
          <div className="brand-box">
            <span className="splash-text">ALPHA BUILD!</span>
            <h1 className="game-title-main">
              REFLEX<span className="accent">RHYTHM</span>
            </h1>
            <p className="game-tagline">// THE ULTIMATE REFLEX &amp; RHYTHM CHALLENGE</p>
          </div>
        </header>

        {/* CENTER NAVIGATION MENU */}
        <div className="menu-content-center">
          <div className="buttons-vertical-stack">
            <a
              href="/lobby"
              onClick={handleNavigateLobby}
              className="menu-btn btn-play"
              id="btnMainPlay"
            >
              <div className="btn-skew-inner">
                <span className="btn-icon">
                  <i className="fas fa-play"></i>
                </span>
                <span className="btn-text">START PLAY</span>
              </div>
            </a>

            <button
              onClick={handleOpenOtherGames}
              className="menu-btn btn-utility btn-orange"
              id="btnMainOtherGames"
              type="button"
            >
              <div className="btn-skew-inner">
                <span className="btn-icon">
                  <i className="fas fa-gamepad"></i>
                </span>
                <span className="btn-text">OTHER GAMES</span>
              </div>
            </button>

            <a
              href="https://lynk.id/bangriyadi/s/z6l332ojeqrg"
              onClick={() => playSfx("clickSound")}
              className="menu-btn btn-utility btn-pink"
              id="btnMainDonate"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="btn-skew-inner">
                <span className="btn-icon">
                  <i className="fas fa-heart"></i>
                </span>
                <span className="btn-text">DONATE SUPPORT</span>
              </div>
            </a>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="menu-footer">
          <div className="footer-center-container">
            <div className="social-panel">
              <span className="social-label">CONNECT WITH US //</span>
              <div className="social-icons-row">
                <a
                  href="https://www.instagram.com/bang_r1yad1/"
                  onClick={() => playSfx("clickSound")}
                  className="social-circle-link ig"
                  title="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="social-txt-icon">
                    <i className="fab fa-instagram"></i>
                  </span>
                </a>
                <a
                  href="https://discord.com/users/1274191390246440981"
                  onClick={() => playSfx("clickSound")}
                  className="social-circle-link dc"
                  title="Discord"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="social-txt-icon">
                    <i className="fab fa-discord"></i>
                  </span>
                </a>
                <a
                  href="https://github.com/RakhaFR/"
                  onClick={() => playSfx("clickSound")}
                  className="social-circle-link gh"
                  title="GitHub"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="social-txt-icon">
                    <i className="fab fa-github"></i>
                  </span>
                </a>
                <a
                  href="https://www.tiktok.com/@xzearty_"
                  onClick={() => playSfx("clickSound")}
                  className="social-circle-link tk"
                  title="TikTok"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="social-txt-icon">
                    <i className="fab fa-tiktok"></i>
                  </span>
                </a>
              </div>
            </div>
            <div className="copyright-tag">
              <span>© 2026 REFLEXRHYTHM PROJECT // ALL RIGHTS RESERVED</span>
            </div>
          </div>
        </footer>
      </main>

      {/* FULLSCREEN QUICK SHORTCUT BUTTON */}
      <button
        onClick={() => {
          playSfx("clickSound");
          const docEl = document.documentElement as any;
          if (docEl.requestFullscreen) docEl.requestFullscreen().catch(() => {});
          else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
          else if (docEl.mozRequestFullScreen) docEl.mozRequestFullScreen();
          else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
        }}
        className="update-log-trigger"
        style={{ bottom: "60px", background: "rgba(0,229,255,0.08)", borderColor: "rgba(0,229,255,0.4)", color: "#00e5ff", padding: "6px 12px", fontSize: "10px", gap: "5px" }}
        type="button"
        title="Toggle Fullscreen Mode"
      >
        <i className="fa-solid fa-expand"></i>
        <span>FULLSCREEN</span>
      </button>

      {/* UPDATE LOG BUTTON */}
      <button
        onClick={handleOpenUpdateLog}
        className="update-log-trigger"
        id="btnUpdateLog"
        type="button"
      >
        <i className="fa-solid fa-file-lines"></i>
        <span>UPDATE LOG</span>
      </button>

      {/* UPDATE LOG MODAL */}
      <div
        id="updateLogModal"
        className={`popup-overlay-menu ${isUpdateLogOpen ? "active" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseUpdateLog();
        }}
      >
        <div className="popup-box-skew log-modal-box">
          <div className="popup-header-row">
            <h3 className="popup-box-title">[U] SYSTEM UPDATE LOG</h3>
            <button
              onClick={handleCloseUpdateLog}
              className="popup-close-btn"
              id="btnCloseUpdateLog"
              type="button"
            >
              ✕
            </button>
          </div>
          <div className="popup-body-content" id="updateLogContent">
            <div className="log-version-container">
              {UPDATE_LOGS.map((log, idx) => (
                <div className="log-version-item" key={idx}>
                  <div className="log-version-header">
                    <span className={`v-badge ${log.badgeClass}`}>{log.version}</span>
                    <span className="v-date">{log.date}</span>
                  </div>

                  <div className="log-banner-wrapper">
                    <img
                      src={log.bannerImg}
                      alt={`Update ${log.version}`}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>

                  <ul className="log-version-list">
                    {log.changes.map((change, cIdx) => {
                      let tagLabel = "UPD";
                      if (change.type === "add") tagLabel = "NEW";
                      if (change.type === "fix") tagLabel = "FIX";
                      return (
                        <li key={cIdx}>
                          <span className={`tag-${change.type}`}>{tagLabel}</span>
                          <p>{change.text}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL OTHER GAMES */}
      <div
        id="modalOtherGames"
        className={`popup-overlay-menu ${isOtherGamesOpen ? "active" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseOtherGames();
        }}
      >
        <div className="popup-box-skew og-modal-box">
          <div className="popup-header-row">
            <h3 className="popup-box-title">[G] OTHER GAMES PROJECT</h3>
            <button
              onClick={handleCloseOtherGames}
              className="popup-close-btn"
              id="btnCloseModal"
              type="button"
            >
              ✕
            </button>
          </div>
          <div className="popup-body-content">
            <p className="coming-soon-text">PILIH GAME // PROYEK LAIN DARI TIM YANG SAMA</p>
            <div className="og-games-row" id="ogGamesRow">
              {OG_GAMES.map((game, idx) => {
                const isLocked = !!game.comingSoon;
                return isLocked ? (
                  <div key={idx} className="og-game-card og-locked" tabIndex={0}>
                    <div className="og-card-art">
                      <img
                        src={game.img}
                        alt={game.title}
                        onError={(e) => {
                          (e.target as HTMLElement).style.opacity = "0";
                        }}
                      />
                      <div className="og-coming-soon-ribbon">COMING SOON</div>
                      <div className="og-card-art-fade"></div>
                    </div>
                    <div className="og-card-info">
                      <span className="og-card-tag">{game.tag}</span>
                      <span className="og-card-title">{game.title}</span>
                      <span className="og-card-desc">{game.desc}</span>
                    </div>
                  </div>
                ) : (
                  <a
                    key={idx}
                    href={game.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="og-game-card"
                    onClick={() => playSfx("clickSound")}
                  >
                    <div className="og-card-art">
                      <img
                        src={game.img}
                        alt={game.title}
                        onError={(e) => {
                          (e.target as HTMLElement).style.opacity = "0";
                        }}
                      />
                      <div className="og-card-art-fade"></div>
                    </div>
                    <div className="og-card-info">
                      <span className="og-card-tag">{game.tag}</span>
                      <span className="og-card-title">{game.title}</span>
                      <span className="og-card-desc">{game.desc}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* LANDSCAPE NOTICE */}
      <div id="landscapeNotice">
        <div className="ln-icon">
          <i className="fa-solid fa-mobile"></i>
        </div>
        <div className="ln-title">Putar Perangkatmu</div>
        <div className="ln-sub">Game ini optimal di mode landscape</div>
      </div>

      {/* AUDIO ELEMENTS */}
      <audio
        ref={bgMusicRef}
        id="bgMusic"
        src="/assets/music/Pixel_Panic.mp3"
        loop
        preload="auto"
      ></audio>
      <audio id="clickSound" src="/assets/audio/click.mp3" preload="auto"></audio>
      <audio id="countdownSound" src="/assets/audio/countdown.mp3" preload="auto"></audio>
    </>
  );
}