"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  FolderOpen,
  Images,
  CheckSquare,
  Square,
  ArrowLeft,
  ShieldCheck,
  Search,
} from "lucide-react";
import {
  parseGoogleDriveInputs,
  GoogleDriveItem,
} from "@/lib/googleDrive";
import {
  GoogleDriveUser,
  GoogleDriveAlbum,
  GoogleDrivePhoto,
  getStoredGoogleUser,
  setStoredGoogleUser,
  clearStoredGoogleUser,
  SAMPLE_GOOGLE_DRIVE_ALBUMS,
  SAMPLE_GOOGLE_DRIVE_PHOTOS,
} from "@/lib/googleAuth";
import { auth, getGoogleDriveProvider } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { addUploadedPhoto } from "@/lib/weddingPhotoStore";

interface GoogleDriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (items: { id: string; name: string; url: string; ceremony: string }[]) => void;
  defaultCeremony?: string;
}

export const GoogleDriveImportModal: React.FC<GoogleDriveImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  defaultCeremony = "Sangeet",
}) => {
  const [activeTab, setActiveTab] = useState<"albums" | "photos" | "links">("albums");
  const [currentUser, setCurrentUser] = useState<GoogleDriveUser | null>(null);
  const [albums, setAlbums] = useState<GoogleDriveAlbum[]>(SAMPLE_GOOGLE_DRIVE_ALBUMS);
  const [allPhotos, setAllPhotos] = useState<GoogleDrivePhoto[]>(SAMPLE_GOOGLE_DRIVE_PHOTOS);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [selectedCeremony, setSelectedCeremony] = useState<string>(defaultCeremony);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Sync Google user on mount and on storage events
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncUser = () => {
      setCurrentUser(getStoredGoogleUser());
    };
    syncUser();
    window.addEventListener("shaadisnap_google_auth_changed", syncUser);
    return () => window.removeEventListener("shaadisnap_google_auth_changed", syncUser);
  }, []);

  // Fetch albums/photos from API if available
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchDriveData = async () => {
      try {
        const resAlbums = await fetch("/api/google-drive/albums");
        if (resAlbums.ok) {
          const data = await resAlbums.json();
          if (data.albums && isMounted) setAlbums(data.albums);
        }

        const resPhotos = await fetch("/api/google-drive/photos");
        if (resPhotos.ok) {
          const pData = await resPhotos.json();
          if (pData.photos && isMounted) setAllPhotos(pData.photos);
        }
      } catch {
        // Fallback to SAMPLE data already in state
      }
    };
    fetchDriveData();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Production Google Drive OAuth Sign-In
  const handleConnectGoogle = async () => {
    setIsAuthenticating(true);
    try {
      const provider = getGoogleDriveProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || (await user.getIdToken());

      const liveUser: GoogleDriveUser = {
        id: user.uid,
        name: user.displayName || "Wedding Host",
        email: user.email || "host@maan-ai.com",
        picture: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "Host")}&background=F1D5D5&color=633C49`,
        accessToken: token,
        connectedAt: new Date().toISOString(),
        scopes: ["drive.readonly", "drive.photos.readonly"],
      };

      setStoredGoogleUser(liveUser);
      setCurrentUser(liveUser);
    } catch (err: unknown) {
      console.error("Google Drive connection error:", err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnectGoogle = () => {
    clearStoredGoogleUser();
    setCurrentUser(null);
  };

  // Toggle selection of photo
  const togglePhotoSelect = (photoId: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  // Select all photos in currently viewed album / filter
  const handleSelectAllVisible = (visibleIds: string[]) => {
    const allSelected = visibleIds.every((id) => selectedPhotoIds.includes(id));
    if (allSelected) {
      setSelectedPhotoIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedPhotoIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Import entire album at once
  const handleImportAlbum = (album: GoogleDriveAlbum) => {
    const albumPhotos = allPhotos.filter((p) => p.albumId === album.id);
    const photoIds = albumPhotos.map((p) => p.id);
    setSelectedPhotoIds(photoIds);
    setSelectedCeremony(album.ceremony);
    setActiveTab("photos");
    setSelectedAlbumId(album.id);
  };

  // Manual link inputs
  const parsedManualItems: GoogleDriveItem[] = parseGoogleDriveInputs(inputText);
  const validManualItems = parsedManualItems.filter((i) => i.isValid);

  // Filter photos based on search & selected album
  const displayedPhotos = allPhotos.filter((p) => {
    const albumMatch = !selectedAlbumId || selectedAlbumId === "all" || p.albumId === selectedAlbumId;
    const searchMatch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ceremony.toLowerCase().includes(searchQuery.toLowerCase());
    return albumMatch && searchMatch;
  });

  const displayedPhotoIds = displayedPhotos.map((p) => p.id);
  const isAllVisibleSelected =
    displayedPhotoIds.length > 0 && displayedPhotoIds.every((id) => selectedPhotoIds.includes(id));

  // Confirm and execute import into live wedding photo store
  const handleExecuteImport = () => {
    let itemsToImport: { id: string; name: string; url: string; ceremony: string; driveFileId?: string }[] = [];

    if (activeTab === "links") {
      if (validManualItems.length === 0) return;
      itemsToImport = validManualItems.map((item, idx) => ({
        id: `gdrive_${item.fileId}_${Date.now()}_${idx}`,
        name: item.name || `Drive_Photo_${item.fileId.slice(0, 6)}.jpg`,
        url: item.directUrl,
        ceremony: selectedCeremony,
        driveFileId: item.fileId,
      }));
    } else {
      if (selectedPhotoIds.length === 0) return;
      const targetPhotos = allPhotos.filter((p) => selectedPhotoIds.includes(p.id));
      itemsToImport = targetPhotos.map((p, idx) => ({
        id: `gdrive_${p.id}_${Date.now()}_${idx}`,
        name: p.name,
        url: p.directUrl,
        ceremony: p.ceremony || selectedCeremony,
        driveFileId: p.id,
      }));
    }

    // Save directly to weddingPhotoStore
    itemsToImport.forEach((item) => {
      addUploadedPhoto({
        id: item.id,
        url: item.url,
        driveFileId: item.driveFileId,
        title: item.name,
        ceremony: item.ceremony,
        photographer: "Google Drive Import",
      });
    });

    if (onImport) {
      onImport(itemsToImport);
    }

    setImportStatus(`Imported ${itemsToImport.length} photos into live gallery`);
    setSelectedPhotoIds([]);
    setInputText("");

    setTimeout(() => {
      setImportStatus(null);
      onClose();
    }, 900);
  };

  const totalSelectedCount =
    activeTab === "links" ? validManualItems.length : selectedPhotoIds.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drive-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="bg-[#FFF8F3] rounded-[28px] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EADDE0] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EADDE0] flex items-center justify-between bg-white/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white border border-[#EADDE0] flex items-center justify-center shadow-xs shrink-0">
              {/* Google Drive SVG Logo */}
              <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="drive-modal-title" className="font-serif text-xl sm:text-2xl font-bold text-[#633C49]">
                  Import from Google Drive
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F1D5D5] text-[#633C49]">
                  <Sparkles className="w-3 h-3 text-[#A85D70]" />
                  <span>Maan AI Sync</span>
                </span>
              </div>
              <p className="text-xs text-[#765D62]">
                Access personal Google Drive storage to seamlessly select and import high-res wedding photos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#765D62] hover:text-[#633C49] hover:bg-[#F1D5D5]/50 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account / Authorization Bar */}
        <div className="px-5 sm:px-6 py-3 bg-[#FFF8F3] border-b border-[#EADDE0] flex flex-wrap items-center justify-between gap-3 text-xs">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-[#F1D5D5] border border-[#EADDE0] shrink-0">
                {currentUser.picture ? (
                  <img src={currentUser.picture} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-[#633C49]">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-[#633C49]">{currentUser.name}</span>
                <span className="text-[#947A80] ml-1.5 font-mono text-[11px]">({currentUser.email})</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                <span>Drive Read Scope Active</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#765D62]">
              <ShieldCheck className="w-4 h-4 text-[#A85D70]" />
              <span>Connect personal Google Drive account to access private wedding albums</span>
            </div>
          )}

          <div>
            {currentUser ? (
              <button
                type="button"
                onClick={handleDisconnectGoogle}
                className="text-xs text-[#A85D70] hover:text-[#914C60] font-semibold transition-colors cursor-pointer"
              >
                Switch / Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#A85D70] hover:bg-[#914C60] shadow-2xs transition-all cursor-pointer"
              >
                {/* Google G icon */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isAuthenticating ? "Connecting..." : "Sign in with Google"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-white flex items-center justify-between border-b border-[#EADDE0] text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("albums");
                setSelectedAlbumId(null);
              }}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "albums"
                  ? "bg-[#633C49] text-white shadow-xs"
                  : "bg-[#FFF8F3] text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Drive Albums ({albums.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("photos")}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "photos"
                  ? "bg-[#633C49] text-white shadow-xs"
                  : "bg-[#FFF8F3] text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
              }`}
            >
              <Images className="w-3.5 h-3.5" />
              <span>All Drive Photos ({allPhotos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("links")}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "links"
                  ? "bg-[#633C49] text-white shadow-xs"
                  : "bg-[#FFF8F3] text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Paste Share Links</span>
            </button>
          </div>

          {/* Ceremony Assignment Pill */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#633C49] uppercase tracking-wider">Ceremony:</span>
            {["Sangeet", "Phere", "Mehendi", "Reception", "Haldi"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCeremony(c)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedCeremony === c
                    ? "bg-[#A85D70] text-white shadow-2xs"
                    : "bg-[#FFF8F3] text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: ALBUMS BROWSER */}
          {activeTab === "albums" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#633C49]">
                    Select Google Drive Wedding Album
                  </h3>
                  <p className="text-xs text-[#765D62]">
                    Albums detected from your connected Google Drive storage. Click an album to view or import.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    className="group bg-white rounded-2xl border border-[#EADDE0] overflow-hidden hover:border-[#A85D70] hover:shadow-md transition-all flex flex-col text-left"
                  >
                    <div className="h-36 relative overflow-hidden bg-[#F1D5D5]/40">
                      <img
                        src={album.coverPhotoUrl}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-[#633C49] backdrop-blur-xs shadow-2xs">
                        {album.photoCount} Photos
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A85D70] text-white shadow-xs">
                        {album.ceremony}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#633C49] line-clamp-1">
                          {album.name}
                        </h4>
                        <p className="text-[11px] text-[#765D62] line-clamp-2 mt-1">
                          {album.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#EADDE0]/60">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAlbumId(album.id);
                            setActiveTab("photos");
                          }}
                          className="flex-1 py-1.5 rounded-full text-xs font-semibold text-[#633C49] bg-[#FFF8F3] hover:bg-[#F1D5D5]/50 border border-[#EADDE0] transition-colors cursor-pointer text-center"
                        >
                          View Photos
                        </button>
                        <button
                          type="button"
                          onClick={() => handleImportAlbum(album)}
                          className="py-1.5 px-3 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Select All</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PHOTOS GRID & SELECTION */}
          {activeTab === "photos" && (
            <div className="space-y-4">
              {/* Filter & Selection Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EADDE0]">
                <div className="flex items-center gap-2">
                  {selectedAlbumId && (
                    <button
                      type="button"
                      onClick={() => setSelectedAlbumId(null)}
                      className="p-1.5 rounded-full text-[#765D62] hover:text-[#633C49] hover:bg-[#FFF8F3] transition-colors cursor-pointer"
                      title="Back to all photos"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectAllVisible(displayedPhotoIds)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFF8F3] hover:bg-[#F1D5D5]/50 border border-[#EADDE0] text-[#633C49] transition-colors cursor-pointer"
                  >
                    {isAllVisibleSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[#A85D70]" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[#765D62]" />
                    )}
                    <span>{isAllVisibleSelected ? "Deselect All Visible" : "Select All Visible"}</span>
                  </button>

                  <span className="text-xs text-[#765D62]">
                    Selected: <strong className="text-[#633C49]">{selectedPhotoIds.length}</strong> of {displayedPhotos.length}
                  </span>
                </div>

                <div className="relative sm:w-56">
                  <Search className="w-3.5 h-3.5 text-[#947A80] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Drive photos..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs bg-[#FFF8F3] border border-[#EADDE0] text-[#633C49] placeholder-[#947A80] focus:outline-none focus:border-[#A85D70]"
                  />
                </div>
              </div>

              {/* Photo Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {displayedPhotos.map((photo) => {
                  const isSelected = selectedPhotoIds.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => togglePhotoSelect(photo.id)}
                      className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all ${
                        isSelected
                          ? "ring-2 ring-[#A85D70] border-[#A85D70] shadow-sm"
                          : "border-[#EADDE0] hover:border-[#D9B7A0] bg-white"
                      }`}
                    >
                      <div className="aspect-square bg-[#F1D5D5]/30 relative overflow-hidden">
                        <img
                          src={photo.thumbnailUrl}
                          alt={photo.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = photo.fallbackUrl;
                          }}
                        />
                        <div
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-[#A85D70] text-white shadow-xs"
                              : "bg-white/80 text-[#765D62] border border-[#EADDE0]"
                          }`}
                        >
                          {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        </div>

                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#633C49]/80 text-white backdrop-blur-xs">
                          {photo.ceremony}
                        </div>
                      </div>

                      <div className="p-2 bg-white">
                        <p className="text-[11px] font-semibold text-[#633C49] truncate">
                          {photo.name}
                        </p>
                        <p className="text-[10px] text-[#947A80] mt-0.5 font-mono">
                          {photo.sizeFormatted} • Google Drive
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PASTE SHARE LINKS */}
          {activeTab === "links" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-[#EADDE0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#633C49] flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#D9B7A0]" />
                    How to get Google Drive Share links:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHelpGuide(!showHelpGuide)}
                    className="text-xs font-semibold text-[#A85D70] hover:underline cursor-pointer"
                  >
                    {showHelpGuide ? "Hide instructions" : "Show step-by-step"}
                  </button>
                </div>

                {showHelpGuide && (
                  <ol className="text-xs text-[#765D62] list-decimal list-inside space-y-1.5 pt-2 border-t border-[#EADDE0]/60">
                    <li>Open your <strong>Google Drive</strong> folder containing wedding photos.</li>
                    <li>Right-click the photo or folder &rarr; click <strong>Share</strong>.</li>
                    <li>Under General Access, set to <strong className="text-emerald-700">“Anyone with the link” (Viewer)</strong>.</li>
                    <li>Click <strong>Copy Link</strong> and paste into the box below.</li>
                  </ol>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#633C49] uppercase tracking-wider">
                    Paste Google Drive Links
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText([
                        "https://drive.google.com/file/d/1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b/view?usp=sharing",
                        "https://drive.google.com/file/d/1mN84kL2vP0xQ3rS6tU8w1Y4z7B2c5D9e/view?usp=sharing",
                        "https://drive.google.com/file/d/1kL93mN1vP2xQ4rS7tU9w2Y5z8B3c6D0f/view?usp=sharing",
                      ].join("\n"));
                    }}
                    className="text-xs font-semibold text-[#A85D70] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fill Demo Drive Links</span>
                  </button>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste one or multiple Google Drive links (one per line):&#10;https://drive.google.com/file/d/1AbCdEfG.../view?usp=sharing&#10;https://drive.google.com/file/d/1XyZaBcD.../view?usp=sharing"
                  rows={4}
                  className="w-full p-4 rounded-2xl bg-white border border-[#EADDE0] focus:outline-hidden focus:border-[#A85D70] text-xs font-mono text-[#633C49] placeholder-[#947A80] resize-none shadow-2xs"
                />
              </div>

              {parsedManualItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#633C49]">
                    <span>Detected ({validManualItems.length} valid / {parsedManualItems.length} total)</span>
                    {validManualItems.length > 0 && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Direct CDN Ready
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto">
                    {parsedManualItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                          item.isValid ? "bg-white border-[#EADDE0]" : "bg-red-50/50 border-red-200"
                        }`}
                      >
                        {item.isValid ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F1D5D5]/40 shrink-0 border border-[#EADDE0]">
                            <img
                              src={item.directUrl}
                              alt="Drive preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=300&q=80";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center shrink-0 text-red-500">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#633C49] truncate">{item.name}</p>
                          <p className="text-[10px] font-mono text-[#765D62] truncate">ID: {item.fileId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Status feedback */}
          {importStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#EADDE0] bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold text-[#765D62] hover:text-[#633C49] hover:bg-[#FFF8F3] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={totalSelectedCount === 0}
            onClick={handleExecuteImport}
            className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>
              Import {totalSelectedCount > 0 ? `${totalSelectedCount} Photos` : "Photos"} to Live Gallery
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
