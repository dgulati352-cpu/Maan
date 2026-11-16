"use client";

import React, { useState } from "react";
import { WeddingPhoto } from "@/data/mockWeddingData";
import { getEffectiveVideoUrls } from "@/lib/weddingPhotoStore";
import { AlertCircle, ExternalLink, Globe, RefreshCw, Sparkles } from "lucide-react";

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
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold text-white bg-black/75 hover:bg-black/95 active:scale-95 backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg"
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
          className="p-1.5 rounded-full text-white/80 hover:text-white bg-black/75 hover:bg-black/95 active:scale-95 backdrop-blur-md border border-white/20 transition-all shadow-lg"
          title="Open in Google Drive"
        >
          <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </a>
      </div>

      {/* Main Video Display */}
      {useDrivePlayer ? (
        <div className="w-full h-[45vh] xs:h-[50vh] sm:h-[58vh] md:h-[65vh] flex items-center justify-center bg-black rounded-lg overflow-hidden relative shadow-2xl">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            title={photo.title || "Wedding Video Player"}
          />
        </div>
      ) : hasError ? (
        /* Graceful Action Card instead of stuck black screen */
        <div className="w-full h-[40vh] xs:h-[46vh] sm:h-[56vh] flex flex-col items-center justify-center p-6 bg-[#1A1215] rounded-xl border border-white/10 text-center text-white">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold mb-1">Mobile Playback Notice</p>
          <p className="text-xs text-white/70 max-w-xs mb-4">
            Tap below to play via Google Drive or download the video directly.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setHasError(false);
                setUseDrivePlayer(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-md"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Open Drive Player</span>
            </button>
            <a
              href={downloadUrl}
              download={photo.title || "wedding_video.mp4"}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#A85D70] hover:bg-[#914C60] active:scale-95 text-white transition-all shadow-md"
            >
              Download Video
            </a>
          </div>
        </div>
      ) : (
        <div className="relative w-full max-h-[50vh] xs:max-h-[55vh] sm:max-h-[62vh] md:max-h-[68vh] flex items-center justify-center">
          {isLoading && (
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
