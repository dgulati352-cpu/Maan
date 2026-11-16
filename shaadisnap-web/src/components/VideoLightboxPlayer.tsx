"use client";

import React, { useState } from "react";
import { WeddingPhoto } from "@/data/mockWeddingData";
import { getEffectiveVideoUrls } from "@/lib/weddingPhotoStore";
import { ExternalLink, Film, Globe, RefreshCw } from "lucide-react";

interface VideoLightboxPlayerProps {
  photo: WeddingPhoto;
  className?: string;
}

export const VideoLightboxPlayer: React.FC<VideoLightboxPlayerProps> = ({
  photo,
  className = "",
}) => {
  // Default to Google Drive High-Speed Adaptive Player for instant 0.2s start with zero buffer lag
  const [useDrivePlayer, setUseDrivePlayer] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { streamUrl, previewUrl, downloadUrl } = getEffectiveVideoUrls(photo);

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${className}`}>
      {/* Player Mode Switcher Bar */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={() => {
            setUseDrivePlayer((prev) => !prev);
            setHasError(false);
            setIsLoading(true);
          }}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold text-white bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/25 transition-all cursor-pointer shadow-md"
          title={useDrivePlayer ? "Switch to Native HD Player" : "Switch to Google Drive High-Speed Player"}
        >
          {useDrivePlayer ? (
            <>
              <Film className="w-3 h-3 text-emerald-400" />
              <span className="hidden xs:inline">Native HD Player</span>
              <span className="xs:hidden">HD Player</span>
            </>
          ) : (
            <>
              <Globe className="w-3 h-3 text-[#D9B7A0]" />
              <span className="hidden xs:inline">Drive Player (Instant)</span>
              <span className="xs:hidden">Drive (Fast)</span>
            </>
          )}
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded-full text-white/80 hover:text-white bg-black/50 hover:bg-black/75 backdrop-blur-md transition-colors"
          title="Open video in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Player Display */}
      {useDrivePlayer ? (
        <div className="w-full h-[42vh] xs:h-[48vh] sm:h-[58vh] md:h-[65vh] flex items-center justify-center bg-black rounded-lg overflow-hidden relative shadow-2xl">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen"
            title={photo.title || "Wedding Video Player"}
          />
        </div>
      ) : (
        <div className="relative w-full max-h-[50vh] sm:max-h-[65vh] flex items-center justify-center">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/20">
              <span className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white shadow-md">
                <RefreshCw className="w-5 h-5 animate-spin text-[#D9B7A0]" />
              </span>
            </div>
          )}

          <video
            key={streamUrl}
            poster={photo.thumbnailUrl || photo.fallbackUrl}
            controls
            playsInline
            preload="metadata"
            onLoadedMetadata={() => setIsLoading(false)}
            onLoadedData={() => setIsLoading(false)}
            onPlaying={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
              // Auto-fallback to Drive player if native player stalls
              setUseDrivePlayer(true);
            }}
            className="max-h-[65vh] w-auto max-w-full rounded-lg shadow-xl bg-black"
          >
            <source src={streamUrl} type="video/mp4" />
            <source src={downloadUrl} type="video/mp4" />
            Your browser does not support HTML5 video playback.
          </video>
        </div>
      )}
    </div>
  );
};
