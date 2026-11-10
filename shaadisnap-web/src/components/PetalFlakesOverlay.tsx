"use client";

import React, { useEffect, useState } from "react";

interface RosePetalItem {
  id: number;
  left: number; // percentage 0 - 100
  size: number; // width in px
  duration: number; // seconds
  delay: number; // negative seconds for immediate in-flight petals
  swayAmp: number; // horizontal sway distance in px
  swayDuration: number; // sway cycle seconds
  opacity: number;
  rotation: number; // initial degree
  shapeVariant: 0 | 1 | 2;
  shadeVariant: "royal-red" | "velvet-crimson" | "deep-scarlet" | "ruby-rose";
}

export const PetalFlakesOverlay: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [petals, setPetals] = useState<RosePetalItem[]>([]);

  useEffect(() => {
    // Generate deterministic rose petal shower trajectories
    const count = 30;
    const shades: RosePetalItem["shadeVariant"][] = [
      "royal-red",
      "velvet-crimson",
      "deep-scarlet",
      "ruby-rose",
    ];

    const generated: RosePetalItem[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.round(((i * 3.4 + 1.2) % 96) + 2),
      size: 18 + (i % 5) * 3.5, // 18px to 32px realistic rose petal size
      duration: 8.5 + (i % 6) * 1.5, // 8.5s to 16s gentle floating speed
      delay: -((i * 1.6) % 14), // negative delay so petals are already mid-flight on first load
      swayAmp: 28 + (i % 4) * 16, // 28px to 76px sway
      swayDuration: 2.8 + (i % 3) * 1.1,
      opacity: 0.65 + (i % 4) * 0.09, // 0.65 to 0.92 rich velvety opacity
      rotation: (i * 53) % 360,
      shapeVariant: (i % 3) as 0 | 1 | 2,
      shadeVariant: shades[i % shades.length],
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
        @keyframes rosePetalFall {
          0% {
            transform: translate3d(0, -45px, 0) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: var(--petal-opacity, 0.85);
          }
          92% {
            opacity: var(--petal-opacity, 0.85);
          }
          100% {
            transform: translate3d(var(--sway-x, 32px), 108vh, 0) rotate(var(--rot-end, 360deg));
            opacity: 0;
          }
        }

        @keyframes rosePetalFlutter {
          0%, 100% {
            transform: rotateY(0deg) rotateX(0deg) rotateZ(0deg) scale(1);
          }
          25% {
            transform: rotateY(65deg) rotateX(35deg) rotateZ(15deg) scale(0.92);
          }
          50% {
            transform: rotateY(180deg) rotateX(60deg) rotateZ(-10deg) scale(1.04);
          }
          75% {
            transform: rotateY(285deg) rotateX(30deg) rotateZ(20deg) scale(0.95);
          }
        }

        .rose-petal {
          position: absolute;
          top: -45px;
          will-change: transform, opacity;
          animation-name: rosePetalFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .rose-petal-inner {
          will-change: transform;
          animation-name: rosePetalFlutter;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>

      {/* SVG Definitions for Authentic Red Rose Petal Gradients & Shading */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* 1. Royal Red Rose (Vibrant Wedding Red) */}
          <linearGradient id="rose-royal-red" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#E63956" />
            <stop offset="45%" stopColor="#C41E3A" />
            <stop offset="85%" stopColor="#8F1027" />
            <stop offset="100%" stopColor="#5E0818" />
          </linearGradient>

          {/* 2. Velvet Crimson (Deep Indian Gulab) */}
          <linearGradient id="rose-velvet-crimson" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#D92344" />
            <stop offset="50%" stopColor="#A8132B" />
            <stop offset="85%" stopColor="#780D1E" />
            <stop offset="100%" stopColor="#4A0512" />
          </linearGradient>

          {/* 3. Deep Scarlet (Lustrous Rose Petal) */}
          <linearGradient id="rose-deep-scarlet" x1="10%" y1="5%" x2="90%" y2="95%">
            <stop offset="0%" stopColor="#F04364" />
            <stop offset="40%" stopColor="#B81432" />
            <stop offset="80%" stopColor="#850B20" />
            <stop offset="100%" stopColor="#520513" />
          </linearGradient>

          {/* 4. Ruby Rose (Bright Wedding Petal Highlight) */}
          <linearGradient id="rose-ruby-rose" x1="25%" y1="0%" x2="75%" y2="100%">
            <stop offset="0%" stopColor="#FF4D6D" />
            <stop offset="50%" stopColor="#C9184A" />
            <stop offset="85%" stopColor="#800F2F" />
            <stop offset="100%" stopColor="#590D22" />
          </linearGradient>
        </defs>
      </svg>

      {petals.map((p) => {
        const fillId = {
          "royal-red": "url(#rose-royal-red)",
          "velvet-crimson": "url(#rose-velvet-crimson)",
          "deep-scarlet": "url(#rose-deep-scarlet)",
          "ruby-rose": "url(#rose-ruby-rose)",
        }[p.shadeVariant];

        return (
          <div
            key={p.id}
            className="rose-petal"
            style={
              {
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size * 1.25}px`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                "--sway-x": `${p.swayAmp * (p.id % 2 === 0 ? 1 : -1)}px`,
                "--rot-end": `${p.rotation + (p.id % 2 === 0 ? 360 : -360)}deg`,
                "--petal-opacity": p.opacity,
              } as React.CSSProperties
            }
          >
            <div
              className="rose-petal-inner w-full h-full"
              style={{
                animationDuration: `${p.swayDuration}s`,
                animationDelay: `${p.delay * 0.6}s`,
              }}
            >
              {/* Variant 0: Full Heart-Cupped Authentic Rose Petal */}
              {p.shapeVariant === 0 && (
                <svg
                  viewBox="0 0 32 38"
                  className="w-full h-full drop-shadow-[0_2px_5px_rgba(94,8,24,0.32)]"
                >
                  <path
                    d="M16 2.5 C20 0.5, 29 3, 31 14 C32.5 23, 25 33, 16 37 C7 33, -0.5 23, 1 14 C3 3, 12 0.5, 16 2.5 Z"
                    fill={fillId}
                    stroke="rgba(255, 120, 140, 0.35)"
                    strokeWidth="0.6"
                  />
                  {/* Subtle Curved Petal Highlight & Shadow Vein */}
                  <path
                    d="M16 6 Q18 20 16 34"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M10 13 Q16 19 22 13"
                    stroke="rgba(255, 180, 200, 0.22)"
                    strokeWidth="0.6"
                    fill="none"
                  />
                </svg>
              )}

              {/* Variant 1: Gently Curved / Fluttering Rose Petal */}
              {p.shapeVariant === 1 && (
                <svg
                  viewBox="0 0 30 38"
                  className="w-full h-full drop-shadow-[0_2px_5px_rgba(94,8,24,0.32)]"
                >
                  <path
                    d="M14 2 C21 1, 28 6, 29 16 C30 26, 22 34, 15 37 C8 35, 1 27, 1 17 C1 7, 7 3, 14 2 Z"
                    fill={fillId}
                    stroke="rgba(255, 120, 140, 0.35)"
                    strokeWidth="0.6"
                  />
                  {/* Natural Rose Petal Curled Edge Accent */}
                  <path
                    d="M14 5 C17 14, 17 25, 14 34"
                    stroke="rgba(255, 255, 255, 0.32)"
                    strokeWidth="0.75"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              )}

              {/* Variant 2: Delicate Inner Rose Bud Petal */}
              {p.shapeVariant === 2 && (
                <svg
                  viewBox="0 0 28 36"
                  className="w-full h-full drop-shadow-[0_2px_5px_rgba(94,8,24,0.32)]"
                >
                  <path
                    d="M14 1 C19 0.5, 27 5, 27 15 C27 24, 20 32, 14 35 C8 32, 1 24, 1 15 C1 5, 9 0.5, 14 1 Z"
                    fill={fillId}
                    stroke="rgba(255, 120, 140, 0.35)"
                    strokeWidth="0.6"
                  />
                  <path
                    d="M14 4 Q15 18 14 31"
                    stroke="rgba(255, 255, 255, 0.28)"
                    strokeWidth="0.7"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
