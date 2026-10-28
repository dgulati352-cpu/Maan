"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ExternalLink, ArrowRight, Camera } from "lucide-react";
import { WEDDING_EVENT, WeddingPhoto } from "@/data/mockWeddingData";
import { getWeddingPhotos } from "@/lib/weddingPhotoStore";

interface LuxuryGalleryPreviewProps {
  onFindYourFace: () => void;
}

export const LuxuryGalleryPreview: React.FC<LuxuryGalleryPreviewProps> = ({ onFindYourFace }) => {
  const [photos, setPhotos] = useState<WeddingPhoto[]>([]);
  const [selectedCeremony, setSelectedCeremony] = useState<string>("All");
  const [lightboxPhoto, setLightboxPhoto] = useState<WeddingPhoto | null>(null);

  useEffect(() => {
    setPhotos(getWeddingPhotos());

    const handleUpdate = () => {
      setPhotos(getWeddingPhotos());
    };

    window.addEventListener("shaadisnap_photos_updated", handleUpdate);
    return () => window.removeEventListener("shaadisnap_photos_updated", handleUpdate);
  }, []);

  const ceremonies = ["All", "Phere", "Sangeet", "Mehendi", "Haldi", "Reception"];

  const filtered =
    selectedCeremony === "All"
      ? photos
      : photos.filter((p) => p.ceremony === selectedCeremony);

  return (
    <section className="py-20 lg:py-28 bg-[#F8F5EF] border-t border-[#DED5C8]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8DDD0] border border-[#C6A76A]/40 text-xs font-semibold uppercase tracking-wider text-[#242321]">
              <Camera className="w-3.5 h-3.5 text-[#C6A76A]" />
              <span>Event Gallery Preview</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#242321] tracking-tight">
              {WEDDING_EVENT.couple}&apos;s Memories
            </h2>
            <p className="text-base text-[#716B63] max-w-lg">
              Explore the master album captured by {WEDDING_EVENT.photographer}. Click below to isolate photos where you appear.
            </p>
          </div>

          <button
            onClick={onFindYourFace}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-[#873F50] hover:bg-[#733443] shadow-md transition-all self-start md:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Find Photos of Me</span>
          </button>
        </div>

        {/* Ceremony Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
          {ceremonies.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCeremony(c)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCeremony === c
                  ? "bg-[#242321] text-white shadow-xs"
                  : "bg-white text-[#716B63] hover:text-[#242321] border border-[#DED5C8]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Real Uploaded Photo Grid or Empty State */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#DED5C8] bg-white p-8 sm:p-14 text-center max-w-xl mx-auto space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#F8F5EF] border border-[#DED5C8] flex items-center justify-center mx-auto text-[#C6A76A]">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#242321]">
              No Uploaded Photos Yet
            </h3>
            <p className="text-sm text-[#716B63] leading-relaxed">
              Be the first to share a wedding memory! Upload candid moments from your camera or phone gallery to see them appear live in this album.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-4 sm:gap-6 ${
              filtered.length === 1
                ? "grid-cols-1 max-w-md mx-auto"
                : filtered.length === 2
                ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                : filtered.length === 3
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5"
            }`}
          >
            {filtered.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setLightboxPhoto(photo)}
                className="group relative rounded-2xl overflow-hidden bg-white border border-[#DED5C8] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer aspect-[3/4]"
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
                    <p className="text-xs text-[#E8DDD0] mt-0.5">
                      {photo.facesCount} Faces Indexed
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            className="relative bg-white rounded-3xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#DED5C8]"
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#DED5C8]">
              <div>
                <span className="text-[10px] font-bold text-[#C6A76A] uppercase tracking-wider">
                  {lightboxPhoto.ceremony} Ceremony
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#242321] truncate max-w-xs sm:max-w-md">
                  {lightboxPhoto.title}
                </h3>
              </div>

              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-2 rounded-full hover:bg-[#F8F5EF] text-[#716B63] hover:text-[#242321] transition-colors"
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

            <div className="p-4 sm:p-5 border-t border-[#DED5C8] bg-[#F8F5EF] flex items-center justify-between">
              <span className="text-xs text-[#716B63]">
                {lightboxPhoto.photographer || "Guest Live Upload"} • {lightboxPhoto.facesCount} Faces Detected
              </span>

              <a
                href={lightboxPhoto.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#873F50] hover:bg-[#733443] transition-all shadow-xs"
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
