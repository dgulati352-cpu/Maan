"use client";

import React, { useState } from "react";
import { WeddingPhoto } from "@/data/mockWeddingData";
import { getEffectiveVideoUrls } from "@/lib/weddingPhotoStore";
import { ExternalLink, Globe, RefreshCw, Sparkles } from "lucide-react";

interface VideoLightboxPlayerProps {
  photo: WeddingPhoto;
  className?: string;
}

export const VideoLightboxPlayer: React.FC<VideoLightboxPlayerProps> = ({
  photo,
  className = "",
}) => {
  // Default to Native 100% Full HD Player for uncompressed, crystal-clear 1080p/4K playback
  const [useDrivePlayer, setUseDrivePlayer] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { streamUrl, previewUrl, downloadUrl } = getEffectiveVideoUrls(photo);

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${className}`}>
      {/* Player Mode Switcher & Quality Indicator */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            setUseDrivePlayer((prev) => !prev);
            setHasError(false);
            setIsLoading(true);
          }}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold text-white bg-black/70 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg"
          title={useDrivePlayer ? "Switch to 100% Original HD Player" : "Switch to Google Drive Preview"}
        >
          {useDrivePlayer ? (
            <>
              <Globe className="w-3 h-3 text-amber-400" />
              <span className="hidden xs:inline">Drive Preview (Switch to HD)</span>
              <span className="xs:hidden">Drive (360p)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span className="hidden xs:inline">Original HD Quality</span>
              <span className="xs:hidden">100% HD</span>
            </>
          )}
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-full text-white/80 hover:text-white bg-black/70 hover:bg-black/90 active:scale-95 backdrop-blur-md border border-white/20 transition-all shadow-lg"
          title="Open in Google Drive"
        >
          <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </a>
      </div>

      {/* Main Video Display */}
      {useDrivePlayer ? (
        <div className="w-full h-[40vh] xs:h-[46vh] sm:h-[56vh] md:h-[62vh] flex items-center justify-center bg-black rounded-lg overflow-hidden relative shadow-2xl">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen"
            title={photo.title || "Wedding Video Player"}
          />
        </div>
      ) : (
        <div className="relative w-full max-h-[50vh] xs:max-h-[55vh] sm:max-h-[62vh] md:max-h-[68vh] flex items-center justify-center">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/20">
              <span className="p-2.5 rounded-full bg-black/70 backdrop-blur-md text-white shadow-xl">
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
              // Auto-fallback to Drive player if native player has codec error
              setUseDrivePlayer(true);
            }}
            className="max-h-[50vh] xs:max-h-[54vh] sm:max-h-[62vh] md:max-h-[68vh] w-auto max-w-full rounded-lg shadow-2xl bg-black object-contain"
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
