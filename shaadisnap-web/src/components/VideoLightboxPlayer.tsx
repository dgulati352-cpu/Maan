"use client";

import React, { useRef, useState, useEffect } from "react";
import { WeddingPhoto } from "@/data/mockWeddingData";
import { getEffectiveVideoUrls } from "@/lib/weddingPhotoStore";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";

interface VideoLightboxPlayerProps {
  photo: WeddingPhoto;
  className?: string;
}

export const VideoLightboxPlayer: React.FC<VideoLightboxPlayerProps> = ({
  photo,
  className = "",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);

  const { streamUrl, previewUrl } = getEffectiveVideoUrls(photo);

  // Auto-hide controls timer during playback
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timer = setTimeout(() => setShowControls(false), 2800);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.currentTime + seconds, duration)
    );
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      onClick={() => setShowControls((prev) => !prev)}
      className={`relative w-full h-[52vh] xs:h-[58vh] sm:h-[65vh] md:h-[70vh] min-h-[300px] xs:min-h-[360px] sm:min-h-[420px] flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-2xl select-none group ${className}`}
    >
      {/* External Link in top right */}
      <div className="absolute top-2.5 right-2.5 z-30 pointer-events-auto">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-full text-white/90 hover:text-white bg-black/75 hover:bg-black/95 active:scale-95 backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center cursor-pointer"
          title="Open in Google Drive"
        >
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D9B7A0]" />
        </a>
      </div>

      {!hasError ? (
        <>
          {/* Native HTML5 Video Stream */}
          <video
            ref={videoRef}
            src={streamUrl}
            poster={photo.thumbnailUrl || photo.fallbackUrl}
            playsInline
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              setIsPlaying(false);
              setShowControls(true);
            }}
            onError={() => setHasError(true)}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* Center Play Button Overlay when paused */}
          {!isPlaying && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="absolute z-20 w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 active:scale-90 text-white backdrop-blur-md border border-white/40 flex items-center justify-center shadow-2xl transition-all cursor-pointer pointer-events-auto"
            >
              <Play className="w-7 h-7 fill-current ml-1 text-white" />
            </button>
          )}

          {/* Bottom Playback Control Bar: Pinned to bottom ("down"), No extra bars ("remove") */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-1.5 transition-all duration-300 pointer-events-auto ${
              showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}
          >
            {/* Scrubber Progress Bar */}
            <div className="relative w-full flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 sm:h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-[#D9B7A0] hover:bg-white/40 transition-all"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white text-xs pt-0.5">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Play / Pause Toggle */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                {/* 10s Backward */}
                <button
                  type="button"
                  onClick={() => skipTime(-10)}
                  className="p-1 text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer flex items-center gap-0.5 text-[10px]"
                  title="10 seconds back"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">10</span>
                </button>

                {/* 10s Forward */}
                <button
                  type="button"
                  onClick={() => skipTime(10)}
                  className="p-1 text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer flex items-center gap-0.5 text-[10px]"
                  title="10 seconds forward"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">10</span>
                </button>

                {/* Time Display */}
                <span className="font-mono text-[11px] text-white/90 ml-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                title="Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Fallback: Drive Iframe with expanded clearance */
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          title={photo.title || "Wedding Video Player"}
        />
      )}
    </div>
  );
};
