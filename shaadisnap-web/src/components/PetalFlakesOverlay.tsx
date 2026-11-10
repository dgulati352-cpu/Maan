"use client";

import React, { useEffect, useState } from "react";

interface PetalItem {
  id: number;
  left: number; // percentage 0 - 100
  size: number; // width in px
  duration: number; // seconds
  delay: number; // negative seconds for immediate in-flight petals
  swayAmp: number; // horizontal sway distance in px
  swayDuration: number; // sway cycle seconds
  opacity: number;
  rotation: number; // initial degree
  type: "rose" | "blush" | "gold" | "crimson";
}

export const PetalFlakesOverlay: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [petals, setPetals] = useState<PetalItem[]>([]);

  useEffect(() => {
    // Generate deterministic yet randomized petal trajectories on client mount
    const count = 28;
    const types: ("rose" | "blush" | "gold" | "crimson")[] = [
      "rose",
      "blush",
      "gold",
      "crimson",
    ];

    const generated: PetalItem[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.round(((i * 3.65 + 1.5) % 96) + 2),
      size: 14 + (i % 5) * 3, // 14px to 26px
      duration: 9 + (i % 7) * 1.5, // 9s to 18s gentle floating speed
      delay: -((i * 1.7) % 15), // negative delay so petals are already mid-flight on first load
      swayAmp: 25 + (i % 4) * 18, // 25px to 79px sway
      swayDuration: 3 + (i % 3) * 1.2,
      opacity: 0.45 + (i % 5) * 0.1, // 0.45 to 0.85
      rotation: (i * 47) % 360,
      type: types[i % types.length],
    }));

    setPetals(generated);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none"
      style={{ perspective: "1000px" }}
    >
      <style jsx global>{`
        @keyframes luxuryPetalFall {
          0% {
            transform: translate3d(0, -40px, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--petal-opacity, 0.7);
          }
          90% {
            opacity: var(--petal-opacity, 0.7);
          }
          100% {
            transform: translate3d(var(--sway-x, 30px), 108vh, 0) rotate(var(--rot-end, 360deg));
            opacity: 0;
          }
        }

        @keyframes luxuryPetalFlutter {
          0%, 100% {
            transform: rotateY(0deg) rotateX(0deg) scale(1);
          }
          25% {
            transform: rotateY(55deg) rotateX(30deg) scale(0.92);
          }
          50% {
            transform: rotateY(180deg) rotateX(60deg) scale(1.05);
          }
          75% {
            transform: rotateY(290deg) rotateX(25deg) scale(0.95);
          }
        }

        .luxury-petal {
          position: absolute;
          top: -40px;
          will-change: transform, opacity;
          animation-name: luxuryPetalFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .luxury-petal-inner {
          will-change: transform;
          animation-name: luxuryPetalFlutter;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>

      {petals.map((p) => {
        // Luxury palette colors
        const colors = {
          rose: {
            fill: "url(#rose-grad)",
            stroke: "rgba(168, 93, 112, 0.3)",
          },
          blush: {
            fill: "url(#blush-grad)",
            stroke: "rgba(241, 213, 213, 0.4)",
          },
          gold: {
            fill: "url(#gold-grad)",
            stroke: "rgba(217, 183, 160, 0.35)",
          },
          crimson: {
            fill: "url(#crimson-grad)",
            stroke: "rgba(99, 60, 73, 0.25)",
          },
        }[p.type];

        return (
          <div
            key={p.id}
            className="luxury-petal"
            style={
              {
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size * 1.3}px`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                "--sway-x": `${p.swayAmp * (p.id % 2 === 0 ? 1 : -1)}px`,
                "--rot-end": `${p.rotation + 360}deg`,
                "--petal-opacity": p.opacity,
              } as React.CSSProperties
            }
          >
            <div
              className="luxury-petal-inner w-full h-full"
              style={{
                animationDuration: `${p.swayDuration}s`,
                animationDelay: `${p.delay * 0.5}s`,
              }}
            >
              <svg
                viewBox="0 0 30 38"
                className="w-full h-full drop-shadow-[0_2px_4px_rgba(99,60,73,0.12)]"
              >
                <defs>
                  {/* Rose Champagne Palette Gradients */}
                  <linearGradient id="rose-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E892A2" stopOpacity="0.85" />
                    <stop offset="70%" stopColor="#A85D70" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#914C60" stopOpacity="0.65" />
                  </linearGradient>

                  <linearGradient id="blush-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF0EB" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#F1D5D5" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#E5B9BA" stopOpacity="0.7" />
                  </linearGradient>

                  <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE6B8" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#D9B7A0" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#C49B7F" stopOpacity="0.7" />
                  </linearGradient>

                  <linearGradient id="crimson-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A85D70" stopOpacity="0.8" />
                    <stop offset="75%" stopColor="#633C49" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#4A2834" stopOpacity="0.65" />
                  </linearGradient>
                </defs>

                {/* Curved Organic Rose Petal Silhouette */}
                <path
                  d="M15 1 C21 3, 29 10, 29 20 C29 29, 21 37, 15 37 C9 37, 1 29, 1 20 C1 10, 9 3, 15 1 Z"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="0.5"
                />

                {/* Delicate Central Leaf / Petal Vein Accent */}
                <path
                  d="M15 6 Q16 19 15 33"
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="0.75"
                  fill="none"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};
