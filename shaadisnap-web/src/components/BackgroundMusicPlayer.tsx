"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Music, Disc3, ChevronDown, ChevronUp } from "lucide-react";

export const BackgroundMusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.45);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [userDismissedPrompt, setUserDismissedPrompt] = useState<boolean>(false);

  useEffect(() => {
    const audio = new Audio("/audio/heeriye.mp3");
    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = "auto";
    audioRef.current = audio;

    // Check saved mute preference
    try {
      const savedMute = localStorage.getItem("shaadisnap_music_muted");
      if (savedMute === "true") {
        audio.muted = true;
        setIsMuted(true);
      }
    } catch {
      // ignore
    }

    // Attempt autoplay if allowed by browser policies
    const tryAutoplay = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
        setHasInteracted(true);
      } catch {
        // Autoplay blocked by browser policy without user gesture:
        // Set up one-time listener on document for first user interaction (click/tap)
        setIsPlaying(false);
      }
    };

    tryAutoplay();

    // Browser policy: start audio on first user gesture anywhere on page
    const handleFirstGesture = async () => {
      const current = audioRef.current;
      if (!current) return;
      if (current.paused && !current.muted) {
        try {
          await current.play();
          setIsPlaying(true);
          setHasInteracted(true);
        } catch {
          // Keep gesture listener if still blocked
          return;
        }
      }
      cleanupGestureListeners();
    };

    const cleanupGestureListeners = () => {
      window.removeEventListener("click", handleFirstGesture);
      window.removeEventListener("touchstart", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };

    window.addEventListener("click", handleFirstGesture, { once: true });
    window.addEventListener("touchstart", handleFirstGesture, { once: true });
    window.addEventListener("keydown", handleFirstGesture, { once: true });

    // Global music event listener (e.g. from Navbar or Hero buttons)
    const handleGlobalToggle = () => {
      togglePlay();
    };
    window.addEventListener("shaadisnap_music_toggle", handleGlobalToggle);

    return () => {
      cleanupGestureListeners();
      window.removeEventListener("shaadisnap_music_toggle", handleGlobalToggle);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
        setHasInteracted(true);
      } catch (err) {
        console.warn("Audio playback failed:", err);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextMuted = !isMuted;
    audio.muted = nextMuted;
    setIsMuted(nextMuted);
    try {
      localStorage.setItem("shaadisnap_music_muted", String(nextMuted));
    } catch {
      // ignore
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) {
        audioRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  return (
    <aside
      aria-label="Wedding Soundtrack Player"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 transition-all duration-300 font-sans"
    >
      {/* Floating Bespoke Wedding Soundtrack Pill */}
      <div className="flex flex-col items-end gap-2">
        {/* Subtle One-Time Tap-To-Play Prompt if autoplay was blocked */}
        {!isPlaying && !hasInteracted && !userDismissedPrompt && (
          <div
            onClick={togglePlay}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#633C49] text-white shadow-lg cursor-pointer hover:bg-[#914C60] transition-all animate-bounce text-xs font-medium border border-white/20"
          >
            <Music className="w-3.5 h-3.5 text-[#F1D5D5] animate-pulse" />
            <span>Play &quot;Heeriye&quot; Soundtrack</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUserDismissedPrompt(true);
              }}
              className="text-white/60 hover:text-white text-xs ml-1 font-bold"
              aria-label="Dismiss prompt"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Glassmorphic Music Player Container */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-[#FFF8F3]/95 backdrop-blur-xl border border-[#A85D70]/30 shadow-[0_12px_36px_rgba(99,60,73,0.16)] hover:shadow-[0_16px_42px_rgba(99,60,73,0.22)] transition-all">
          {/* Spinning Miniature Vinyl Artwork */}
          <button
            type="button"
            onClick={togglePlay}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D70]"
            title={isPlaying ? "Pause Heeriye" : "Play Heeriye"}
            aria-label={isPlaying ? "Pause Heeriye" : "Play Heeriye"}
          >
            <img
              src="/hero-couple.jpg"
              alt="Heeriye — Wedding Track"
              className={`w-full h-full object-cover object-top ${
                isPlaying ? "animate-spin-slow" : ""
              }`}
            />
            {/* Center vinyl pinhole */}
            <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-[#633C49] border border-white" />
          </button>

          {/* Song Info & Equalizer */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex flex-col text-left cursor-pointer select-none max-w-[130px] sm:max-w-[170px]"
            title="Click to adjust volume"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xs sm:text-sm font-bold text-[#633C49] truncate">
                Heeriye
              </span>
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3 shrink-0">
                  <span className="w-0.5 h-2 bg-[#A85D70] rounded-full animate-music-bar-1" />
                  <span className="w-0.5 h-3 bg-[#A85D70] rounded-full animate-music-bar-2" />
                  <span className="w-0.5 h-1.5 bg-[#A85D70] rounded-full animate-music-bar-3" />
                </div>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-[#947A80] font-medium truncate">
              Jasleen Royal &amp; Arijit Singh
            </span>
          </div>

          {/* Controls: Play/Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#633C49] hover:bg-[#914C60] text-white flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            title={isPlaying ? "Pause" : "Play"}
            aria-label={isPlaying ? "Pause soundtrack" : "Play soundtrack"}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          {/* Controls: Mute/Unmute */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 sm:p-1.5 text-[#765D62] hover:text-[#633C49] transition-colors rounded-full hover:bg-white/60 cursor-pointer shrink-0"
            title={isMuted ? "Unmute" : "Mute"}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-red-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#A85D70]" />
            )}
          </button>

          {/* Expand / Collapse Volume Slider Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-[#947A80] hover:text-[#633C49] transition-colors rounded-full hidden sm:block cursor-pointer shrink-0"
            title={isExpanded ? "Collapse player" : "Show volume control"}
            aria-label={isExpanded ? "Collapse volume control" : "Show volume control"}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Expanded Volume Slider Drawer */}
        {isExpanded && (
          <div className="w-full max-w-[240px] px-4 py-2.5 rounded-2xl bg-[#FFF8F3]/95 backdrop-blur-xl border border-[#A85D70]/25 shadow-lg flex items-center gap-3 animate-fade-in">
            <Volume2 className="w-3.5 h-3.5 text-[#A85D70] shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1.5 bg-[#EADDE0] rounded-lg appearance-none cursor-pointer accent-[#A85D70]"
              aria-label="Volume slider"
            />
            <span className="text-[10px] font-semibold text-[#633C49] w-7 text-right shrink-0">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
