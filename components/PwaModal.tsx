"use client";

import { usePwaInstall } from "@/lib/pwa";
import { playSfx } from "@/lib/profile";

interface PwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PwaModal({ isOpen, onClose }: PwaModalProps) {
  const { isInstalled, isIos, canPromptDirectly, triggerInstall } = usePwaInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    playSfx("clickSound");
    const res = await triggerInstall();
    if (res === "accepted" || res === "installed") {
      onClose();
    }
  };

  return (
    <div
      className="popup-overlay-menu active"
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSfx("clickSound");
          onClose();
        }
      }}
    >
      <div className="popup-box-skew pwa-modal-box" style={{ maxWidth: "480px", width: "92%" }}>
        <div className="popup-header-row">
          <h3 className="popup-box-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fa-solid fa-download text-[#00f0ff]"></i>
            <span>INSTALL REFLEXRHYTHM</span>
          </h3>
          <button
            onClick={() => {
              playSfx("clickSound");
              onClose();
            }}
            className="popup-close-btn"
            type="button"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="popup-body-content" style={{ padding: "20px" }}>
          {isInstalled ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: "40px", color: "#00ff88", marginBottom: "12px" }}>
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <h4 style={{ color: "#fff", fontFamily: "Orbitron", fontSize: "16px", marginBottom: "8px" }}>
                APLIKASI SUDAH TERPASANG
              </h4>
              <p style={{ color: "#aaa", fontSize: "13px" }}>
                ReflexRHYTHM sudah terpasang di perangkatmu. Kamu bisa membukanya langsung dari Home Screen atau App Drawer!
              </p>
            </div>
          ) : isIos ? (
            <div>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "36px", color: "#00e5ff", marginBottom: "8px" }}>
                  <i className="fa-brands fa-apple"></i>
                </div>
                <h4 style={{ color: "#fff", fontFamily: "Orbitron", fontSize: "15px" }}>
                  CARA INSTALL DI IOS / SAFARI
                </h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#ccc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(0,229,255,0.2)" }}>
                  <span style={{ background: "#00e5ff", color: "#000", fontWeight: "bold", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>1</span>
                  <span>Tekan tombol <strong>Share</strong> <i className="fa-solid fa-arrow-up-from-bracket" style={{ color: "#00e5ff", margin: "0 4px" }}></i> di menu bawah Safari.</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(0,229,255,0.2)" }}>
                  <span style={{ background: "#00e5ff", color: "#000", fontWeight: "bold", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>2</span>
                  <span>Gulir ke bawah dan pilih <strong>&quot;Add to Home Screen&quot;</strong> <i className="fa-solid fa-square-plus" style={{ color: "#00e5ff", margin: "0 4px" }}></i>.</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(0,229,255,0.2)" }}>
                  <span style={{ background: "#00e5ff", color: "#000", fontWeight: "bold", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>3</span>
                  <span>Tekan <strong>&quot;Add&quot;</strong> di pojok kanan atas untuk menyelesaikan!</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "36px", color: "#00e5ff", marginBottom: "8px" }}>
                  <i className="fa-solid fa-mobile-screen-button"></i>
                </div>
                <h4 style={{ color: "#fff", fontFamily: "Orbitron", fontSize: "15px" }}>
                  NIKMATI PENGALAMAN NATIVE FULLSCREEN
                </h4>
                <p style={{ color: "#aaa", fontSize: "13px", marginTop: "6px" }}>
                  Mainkan ReflexRHYTHM dengan performa maksimal, tanpa address bar browser, dan respons ketukan lebih cepat.
                </p>
              </div>

              {canPromptDirectly ? (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #00f0ff 0%, #0099cc 100%)",
                    color: "#000",
                    fontWeight: "900",
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "14px",
                    letterSpacing: "1px",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "2px solid #00f0ff",
                    boxShadow: "0 0 16px rgba(0,240,255,0.4)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  <i className="fa-solid fa-download"></i>
                  <span>INSTALL SEKARANG</span>
                </button>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(0,229,255,0.2)", fontSize: "13px", color: "#ccc" }}>
                  <p style={{ marginBottom: "8px" }}>
                    <i className="fa-solid fa-circle-info text-[#00f0ff] mr-2"></i>
                    Buka menu browser Anda lalu pilih <strong>&quot;Install App&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => {
                playSfx("clickSound");
                onClose();
              }}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "8px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "Orbitron, sans-serif",
                fontSize: "12px",
              }}
            >
              <i className="fa-solid fa-xmark mr-1"></i> TUTUP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
