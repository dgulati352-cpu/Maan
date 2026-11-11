"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ExternalLink, ArrowRight, Camera } from "lucide-react";
import { WEDDING_EVENT, WeddingPhoto } from "@/data/mockWeddingData";
import { getApprovedWeddingPhotos, fetchSharedGalleryPhotos } from "@/lib/weddingPhotoStore";

interface LuxuryGalleryPreviewProps {
  onFindYourFace: () => void;
  onViewAllGallery?: () => void;
}

export const LuxuryGalleryPreview: React.FC<LuxuryGalleryPreviewProps> = ({
  onFindYourFace,
  onViewAllGallery,
}) => {
  const [photos, setPhotos] = useState<WeddingPhoto[]>(() => getApprovedWeddingPhotos());
  const [selectedCeremony, setSelectedCeremony] = useState<string>("All");
  const [lightboxPhoto, setLightboxPhoto] = useState<WeddingPhoto | null>(null);

  useEffect(() => {
    let active = true;

    const syncLive = async () => {
      const livePhotos = await fetchSharedGalleryPhotos();
      if (active) {
        setPhotos(livePhotos);
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
              {latestPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxPhoto(photo)}
                  className="photo-card-sheen group relative rounded-2xl overflow-hidden bg-white border border-white shadow-[0_10px_26px_rgba(99,60,73,0.08)] hover:shadow-[0_20px_38px_rgba(99,60,73,0.18)] hover:-translate-y-1 transition-all duration-300 cursor-pointer aspect-[3/4]"
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      if (photo.fallbackUrl && e.currentTarget.src !== photo.fallbackUrl) {
                        e.currentTarget.src = photo.fallbackUrl;
                      }
                    }}
                  />

                  {/* Hover / Tap Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 sm:p-5 flex flex-col justify-between">
                    <div className="flex justify-end">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30">
                        {photo.ceremony}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif text-base sm:text-lg font-bold text-white truncate">
                        {photo.title}
                      </h4>
                      <p className="text-xs text-emerald-300 mt-0.5 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {photo.facesCount === 1 ? "1 Person Available" : `${photo.facesCount || 1} Persons Available`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#EADDE0]"
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EADDE0]">
              <div>
                <span className="text-[10px] font-bold text-[#A85D70] uppercase tracking-wider">
                  {lightboxPhoto.ceremony} Ceremony
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#633C49] truncate max-w-xs sm:max-w-md">
                  {lightboxPhoto.title}
                </h3>
              </div>

              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-2 rounded-full hover:bg-[#FFF8F3] text-[#765D62] hover:text-[#633C49] transition-colors cursor-pointer"
                title="Close Lightbox"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-2 min-h-[300px]">
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
            </div>

            <div className="p-4 sm:p-5 border-t border-[#EADDE0] bg-[#FFF8F3] flex items-center justify-between">
              <span className="text-xs text-[#765D62] flex items-center gap-2">
                <span>{lightboxPhoto.photographer || "Guest Live Upload"}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {lightboxPhoto.facesCount === 1 ? "1 Person Available" : `${lightboxPhoto.facesCount || 1} Persons Available`}
                </span>
              </span>

              <a
                href={lightboxPhoto.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-all shadow-xs"
              >
                <span>View Full HD</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
