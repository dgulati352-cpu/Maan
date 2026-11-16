"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, ExternalLink, ArrowRight, Camera, Video, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { WEDDING_EVENT, WeddingPhoto } from "@/data/mockWeddingData";
import { getApprovedWeddingPhotos, fetchSharedGalleryPhotos, getCachedSharedPhotos, getEffectiveVideoUrls } from "@/lib/weddingPhotoStore";
import { isVideoFile } from "@/lib/videoThumbnail";
import { VideoLightboxPlayer } from "@/components/VideoLightboxPlayer";
import { GalleryVideoCard } from "@/components/GalleryVideoCard";

interface LuxuryGalleryPreviewProps {
  onFindYourFace: () => void;
  onViewAllGallery?: () => void;
}

export const LuxuryGalleryPreview: React.FC<LuxuryGalleryPreviewProps> = ({
  onFindYourFace,
  onViewAllGallery,
}) => {
  // Instantly initialize from cache memory (0ms)
  const [photos, setPhotos] = useState<WeddingPhoto[]>(() => getCachedSharedPhotos());
  const [selectedCeremony, setSelectedCeremony] = useState<string>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const syncLive = async () => {
      const livePhotos = await fetchSharedGalleryPhotos();
      if (active) {
        setPhotos((prev) => {
          if (
            prev.length === livePhotos.length &&
            prev[0]?.id === livePhotos[0]?.id &&
            prev[prev.length - 1]?.id === livePhotos[livePhotos.length - 1]?.id
          ) {
            return prev;
          }
          return livePhotos;
        });
      }
    };

    // Immediate sync with shared Google Drive + local uploads
    syncLive();

    const handleUpdate = () => {
      setPhotos(getApprovedWeddingPhotos());
      syncLive();
    };

    window.addEventListener("shaadisnap_photos_updated", handleUpdate);
    window.addEventListener("focus", syncLive);
    const interval = setInterval(syncLive, 15000);

    return () => {
      active = false;
      window.removeEventListener("shaadisnap_photos_updated", handleUpdate);
      window.removeEventListener("focus", syncLive);
      clearInterval(interval);
    };
  }, []);

  const ceremonies = ["All", "Phere", "Sangeet", "Mehendi", "Haldi", "Reception"];

  const filtered =
    selectedCeremony === "All"
      ? photos
      : photos.filter((p) => p.ceremony === selectedCeremony);

  // Show only latest 15 photos as requested
  const latestPhotos = filtered.slice(0, 15);

  const navigateLightbox = useCallback(
    (direction: 1 | -1) => {
      setLightboxIndex((prev) => {
        if (prev === null || latestPhotos.length === 0) return null;
        return (prev + direction + latestPhotos.length) % latestPhotos.length;
      });
    },
    [latestPhotos.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Escape") {
        e.preventDefault();
        setLightboxIndex(null);
      } else if (e.key === "ArrowRight" || e.key === "Right" || e.code === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        navigateLightbox(1);
      } else if (e.key === "ArrowLeft" || e.key === "Left" || e.code === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        navigateLightbox(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [lightboxIndex, navigateLightbox]);

  const lightboxPhoto =
    lightboxIndex !== null && lightboxIndex < latestPhotos.length
      ? latestPhotos[lightboxIndex]
      : null;

  return (
    <section className="relative py-20 lg:py-28 bg-[#FFF8F3] border-t border-[#EADDE0] overflow-hidden">
      <div className="absolute -right-32 top-24 h-80 w-80 rounded-full bg-[#F1D5D5]/45 blur-3xl pointer-events-none" />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 relative">
            <div className="editorial-kicker flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-[#A85D70]" />
              <span>Event Gallery Preview</span>
            </div>
            <div className="luxury-rule" />
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#633C49] tracking-tight">
              {WEDDING_EVENT.couple}
            </h2>
            <p className="text-base text-[#765D62] max-w-lg">
              Showing the latest 15 moments from {WEDDING_EVENT.couple}&apos;s celebration. Explore the full album in the gallery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {onViewAllGallery && (
              <button
                type="button"
                onClick={onViewAllGallery}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-semibold text-[#633C49] bg-white/75 hover:bg-white border border-[#EADDE0] hover:border-[#A85D70] shadow-xs transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#A85D70]" />
                <span>View All ({photos.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onFindYourFace}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold text-white bg-[#633C49] hover:bg-[#914C60] shadow-[0_10px_22px_rgba(99,60,73,0.22)] transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Find Photos of Me</span>
            </button>
          </div>
        </div>

        {/* Ceremony Filter Tabs */}
         <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 relative">
          {ceremonies.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCeremony(c)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedCeremony === c
                  ? "bg-[#633C49] text-white shadow-xs"
                   : "bg-white/70 text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Real Uploaded Photo Grid or Empty State */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#EADDE0] bg-white p-8 sm:p-14 text-center max-w-xl mx-auto space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#FFF8F3] border border-[#EADDE0] flex items-center justify-center mx-auto text-[#A85D70]">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#633C49]">
              No Uploaded Photos Yet
            </h3>
            <p className="text-sm text-[#765D62] leading-relaxed">
              Be the first to share a wedding memory! Upload candid moments from your camera or phone gallery to see them appear live in this album.
            </p>
          </div>
        ) : (
          <>
            <div
              className={`grid gap-4 sm:gap-6 ${
                latestPhotos.length === 1
                  ? "grid-cols-1 max-w-md mx-auto"
                  : latestPhotos.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : latestPhotos.length === 3
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto"
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5"
              }`}
            >
              {latestPhotos.map((photo, index) => {
                const isVideo = photo.mediaType === "video" || isVideoFile(photo.url || photo.title);
                return (
                  <div
                    key={photo.id}
                    onClick={() => setLightboxIndex(index)}
                    className={`photo-card-sheen group relative rounded-2xl overflow-hidden ${
                      isVideo ? "bg-[#1E1719]" : "bg-white"
                    } border border-[#EADDE0] shadow-[0_10px_26px_rgba(99,60,73,0.08)] hover:shadow-[0_20px_38px_rgba(99,60,73,0.18)] hover:-translate-y-1 transition-all duration-300 cursor-pointer aspect-[3/4]`}
                  >
                    {isVideo ? (
                      <GalleryVideoCard photo={photo} />
                    ) : (
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.title}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          if (photo.fallbackUrl && e.currentTarget.src !== photo.fallbackUrl) {
                            e.currentTarget.src = photo.fallbackUrl;
                          }
                        }}
                      />
                    )}

                    {/* Top Overlay Ceremony Badge */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/85 backdrop-blur-md text-[#633C49] border border-white/40 flex items-center gap-1 shadow-xs">
                        {isVideo && <Video className="w-2.5 h-2.5 text-[#A85D70]" />}
                        <span>{photo.ceremony}</span>
                      </span>
                    </div>

                    {/* Sliding Editorial Info on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 sm:p-5 flex flex-col justify-end text-white pointer-events-none">
                      <h4 className="font-serif text-base sm:text-lg font-bold text-white truncate">
                        {photo.title}
                      </h4>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-emerald-300 flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {isVideo ? "HD Video Clip" : photo.facesCount === 1 ? "1 Person" : `${photo.facesCount || 1} Persons`}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                          Click to Expand
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View Full Gallery CTA at bottom of preview */}
            {onViewAllGallery && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={onViewAllGallery}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold text-white bg-[#A85D70] hover:bg-[#914C60] shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Open Full Gallery ({photos.length} Photos)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {/* Responsive Fullscreen Lightbox Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EADDE0]"
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EADDE0]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#A85D70] uppercase tracking-wider">
                    {lightboxPhoto.ceremony} Ceremony
                  </span>
                  <span className="text-[10px] text-[#947A80]">
                    ({(lightboxIndex || 0) + 1} of {latestPhotos.length})
                  </span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#633C49] truncate max-w-xs sm:max-w-md">
                  {lightboxPhoto.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-full hover:bg-[#FFF8F3] text-[#765D62] hover:text-[#633C49] transition-colors cursor-pointer"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center p-2 min-h-[320px] max-h-[65vh]">
              {lightboxPhoto.mediaType === "video" || isVideoFile(lightboxPhoto.videoUrl || lightboxPhoto.url || lightboxPhoto.title) ? (
                <VideoLightboxPlayer photo={lightboxPhoto} />
              ) : (
                <img
                  src={lightboxPhoto.url}
                  alt={lightboxPhoto.title}
                  referrerPolicy="no-referrer"
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
                  onError={(e) => {
                    if (lightboxPhoto.fallbackUrl && e.currentTarget.src !== lightboxPhoto.fallbackUrl) {
                      e.currentTarget.src = lightboxPhoto.fallbackUrl;
                    }
                  }}
                />
              )}

              {/* Prev Button (Click & Left Arrow Navigation) */}
              {latestPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateLightbox(-1);
                  }}
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-full bg-black/70 hover:bg-black/90 active:scale-95 text-white backdrop-blur-md transition-all cursor-pointer shadow-2xl z-50 pointer-events-auto border border-white/20 hover:border-white/50"
                  title="Previous photo (Left Arrow / Click)"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                </button>
              )}

              {/* Next Button (Click & Right Arrow Navigation) */}
              {latestPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateLightbox(1);
                  }}
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 p-3 sm:p-3.5 rounded-full bg-black/70 hover:bg-black/90 active:scale-95 text-white backdrop-blur-md transition-all cursor-pointer shadow-2xl z-50 pointer-events-auto border border-white/20 hover:border-white/50"
                  title="Next photo (Right Arrow / Click)"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                </button>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-[#EADDE0] bg-[#FFF8F3] flex items-center justify-between">
              <span className="text-xs text-[#765D62] flex items-center gap-2">
                <span>{lightboxPhoto.photographer || "Guest Live Upload"}</span>
                <span>•</span>
                {lightboxPhoto.mediaType === "video" || isVideoFile(lightboxPhoto.url || lightboxPhoto.title) ? (
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">
                    <Video className="w-3 h-3 text-emerald-700" />
                    <span>Original HD Video (100% Quality)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {lightboxPhoto.facesCount === 1 ? "1 Person Available" : `${lightboxPhoto.facesCount || 1} Persons Available`}
                  </span>
                )}
              </span>

              <a
                href={
                  lightboxPhoto.mediaType === "video" || isVideoFile(lightboxPhoto.url || lightboxPhoto.title)
                    ? getEffectiveVideoUrls(lightboxPhoto).downloadUrl
                    : lightboxPhoto.url
                }
                download={
                  lightboxPhoto.title ||
                  (lightboxPhoto.mediaType === "video" || isVideoFile(lightboxPhoto.url || lightboxPhoto.title)
                    ? "wedding_video.mp4"
                    : "wedding_photo.jpg")
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-all shadow-xs"
              >
                <span>
                  {lightboxPhoto.mediaType === "video" || isVideoFile(lightboxPhoto.url || lightboxPhoto.title)
                    ? "Download Original HD Video"
                    : "View Full HD"}
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
