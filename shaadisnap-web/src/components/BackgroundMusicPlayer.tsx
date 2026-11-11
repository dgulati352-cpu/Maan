"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Music, Play, Pause, Volume2, VolumeX, Sparkles, X, ChevronUp } from "lucide-react";

export const MUSIC_EVENT_TOGGLE = "shaadisnap_toggle_music";
export const MUSIC_EVENT_STATE = "shaadisnap_music_state";

const AUDIO_SRC_LOCAL = "/audio/heeriye.mp3";
const AUDIO_SRC_FALLBACK = "https://raw.githubusercontent.com/vishakha-singhal01/arijitsingh-music/main/Heeriye.mp3";
const STORAGE_KEY_MUSIC_MUTED = "shaadisnap_music_muted";
const DEFAULT_VOLUME = 0.4;

export const BackgroundMusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(DEFAULT_VOLUME);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<boolean>(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  // Broadcast state changes for Navbar and other components
  const broadcastState = useCallback((playing: boolean, muted: boolean) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(MUSIC_EVENT_STATE, {
          detail: { isPlaying: playing, isMuted: muted },
        })
      );
    }
  }, []);

  const playAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.volume = isMuted ? 0 : volume;
      await audio.play();
      setIsPlaying(true);
      broadcastState(true, isMuted);
    } catch {
      // Autoplay blocked until interaction
      setIsPlaying(false);
      broadcastState(false, isMuted);
    }
  }, [broadcastState, isMuted, volume]);

  const pauseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    broadcastState(false, isMuted);
  }, [broadcastState, isMuted]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseAudio();
      try {
        sessionStorage.setItem("shaadisnap_user_paused_music", "true");
      } catch {
        // ignore
      }
    } else {
      try {
        sessionStorage.removeItem("shaadisnap_user_paused_music");
      } catch {
        // ignore
      }
      playAudio();
    }
  }, [isPlaying, pauseAudio, playAudio]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audio) {
      audio.muted = nextMuted;
      audio.volume = nextMuted ? 0 : volume;
    }
    try {
      localStorage.setItem(STORAGE_KEY_MUSIC_MUTED, String(nextMuted));
    } catch {
      // ignore
    }
    broadcastState(isPlaying, nextMuted);
  }, [broadcastState, isMuted, isPlaying, volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVol;
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
        audio.muted = false;
      }
    }
  };

  // Initialize audio and listen for global toggle events
  useEffect(() => {
    const audio = new Audio();
    audio.src = AUDIO_SRC_LOCAL;
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = DEFAULT_VOLUME;

    // Fallback if local source fails to load
    audio.addEventListener("error", () => {
      if (audio.src.includes(AUDIO_SRC_LOCAL)) {
        audio.src = AUDIO_SRC_FALLBACK;
        audio.load();
        if (isPlaying) {
          audio.play().catch(() => {});
        }
      } else {
        setAudioError(true);
      }
    });

    audio.addEventListener("play", () => {
      setIsPlaying(true);
      broadcastState(true, isMuted);
    });

    audio.addEventListener("pause", () => {
      setIsPlaying(false);
      broadcastState(false, isMuted);
    });

    audioRef.current = audio;

    // Check stored mute preference
    try {
      const storedMute = localStorage.getItem(STORAGE_KEY_MUSIC_MUTED) === "true";
      if (storedMute) {
        setIsMuted(true);
        audio.muted = true;
      }
    } catch {
      // ignore
    }

    // Attempt initial gentle play
    const userPaused = sessionStorage.getItem("shaadisnap_user_paused_music") === "true";
    if (!userPaused) {
      audio.play().then(() => {
        setIsPlaying(true);
        broadcastState(true, isMuted);
      }).catch(() => {
        // Expected if autoplay policy blocks initial non-interacted play
        setIsPlaying(false);
      });
    }

    // Global toggle listener (from Navbar or Hero)
    const handleGlobalToggle = () => {
      togglePlay();
    };

    window.addEventListener(MUSIC_EVENT_TOGGLE, handleGlobalToggle);

    // Auto-start on first user interaction anywhere on the page
    const handleFirstInteraction = () => {
      setHasUserInteracted(true);
      const wasPausedByUser = sessionStorage.getItem("shaadisnap_user_paused_music") === "true";
      if (!wasPausedByUser && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          broadcastState(true, isMuted);
        }).catch(() => {});
      }
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction, { passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });
    window.addEventListener("keydown", handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener(MUSIC_EVENT_TOGGLE, handleGlobalToggle);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      audio.pause();
      audio.src = "";
    };
  }, [broadcastState, isMuted, isPlaying, togglePlay]);

  if (audioError) {
    return null;
  }

  // Minimized Floating Disc Badge
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-40 animate-fade-in">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(99,60,73,0.22)] border border-[#EADDE0] backdrop-blur-md transition-all duration-300 cursor-pointer ${
            isPlaying
              ? "bg-[#633C49] text-white hover:bg-[#914C60] hover:scale-108"
              : "bg-white/95 text-[#633C49] hover:bg-white hover:scale-108"
          }`}
          title="Open Heeriye Music Player"
          aria-label="Open Heeriye Music Player"
        >
          {isPlaying ? (
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-white rounded-full animate-music-bar-1" />
              <span className="w-1 h-4 bg-white rounded-full animate-music-bar-2" />
              <span className="w-1 h-2 bg-white rounded-full animate-music-bar-3" />
            </div>
          ) : (
            <Music className="w-5 h-5" />
          )}

          {/* Pulse ring when playing */}
          {isPlaying && (
            <span className="absolute -inset-1 rounded-full border border-[#A85D70]/40 animate-ping pointer-events-none" />
          )}
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Background Wedding Music Player"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 transition-all duration-300"
    >
      <div className="group relative flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.18)] hover:shadow-[0_16px_40px_rgba(99,60,73,0.24)] transition-all">
        {/* Animated Disc / Icon Container */}
        <button
          type="button"
          onClick={togglePlay}
          className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xs ${
            isPlaying
              ? "bg-gradient-to-tr from-[#633C49] to-[#A85D70] text-white ring-2 ring-[#A85D70]/30"
              : "bg-[#FFF8F3] text-[#633C49] border border-[#EADDE0] hover:bg-[#F1D5D5]"
          }`}
          title={isPlaying ? "Pause Heeriye" : "Play Heeriye"}
          aria-label={isPlaying ? "Pause Heeriye" : "Play Heeriye"}
        >
          {isPlaying ? (
            <div className="flex items-end justify-center gap-0.5 h-4 w-4">
              <span className="w-0.5 h-3 bg-white rounded-full animate-music-bar-1" />
              <span className="w-0.5 h-4 bg-white rounded-full animate-music-bar-2" />
              <span className="w-0.5 h-2 bg-white rounded-full animate-music-bar-3" />
              <span className="w-0.5 h-3.5 bg-white rounded-full animate-music-bar-4" />
            </div>
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5 text-[#633C49]" />
          )}
        </button>

        {/* Track Metadata & Status */}
        <div
          onClick={togglePlay}
          className="flex flex-col cursor-pointer select-none min-w-[120px] max-w-[160px] sm:max-w-[200px]"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-serif text-xs sm:text-sm font-bold text-[#633C49] truncate">
              Heeriye
            </span>
            {isPlaying && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#A85D70] font-medium truncate">
            Jasleen Royal &bull; Arijit Singh
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1 pl-1 border-l border-[#EADDE0]">
          {/* Main Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="p-1.5 rounded-lg text-[#633C49] hover:text-[#A85D70] hover:bg-[#FFF8F3] transition-colors cursor-pointer"
            title={isPlaying ? "Pause" : "Play"}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          {/* Volume / Mute Button */}
          <div className="relative">
            <button
              type="button"
              onClick={toggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              className="p-1.5 rounded-lg text-[#633C49] hover:text-[#A85D70] hover:bg-[#FFF8F3] transition-colors cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Hover Volume Slider */}
            {showVolumeSlider && (
              <div
                onMouseLeave={() => setShowVolumeSlider(false)}
                className="absolute -top-10 left-1/2 -translate-x-1/2 p-2 bg-white rounded-xl shadow-lg border border-[#EADDE0] flex items-center z-50 animate-fade-in"
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 accent-[#A85D70] cursor-pointer"
                  title="Adjust volume"
                />
              </div>
            )}
          </div>

          {/* Minimize Button */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-[#947A80] hover:text-[#633C49] hover:bg-[#FFF8F3] transition-colors cursor-pointer ml-0.5"
            title="Minimize music player"
            aria-label="Minimize music player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtle romantic sparkle watermark */}
        <div className="absolute -top-2 -left-2 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-[#D9B7A0]/70" />
        </div>
      </div>
    </aside>
  );
};
