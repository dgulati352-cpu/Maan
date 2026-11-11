"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Camera,
  Sparkles,
  Heart,
  Download,
  X,
  Sliders,
  Search,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { WEDDING_EVENT, WeddingPhoto } from "@/data/mockWeddingData";
import { getApprovedWeddingPhotos, getPhotosForCurrentUser } from "@/lib/weddingPhotoStore";
import { ShareGuestLinkModal } from "@/components/ShareGuestLinkModal";

interface FullWeddingGalleryProps {
  onFindPhotos?: () => void;
  onUploadPhotos?: () => void;
}

export const FullWeddingGallery: React.FC<FullWeddingGalleryProps> = ({
  onFindPhotos,
  onUploadPhotos,
}) => {
  const [photos, setPhotos] = useState<WeddingPhoto[]>([]);
  const [selectedCeremony, setSelectedCeremony] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLiveGallery = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/gallery/photos?ceremony=${encodeURIComponent(selectedCeremony)}&search=${encodeURIComponent(searchQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.photos) && data.photos.length > 0) {
          setPhotos(data.photos);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Fallback to local client store if offline
    }
    setPhotos(getPhotosForCurrentUser());
    setIsLoading(false);
  }, [selectedCeremony, searchQuery]);

  useEffect(() => {
    fetchLiveGallery();
    const handleUpdate = () => fetchLiveGallery();
    window.addEventListener("shaadisnap_photos_updated", handleUpdate);
    window.addEventListener("shaadisnap_google_auth_changed", handleUpdate);
    return () => {
      window.removeEventListener("shaadisnap_photos_updated", handleUpdate);
      window.removeEventListener("shaadisnap_google_auth_changed", handleUpdate);
    };
  }, [fetchLiveGallery]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectPhoto = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const ceremonies = ["All", "Phere", "Sangeet", "Mehendi", "Haldi", "Reception"];

  const filteredPhotos = photos.filter((photo) => {
    const ceremonyMatch =
      selectedCeremony === "All" || photo.ceremony === selectedCeremony;
    const queryMatch =
      !searchQuery ||
      photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.ceremony.toLowerCase().includes(searchQuery.toLowerCase());
    return ceremonyMatch && queryMatch;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPhotos.map((p) => p.id));
    }
  };

  const triggerBatchDownload = (itemsToDownload: WeddingPhoto[]) => {
    if (itemsToDownload.length === 0) return;
    setDownloadProgress(`Preparing ${itemsToDownload.length} photos...`);
    itemsToDownload.forEach((photo, idx) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = photo.url;
        link.download = `${photo.title || `wedding_photo_${idx + 1}`}.jpg`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (idx === itemsToDownload.length - 1) {
          setDownloadProgress(`Downloaded ${itemsToDownload.length} photos successfully`);
          setTimeout(() => setDownloadProgress(null), 3000);
        } else {
          setDownloadProgress(`Downloading ${idx + 1} of ${itemsToDownload.length}...`);
        }
      }, idx * 250);
    });
  };

  const handleDownloadSelected = () => {
    const targetPhotos = filteredPhotos.filter((p) => selectedIds.includes(p.id));
    triggerBatchDownload(targetPhotos);
  };

  const handleDownloadAll = () => {
    triggerBatchDownload(filteredPhotos);
  };

  const navigateLightbox = useCallback(
    (direction: 1 | -1) => {
      if (lightboxIndex === null || filteredPhotos.length === 0) return;
      const nextIndex =
        (lightboxIndex + direction + filteredPhotos.length) % filteredPhotos.length;
      setLightboxIndex(nextIndex);
    },
    [lightboxIndex, filteredPhotos]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") navigateLightbox(1);
      if (e.key === "ArrowLeft") navigateLightbox(-1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, navigateLightbox]);

  const currentLightboxPhoto =
    lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  return (
    <div className="w-full bg-[#FFF8F3] text-[#765D62] pt-8 pb-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-8">
        
        {/* --- 1. TOP: Centered Editorial Header --- */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1D5D5]/50 border border-[#EADDE0] text-xs font-semibold uppercase tracking-wider text-[#633C49]">
            <Camera className="w-3.5 h-3.5 text-[#A85D70]" />
            <span>Master Wedding Gallery • {WEDDING_EVENT.venue}</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#633C49] tracking-tight">
            {WEDDING_EVENT.couple}
          </h1>

          <p className="text-sm sm:text-base text-[#765D62] max-w-xl mx-auto leading-relaxed">
            High-fashion magazine album capturing the celebration at Deventure Shimla Hills Resort, Solan (HP). Explore candid memories with AI facial retrieval or enjoy full ceremony spreads.
          </p>

          {/* Quick Action Buttons (Centered) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onFindPhotos && (
              <button
                type="button"
                onClick={onFindPhotos}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#A85D70] hover:bg-[#914C60] shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Find My Photos</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-[#633C49] bg-white hover:bg-[#F1D5D5]/50 border border-[#EADDE0] hover:border-[#A85D70] transition-all cursor-pointer shadow-2xs"
            >
              <Share2 className="w-4 h-4 text-[#A85D70]" />
              <span>Share Guest Link</span>
            </button>
          </div>
        </div>

        {/* --- 2. MIDDLE: Clean Filters, Search & Batch Download Bar --- */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EADDE0] shadow-rose-sm flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Ceremony Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-bold text-[#633C49] mr-1 hidden sm:inline-flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-[#A85D70]" />
                <span>Ceremony:</span>
              </span>
              {ceremonies.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCeremony(c)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCeremony === c
                      ? "bg-[#A85D70] text-white shadow-xs"
                      : "bg-[#FFF8F3] text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Search Box & Counter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-[#947A80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search caption or ceremony..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-full text-xs bg-[#FFF8F3] border border-[#EADDE0] text-[#633C49] placeholder-[#947A80] focus:outline-none focus:border-[#A85D70]"
                />
              </div>

              <div className="px-3 py-1.5 rounded-full bg-[#F1D5D5]/50 border border-[#A85D70]/20 text-[11px] font-bold text-[#633C49] whitespace-nowrap">
                {filteredPhotos.length} {filteredPhotos.length === 1 ? "Photo" : "Photos"}
              </div>
            </div>
          </div>

          {/* Batch Actions Toolbar */}
          <div className="pt-3 border-t border-[#EADDE0]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  if (isSelectMode) setSelectedIds([]);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                  isSelectMode
                    ? "bg-[#633C49] text-white"
                    : "bg-[#FFF8F3] text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
                }`}
              >
                {isSelectMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                <span>{isSelectMode ? "Cancel Select" : "Multi-Select Mode"}</span>
              </button>

              {isSelectMode && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-full font-semibold bg-white border border-[#EADDE0] hover:border-[#A85D70] text-[#633C49] transition-all cursor-pointer"
                >
                  {selectedIds.length === filteredPhotos.length ? "Deselect All" : "Select All"}
                </button>
              )}

              {isSelectMode && selectedIds.length > 0 && (
                <span className="text-[11px] font-medium text-[#A85D70]">
                  {selectedIds.length} photo{selectedIds.length === 1 ? "" : "s"} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isSelectMode && selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadSelected}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Selected ({selectedIds.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full font-semibold text-[#633C49] bg-[#F1D5D5]/50 hover:bg-[#F1D5D5] border border-[#A85D70]/30 transition-all cursor-pointer text-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#A85D70]" />
                <span className="hidden sm:inline">Download All as ZIP / Batch ({filteredPhotos.length})</span>
                <span className="inline sm:hidden">Download All ({filteredPhotos.length})</span>
              </button>
            </div>
          </div>

          {/* Download Toast Notification */}
          {downloadProgress && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{downloadProgress}</span>
            </div>
          )}
        </div>

        {/* --- 3. BOTTOM: Asymmetric Editorial Magazine Grid --- */}
        {filteredPhotos.length === 0 ? (
          <div className="rounded-[28px] border-2 border-dashed border-[#EADDE0] bg-white p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#F1D5D5]/50 flex items-center justify-center mx-auto text-[#A85D70]">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#633C49]">
              No Photos Found
            </h3>
            <p className="text-xs sm:text-sm text-[#947A80]">
              {searchQuery
                ? `No photos matched "${searchQuery}". Try clearing your search.`
                : "No photos uploaded for this ceremony yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredPhotos.map((photo, index) => {
              // Asymmetric editorial centerfold feature cards
              const isCenterfold = (index % 6 === 0 && index !== 0) || photo.title.toLowerCase().includes("royal") || photo.title.toLowerCase().includes("grand");
              const isSelected = selectedIds.includes(photo.id);

              return (
                <div
                  key={photo.id}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelectPhoto(photo.id);
                    } else {
                      setLightboxIndex(index);
                    }
                  }}
                  className={`group photo-card-sheen relative rounded-2xl overflow-hidden bg-white border transition-all duration-300 cursor-pointer text-left shadow-rose-sm hover:shadow-[0_20px_45px_rgba(99,60,73,0.14)] ${
                    isCenterfold
                      ? "col-span-2 aspect-[16/10] sm:aspect-[16/9]"
                      : "aspect-[3/4]"
                  } ${
                    isSelected
                      ? "ring-2 ring-[#A85D70] border-[#A85D70]"
                      : "border-[#EADDE0] hover:border-[#D9B7A0]"
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.025] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    onError={(e) => {
                      if (photo.fallbackUrl && e.currentTarget.src !== photo.fallbackUrl) {
                        e.currentTarget.src = photo.fallbackUrl;
                      }
                    }}
                  />

                  {/* Top Overlay Controls */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                    {/* Ceremony / Centerfold Pill */}
                    <div className="flex items-center gap-1.5">
                      {isCenterfold && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#633C49]/85 backdrop-blur-md text-white border border-[#D9B7A0]/60 tracking-wider uppercase">
                          Centerfold Spread
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/80 backdrop-blur-md text-[#633C49] border border-white/40">
                        {photo.ceremony}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      {/* Checkbox for Select Mode */}
                      {isSelectMode && (
                        <button
                          type="button"
                          onClick={(e) => toggleSelectPhoto(photo.id, e)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                            isSelected
                              ? "bg-[#A85D70] text-white"
                              : "bg-white/90 backdrop-blur-md text-[#633C49]"
                          }`}
                        >
                          {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Square className="w-4 h-4 text-[#947A80]" />}
                        </button>
                      )}

                      {/* Favorite Heart Button with Micro-Bounce */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(photo.id, e)}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#A85D70] shadow-xs opacity-90 hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer"
                        title="Favorite photograph"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            favorites.includes(photo.id)
                              ? "fill-[#A85D70] text-[#A85D70]"
                              : "text-[#A85D70]"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Refined Sliding Editorial Tray on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end text-white pointer-events-none">
                    <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] space-y-1.5">
                      <h4 className="font-serif text-base sm:text-lg font-bold tracking-tight truncate text-white">
                        {photo.title}
                      </h4>
                      <p className="text-[11px] text-[#D9B7A0] truncate">
                        {photo.photographer || "Deventure Shimla Hills Studio Master"}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-emerald-300 flex items-center gap-1 font-medium bg-emerald-950/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {photo.facesCount === 1 ? "1 Person Available" : `${photo.facesCount || 1} Persons Available`}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                          Click to Expand
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Lightbox Modal with Carousel Controls & Restrained Entry */}
      {currentLightboxPhoto && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-[28px] overflow-hidden max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EADDE0]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EADDE0]">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#A85D70] uppercase tracking-wider">
                    {currentLightboxPhoto.ceremony} Ceremony
                  </span>
                  <span className="text-[10px] text-[#947A80]">
                    ({(lightboxIndex || 0) + 1} of {filteredPhotos.length})
                  </span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#633C49] truncate max-w-xs sm:max-w-md">
                  {currentLightboxPhoto.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(currentLightboxPhoto.id)}
                  className="p-2 rounded-full hover:bg-[#FFF8F3] text-[#A85D70] transition-colors cursor-pointer"
                  title="Favorite"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favorites.includes(currentLightboxPhoto.id)
                        ? "fill-[#A85D70] text-[#A85D70]"
                        : ""
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 rounded-full hover:bg-[#FFF8F3] text-[#765D62] transition-colors cursor-pointer"
                  title="Close Lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image with Carousel Arrows */}
            <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center p-2 min-h-[320px] max-h-[65vh]">
              <img
                src={currentLightboxPhoto.url}
                alt={currentLightboxPhoto.title}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />

              {/* Prev Button */}
              {filteredPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() => navigateLightbox(-1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg"
                  title="Previous photo (Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Next Button */}
              {filteredPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() => navigateLightbox(1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg"
                  title="Next photo (Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Footer & Download Action */}
            <div className="p-4 sm:p-5 border-t border-[#EADDE0] bg-[#FFF8F3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-[#765D62] flex items-center gap-2">
                <span>{currentLightboxPhoto.photographer || "Guest Live Upload"}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {currentLightboxPhoto.facesCount === 1 ? "1 Person Available" : `${currentLightboxPhoto.facesCount || 1} Persons Available`}
                </span>
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={currentLightboxPhoto.url}
                  download={`${currentLightboxPhoto.title || "wedding_photo"}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Master HD</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Guest Link Modal */}
      <ShareGuestLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};

export default FullWeddingGallery;
