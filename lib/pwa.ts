"use client";

import { useState, useEffect } from "react";

// Global storage for beforeinstallprompt event so it persists across Next.js page navigations
let globalDeferredPrompt: any = null;
let promptListenersInitialized = false;

export function initGlobalPwaListeners() {
  if (typeof window === "undefined" || promptListenersInitialized) return;
  promptListenersInitialized = true;

  // Register Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          // SW registered
        })
        .catch(() => {
          // SW registration failed silently
        });
    });
  }

  // Listen for beforeinstallprompt
  window.addEventListener("beforeinstallprompt", (e: any) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.dispatchEvent(new CustomEvent("pwa-prompt-ready"));
  });

  // Listen for appinstalled
  window.addEventListener("appinstalled", () => {
    globalDeferredPrompt = null;
    try {
      localStorage.setItem("reflex_pwa_installed", "true");
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("pwa-installed"));
  });
}

export function isPwaInstalled(): boolean {
  if (typeof window === "undefined") return false;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes("android-app://");

  if (isStandalone) {
    try {
      localStorage.setItem("reflex_pwa_installed", "true");
    } catch {
      // ignore
    }
    return true;
  }

  try {
    if (localStorage.getItem("reflex_pwa_installed") === "true") {
      // If marked installed, verify if it is indeed running standalone or browser
      return isStandalone;
    }
  } catch {
    // ignore
  }

  return false;
}

export function usePwaInstall() {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [canPromptDirectly, setCanPromptDirectly] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    initGlobalPwaListeners();

    const checkStatus = () => {
      const installed = isPwaInstalled();
      setIsInstalled(installed);
      setCanPromptDirectly(!!globalDeferredPrompt);

      const ua = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(ua);
      setIsIos(isIosDevice);
    };

    checkStatus();

    const handlePromptReady = () => {
      setCanPromptDirectly(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setCanPromptDirectly(false);
    };

    window.addEventListener("pwa-prompt-ready", handlePromptReady);
    window.addEventListener("pwa-installed", handleInstalled);

    return () => {
      window.removeEventListener("pwa-prompt-ready", handlePromptReady);
      window.removeEventListener("pwa-installed", handleInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<"prompted" | "accepted" | "dismissed" | "ios" | "installed" | "unsupported"> => {
    if (isPwaInstalled()) {
      setIsInstalled(true);
      return "installed";
    }

    if (globalDeferredPrompt) {
      try {
        const promptEvent = globalDeferredPrompt;
        globalDeferredPrompt = null;
        setCanPromptDirectly(false);
        promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === "accepted") {
          setIsInstalled(true);
          try {
            localStorage.setItem("reflex_pwa_installed", "true");
          } catch {
            // ignore
          }
          return "accepted";
        }
        return "dismissed";
      } catch {
        return "unsupported";
      }
    }

    if (isIos) {
      return "ios";
    }

    return "unsupported";
  };

  return {
    isInstalled,
    canPromptDirectly,
    isIos,
    triggerInstall,
  };
}
