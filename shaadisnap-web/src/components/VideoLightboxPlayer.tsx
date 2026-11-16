"use client";

import React from "react";
import { WeddingPhoto } from "@/data/mockWeddingData";
import { getEffectiveVideoUrls } from "@/lib/weddingPhotoStore";
import { ExternalLink } from "lucide-react";

interface VideoLightboxPlayerProps {
  photo: WeddingPhoto;
  className?: string;
}

export const VideoLightboxPlayer: React.FC<VideoLightboxPlayerProps> = ({
  photo,
  className = "",
}) => {
  const { previewUrl, streamUrl } = getEffectiveVideoUrls(photo);

  // High-compatibility player URL supporting all mobile codecs (H.264, H.265/HEVC, WebM, MOV)
  const videoSrc = previewUrl || streamUrl;

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${className}`}>
      {/* External Fullscreen / New Tab Action */}
      <div className="absolute top-2 right-2 z-20 pointer-events-auto">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 sm:p-2 rounded-full text-white/90 hover:text-white bg-black/75 hover:bg-black/95 active:scale-95 backdrop-blur-md border border-white/20 transition-all shadow-lg flex items-center justify-center"
          title="Open in Google Drive"
        >
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D9B7A0]" />
        </a>
      </div>

      {/* Main Video Display: Seamless, responsive container with no notices */}
      <div className="w-full h-[48vh] xs:h-[54vh] sm:h-[62vh] md:h-[68vh] flex items-center justify-center bg-black rounded-xl overflow-hidden relative shadow-2xl">
        <iframe
          src={videoSrc}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          loading="eager"
          title={photo.title || "Wedding Video Player"}
        />
      </div>
    </div>
  );
};
