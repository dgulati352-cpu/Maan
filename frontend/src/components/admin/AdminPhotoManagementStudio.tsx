"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  UploadCloud,
  FolderUp,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Filter,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  ExternalLink,
  Sliders,
  FolderOpen,
  Plus,
  Play,
  Pause,
  X,
  Layers,
  HardDrive,
  Users,
  ShieldCheck,
  Check,
  ChevronDown,
  Info,
  Maximize2,
  Download,
} from "lucide-react";
import { useGooglePicker, GooglePickerItem } from "@/lib/useGooglePicker";
import { WEDDING_EVENT } from "@/data/mockWeddingData";
import { addUploadedPhoto, deleteUploadedPhoto } from "@/lib/weddingPhotoStore";

export interface AdminPhotoItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  fileHash: string;
  sizeBytes: number;
  sizeFormatted: string;
  mimeType: string;
  ceremony: string;
  album: string;
  source: "computer" | "folder_drag" | "google_drive";
  driveFileId?: string;
  driveFolderName?: string;
  processingStatus: "PENDING" | "UPLOADING" | "IMPORTING" | "PROCESSING" | "COMPLETED" | "FAILED";
  facesDetected: number;
  facesIndexed: number;
  approvalStatus: "approved" | "pending_ceo_approval" | "rejected";
  errorMessage?: string;
  createdAt: string;
}

export interface AlbumItem {
  id: string;
  name: string;
  ceremony: string;
  description?: string;
  photoCount: number;
}

export interface AnalyticsData {
  totalPhotos: number;
  successfullyUploaded: number;
  importedFromGoogleDrive: number;
  completedPhotos: number;
  pendingUploads: number;
  failedUploads: number;
  processingPhotos: number;
  indexedFaces: number;
  storageConsumedFormatted: string;
  aiProcessingProgressPercent: number;
  approvedCount: number;
  pendingCeoApprovalCount: number;
}

interface UploadTask {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  progress: number;
  status: "PENDING" | "UPLOADING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PAUSED" | "DUPLICATE";
  error?: string;
  abortController?: AbortController;
  photoId?: string;
}

export const AdminPhotoManagementStudio: React.FC = () => {
  // State
  const [photos, setPhotos] = useState<AdminPhotoItem[]>([]);
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCeremony, setSelectedCeremony] = useState<string>("All");
  const [selectedAlbum, setSelectedAlbum] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Selection & Actions
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<AdminPhotoItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Upload Queue State
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [targetCeremony, setTargetCeremony] = useState<string>("Sangeet");
  const [targetAlbum, setTargetAlbum] = useState<string>("Sangeet Musical Night");

  // New Album Modal
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState<boolean>(false);
  const [newAlbumName, setNewAlbumName] = useState<string>("");
  const [newAlbumCeremony, setNewAlbumCeremony] = useState<string>("Reception");
  const [newAlbumDescription, setNewAlbumDescription] = useState<string>("");

  // Drive Import State
  const [driveImportStatus, setDriveImportStatus] = useState<{
    inProgress: boolean;
    total: number;
    current: number;
    message: string;
  } | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Google Picker Hook
  const { openPicker, isAuthenticating } = useGooglePicker({
    onSelected: async (items, token) => {
      await handleDriveImportSelected(items, token);
    },
    onError: (err) => {
      showToast(`Google Drive: ${err}`, "error");
    },
  });

  // Fetch photos & analytics
  const refreshData = useCallback(async () => {
    try {
      const [photosRes, albumsRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/photos"),
        fetch("/api/admin/albums"),
        fetch("/api/admin/photos/analytics"),
      ]);

      if (photosRes.ok) {
        const pData = await photosRes.json();
        if (pData.success) setPhotos(pData.photos);
      }

      if (albumsRes.ok) {
        const aData = await albumsRes.json();
        if (aData.success) setAlbums(aData.albums);
      }

      if (analyticsRes.ok) {
        const anData = await analyticsRes.json();
        if (anData.success) setAnalytics(anData.analytics);
      }
    } catch (err) {
      console.warn("Failed fetching admin data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Compute Client SHA-256 for duplicate check
  const computeFileSha256 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // Enqueue Files
  const enqueueFiles = async (files: FileList | File[], source: "computer" | "folder_drag") => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newTasks: UploadTask[] = fileArray.map((file) => ({
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      file,
      name: file.name,
      sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      progress: 0,
      status: "PENDING",
    }));

    setUploadQueue((prev) => [...prev, ...newTasks]);
    showToast(`Added ${newTasks.length} photo${newTasks.length === 1 ? "" : "s"} to upload queue.`, "info");

    // Automatically trigger processing
    processQueue(newTasks, source);
  };

  // Process Upload Queue sequentially
  const processQueue = async (tasks: UploadTask[], source: "computer" | "folder_drag") => {
    setIsUploading(true);

    for (const task of tasks) {
      const abortController = new AbortController();

      setUploadQueue((current) =>
        current.map((t) =>
          t.id === task.id ? { ...t, status: "UPLOADING", progress: 20, abortController } : t
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", task.file);
        formData.append("ceremony", targetCeremony);
        formData.append("album", targetAlbum);
        formData.append("eventId", WEDDING_EVENT.id);
        formData.append("source", source);
        formData.append("uploaderEmail", "admin@maan-ai.com");

        const res = await fetch("/api/admin/photos", {
          method: "POST",
          body: formData,
          signal: abortController.signal,
        });

        const data = await res.json();

        if (data.success) {
          if (data.isDuplicate) {
            setUploadQueue((current) =>
              current.map((t) =>
                t.id === task.id
                  ? { ...t, status: "DUPLICATE", progress: 100, error: "Duplicate photo already exists" }
                  : t
              )
            );
          } else {
            setUploadQueue((current) =>
              current.map((t) =>
                t.id === task.id
                  ? { ...t, status: "COMPLETED", progress: 100, photoId: data.photo?.id }
                  : t
              )
            );

            // Sync with local weddingPhotoStore for immediate gallery reflection
            if (data.photo) {
              addUploadedPhoto({
                id: data.photo.id,
                url: data.photo.url,
                fallbackUrl: data.photo.thumbnailUrl,
                title: data.photo.filename,
                ceremony: data.photo.ceremony,
                photographer: "Admin Master Upload",
                approvalStatus: "approved",
              });
            }
          }
        } else {
          setUploadQueue((current) =>
            current.map((t) =>
              t.id === task.id ? { ...t, status: "FAILED", progress: 0, error: data.error || "Upload failed" } : t
            )
          );
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          setUploadQueue((current) =>
            current.map((t) => (t.id === task.id ? { ...t, status: "PAUSED", error: "Upload paused" } : t))
          );
        } else {
          setUploadQueue((current) =>
            current.map((t) =>
              t.id === task.id ? { ...t, status: "FAILED", progress: 0, error: err.message || "Network error" } : t
            )
          );
        }
      }
    }

    setIsUploading(false);
    refreshData();
  };

  // Pause / Resume Task
  const togglePauseTask = (task: UploadTask) => {
    if (task.status === "UPLOADING" && task.abortController) {
      task.abortController.abort();
    } else if (task.status === "PAUSED" || task.status === "FAILED") {
      processQueue([task], "computer");
    }
  };

  // Retry single task
  const retryTask = (task: UploadTask) => {
    processQueue([task], "computer");
  };

  // Retry all failed
  const retryAllFailed = () => {
    const failedTasks = uploadQueue.filter((t) => t.status === "FAILED");
    if (failedTasks.length > 0) {
      processQueue(failedTasks, "computer");
    }
  };

  // Clear completed from queue
  const clearCompletedTasks = () => {
    setUploadQueue((current) => current.filter((t) => t.status !== "COMPLETED" && t.status !== "DUPLICATE"));
  };

  // Handle Google Drive Import
  const handleDriveImportSelected = async (items: GooglePickerItem[], token: string) => {
    if (items.length === 0) return;

    setDriveImportStatus({
      inProgress: true,
      total: items.length,
      current: 0,
      message: `Connecting to Google Drive and scanning ${items.length} item(s)...`,
    });

    try {
      const res = await fetch("/api/google-drive/picker-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: token,
          items,
          ceremony: targetCeremony,
          album: targetAlbum,
          eventId: WEDDING_EVENT.id,
          uploaderEmail: "admin@maan-ai.com",
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(
          `Google Drive Import Complete: ${data.completedCount} imported, ${data.duplicateCount} duplicates skipped.`,
          "success"
        );
        refreshData();
      } else {
        showToast(`Drive Import Error: ${data.error}`, "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import from Drive";
      showToast(msg, "error");
    } finally {
      setDriveImportStatus(null);
    }
  };

  // Create Album Handler
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    try {
      const res = await fetch("/api/admin/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAlbumName.trim(),
          ceremony: newAlbumCeremony,
          description: newAlbumDescription,
          eventId: WEDDING_EVENT.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Album "${data.album.name}" created successfully.`, "success");
        setIsAlbumModalOpen(false);
        setNewAlbumName("");
        setNewAlbumDescription("");
        refreshData();
      } else {
        showToast(data.error || "Failed to create album", "error");
      }
    } catch (err) {
      showToast("Network error creating album", "error");
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedPhotoIds.length === 0) return;
    const confirm = window.confirm(
      `Permanently delete ${selectedPhotoIds.length} selected photograph(s) from storage and live galleries?`
    );
    if (!confirm) return;

    try {
      const res = await fetch("/api/admin/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedPhotoIds }),
      });

      const data = await res.json();
      if (data.success) {
        // Also remove from local weddingPhotoStore
        selectedPhotoIds.forEach((id) => deleteUploadedPhoto(id));
        showToast(`Deleted ${data.deletedCount} photo(s).`, "success");
        setSelectedPhotoIds([]);
        refreshData();
      }
    } catch {
      showToast("Error deleting selected photos", "error");
    }
  };

  // Batch Approve
  const handleBatchApprove = async () => {
    if (selectedPhotoIds.length === 0) return;
    try {
      const res = await fetch("/api/admin/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", ids: selectedPhotoIds }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Approved ${data.approvedCount} photo(s) for public VIP gallery.`, "success");
        setSelectedPhotoIds([]);
        refreshData();
      }
    } catch {
      showToast("Error approving photos", "error");
    }
  };

  // Filtered Photos List
  const filteredPhotos = photos.filter((photo) => {
    if (selectedCeremony !== "All" && photo.ceremony.toLowerCase() !== selectedCeremony.toLowerCase()) {
      return false;
    }
    if (selectedAlbum !== "All" && photo.album.toLowerCase() !== selectedAlbum.toLowerCase()) {
      return false;
    }
    if (selectedSource !== "all" && photo.source !== selectedSource) {
      return false;
    }
    if (selectedStatus !== "all" && photo.processingStatus !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        photo.filename.toLowerCase().includes(q) ||
        photo.ceremony.toLowerCase().includes(q) ||
        photo.album.toLowerCase().includes(q) ||
        (photo.driveFolderName && photo.driveFolderName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const allFilteredSelected =
    filteredPhotos.length > 0 && selectedPhotoIds.length === filteredPhotos.length;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(filteredPhotos.map((p) => p.id));
    }
  };

  const toggleSelectPhoto = (id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="alert"
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold border transition-all ${
            toastMessage.type === "success"
              ? "bg-[#633C49] text-white border-[#A85D70]"
              : toastMessage.type === "error"
              ? "bg-rose-900 text-white border-rose-700"
              : "bg-white text-[#633C49] border-[#EADDE0]"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-[#D9B7A0]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/70 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Section F: 7 Key Analytics Cards */}
      <section aria-label="Photo Management Analytics">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
          {/* Card 1: Total */}
          <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-xs">
            <div className="flex items-center justify-between text-[#947A80] mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Total Photos</span>
              <ImageIcon className="w-3.5 h-3.5 text-[#A85D70]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#633C49]">
              {analytics ? analytics.totalPhotos : photos.length}
            </div>
            <span className="text-[10px] text-[#765D62]">Master Event Vault</span>
          </div>

          {/* Card 2: Uploaded Computer */}
          <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-xs">
            <div className="flex items-center justify-between text-[#947A80] mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Uploaded</span>
              <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#633C49]">
              {analytics ? analytics.successfullyUploaded : photos.filter((p) => p.source !== "google_drive").length}
            </div>
            <span className="text-[10px] text-[#765D62]">Local &amp; Folders</span>
          </div>

          {/* Card 3: Google Drive */}
          <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-xs">
            <div className="flex items-center justify-between text-[#947A80] mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">From Drive</span>
              <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#633C49]">
              {analytics ? analytics.importedFromGoogleDrive : photos.filter((p) => p.source === "google_drive").length}
            </div>
            <span className="text-[10px] text-[#765D62]">Picker &amp; Folders</span>
          </div>

          {/* Card 4: Pending / In-Flight */}
          <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-xs">
            <div className="flex items-center justify-between text-[#947A80] mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">In-Flight</span>
              <RefreshCw className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#633C49]">
              {uploadQueue.filter((t) => t.status === "UPLOADING" || t.status === "PENDING").length}
            </div>
            <span className="text-[10px] text-[#765D62]">Active Queue</span>
          </div>

          {/* Card 5: Failed */}
          <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-xs">
            <div className="flex items-center justify-between text-[#947A80] mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Failed</span>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="font-serif text-2xl font-bold text-rose-700">
              {uploadQueue.filter((t) => t.status === "FAILED").length}
            </div>
            <span className="text-[10px] text-[#765D62]">Requires Retry</span>
          </div>

          {/* Card 6: Faces Indexed */}
          <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-xs">
            <div className="flex items-center justify-between text-[#947A80] mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Indexed Faces</span>
              <Users className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#633C49]">
              {analytics ? analytics.indexedFaces : photos.reduce((acc, p) => acc + (p.facesIndexed || 0), 0)}
            </div>
            <span className="text-[10px] text-[#765D62]">ArcFace 512-d</span>
          </div>

          {/* Card 7: Storage */}
          <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-xs">
            <div className="flex items-center justify-between text-[#947A80] mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Storage</span>
              <HardDrive className="w-3.5 h-3.5 text-[#A85D70]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#633C49] truncate">
              {analytics ? analytics.storageConsumedFormatted : "1.8 MB"}
            </div>
            <span className="text-[10px] text-[#765D62]">Encrypted GCS</span>
          </div>
        </div>
      </section>

      {/* Dual Upload Station (Computer & Google Drive) */}
      <section className="bg-white rounded-3xl p-6 border border-[#EADDE0] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EADDE0] pb-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#633C49] flex items-center gap-2.5">
              <span>Photo Ingestion Hub</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-[#F1D5D5] text-[#633C49] px-2.5 py-0.5 rounded-full">
                AI Auto-Indexing
              </span>
            </h2>
            <p className="text-xs text-[#765D62] mt-0.5">
              Upload from your computer, drag entire folders, or connect Google Drive with one-click folder sync.
            </p>
          </div>

          {/* Ingestion Target Selectors (Ceremony & Album) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-[#FFF8F3] px-3 py-1.5 rounded-xl border border-[#EADDE0]">
              <span className="text-[10px] uppercase font-bold text-[#947A80]">Ceremony:</span>
              <select
                value={targetCeremony}
                onChange={(e) => setTargetCeremony(e.target.value)}
                className="text-xs font-semibold text-[#633C49] bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="Mehendi">Mehendi</option>
                <option value="Haldi">Haldi</option>
                <option value="Sangeet">Sangeet</option>
                <option value="Phere">Phere (Wedding)</option>
                <option value="Reception">Reception</option>
                <option value="Cocktail">Cocktail</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#FFF8F3] px-3 py-1.5 rounded-xl border border-[#EADDE0]">
              <span className="text-[10px] uppercase font-bold text-[#947A80]">Album:</span>
              <select
                value={targetAlbum}
                onChange={(e) => setTargetAlbum(e.target.value)}
                className="text-xs font-semibold text-[#633C49] bg-transparent border-none focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                {albums.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
                <option value="General Celebration">General Celebration</option>
              </select>
              <button
                type="button"
                onClick={() => setIsAlbumModalOpen(true)}
                title="Create New Album"
                className="p-1 rounded-md text-[#A85D70] hover:bg-[#F1D5D5] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Upload Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card A: Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files) {
                enqueueFiles(e.dataTransfer.files, "folder_drag");
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
              isDragOver
                ? "border-[#A85D70] bg-[#F1D5D5]/30 scale-[0.99]"
                : "border-[#EADDE0] hover:border-[#D9B7A0] bg-[#FFF8F3]/60"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#EADDE0] flex items-center justify-center shadow-xs text-[#A85D70] mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-bold text-[#633C49]">
              Drag &amp; Drop Photos or Folders
            </h3>
            <p className="text-xs text-[#765D62] mt-1 max-w-sm">
              Supports high-resolution JPG, JPEG, PNG, WEBP, and HEIC up to 50MB per file.
            </p>

            <div className="flex items-center gap-3 mt-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) enqueueFiles(e.target.files, "computer");
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Select Photos</span>
              </button>

              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore - webkitdirectory is standard in Chromium / WebKit
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) enqueueFiles(e.target.files, "folder_drag");
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#633C49] bg-white border border-[#EADDE0] hover:border-[#A85D70] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <FolderUp className="w-4 h-4 text-[#A85D70]" />
                <span>Upload Bulk Folder</span>
              </button>
            </div>
          </div>

          {/* Card B: Google Drive & Google Picker Integration */}
          <div className="border border-[#EADDE0] rounded-2xl p-6 bg-gradient-to-br from-white via-[#FFF8F3] to-[#F1D5D5]/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EADDE0] flex items-center justify-center shadow-xs">
                    <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
                      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#633C49]">
                      Google Drive &amp; Picker Sync
                    </h3>
                    <span className="text-[10px] text-[#947A80] font-semibold">
                      Least-Privilege Readonly OAuth 2.0
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Ready
                </span>
              </div>

              <p className="text-xs text-[#765D62] leading-relaxed">
                Connect your wedding photographer&apos;s Google Drive to select individual photo batches or complete folders. All files are permanently downloaded into private encrypted storage and indexed into the AI face matching database.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openPicker()}
                disabled={isAuthenticating || Boolean(driveImportStatus?.inProgress)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#633C49] hover:bg-[#4E2E39] disabled:opacity-50 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {isAuthenticating ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#D9B7A0]" />
                ) : (
                  <FolderOpen className="w-4 h-4 text-[#D9B7A0]" />
                )}
                <span>{isAuthenticating ? "Authenticating Google..." : "Open Google Picker & Import"}</span>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-[#947A80]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Zero Public Model Training</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Drive Import Telemetry Progress Banner */}
        {driveImportStatus?.inProgress && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>{driveImportStatus.message}</span>
              </div>
              <span>Processing Streams...</span>
            </div>
            <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
              <div className="bg-amber-600 h-2 rounded-full w-2/3 animate-pulse" />
            </div>
          </div>
        )}

        {/* Upload Queue Section (Shows when files are being uploaded) */}
        {uploadQueue.length > 0 && (
          <div className="border border-[#EADDE0] rounded-2xl p-4 bg-[#FFF8F3] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#633C49]">
                  Live Upload Queue ({uploadQueue.length})
                </span>
                {isUploading && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Uploading &amp; Extracting Embeddings
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {uploadQueue.some((t) => t.status === "FAILED") && (
                  <button
                    onClick={retryAllFailed}
                    className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry All Failed</span>
                  </button>
                )}
                <button
                  onClick={clearCompletedTasks}
                  className="text-[11px] font-semibold text-[#765D62] hover:text-[#633C49] cursor-pointer"
                >
                  Clear Finished
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {uploadQueue.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl p-3 border border-[#EADDE0] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF8F3] border border-[#EADDE0] flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-[#A85D70]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#633C49] truncate">{task.name}</p>
                      <span className="text-[10px] text-[#947A80]">{task.sizeFormatted}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {task.status === "COMPLETED" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" />
                        <span>Indexed</span>
                      </span>
                    )}

                    {task.status === "DUPLICATE" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Info className="w-3 h-3" />
                        <span>Duplicate Skipped</span>
                      </span>
                    )}

                    {task.status === "FAILED" && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Failed
                        </span>
                        <button
                          onClick={() => retryTask(task)}
                          className="p-1 rounded text-rose-700 hover:bg-rose-100 cursor-pointer"
                          title="Retry"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {task.status === "UPLOADING" && (
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-[#EADDE0] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#A85D70] h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <button
                          onClick={() => togglePauseTask(task)}
                          className="p-1 text-[#765D62] hover:text-[#633C49] cursor-pointer"
                          title="Pause"
                        >
                          <Pause className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {task.status === "PAUSED" && (
                      <button
                        onClick={() => togglePauseTask(task)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Resume</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Section E & G: Photo Management, Search & Multi-Album Grid */}
      <section className="space-y-4" aria-label="Photo Gallery Management">
        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#947A80] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search photos, filenames, ceremonies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FFF8F3] border border-[#EADDE0] rounded-xl text-[#633C49] placeholder-[#947A80] focus:outline-none focus:border-[#A85D70]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#947A80] hover:text-[#633C49]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Ceremony Filter */}
            <select
              value={selectedCeremony}
              onChange={(e) => setSelectedCeremony(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold text-[#633C49] bg-[#FFF8F3] border border-[#EADDE0] rounded-xl focus:outline-none focus:border-[#A85D70] cursor-pointer"
            >
              <option value="All">All Ceremonies</option>
              <option value="Mehendi">Mehendi</option>
              <option value="Haldi">Haldi</option>
              <option value="Sangeet">Sangeet</option>
              <option value="Phere">Phere (Wedding)</option>
              <option value="Reception">Reception</option>
              <option value="Cocktail">Cocktail</option>
            </select>

            {/* Album Filter */}
            <select
              value={selectedAlbum}
              onChange={(e) => setSelectedAlbum(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold text-[#633C49] bg-[#FFF8F3] border border-[#EADDE0] rounded-xl focus:outline-none focus:border-[#A85D70] cursor-pointer"
            >
              <option value="All">All Albums</option>
              {albums.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name} ({a.photoCount})
                </option>
              ))}
            </select>

            {/* Source Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold text-[#633C49] bg-[#FFF8F3] border border-[#EADDE0] rounded-xl focus:outline-none focus:border-[#A85D70] cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="computer">Computer Upload</option>
              <option value="google_drive">Google Drive</option>
              <option value="folder_drag">Bulk Folder Drop</option>
            </select>
          </div>

          {/* Quick Select All & Action Count */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#633C49] hover:text-[#A85D70] cursor-pointer"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-[#A85D70]" />
              ) : (
                <Square className="w-4 h-4 text-[#947A80]" />
              )}
              <span>Select All ({filteredPhotos.length})</span>
            </button>

            <button
              onClick={refreshData}
              title="Refresh"
              className="p-1.5 rounded-lg text-[#765D62] hover:text-[#633C49] hover:bg-[#FFF8F3] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-4/5 rounded-2xl bg-[#EADDE0]/50 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPhotos.length === 0 && (
          <div className="bg-white rounded-3xl p-12 border border-[#EADDE0] text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0] flex items-center justify-center mx-auto text-[#A85D70]">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#633C49]">
              No Photographs Found
            </h3>
            <p className="text-xs text-[#765D62] max-w-sm mx-auto">
              No photos match your active filter criteria. Upload images from your computer or import folders directly from Google Drive.
            </p>
          </div>
        )}

        {/* Photo Grid */}
        {!isLoading && filteredPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredPhotos.map((photo) => {
              const isSelected = selectedPhotoIds.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => toggleSelectPhoto(photo.id)}
                  className={`group relative aspect-4/5 rounded-2xl overflow-hidden bg-white border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? "border-2 border-[#A85D70] ring-3 ring-[#F1D5D5]"
                      : "border-[#EADDE0] hover:border-[#D9B7A0] hover:shadow-md"
                  }`}
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectPhoto(photo.id);
                      }}
                      className="p-1 rounded-md bg-black/40 text-white backdrop-blur-xs hover:bg-black/60"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#00e5ff]" />
                      ) : (
                        <Square className="w-4 h-4 text-white/80" />
                      )}
                    </div>

                    {/* Source Icon Badge */}
                    <div className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/50 text-white backdrop-blur-xs flex items-center gap-1">
                      {photo.source === "google_drive" ? (
                        <>
                          <FolderOpen className="w-2.5 h-2.5 text-amber-400" />
                          <span>Drive</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-2.5 h-2.5 text-blue-400" />
                          <span>Upload</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Metadata Info */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white space-y-1">
                    <p className="font-serif text-xs font-bold truncate">{photo.filename}</p>
                    <div className="flex items-center justify-between text-[10px] text-white/80">
                      <span>{photo.ceremony}</span>
                      <span className="flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded-md font-mono">
                        <Users className="w-2.5 h-2.5" />
                        <span>{photo.facesDetected || 1} face{photo.facesDetected === 1 ? "" : "s"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Hover Quick Action Lightbox Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxPhoto(photo);
                    }}
                    className="absolute inset-0 m-auto w-9 h-9 rounded-full bg-white/90 text-[#633C49] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="View Full Size"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating Batch Selection Action Ribbon */}
      {selectedPhotoIds.length > 0 && (
        <aside
          role="region"
          aria-label="Selected photos actions"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#633C49] text-white px-6 py-3.5 rounded-full shadow-2xl border-2 border-[#D9B7A0] flex items-center gap-4 animate-fadeIn"
        >
          <span className="font-serif text-xs font-bold text-[#D9B7A0]">
            {selectedPhotoIds.length} Selected
          </span>

          <div className="h-4 w-px bg-white/20" />

          <button
            type="button"
            onClick={handleBatchApprove}
            className="text-xs font-semibold text-white hover:text-[#D9B7A0] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Approve for VIP</span>
          </button>

          <button
            type="button"
            onClick={handleBatchDelete}
            className="text-xs font-semibold text-white hover:text-rose-300 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPhotoIds([])}
            className="p-1 rounded-full text-white/60 hover:text-white cursor-pointer ml-1"
            title="Deselect all"
          >
            ✕
          </button>
        </aside>
      )}

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#EADDE0] flex items-center justify-between bg-[#FFF8F3]">
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-bold text-[#633C49]">
                  {lightboxPhoto.filename}
                </span>
                <span className="text-[10px] bg-[#F1D5D5] text-[#633C49] font-bold px-2 py-0.5 rounded-full">
                  {lightboxPhoto.ceremony} • {lightboxPhoto.album}
                </span>
              </div>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-full text-[#765D62] hover:text-[#633C49] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#09090b]">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.filename}
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="p-4 border-t border-[#EADDE0] bg-[#FFF8F3] flex flex-wrap items-center justify-between text-xs text-[#765D62]">
              <div className="flex items-center gap-4">
                <span>File Size: {lightboxPhoto.sizeFormatted}</span>
                <span>Faces Indexed: {lightboxPhoto.facesIndexed}</span>
                <span>Source: {lightboxPhoto.source}</span>
              </div>
              <a
                href={lightboxPhoto.url}
                download={lightboxPhoto.filename}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Master</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Create Album Modal */}
      {isAlbumModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EADDE0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EADDE0] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#633C49]">
                Create New Wedding Album
              </h3>
              <button
                onClick={() => setIsAlbumModalOpen(false)}
                className="text-[#947A80] hover:text-[#633C49]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#633C49] mb-1">
                  Album Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mehendi Candids, VIP Guests"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FFF8F3] border border-[#EADDE0] rounded-xl text-[#633C49] focus:outline-none focus:border-[#A85D70]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#633C49] mb-1">
                  Ceremony *
                </label>
                <select
                  value={newAlbumCeremony}
                  onChange={(e) => setNewAlbumCeremony(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FFF8F3] border border-[#EADDE0] rounded-xl text-[#633C49] focus:outline-none focus:border-[#A85D70]"
                >
                  <option value="Mehendi">Mehendi</option>
                  <option value="Haldi">Haldi</option>
                  <option value="Sangeet">Sangeet</option>
                  <option value="Phere">Phere</option>
                  <option value="Reception">Reception</option>
                  <option value="Cocktail">Cocktail</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#633C49] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Ceremony highlights and moment details"
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FFF8F3] border border-[#EADDE0] rounded-xl text-[#633C49] focus:outline-none focus:border-[#A85D70]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAlbumModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#765D62] hover:bg-[#FFF8F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] shadow-xs"
                >
                  Create Album
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

