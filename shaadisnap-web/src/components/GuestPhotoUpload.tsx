"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  Camera,
  Home,
  Search,
  Image as ImageIcon,
  Heart,
  Calendar,
  CheckCircle2,
  X,
  RefreshCw,
  Sliders,
  Trash2,
  Download,
  MapPin,
  ShieldCheck,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { WEDDING_EVENT, WeddingPhoto } from "@/data/mockWeddingData";
import { addUploadedPhoto, getWeddingPhotos, getPhotosForCurrentUser, clearUploadedPhotos, deleteUploadedPhoto } from "@/lib/weddingPhotoStore";
import { GoogleDriveImportModal } from "@/components/GoogleDriveImportModal";
import { getStoredGoogleUser, switchActiveUser, GoogleDriveUser } from "@/lib/googleAuth";
import { compressImage, formatBytes } from "@/lib/imageCompression";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // 20 MB

interface UploadFileItem {
  id: string;
  name: string;
  size: string;
  previewUrl: string;
  progress: number;
  status: "pending" | "compressing" | "uploading" | "completed" | "error";
  facesDetected?: number;
  sharpness?: number;
  rawFile?: File;
  compressedFile?: File;
  compressionRatio?: string;
  driveFileId?: string;
}

interface GuestPhotoUploadProps {
  onNavigate: (tab: "landing" | "search" | "upload") => void;
}

export const GuestPhotoUpload: React.FC<GuestPhotoUploadProps> = ({ onNavigate }) => {
  const [activeSidebarItem, setActiveSidebarItem] = useState<"upload" | "gallery" | "favorites" | "details">("upload");
  const [uploadFiles, setUploadFiles] = useState<UploadFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCeremony, setSelectedCeremony] = useState("Sangeet");
  const [galleryCeremony, setGalleryCeremony] = useState("All");
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [activeUser, setActiveUser] = useState<GoogleDriveUser | null>(() =>
    typeof window !== "undefined" ? getStoredGoogleUser() : null
  );
  const [liveStreamPhotos, setLiveStreamPhotos] = useState<WeddingPhoto[]>(() =>
    typeof window !== "undefined" ? getPhotosForCurrentUser() : []
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<WeddingPhoto | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync photos and auth user
  useEffect(() => {
    const handleSync = () => {
      setLiveStreamPhotos(getPhotosForCurrentUser());
      setActiveUser(getStoredGoogleUser());
    };
    handleSync();
    window.addEventListener("shaadisnap_photos_updated", handleSync);
    window.addEventListener("shaadisnap_google_auth_changed", handleSync);
    return () => {
      window.removeEventListener("shaadisnap_photos_updated", handleSync);
      window.removeEventListener("shaadisnap_google_auth_changed", handleSync);
    };
  }, []);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Compress image before upload to drastically reduce cloud & Google Drive storage consumption
  const uploadSingleItem = async (item: UploadFileItem) => {
    if (!item.rawFile) return;

    setUploadFiles((current) =>
      current.map((f) =>
        f.id === item.id ? { ...f, progress: 20, status: "uploading" } : f
      )
    );

    try {
      // High-efficiency in-browser compression (scaled to max 1920px 2K, quality 0.82)
      const compression = await compressImage(item.rawFile);
      const fileToUpload = compression.file;

      setUploadFiles((current) =>
        current.map((f) =>
          f.id === item.id
            ? {
                ...f,
                progress: 50,
                size: `${formatBytes(compression.compressedSize)} (${compression.savingsPercent}% saved)`,
              }
            : f
        )
      );

      const activeUser = getStoredGoogleUser();
      const uploaderEmail = activeUser?.email || "guest@maan-ai.com";

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("ceremony", selectedCeremony);
      formData.append("eventId", WEDDING_EVENT.id);
      formData.append("uploaderEmail", uploaderEmail);
      if (activeUser?.driveFolderId) {
        formData.append("driveFolderId", activeUser.driveFolderId);
      }

      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.fileId) {
        addUploadedPhoto({
          id: data.fileId,
          url: data.url,
          fallbackUrl: item.previewUrl,
          driveFileId: data.fileId,
          title: item.name,
          ceremony: selectedCeremony,
          photographer: "Guest Live Upload",
          uploaderEmail: uploaderEmail,
          driveFolderId: activeUser?.driveFolderId,
        });

        setUploadFiles((current) =>
          current.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  progress: 100,
                  status: "completed",
                  previewUrl: data.url,
                  driveFileId: data.fileId,
                }
              : f
          )
        );
      } else {
        setUploadFiles((current) =>
          current.map((f) =>
            f.id === item.id ? { ...f, progress: 0, status: "error" } : f
          )
        );
      }
    } catch {
      setUploadFiles((current) =>
        current.map((f) =>
          f.id === item.id ? { ...f, progress: 0, status: "error" } : f
        )
      );
    }
  };

  // Batch file processor with validation
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type);
      const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

      if (!isExtValid || (file.type && !isMimeValid)) {
        errors.push(`${file.name}: Invalid image format (JPG, PNG, WebP, HEIC supported).`);
        return;
      }
      if (file.size === 0) {
        errors.push(`${file.name}: File is empty.`);
        return;
      }
      if (file.size > MAX_UPLOAD_SIZE) {
        errors.push(`${file.name}: Exceeds 20MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      setUploadErrors(errors);
    } else {
      setUploadErrors([]);
    }

    if (validFiles.length === 0) return;

    const newItems: UploadFileItem[] = validFiles.map((f) => ({
      id: `up_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      previewUrl: URL.createObjectURL(f),
      progress: 0,
      status: "pending",
      facesDetected: Math.floor(Math.random() * 3) + 1,
      sharpness: Math.floor(Math.random() * 15) + 85,
      rawFile: f,
    }));

    setUploadFiles((prev) => [...newItems, ...prev]);
    newItems.forEach((item) => uploadSingleItem(item));
  };

  const startBatchUpload = async () => {
    setIsBatchUploading(true);
    for (const item of uploadFiles) {
      if (item.status !== "completed") {
        await uploadSingleItem(item);
      }
    }
    setIsBatchUploading(false);
  };

  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const filteredGalleryPhotos =
    galleryCeremony === "All"
      ? liveStreamPhotos
      : liveStreamPhotos.filter((p) => p.ceremony === galleryCeremony);

  const favoritePhotosList = liveStreamPhotos.filter((p) => favorites.includes(p.id));

  return (
    <div className="w-full bg-[#FFF8F3] text-[#765D62] flex flex-col md:flex-row rounded-3xl border border-[#EADDE0] shadow-[0_8px_30px_rgba(99,60,73,0.06)] overflow-hidden">
      
      {/* --- Left Sidebar (Dashboard) --- */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-[#EADDE0] flex flex-col justify-between p-3.5 sm:p-6 shrink-0">
        <div className="space-y-3.5 md:space-y-7">
          
          {/* Sidebar Event Badge */}
          <div className="space-y-1 pb-3 md:pb-4 border-b border-[#EADDE0]">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[#A85D70]">
              Active Event Gallery
            </span>
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#633C49] truncate">
              {WEDDING_EVENT.couple}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#947A80] truncate">
              {WEDDING_EVENT.venue}
            </p>
          </div>

          {/* Navigation Links: Responsive App Bar on Mobile, Vertical Stack on Desktop */}
          <nav className="flex md:flex-col items-center md:items-stretch gap-1.5 overflow-x-auto pb-1 md:pb-0 whitespace-nowrap" aria-label="Sidebar Menu">
            <button
              type="button"
              onClick={() => onNavigate("landing")}
              className="shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[#765D62] hover:text-[#633C49] hover:bg-[#FFF8F3] transition-colors cursor-pointer text-left"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A85D70]" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("search")}
              className="shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[#765D62] hover:text-[#633C49] hover:bg-[#FFF8F3] transition-colors cursor-pointer text-left"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A85D70]" />
              <span>Find My Photos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSidebarItem("upload")}
              className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer text-left ${
                activeSidebarItem === "upload"
                  ? "font-bold text-[#633C49] bg-[#F1D5D5]/50 border border-[#A85D70]/30 shadow-2xs"
                  : "font-medium text-[#765D62] hover:text-[#633C49] hover:bg-[#FFF8F3]"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A85D70]" />
              <span>Upload Photos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSidebarItem("gallery")}
              className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer text-left ${
                activeSidebarItem === "gallery"
                  ? "font-bold text-[#633C49] bg-[#F1D5D5]/50 border border-[#A85D70]/30 shadow-2xs"
                  : "font-medium text-[#765D62] hover:text-[#633C49] hover:bg-[#FFF8F3]"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A85D70]" />
              <span>My Gallery</span>
              <span className="ml-1 sm:ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#A85D70] border border-[#EADDE0]">
                {liveStreamPhotos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSidebarItem("favorites")}
              className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer text-left ${
                activeSidebarItem === "favorites"
                  ? "font-bold text-[#633C49] bg-[#F1D5D5]/50 border border-[#A85D70]/30 shadow-2xs"
                  : "font-medium text-[#765D62] hover:text-[#633C49] hover:bg-[#FFF8F3]"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${favorites.length > 0 ? "text-[#A85D70] fill-[#A85D70]" : "text-[#A85D70]"}`} />
              <span>Favorites</span>
              {favorites.length > 0 && (
                <span className="ml-1 sm:ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A85D70] text-white">
                  {favorites.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSidebarItem("details")}
              className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer text-left ${
                activeSidebarItem === "details"
                  ? "font-bold text-[#633C49] bg-[#F1D5D5]/50 border border-[#A85D70]/30 shadow-2xs"
                  : "font-medium text-[#765D62] hover:text-[#633C49] hover:bg-[#FFF8F3]"
              }`}
            >
              <Calendar className="w-4 h-4 text-[#A85D70]" />
              <span>Event Details</span>
            </button>
          </nav>
        </div>

        {/* Guest Profile Section at bottom of sidebar */}
        <div className="pt-4 mt-6 border-t border-[#EADDE0] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F1D5D5] border border-[#A85D70]/30 flex items-center justify-center font-bold text-[#633C49] text-sm">
            DG
          </div>
          <div className="truncate text-left">
            <p className="text-xs font-bold text-[#633C49] truncate">Dhairya Gulati</p>
            <p className="text-[11px] text-[#947A80] truncate">Mahine & Anand Wedding Celebration</p>
          </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10">
        <div className="max-w-4xl mx-auto space-y-8 text-left">
          
          {/* VIEW 1: UPLOAD PHOTOS */}
          {activeSidebarItem === "upload" && (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#633C49] tracking-tight">
                    Upload Wedding Photos
                  </h1>
                  <p className="text-sm sm:text-base text-[#765D62] mt-1">
                    Share your candid memories with the couple. Our facial engine automatically indexes guests.
                  </p>
                </div>

                {/* Event Access Code Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#EADDE0] text-xs font-semibold text-[#633C49] shadow-xs self-start sm:self-auto">
                  <span className="text-[#A85D70]">Access Code:</span>
                  <span className="font-mono text-[#633C49] font-bold">{WEDDING_EVENT.accessCode}</span>
                </div>
              </div>

              {/* Upload Validation Error Notice Banner */}
              {uploadErrors.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#F1D5D5]/60 border border-[#A85D70]/40 text-[#633C49] flex items-start justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#A85D70] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Upload Validation Notice</p>
                      <ul className="text-xs space-y-0.5 text-[#765D62]">
                        {uploadErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadErrors([])}
                    className="p-1 rounded-lg hover:bg-black/5 text-[#765D62] hover:text-[#633C49] transition-colors"
                    title="Dismiss notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Ceremony Selector Bar */}
              <div className="bg-white p-4 rounded-2xl border border-[#EADDE0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-rose-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#633C49]">
                  <Sliders className="w-4 h-4 text-[#A85D70]" />
                  <span>Tag Ceremony:</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {["Mehendi", "Haldi", "Sangeet", "Phere", "Reception"].map((c) => (
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
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[24px] p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[280px] ${
                  isDragging
                    ? "border-[#A85D70] bg-[#F1D5D5]/30 scale-[1.01]"
                    : "border-[#EADDE0] hover:border-[#A85D70] bg-white hover:bg-[#FFF8F3]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />

                <div className="w-16 h-16 rounded-full bg-[#F1D5D5]/50 flex items-center justify-center mb-4 border border-[#EADDE0] shadow-xs">
                  <UploadCloud className="w-8 h-8 text-[#A85D70]" />
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#633C49] mb-1.5">
                  Add Wedding Photos
                </h3>
                <p className="text-sm text-[#947A80] mb-6 max-w-md">
                  Snap new candid photos on your camera or select high-resolution images from your device gallery.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="px-6 py-3 rounded-full text-sm font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-6 py-3 rounded-full text-sm font-semibold text-[#633C49] bg-white hover:bg-[#FFF8F3] border border-[#EADDE0] hover:border-[#A85D70] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <ImageIcon className="w-4 h-4 text-[#A85D70]" />
                    <span>Choose From Gallery</span>
                  </button>
                </div>
              </div>

              {/* Upload Queue */}
              {uploadFiles.length > 0 && (
                <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EADDE0] space-y-4 shadow-rose-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EADDE0]">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#633C49]">
                        Upload Queue ({uploadFiles.length})
                      </h3>
                      <p className="text-xs text-[#947A80]">
                        Photos are securely indexed and placed in the wedding album.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isBatchUploading || uploadFiles.every((f) => f.status === "completed")}
                      onClick={startBatchUpload}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {isBatchUploading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload All</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {uploadFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#FFF8F3] border border-[#EADDE0]"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={file.previewUrl}
                            alt="Preview"
                            className="w-12 h-12 rounded-lg object-cover border border-[#EADDE0]"
                          />
                          <div>
                            <p className="text-sm font-bold text-[#633C49] truncate max-w-xs">
                              {file.name}
                            </p>
                            <span className="text-xs text-[#947A80] flex items-center gap-1.5 flex-wrap">
                              <span>{file.size}</span>
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#A85D70] bg-[#F1D5D5]/50 px-1.5 py-0.5 rounded border border-[#A85D70]/20">
                                Compressed 2K
                              </span>
                              <span>•</span>
                              <span>{selectedCeremony}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {file.status === "uploading" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#633C49] bg-white px-2.5 py-1 rounded-full border border-[#EADDE0]">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#A85D70]" />
                              Compressing & Uploading...
                            </span>
                          )}
                          {file.status === "completed" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Optimized & Stored
                            </span>
                          )}
                          {file.status === "error" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                              <X className="w-3.5 h-3.5" />
                              Upload Failed
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="p-1 rounded text-[#947A80] hover:text-red-700 hover:bg-white transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* VIEW 2: MY GALLERY */}
          {activeSidebarItem === "gallery" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#633C49] tracking-tight">
                    Wedding Photo Gallery
                  </h1>
                  <p className="text-sm text-[#765D62] mt-1">
                    All candid and official photographs from Mahine & Anand&apos;s celebration ({liveStreamPhotos.length} photos).
                  </p>
                </div>

                {liveStreamPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to clear cached photos?")) {
                        clearUploadedPhotos();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#765D62] hover:text-red-700 hover:bg-red-50 border border-[#EADDE0] transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Stream</span>
                  </button>
                )}
              </div>

              {/* Ceremony Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {["All", "Phere", "Sangeet", "Mehendi", "Haldi", "Reception"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setGalleryCeremony(c)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      galleryCeremony === c
                        ? "bg-[#A85D70] text-white shadow-xs"
                        : "bg-white text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredGalleryPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setLightboxPhoto(photo)}
                    className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-white border border-[#EADDE0] shadow-rose-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Delete Photo Button */}
                    <button
                      type="button"
                      title="Remove photograph"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUploadedPhoto(photo.id);
                        setLiveStreamPhotos(getPhotosForCurrentUser());
                      }}
                      className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-red-500 hover:text-red-700 shadow-xs opacity-90 hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Favorite Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(photo.id, e)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#A85D70] shadow-xs opacity-90 hover:scale-110 transition-transform cursor-pointer z-10"
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(photo.id) ? "fill-[#A85D70] text-[#A85D70]" : "text-[#A85D70]"}`} />
                    </button>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
                      <span className="text-[10px] font-semibold text-[#D9B7A0] uppercase tracking-wider">
                        {photo.ceremony}
                      </span>
                      <p className="text-xs font-bold truncate">
                        {photo.title}
                      </p>
                      <span className="text-[10px] text-emerald-300 flex items-center gap-1 mt-0.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {photo.facesCount === 1 ? "1 Person Available" : `${photo.facesCount || 1} Persons Available`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: FAVORITES */}
          {activeSidebarItem === "favorites" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#633C49] tracking-tight">
                  Your Favorite Photos ({favoritePhotosList.length})
                </h1>
                <p className="text-sm text-[#765D62] mt-1">
                  Wedding memories you have saved with a heart.
                </p>
              </div>

              {favoritePhotosList.length === 0 ? (
                <div className="rounded-[24px] border-2 border-dashed border-[#EADDE0] bg-white p-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#F1D5D5]/50 flex items-center justify-center mx-auto text-[#A85D70]">
                    <Heart className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#633C49]">
                    No Favorite Photos Yet
                  </h3>
                  <p className="text-sm text-[#947A80] max-w-sm mx-auto">
                    Click the heart icon on any photo in the gallery to save it here for fast viewing and downloading.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveSidebarItem("gallery")}
                    className="px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors cursor-pointer"
                  >
                    Browse Gallery
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {favoritePhotosList.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setLightboxPhoto(photo)}
                      className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-white border border-[#EADDE0] shadow-rose-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(photo.id, e)}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#A85D70] shadow-xs cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-[#A85D70] text-[#A85D70]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: EVENT DETAILS */}
          {activeSidebarItem === "details" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#633C49] tracking-tight">
                  Event & Wedding Details
                </h1>
                <p className="text-sm text-[#765D62] mt-1">
                  Complete itinerary, location guide, and gallery access configurations.
                </p>
              </div>

              {/* Event Overview Card */}
              <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#EADDE0] shadow-rose-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADDE0]">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-widest text-[#A85D70]">
                      Official Celebration
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#633C49] mt-0.5">
                      {WEDDING_EVENT.couple}
                    </h2>
                    <p className="text-sm text-[#947A80] flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-[#A85D70]" />
                      <span>{WEDDING_EVENT.venue}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs uppercase font-bold tracking-widest text-[#947A80]">
                      Dates
                    </span>
                    <p className="text-sm font-semibold text-[#633C49] flex items-center sm:justify-end gap-1.5 mt-0.5">
                      <Calendar className="w-4 h-4 text-[#A85D70]" />
                      <span>{WEDDING_EVENT.date}</span>
                    </p>
                  </div>
                </div>

                {/* Itinerary Grid */}
                <div>
                  <h3 className="font-serif text-base font-bold text-[#633C49] mb-4">
                    Ceremony Itinerary
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-xl bg-[#FFF8F3] border border-[#EADDE0] space-y-1">
                      <span className="font-bold text-[#633C49] block text-sm">Mehendi Ceremony</span>
                      <p className="text-[#947A80]">Henna rituals, pool deck, live dhol beats</p>
                      <span className="text-[11px] font-semibold text-[#A85D70]">Dec 14 • 11:00 AM</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FFF8F3] border border-[#EADDE0] space-y-1">
                      <span className="font-bold text-[#633C49] block text-sm">Haldi Celebration</span>
                      <p className="text-[#947A80]">Turmeric blessings with family & friends</p>
                      <span className="text-[11px] font-semibold text-[#A85D70]">Dec 14 • 4:00 PM</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FFF8F3] border border-[#EADDE0] space-y-1">
                      <span className="font-bold text-[#633C49] block text-sm">Sangeet & Cocktail Night</span>
                      <p className="text-[#947A80]">Dance performances, dinner & celebrations</p>
                      <span className="text-[11px] font-semibold text-[#A85D70]">Dec 15 • 7:30 PM</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FFF8F3] border border-[#EADDE0] space-y-1">
                      <span className="font-bold text-[#633C49] block text-sm">Varmala & Royal Phere</span>
                      <p className="text-[#947A80]">Twilight grand wedding rituals at palace lakefront</p>
                      <span className="text-[11px] font-semibold text-[#A85D70]">Dec 16 • 5:00 PM</span>
                    </div>
                  </div>
                </div>

                {/* Vault & Privacy Card */}
                <div className="p-4 rounded-xl bg-[#F1D5D5]/30 border border-[#A85D70]/20 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#477A5B] flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-[#633C49] block">
                      Protected Private Biometric Vault
                    </span>
                    <span className="text-[#765D62]">
                      Face matching complies with India DPDP Act 2023 & GDPR Art. 9. Ephemeral zero-retention matching.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-[24px] overflow-hidden shadow-2xl border border-[#EADDE0] flex flex-col"
          >
            <div className="p-4 border-b border-[#EADDE0] flex items-center justify-between">
              <div>
                <h4 className="font-serif text-base font-bold text-[#633C49]">{lightboxPhoto.title}</h4>
                <span className="text-xs text-[#947A80]">{lightboxPhoto.ceremony} Ceremony</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1 rounded-full text-[#765D62] hover:bg-[#FFF8F3] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex-1 bg-black/5 flex items-center justify-center p-4 overflow-hidden">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-sm"
              />
            </div>

            <div className="p-4 border-t border-[#EADDE0] flex items-center justify-between bg-[#FFF8F3]">
              <button
                type="button"
                onClick={(e) => toggleFavorite(lightboxPhoto.id, e)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#633C49] bg-white border border-[#EADDE0] hover:border-[#A85D70] transition-colors cursor-pointer"
              >
                <Heart className={`w-3.5 h-3.5 ${favorites.includes(lightboxPhoto.id) ? "fill-[#A85D70] text-[#A85D70]" : "text-[#A85D70]"}`} />
                <span>{favorites.includes(lightboxPhoto.id) ? "Favorited" : "Favorite"}</span>
              </button>

              <a
                href={lightboxPhoto.url}
                download={`${lightboxPhoto.title || "wedding_photo"}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download High-Res</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
