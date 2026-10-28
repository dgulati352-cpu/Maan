"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  Camera,
  Home,
  Search,
  Image as ImageIcon,
  Heart,
  Calendar,
  User,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
  Info,
  Sliders,
  FileCheck,
  AlertCircle,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { WEDDING_EVENT, WeddingPhoto } from "@/data/mockWeddingData";
import { addUploadedPhoto, getWeddingPhotos, clearUploadedPhotos } from "@/lib/weddingPhotoStore";

interface UploadFileItem {
  id: string;
  name: string;
  size: string;
  previewUrl: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  facesDetected?: number;
  sharpness?: number;
  rawFile?: File;
  driveFileId?: string;
}

interface GuestPhotoUploadProps {
  onNavigate: (tab: "landing" | "search" | "upload") => void;
}

export const GuestPhotoUpload: React.FC<GuestPhotoUploadProps> = ({ onNavigate }) => {
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>("upload");
  const [uploadFiles, setUploadFiles] = useState<UploadFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCeremony, setSelectedCeremony] = useState("Sangeet");
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [liveStreamPhotos, setLiveStreamPhotos] = useState<WeddingPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync live uploaded photos
  React.useEffect(() => {
    setLiveStreamPhotos(getWeddingPhotos());
    const handleSync = () => setLiveStreamPhotos(getWeddingPhotos());
    window.addEventListener("shaadisnap_photos_updated", handleSync);
    return () => window.removeEventListener("shaadisnap_photos_updated", handleSync);
  }, []);

  // Upload a single file item to Google Drive via backend API
  const uploadSingleItem = async (item: UploadFileItem) => {
    if (!item.rawFile) return;

    setUploadFiles((current) =>
      current.map((f) =>
        f.id === item.id ? { ...f, progress: 40, status: "uploading" } : f
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", item.rawFile);
      formData.append("ceremony", selectedCeremony);

      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.fileId) {
        // Add to persistent wedding album so all pages show it!
        addUploadedPhoto({
          id: data.fileId,
          url: data.url,
          fallbackUrl: item.previewUrl,
          driveFileId: data.fileId,
          title: item.name,
          ceremony: selectedCeremony,
          photographer: "Guest Live Upload",
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
    } catch (err) {
      console.error("Upload error:", err);
      setUploadFiles((current) =>
        current.map((f) =>
          f.id === item.id ? { ...f, progress: 0, status: "error" } : f
        )
      );
    }
  };

  // Handle files added & trigger instant upload
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadFileItem[] = [];
    Array.from(files).forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

      const item: UploadFileItem = {
        id: `file_${Date.now()}_${index}`,
        name: file.name,
        size: `${sizeMb} MB`,
        previewUrl: url,
        progress: 10,
        status: "uploading",
        facesDetected: Math.floor(Math.random() * 3) + 1,
        sharpness: Math.floor(Math.random() * 25) + 75,
        rawFile: file,
      };

      newItems.push(item);
    });

    setUploadFiles((prev) => [...newItems, ...prev]);

    // Automatically begin uploading to Google Drive immediately!
    newItems.forEach((item) => {
      uploadSingleItem(item);
    });
  };

  // Manual batch retry for any pending/error items
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

  return (
    <div className="min-h-screen bg-[#F8F5EF] flex">
      
      {/* --- Left Sidebar (Dashboard) --- */}
      <aside className="w-64 bg-white border-r border-[#DED5C8] hidden md:flex flex-col justify-between p-6">
        <div className="space-y-8">
          
          {/* Sidebar Event Badge */}
          <div className="space-y-1 pb-4 border-b border-[#DED5C8]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#C6A76A]">
              Active Event Gallery
            </span>
            <h2 className="font-serif text-lg font-bold text-[#242321] truncate">
              {WEDDING_EVENT.couple}
            </h2>
            <p className="text-xs text-[#716B63] truncate">
              {WEDDING_EVENT.venue}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => onNavigate("landing")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#716B63] hover:text-[#242321] hover:bg-[#F8F5EF] transition-colors"
            >
              <Home className="w-4 h-4 text-[#C6A76A]" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onNavigate("search")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#716B63] hover:text-[#242321] hover:bg-[#F8F5EF] transition-colors"
            >
              <Search className="w-4 h-4 text-[#C6A76A]" />
              <span>Find My Photos</span>
            </button>

            <button
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-[#873F50] bg-[#E8DDD0]/50 border border-[#C6A76A]/30 transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-[#873F50]" />
              <span>Upload Photos</span>
            </button>

            <button
              onClick={() => onNavigate("landing")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#716B63] hover:text-[#242321] hover:bg-[#F8F5EF] transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-[#C6A76A]" />
              <span>My Gallery</span>
            </button>

            <button
              onClick={() => onNavigate("landing")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#716B63] hover:text-[#242321] hover:bg-[#F8F5EF] transition-colors"
            >
              <Heart className="w-4 h-4 text-[#C6A76A]" />
              <span>Favorites</span>
            </button>

            <button
              onClick={() => onNavigate("landing")}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#716B63] hover:text-[#242321] hover:bg-[#F8F5EF] transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#C6A76A]" />
              <span>Event Details</span>
            </button>
          </nav>
        </div>

        {/* Guest Profile Section at bottom of sidebar */}
        <div className="pt-4 border-t border-[#DED5C8] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E8DDD0] border border-[#C6A76A]/40 flex items-center justify-center font-bold text-[#873F50] text-sm">
            AS
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-[#242321] truncate">Ananya Sharma</p>
            <p className="text-[11px] text-[#716B63] truncate">Guest • Sister of Bride</p>
          </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#242321] tracking-tight">
                Upload Wedding Photos
              </h1>
              <p className="text-sm sm:text-base text-[#716B63] mt-1">
                Share your candid memories with the couple. Our AI automatically tags and sorts faces.
              </p>
            </div>

            {/* Event Access Code Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#DED5C8] text-xs font-semibold text-[#242321] shadow-xs self-start sm:self-auto">
              <span className="text-[#C6A76A]">Access Code:</span>
              <span className="font-mono text-[#873F50] font-bold">{WEDDING_EVENT.accessCode}</span>
            </div>
          </div>

          {/* Ceremony Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#DED5C8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#242321]">
              <Sliders className="w-4 h-4 text-[#C6A76A]" />
              <span>Tag Ceremony:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {["Mehendi", "Haldi", "Sangeet", "Phere", "Reception"].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCeremony(c)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCeremony === c
                      ? "bg-[#873F50] text-white"
                      : "bg-[#F8F5EF] text-[#716B63] hover:text-[#242321] border border-[#DED5C8]"
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
            className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[280px] ${
              isDragging
                ? "border-[#873F50] bg-[#E8DDD0]/50 scale-[1.01]"
                : "border-[#DED5C8] hover:border-[#C6A76A] bg-white hover:bg-[#F8F5EF]"
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

            {/* Direct Camera capture for mobile/event guests */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="w-18 h-18 rounded-full bg-[#E8DDD0] flex items-center justify-center mb-5 border border-[#C6A76A]/40 shadow-xs">
              <UploadCloud className="w-9 h-9 text-[#873F50]" />
            </div>

            <h3 className="font-serif text-2xl font-bold text-[#242321] mb-2">
              Add Wedding Photos
            </h3>
            <p className="text-sm text-[#716B63] mb-6 max-w-md">
              Snap new candid photos on your camera or select high-resolution images from your device gallery.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="px-6 py-3 rounded-full text-sm font-semibold text-white bg-[#873F50] hover:bg-[#733443] shadow-md transition-all active:scale-98 flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#E8DDD0]" />
                <span>Take Photo with Camera</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-6 py-3 rounded-full text-sm font-semibold text-[#242321] bg-white hover:bg-[#F8F5EF] border border-[#DED5C8] hover:border-[#C6A76A] shadow-xs transition-all active:scale-98 flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4 text-[#C6A76A]" />
                <span>Browse Gallery</span>
              </button>
            </div>

            <span className="text-xs text-[#716B63] mt-4">
              Supported formats: JPG, PNG, WebP, HEIC (Up to 50MB per photo)
            </span>
          </div>

          {/* Active Upload Files List */}
          {uploadFiles.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DED5C8] space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-[#DED5C8]">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#C6A76A]" />
                  <h3 className="font-serif text-lg font-bold text-[#242321]">
                    Selected Photos ({uploadFiles.length})
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUploadFiles([])}
                    className="text-xs font-semibold text-[#716B63] hover:text-red-700"
                  >
                    Clear All
                  </button>
                  <button
                    disabled={isBatchUploading || uploadFiles.every((f) => f.status === "completed")}
                    onClick={startBatchUpload}
                    className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#873F50] hover:bg-[#733443] disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    {isBatchUploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload All Photos</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {uploadFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#F8F5EF] border border-[#DED5C8]"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={file.previewUrl}
                        alt="Preview"
                        className="w-14 h-14 rounded-xl object-cover border border-[#DED5C8]"
                      />
                      <div>
                        <p className="text-sm font-bold text-[#242321] truncate max-w-xs sm:max-w-sm">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#716B63] mt-0.5">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span className="text-[#C6A76A] font-semibold">{selectedCeremony}</span>
                          <span>•</span>
                          <span className="text-emerald-700 flex items-center gap-1 font-medium">
                            <Sparkles className="w-3 h-3" />
                            {file.facesDetected} Faces Detected
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Status Controls */}
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                      {file.status === "uploading" && (
                        <div className="w-32 bg-[#DED5C8] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#873F50] h-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}

                      {file.status === "completed" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Indexed
                        </span>
                      )}

                      {file.status === "error" && (
                        <button
                          onClick={() => uploadSingleItem(file)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 hover:bg-red-100"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Retry Upload
                        </button>
                      )}

                      {file.status === "pending" && (
                        <span className="text-xs font-medium text-[#716B63]">
                          Ready
                        </span>
                      )}

                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 rounded-lg text-[#716B63] hover:text-red-700 hover:bg-white transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Live Wedding Gallery Stream connected to Google Drive */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DED5C8] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DED5C8]">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#E8DDD0] text-[10px] font-bold text-[#873F50] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-[#C6A76A]" />
                  Live Google Drive Album
                </div>
                <h3 className="font-serif text-xl font-bold text-[#242321]">
                  Live Wedding Photo Stream ({liveStreamPhotos.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {liveStreamPhotos.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear locally cached uploaded photos?")) {
                        clearUploadedPhotos();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-[#716B63] hover:text-red-700 hover:bg-red-50 border border-[#DED5C8] transition-all"
                    title="Clear cached photos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Stream</span>
                  </button>
                )}

                <a
                  href={WEDDING_EVENT.googleDriveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[#873F50] bg-[#F8F5EF] hover:bg-[#E8DDD0] border border-[#DED5C8] transition-all"
                >
                  <span>Open Google Drive Folder</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {liveStreamPhotos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#DED5C8] bg-[#F8F5EF] p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-[#242321]">
                  No photos uploaded to this wedding album yet
                </p>
                <p className="text-xs text-[#716B63]">
                  Use the camera or gallery button above to upload the first memories!
                </p>
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  liveStreamPhotos.length === 1
                    ? "grid-cols-1 max-w-sm mx-auto"
                    : liveStreamPhotos.length === 2
                    ? "grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                }`}
              >
                {liveStreamPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-[#F8F5EF] border border-[#DED5C8] shadow-xs"
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        if (photo.fallbackUrl && e.currentTarget.src !== photo.fallbackUrl) {
                          e.currentTarget.src = photo.fallbackUrl;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                      <span className="text-[10px] font-semibold text-[#E8DDD0] uppercase tracking-wider">
                        {photo.ceremony}
                      </span>
                      <p className="text-xs font-bold text-white truncate">
                        {photo.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Tips Panel with 4 Icons */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DED5C8] space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#242321] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#C6A76A]" />
              <span>Wedding Photo Upload Guidelines</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#716B63]">
              <div className="p-3.5 rounded-xl bg-[#F8F5EF] border border-[#DED5C8]/80">
                <span className="font-bold text-[#242321] block mb-1">
                  1. Uncompressed Quality
                </span>
                Upload original resolution photos so face recognition can accurately align micro-features.
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F5EF] border border-[#DED5C8]/80">
                <span className="font-bold text-[#242321] block mb-1">
                  2. Group Candids Welcome
                </span>
                Our multi-face detection parses every subject in Baraat and dance floor group photographs.
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F5EF] border border-[#DED5C8]/80">
                <span className="font-bold text-[#242321] block mb-1">
                  3. Tag Ceremony Correctly
                </span>
                Tagging (Haldi, Sangeet, Phere) keeps the couple&apos;s digital storybook categorized.
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F5EF] border border-[#DED5C8]/80">
                <span className="font-bold text-[#242321] block mb-1">
                  4. Privacy Protection
                </span>
                Only authorized wedding guests and the couple can discover and access these memories.
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
