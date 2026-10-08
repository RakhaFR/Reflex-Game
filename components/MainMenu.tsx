"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { OG_GAMES, UPDATE_LOGS, GAME_GUIDE_STEPS, GameGuideStep } from "@/lib/gameData";
import { playSfx } from "@/lib/profile";
import { usePwaInstall } from "@/lib/pwa";
import PwaModal from "@/components/PwaModal";

export default function MainMenu() {
  const router = useRouter();
  const [isOtherGamesOpen, setIsOtherGamesOpen] = useState(false);
  const [isUpdateLogOpen, setIsUpdateLogOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const { isInstalled, triggerInstall } = usePwaInstall();

  useEffect(() => {
    // If returning from Google OAuth or password reset link, immediately redirect to lobby with profile identity open
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const isPendingOAuth = sessionStorage.getItem("reflex_pending_oauth") === "true";
      const isAuthRedirect =
        hash.includes("access_token") ||
        hash.includes("type=recovery") ||
        search.includes("code=") ||
        search.includes("openProfile=true") ||
        search.includes("openResetPassword=true") ||
        isPendingOAuth;

      if (isAuthRedirect) {
        if (isPendingOAuth) sessionStorage.removeItem("reflex_pending_oauth");
        const query = search ? (search.includes("openProfile") ? search : `${search}&openProfile=true`) : "?openProfile=true";
        router.replace(`/lobby${query}${hash}`);
        return;
      }

      // Check if first-time visitor to proactively show Game Guide
      const guideSeen = localStorage.getItem("rhg_guide_seen");
      if (!guideSeen) {
        setIsGuideOpen(true);
      }
    }

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

  const handleOpenGuide = () => {
    playSfx("clickSound");
    setGuideStep(0);
    setIsGuideOpen(true);
  };

  const handleCloseGuide = () => {
    playSfx("clickSound");
    try {
      localStorage.setItem("rhg_guide_seen", "true");
    } catch {
      // ignore
    }
    setIsGuideOpen(false);
  };

  const renderGuideSvg = (type: string) => {
    if (type === "lanes") {
      return (
        <svg viewBox="0 0 240 130" className="guide-card-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="130" rx="8" fill="#060814" />
          <line x1="60" y1="0" x2="60" y2="130" stroke="#ffffff" strokeWidth="0.5" opacity="0.12" />
          <line x1="120" y1="0" x2="120" y2="130" stroke="#ffffff" strokeWidth="0.5" opacity="0.12" />
          <line x1="180" y1="0" x2="180" y2="130" stroke="#ffffff" strokeWidth="0.5" opacity="0.12" />
          {/* Target Receptors */}
          <circle cx="30" cy="24" r="14" stroke="#ffffff" strokeWidth="2.5" fill="rgba(255,255,255,0.08)" />
          <text x="30" y="29" fill="#fff" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">Q</text>
          <circle cx="90" cy="24" r="14" stroke="#00f0ff" strokeWidth="2.5" fill="rgba(0,240,255,0.25)" />
          <text x="90" y="29" fill="#00f0ff" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">W</text>
          <circle cx="150" cy="24" r="14" stroke="#ffffff" strokeWidth="2.5" fill="rgba(255,255,255,0.08)" />
          <text x="150" y="29" fill="#fff" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">E</text>
          <circle cx="210" cy="24" r="14" stroke="#ffffff" strokeWidth="2.5" fill="rgba(255,255,255,0.08)" />
          <text x="210" y="29" fill="#fff" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">R</text>
          {/* Falling Notes */}
          <circle cx="30" cy="95" r="11" fill="#00ff88" filter="drop-shadow(0 0 6px #00ff88)" />
          <text x="30" y="99" fill="#000" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">Q</text>
          <circle cx="90" cy="24" r="11" fill="#00f0ff" filter="drop-shadow(0 0 8px #00f0ff)" />
          <text x="90" y="28" fill="#000" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">W</text>
          <circle cx="150" cy="65" r="11" fill="#ffe500" filter="drop-shadow(0 0 6px #ffe500)" />
          <text x="150" y="69" fill="#000" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">E</text>
          <circle cx="210" cy="105" r="11" fill="#ff4444" filter="drop-shadow(0 0 6px #ff4444)" />
          <text x="210" y="109" fill="#fff" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">!</text>
        </svg>
      );
    }
    if (type === "mascot") {
      return (
        <svg viewBox="0 0 240 130" className="guide-card-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="130" rx="8" fill="#060814" />
          <circle cx="70" cy="70" r="36" fill="#150a24" stroke="#ff2d78" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="170" cy="70" r="36" fill="#08182b" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="70" y="74" fill="#ff2d78" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">KAMIA</text>
          <text x="170" y="74" fill="#00f0ff" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">OCEAN</text>
          <rect x="40" y="18" width="60" height="20" rx="10" fill="#ff2d78" />
          <text x="70" y="32" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">PERFECT!!</text>
          <rect x="140" y="18" width="60" height="20" rx="10" fill="#00f0ff" />
          <text x="170" y="32" fill="#000" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">NICE BEAT!</text>
        </svg>
      );
    }
    if (type === "settings") {
      return (
        <svg viewBox="0 0 240 130" className="guide-card-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="130" rx="8" fill="#060814" />
          <rect x="16" y="20" width="46" height="36" rx="6" fill="#0e142b" stroke="#00f0ff" strokeWidth="1.5" />
          <text x="39" y="44" fill="#00f0ff" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">Q</text>
          <rect x="70" y="20" width="46" height="36" rx="6" fill="#0e142b" stroke="#00f0ff" strokeWidth="1.5" />
          <text x="93" y="44" fill="#00f0ff" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">W</text>
          <rect x="124" y="20" width="46" height="36" rx="6" fill="#0e142b" stroke="#00f0ff" strokeWidth="1.5" />
          <text x="147" y="44" fill="#00f0ff" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">↑</text>
          <rect x="178" y="20" width="46" height="36" rx="6" fill="#0e142b" stroke="#00f0ff" strokeWidth="1.5" />
          <text x="201" y="44" fill="#00f0ff" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">N1</text>
          <rect x="16" y="70" width="208" height="42" rx="6" fill="#090d1f" stroke="#1f2c4d" />
          <text x="28" y="88" fill="#00ffcc" fontSize="9" fontWeight="bold" fontFamily="Orbitron">KEYBOARDS &amp; NUMPAD READY</text>
          <text x="28" y="102" fill="rgba(255,255,255,0.5)" fontSize="8">UPSCROLL / DOWNSCROLL • 10 FONTS</text>
        </svg>
      );
    }
    if (type === "chat") {
      return (
        <svg viewBox="0 0 240 130" className="guide-card-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="240" height="130" rx="8" fill="#060814" />
          <rect x="20" y="20" width="200" height="38" rx="6" fill="#0e142b" stroke="#1a2744" />
          <circle cx="36" cy="39" r="10" fill="#ff2d78" />
          <text x="54" y="34" fill="#00f0ff" fontSize="8" fontWeight="bold" fontFamily="Orbitron">PlayerOne [Lv.42]</text>
          <text x="54" y="48" fill="#fff" fontSize="8">Siapa yang mau duel di track Pixel Panic?!</text>
          <rect x="20" y="68" width="200" height="38" rx="6" fill="#0e142b" stroke="#1a2744" />
          <circle cx="36" cy="87" r="10" fill="#00ff88" />
          <text x="54" y="82" fill="#ffe500" fontSize="8" fontWeight="bold" fontFamily="Orbitron">RhythmMaster [Lv.99]</text>
          <text x="54" y="96" fill="#fff" fontSize="8">Gaskeun bro! Baru cetak Perfect Combo tadi 🔥</text>
        </svg>
      );
    }
    // Leaderboard
    return (
      <svg viewBox="0 0 240 130" className="guide-card-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="240" height="130" rx="8" fill="#060814" />
        <rect x="30" y="55" width="50" height="55" rx="4" fill="#12182b" stroke="#00f0ff" strokeWidth="1" />
        <text x="55" y="85" fill="#00f0ff" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">#2</text>
        <rect x="95" y="35" width="50" height="75" rx="4" fill="#1c182b" stroke="#ffe500" strokeWidth="1.5" />
        <text x="120" y="70" fill="#ffe500" fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">👑#1</text>
        <rect x="160" y="65" width="50" height="45" rx="4" fill="#12182b" stroke="#ff2d78" strokeWidth="1" />
        <text x="185" y="90" fill="#ff2d78" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">#3</text>
        <text x="120" y="24" fill="#00ffcc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="Orbitron">GLOBAL 4-TAB RANKING</text>
      </svg>
    );
  };

  return (
    <>
      {/* BACKGROUND LIVE2D VIDEO FOR MAIN MENU */}
      <div className="menu-video-bg">
        <video autoPlay loop muted playsInline>
          <source src="https://yznaoalbsrgaithstpxv.supabase.co/storage/v1/object/public/game-lobby/lobby.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay"></div>
      </div>

      {/* MAIN INTERFACE LAYOUT */}
      <main className="menu-layout">
        {/* BRANDING TITLE */}
        <header className="menu-header">
          <div className="brand-box">
            <span className="splash-text">BETA BUILD!</span>
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

            {!isInstalled && (
              <button
                onClick={async () => {
                  playSfx("clickSound");
                  const res = await triggerInstall();
                  if (res === "ios" || res === "unsupported") {
                    setIsPwaModalOpen(true);
                  }
                }}
                className="menu-btn btn-utility btn-cyan"
                id="btnMainInstallPwa"
                type="button"
              >
                <div className="btn-skew-inner">
                  <span className="btn-icon">
                    <i className="fa-solid fa-download"></i>
                  </span>
                  <span className="btn-text">INSTALL APP</span>
                </div>
              </button>
            )}

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

      {/* FULLSCREEN QUICK SHORTCUT BUTTON (Hidden when installed as PWA) */}
      {!isInstalled && (
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
      )}

      {/* GUIDE PLAY BUTTON (TOP-LEFT) */}
      <button
        onClick={handleOpenGuide}
        className="guide-play-trigger"
        id="btnGuidePlay"
        type="button"
        title="Game Guide & Tutorial"
      >
        <i className="fa-solid fa-circle-question"></i>
        <span>GUIDE PLAY</span>
      </button>

      {/* UPDATE LOG BUTTON (TOP-RIGHT) */}
      <button
        onClick={handleOpenUpdateLog}
        className="update-log-trigger"
        id="btnUpdateLog"
        type="button"
      >
        <i className="fa-solid fa-file-lines"></i>
        <span>UPDATE LOG</span>
      </button>

      {/* GAME GUIDE MODAL (5-STEP ONBOARDING) */}
      <div
        id="gameGuideModal"
        className={`popup-overlay-menu ${isGuideOpen ? "active" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseGuide();
        }}
      >
        <div className="popup-box-skew guide-modal-box">
          <div className="popup-header-row">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 className="popup-box-title">[?] GAME PLAYBOOK &amp; GUIDE</h3>
              <span className="guide-step-pill">
                STEP {guideStep + 1} / {GAME_GUIDE_STEPS.length}
              </span>
            </div>
            <button
              onClick={handleCloseGuide}
              className="popup-close-btn"
              id="btnCloseGuide"
              type="button"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {GAME_GUIDE_STEPS[guideStep] && (
            <div className="popup-body-content guide-modal-body">
              <div className="guide-slide-header">
                <div className="guide-slide-tag">{GAME_GUIDE_STEPS[guideStep].tag}</div>
                <h2 className="guide-slide-title">
                  <i className={`fa-solid ${GAME_GUIDE_STEPS[guideStep].icon} mr-2`}></i>
                  {GAME_GUIDE_STEPS[guideStep].title}
                </h2>
                <p className="guide-slide-sub">// {GAME_GUIDE_STEPS[guideStep].subtitle}</p>
              </div>

              <div className="guide-slide-grid">
                <div className="guide-slide-visual">
                  {renderGuideSvg(GAME_GUIDE_STEPS[guideStep].svgType)}
                </div>

                <div className="guide-slide-points">
                  {GAME_GUIDE_STEPS[guideStep].points.map((pt, pIdx) => (
                    <div className="guide-point-card" key={pIdx}>
                      <div className="guide-point-num">{pIdx + 1}</div>
                      <div className="guide-point-content">
                        <div className="guide-point-title">{pt.title}</div>
                        <div className="guide-point-desc">{pt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guide Pagination & Controls */}
              <div className="guide-modal-footer">
                <div className="guide-dots-indicator">
                  {GAME_GUIDE_STEPS.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`guide-dot ${guideStep === idx ? "active" : ""}`}
                      onClick={() => {
                        playSfx("clickSound");
                        setGuideStep(idx);
                      }}
                      title={`Step ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="guide-nav-buttons">
                  {guideStep > 0 && (
                    <button
                      type="button"
                      className="guide-btn-prev"
                      onClick={() => {
                        playSfx("clickSound");
                        setGuideStep((s) => Math.max(0, s - 1));
                      }}
                    >
                      <i className="fa-solid fa-chevron-left mr-1"></i> Sebelumnya
                    </button>
                  )}

                  {guideStep < GAME_GUIDE_STEPS.length - 1 ? (
                    <button
                      type="button"
                      className="guide-btn-next"
                      onClick={() => {
                        playSfx("clickSound");
                        setGuideStep((s) => Math.min(GAME_GUIDE_STEPS.length - 1, s + 1));
                      }}
                    >
                      Selanjutnya <i className="fa-solid fa-chevron-right ml-1"></i>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="guide-btn-start"
                      onClick={handleCloseGuide}
                    >
                      <i className="fa-solid fa-play mr-1"></i> Selesai &amp; Main
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="popup-body-content" id="updateLogContent">
            <div className="log-version-container">
              {UPDATE_LOGS.map((log, idx) => (
                <div key={idx}>
                  {log.stageDivider && (
                    <div className="log-stage-divider">
                      <span>{log.stageDivider}</span>
                    </div>
                  )}
                  <div className="log-version-item">
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
              <i className="fa-solid fa-xmark"></i>
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

      {/* PWA INSTALL GUIDANCE MODAL */}
      <PwaModal isOpen={isPwaModalOpen} onClose={() => setIsPwaModalOpen(false)} />

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
        src="https://yznaoalbsrgaithstpxv.supabase.co/storage/v1/object/public/game-music/Pixel_Panic.mp3"
        loop
        preload="auto"
      ></audio>
      <audio id="clickSound" src="/assets/audio/click.mp3" preload="auto"></audio>
      <audio id="countdownSound" src="/assets/audio/countdown.mp3" preload="auto"></audio>
    </>
  );
}