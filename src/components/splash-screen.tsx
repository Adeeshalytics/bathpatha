"use client";

import { useEffect, useState } from "react";
import { RiceLoaderOverlay } from "./rice-loader-overlay";

const SESSION_FLAG = "bp-splash-shown";
// One relaxed loop so users see the rice settle + steam before the app appears.
const SPLASH_MS = 2600;
const REDUCED_MS = 900;

/**
 * Initial-app-launch splash. Shows the branded Rice Filling loader once per
 * app launch (guarded by sessionStorage so in-session reloads of inner pages
 * don't re-trigger it), then fades out into the app.
 *
 * Mounted at the root so it covers the very first paint; it is purely an
 * overlay and never blocks routing or data loading underneath.
 */
export function SplashScreen() {
  // Assume shown (no splash) during SSR/first render to avoid a flash, then
  // decide on the client where sessionStorage is available.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_FLAG) === "1";
    } catch {
      // sessionStorage unavailable (e.g. privacy mode) — show splash anyway.
    }
    if (alreadyShown) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(SESSION_FLAG, "1");
      } catch {
        /* ignore */
      }
    }, reduced ? REDUCED_MS : SPLASH_MS);

    return () => clearTimeout(t);
  }, []);

  return <RiceLoaderOverlay visible={visible} label="බත්පත starting" />;
}
