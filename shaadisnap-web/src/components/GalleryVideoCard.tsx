"use client";

import React, { useState } from "react";
import { Play, Video } from "lucide-react";
import { WeddingPhoto } from "@/data/mockWeddingData";
import { getEffectiveVideoUrls } from "@/lib/weddingPhotoStore";

interface GalleryVideoCardProps {
  photo: WeddingPhoto;
  className?: string;
}

export const GalleryVideoCard: React.FC<GalleryVideoCardProps> = ({ photo, className = "" }) => {
  const [hasImgError, setHasImgError] = useState(false);
  const { streamUrl } = getEffectiveVideoUrls(photo);

  const posterSrc = photo.thumbnailUrl || photo.fallbackUrl || photo.url;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#1E1719] flex items-center justify-center ${className}`}>
      {/* 1. Primary: High-speed Poster Frame / Thumbnail */}
      {!hasImgError && posterSrc ? (
        <img
          src={posterSrc}
          alt={photo.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setHasImgError(true)}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      ) : streamUrl ? (
        /* 2. Seamless Fallback: Native Video Frame Extraction (Loads first 50KB for instant poster) */
        <video
          src={streamUrl}
          preload="metadata"
          muted
          playsInline
          className="w-full h-full object-cover object-center pointer-events-none opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
      ) : (
        /* 3. Luxury Cinematic Gradient Poster for Videos without Thumbnail */
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D1B22] via-[#1A1215] to-[#0D080A] flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-[#D9B7A0] mb-2 border border-white/15">
            <Video className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-semibold text-white/90 text-center truncate max-w-[85%]">
            {photo.title}
          </p>
        </div>
      )}

      {/* Subtle Dark Vignette for Cinematic Depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25 pointer-events-none" />

      {/* Central High-Fashion Play Icon Button */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/40 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:border-white/80 transition-all duration-300">
          <Play className="w-5 h-5 fill-current ml-0.5 text-white" />
        </div>
      </div>

      {/* Video Duration / Format Badge */}
      <div className="absolute bottom-3 right-3 pointer-events-none z-10 flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-medium border border-white/20 shadow-md">
          {photo.durationFormatted || "HD Video"}
        </span>
      </div>
    </div>
  );
};
