"use client";

import { cn } from "@/lib/utils";

/**
 * Bathpatha "Rice Filling" branded loader.
 *
 * The Sinhala letter "බ" starts as an empty white outline; soft white rice
 * rises from the bottom to fill it, settles with a gentle ease, the crisp
 * finished logo pops in, and small steam puffs drift up — conveying the warmth
 * of freshly served rice. Loops seamlessly (~2–3s) while work is in progress.
 *
 * Faithful, dependency-free reimplementation of the "Bathpatha Loader" design
 * candidate, built from the live brand glyph + CSS so it stays lightweight
 * (no image assets), renders at 60fps, and honours prefers-reduced-motion.
 *
 * Use ONLY for the splash screen and authentication flows — never for
 * in-app data loading, page transitions, lists, or skeletons.
 */
export function RiceLoader({
  size = 224,
  duration = 3.4,
  showWordmark = true,
  showSteam = true,
  label = "බත්පත loading",
  className,
}: {
  /** Icon edge length in px. */
  size?: number;
  /** Loop duration in seconds (~2–3s recommended). */
  duration?: number;
  showWordmark?: boolean;
  showSteam?: boolean;
  /** Accessible label announced to screen readers. */
  label?: string;
  className?: string;
}) {
  // Glyph fills most of the rounded-square icon.
  const glyphSize = Math.round(size * 0.6);

  // Shared styling for the three stacked glyph layers so they align exactly.
  const glyphLayer: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    fontFamily: "var(--font-sinhala), system-ui, sans-serif",
    fontWeight: 700,
    fontSize: `${glyphSize}px`,
    lineHeight: 1,
    userSelect: "none",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("flex flex-col items-center gap-7", className)}
      style={{ ["--bp-dur" as string]: `${duration}s` }}
    >
      <div
        className="bp-reduced-fade"
        style={{ position: "relative", width: size, height: size }}
      >
        {/* soft ground shadow for depth */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "-6%",
            width: "78%",
            height: "16%",
            transform: "translateX(-50%)",
            background:
              "radial-gradient(ellipse at center, rgba(210,120,40,.28), rgba(210,120,40,0) 70%)",
            filter: "blur(6px)",
          }}
        />

        {/* icon body */}
        <div
          className="bp-pop"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "22.5%",
            overflow: "hidden",
            background:
              "linear-gradient(152deg,#F6911F 0%,#EF7E1A 56%,#E8731A 100%)",
            boxShadow:
              "0 22px 48px rgba(226,112,26,.34), 0 6px 16px rgba(120,50,0,.16), inset 0 1px 0 rgba(255,255,255,.28)",
          }}
        >
          {/* top gloss */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(120% 80% at 30% -10%, rgba(255,255,255,.30), rgba(255,255,255,0) 55%)",
              pointerEvents: "none",
            }}
          />

          {/* empty container: letter outline */}
          <div
            className="bp-outline"
            aria-hidden
            style={{
              ...glyphLayer,
              color: "transparent",
              WebkitTextStroke: `${Math.max(2, size * 0.011)}px rgba(255,255,255,.92)`,
            }}
          >
            බ
          </div>

          {/* rice fill — the same glyph in warm white, revealed bottom -> top */}
          <div
            className="bp-fill"
            aria-hidden
            style={{
              ...glyphLayer,
              color: "#FDFBF6",
            }}
          >
            බ
            {/* freshly-cooked sheen sweeping up with the fill */}
            <div
              className="bp-sheen"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 30%)",
                mixBlendMode: "screen",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* crisp final white letter */}
          <div
            className="bp-solid"
            aria-hidden
            style={{ ...glyphLayer, color: "#FFFFFF" }}
          >
            බ
          </div>

          {/* steam puffs over the finished rice */}
          {showSteam && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "44%",
                top: "8%",
                width: "42%",
                height: "42%",
                pointerEvents: "none",
              }}
            >
              <div
                className="bp-steam1"
                style={{
                  position: "absolute",
                  left: "26%",
                  top: "60%",
                  width: "40%",
                  height: "40%",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 50% 45%, rgba(255,255,255,.9), rgba(255,255,255,0) 68%)",
                  filter: "blur(3px)",
                }}
              />
              <div
                className="bp-steam2"
                style={{
                  position: "absolute",
                  left: "54%",
                  top: "64%",
                  width: "34%",
                  height: "34%",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 50% 45%, rgba(255,255,255,.85), rgba(255,255,255,0) 68%)",
                  filter: "blur(3px)",
                }}
              />
              <div
                className="bp-steam3"
                style={{
                  position: "absolute",
                  left: "8%",
                  top: "66%",
                  width: "30%",
                  height: "30%",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 50% 45%, rgba(255,255,255,.8), rgba(255,255,255,0) 68%)",
                  filter: "blur(3px)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {showWordmark && (
        <div className="flex flex-col items-center gap-3.5">
          <div
            style={{
              fontFamily: "var(--font-sinhala), sans-serif",
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: ".5px",
              color: "#E8731A",
            }}
          >
            බත්පත
          </div>
          <div className="flex gap-[7px]">
            <span
              className="bp-dot"
              style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF7E1A" }}
            />
            <span
              className="bp-dot"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#EF7E1A",
                animationDelay: ".18s",
              }}
            />
            <span
              className="bp-dot"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#EF7E1A",
                animationDelay: ".36s",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
