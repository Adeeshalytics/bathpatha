"use client";

import { useEffect, useRef, useState } from "react";
import { RiceLoader } from "./rice-loader";

/**
 * Full-screen branded loader that fades in when `visible` becomes true and
 * fades out smoothly when it becomes false, then unmounts — so there are no
 * abrupt visual changes between the loader and the destination screen.
 *
 * For splash + authentication only.
 */
export function RiceLoaderOverlay({
  visible,
  label,
  duration,
  showWordmark = true,
}: {
  visible: boolean;
  label?: string;
  duration?: number;
  showWordmark?: boolean;
}) {
  // Stay mounted through the fade-out, then remove from the tree.
  const [rendered, setRendered] = useState(visible);
  const [shown, setShown] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (exitTimer.current) clearTimeout(exitTimer.current);
      setRendered(true);
      // Next frame -> trigger the fade-in transition.
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    exitTimer.current = setTimeout(() => setRendered(false), 400);
    return () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [visible]);

  if (!rendered) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-[400ms] ease-out"
      style={{
        opacity: shown ? 1 : 0,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <RiceLoader label={label} duration={duration} showWordmark={showWordmark} />
    </div>
  );
}
