"use client";

import React, { useState } from "react";
import { WeddingPhoto } from "@/data/mockWeddingData";
import { getEffectiveVideoUrls } from "@/lib/weddingPhotoStore";
import { ExternalLink, Film, Globe } from "lucide-react";

interface VideoLightboxPlayerProps {
  photo: WeddingPhoto;
  className?: string;
}

export const VideoLightboxPlayer: React.FC<VideoLightboxPlayerProps> = ({
  photo,
  className = "",
}) => {
  // Default to Native Mobile Player (eliminates overlapping controls, crystal clear HD)
  const [useDrivePlayer, setUseDrivePlayer] = useState(false);
  const { previewUrl, streamUrl, downloadUrl } = getEffectiveVideoUrls(photo);

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${className}`}>
      {/* Sleek Top-Right Controls: Mode Switcher & Open in Drive */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => setUseDrivePlayer((prev) => !prev)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold text-white bg-black/75 hover:bg-black/95 active:scale-95 backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg"
          title={useDrivePlayer ? "Switch to Native HD Player" : "Switch to Drive Player"}
        >
          {useDrivePlayer ? (
            <>
              <Film className="w-3 h-3 text-emerald-400" />
              <span>Native HD</span>
            </>
          ) : (
            <>
              <Globe className="w-3 h-3 text-amber-400" />
              <span>Drive Player</span>
            </>
          )}
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-full text-white/90 hover:text-white bg-black/75 hover:bg-black/95 active:scale-95 backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center"
          title="Open in Google Drive"
        >
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D9B7A0]" />
        </a>
      </div>

      {/* Main Video Display */}
      {useDrivePlayer ? (
        /* Google Drive Iframe with expanded vertical clearance to eliminate control overlap */
        <div className="w-full h-[52vh] xs:h-[58vh] sm:h-[65vh] md:h-[70vh] min-h-[320px] xs:min-h-[360px] sm:min-h-[420px] flex items-center justify-center bg-black rounded-xl overflow-hidden relative shadow-2xl">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            loading="eager"
            title={photo.title || "Wedding Video Player"}
          />
        </div>
      ) : (
        /* Native HTML5 Video Player: Perfect mobile controls, zero overlap, crystal-clear 1080p/4K */
        <div className="relative w-full h-[50vh] xs:h-[56vh] sm:h-[64vh] md:h-[68vh] min-h-[280px] xs:min-h-[340px] sm:min-h-[400px] flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-2xl">
          <video
            key={streamUrl}
            poster={photo.thumbnailUrl || photo.fallbackUrl}
            controls
            playsInline
            preload="metadata"
            onError={() => {
              // Seamlessly fallback to Drive player if native hardware decoder is unavailable
              setUseDrivePlayer(true);
            }}
            className="w-full h-full object-contain bg-black"
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
