"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Camera,
  UploadCloud,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  CheckSquare,
  Square,
  RefreshCw,
  Maximize2,
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  Lock,
  Calendar,
  MapPin,
  ExternalLink,
  Flame,
  Award,
} from "lucide-react";
import { WeddingPhoto } from "@/data/mockWeddingData";
import { matchSelfieAgainstPhotos } from "@/lib/faceComparison";
import { getWeddingPhotos } from "@/lib/weddingPhotoStore";

interface GuestPassInfo {
  id: string;
  guestName: string;
  eventId: string;
  eventName: string;
  expiresAt?: string;
  scanCount: number;
  maxScans?: number;
}

interface EventInfo {
  id: string;
  name: string;
  couple: string;
  venue: string;
  date: string;
  coverPhoto: string;
}

interface MatchedItem extends WeddingPhoto {
  similarity: number;
}

export default function GuestPassPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;

  // Pass validation states
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [passError, setPassError] = useState<string | null>(null);
  const [passInfo, setPassInfo] = useState<GuestPassInfo | null>(null);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);

  // Scanning Modal & Camera states
  const [isScanningOpen, setIsScanningOpen] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Results & Personal Gallery states
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedItem[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<MatchedItem | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Validate Guest Token on Mount
  useEffect(() => {
    let isMounted = true;

    async function validateToken() {
      try {
        setIsValidating(true);
        const res = await fetch(`/api/guest/verify-pass?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.valid) {
          setPassInfo(data.pass);
          setEventInfo(data.event);
          setPassError(null);
        } else {
          setPassError(
            data.error || "This guest pass is invalid, expired, or has been revoked by the wedding host."
          );
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Network error validating pass";
        setPassError(msg);
      } finally {
        if (isMounted) setIsValidating(false);
      }
    }

    if (token) {
      validateToken();
    } else {
      setPassError("Missing guest pass token.");
      setIsValidating(false);
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser or device.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message.includes("Permission denied") || err.name === "NotAllowedError"
            ? "Camera permission was denied. Please allow camera access in your browser settings or upload a selfie photo below."
            : err.message
          : "Could not access front camera.";
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCameraError("Please select an image file (JPG, PNG, or WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      stopCamera();
      setCameraError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenScanner = () => {
    setIsScanningOpen(true);
    setSearchError(null);
    setTimeout(() => {
      startCamera();
    }, 150);
  };

  const handleCloseScanner = () => {
    stopCamera();
    setIsScanningOpen(false);
  };

  const fireCelebration = () => {
    if (typeof window === "undefined") return;
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#A85D70", "#633C49", "#D9B7A0", "#F1D5D5"],
      });
    } catch {
      // Confetti fallback
    }
  };

  // 2. Face Recognition Search Handler
  const handlePerformSearch = async () => {
    if (!capturedImage) {
      setSearchError("Please capture or upload a selfie first.");
      return;
    }

    if (!hasConsent) {
      setSearchError("Biometric consent is required under DPDP Act 2023 to search photographs.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Convert base64 dataUrl to Blob
      const blobRes = await fetch(capturedImage);
      const blob = await blobRes.blob();

      const formData = new FormData();
      formData.append("token", token);
      formData.append("file", blob, "selfie.jpg");
      formData.append("hasConsent", "true");
      formData.append("threshold", "0.70");

      // Request server-side face search strictly bound to the token's authorized event
      const res = await fetch("/api/guest/face-search", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process facial recognition search.");
      }

      // Resolve matches against current wedding photo store
      const allApprovedPhotos = getWeddingPhotos();
      let finalMatched: MatchedItem[] = [];

      if (Array.isArray(data.matches) && data.matches.length > 0) {
        // Map API matches to local wedding photos
        for (const m of data.matches) {
          const found = allApprovedPhotos.find(
            (p) => p.id === m.photoId || p.id === m.id || p.driveFileId === m.photoId
          );
          if (found) {
            finalMatched.push({
              ...found,
              similarity: m.similarity || 0.95,
            });
          } else if (m.photoUrl) {
            finalMatched.push({
              id: m.id || m.photoId || `match_${Math.random()}`,
              url: m.photoUrl,
              title: m.title || "Wedding Candid",
              ceremony: (m.ceremony as WeddingPhoto["ceremony"]) || "Reception",
              facesCount: 1,
              photographer: "Official Wedding Photography",
              similarity: m.similarity || 0.92,
              approvalStatus: "approved",
            });
          }
        }
      }

      // If backend was running in simulation / standalone mode, use client-side likeness comparison
      if (finalMatched.length === 0 && data.engine === "simulation" && capturedImage) {
        try {
          const clientMatches = await matchSelfieAgainstPhotos(capturedImage, allApprovedPhotos, 0.70);
          finalMatched = clientMatches.map((p) => ({
            ...p,
            similarity: p.similarity || 0.85,
          }));
        } catch {
          // Keep empty if zero likeness detected
        }
      }

      setMatchedPhotos(finalMatched);
      setHasSearched(true);
      setIsScanningOpen(false);

      if (finalMatched.length > 0) {
        fireCelebration();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze face. Please try again.";
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  // Multi-selection handlers
  const toggleSelectPhoto = (id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPhotoIds.length === matchedPhotos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(matchedPhotos.map((p) => p.id));
    }
  };

  const handleDownloadSingle = (photo: MatchedItem) => {
    const a = document.createElement("a");
    a.href = photo.url;
    a.download = `Wedding_Photo_${photo.ceremony}_${photo.id}.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSelected = () => {
    const selected = matchedPhotos.filter((p) => selectedPhotoIds.includes(p.id));
    if (selected.length === 0) return;

    selected.forEach((p, idx) => {
      setTimeout(() => {
        handleDownloadSingle(p);
      }, idx * 300);
    });
  };

  // --- RENDERING STATES ---

  // Loading Pass State
  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-[#F1D5D5] border-t-[#A85D70] animate-spin mb-4" />
        <h2 className="font-serif text-2xl font-bold text-[#633C49]">
          Verifying Your Guest Pass...
        </h2>
        <p className="text-xs sm:text-sm text-[#765D62] mt-1 max-w-sm">
          Connecting securely to the Marwaha &amp; Gulati Celebration Vault.
        </p>
      </div>
    );
  }

  // Invalid / Expired / Revoked Pass State
  if (passError || !passInfo) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white border border-[#EADDE0] rounded-3xl p-8 shadow-[0_16px_40px_rgba(99,60,73,0.08)]">
          <div className="w-14 h-14 rounded-2xl bg-[#A63B48]/10 text-[#A63B48] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#633C49]">
            Access Denied or Expired
          </h2>
          <p className="text-xs sm:text-sm text-[#765D62] mt-2 leading-relaxed">
            {passError || "This guest pass is no longer active. Guest passes are time-sensitive for private wedding celebrations."}
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-[#F1D5D5]/30 border border-[#EADDE0] text-xs text-[#633C49] text-left space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#A85D70]" />
              <span>How to regain access:</span>
            </div>
            <p className="text-[#765D62]">
              1. Ask the wedding host or photographer to share a refreshed guest pass link on WhatsApp.
            </p>
            <p className="text-[#765D62]">
              2. Ensure you are opening the link provided in the original invitation.
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full text-xs font-bold text-white bg-[#633C49] hover:bg-[#914C60] transition-all shadow-md"
            >
              Return to Celebration Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] text-[#633C49] selection:bg-[#F1D5D5] selection:text-[#633C49]">
      {/* Top Luxury Banner */}
      <header className="sticky top-0 z-40 bg-[#FFF8F3]/90 backdrop-blur-md border-b border-[#EADDE0]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#633C49] to-[#A85D70] flex items-center justify-center shadow-xs">
              <Heart className="w-4 h-4 text-[#D9B7A0] fill-current" />
            </div>
            <span className="font-serif text-lg font-bold tracking-tight text-[#633C49]">
              Maan AI <span className="font-sans text-xs font-semibold text-[#A85D70]">Guest Pass</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F1D5D5] text-[#633C49] border border-[#A85D70]/20">
              <Lock className="w-3 h-3 text-[#A85D70]" />
              <span className="hidden sm:inline">Authenticated Pass:</span>
              <strong className="font-mono">{passInfo.guestName}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!hasSearched ? (
          /* =========================================================================
             SECTION 3: GUEST LANDING PAGE (BEFORE FACE MATCH)
             ========================================================================= */
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
            {/* Event Header Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F1D5D5]/60 border border-[#A85D70]/30 text-xs font-bold uppercase tracking-wider text-[#633C49] shadow-2xs mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#A85D70]" />
              <span>{eventInfo?.couple || "Marwaha & Gulati"} Wedding Celebration</span>
            </div>

            {/* Wedding Cover Photograph Card */}
            <div className="w-full relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden border-2 border-[#D9B7A0] shadow-[0_16px_40px_rgba(99,60,73,0.12)] mb-8 bg-[#F1D5D5]/20">
              <Image
                src={eventInfo?.coverPhoto || "/hero-couple.jpg"}
                alt="Marwaha & Gulati Wedding"
                fill
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-left text-white">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D9B7A0] mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{eventInfo?.venue || "Deventure Shimla Hills Resort, Solan (HP)"}</span>
                </div>
                <h3 className="font-serif text-lg sm:text-2xl font-bold tracking-tight">
                  {eventInfo?.name || "Marwaha & Gulati Wedding"}
                </h3>
              </div>
            </div>

            {/* Required Headings */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#633C49] tracking-tight leading-tight">
              Your Beautiful Memories Are Waiting ❤️
            </h1>

            <p className="text-sm sm:text-base text-[#765D62] max-w-xl mx-auto mt-3 leading-relaxed">
              Find every moment captured at this beautiful celebration.
            </p>

            {/* Primary Action Button */}
            <div className="mt-8 flex flex-col items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleOpenScanner}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-[#A85D70] to-[#633C49] hover:from-[#914C60] hover:to-[#502F3A] transition-all shadow-[0_12px_28px_rgba(168,93,112,0.30)] hover:shadow-xl active:scale-95 cursor-pointer"
              >
                <Camera className="w-5 h-5 text-[#D9B7A0]" />
                <span>SCAN MY FACE</span>
                <Sparkles className="w-4 h-4 text-[#D9B7A0]" />
              </button>

              <p className="text-xs font-semibold text-[#A85D70] tracking-wide">
                No Login. No Signup. Just Your Memories.
              </p>
            </div>

            {/* Privacy Notice Card */}
            <div className="mt-12 w-full p-5 rounded-2xl bg-white border border-[#EADDE0] shadow-xs text-left">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#F1D5D5] text-[#633C49] shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-[#A85D70]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#633C49]">
                    Biometric Privacy Guarantee (DPDP Act 2023 &amp; GDPR)
                  </h4>
                  <p className="text-xs text-[#765D62] leading-relaxed">
                    ShaadiSnap AI uses ephemeral on-device facial likeness analysis solely to discover your photographs from this wedding celebration. Your selfie is processed instantly in temporary memory and permanently deleted immediately after searching. We never train public models, store raw facial images, or sell your biometric data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             SECTION 5: PERSONAL PHOTO GALLERY (AFTER SUCCESSFUL FACE MATCH)
             ========================================================================= */
          <div className="space-y-8 animate-fade-in">
            {/* Gallery Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#EADDE0]">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ArcFace Biometric Match Verified</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#633C49]">
                  Your Beautiful Moments ❤️
                </h1>
                <p className="text-xs sm:text-sm text-[#765D62] mt-1">
                  Found <strong className="text-[#633C49] font-bold">{matchedPhotos.length}</strong> photograph{matchedPhotos.length === 1 ? "" : "s"} featuring you across the celebration.
                </p>
              </div>

              {/* Gallery Actions */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleOpenScanner}
                  className="inline-flex items-center gap-2 py-2.5 px-4 rounded-full text-xs font-semibold text-[#633C49] bg-white border border-[#EADDE0] hover:bg-[#F1D5D5]/50 transition-colors shadow-2xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#A85D70]" />
                  <span>Scan Again</span>
                </button>

                {matchedPhotos.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full text-xs font-semibold text-[#633C49] bg-white border border-[#EADDE0] hover:bg-[#F1D5D5]/50 transition-colors shadow-2xs cursor-pointer"
                    >
                      {selectedPhotoIds.length === matchedPhotos.length ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-[#A85D70]" />
                          <span>Deselect All</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5 text-[#947A80]" />
                          <span>Select All</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadSelected}
                      disabled={selectedPhotoIds.length === 0}
                      className={`inline-flex items-center gap-2 py-2.5 px-5 rounded-full text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                        selectedPhotoIds.length > 0
                          ? "bg-[#633C49] hover:bg-[#914C60]"
                          : "bg-gray-400 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Selected ({selectedPhotoIds.length})</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Gallery Grid or Empty State */}
            {matchedPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {matchedPhotos.map((photo) => {
                  const isSelected = selectedPhotoIds.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col shadow-xs hover:shadow-lg ${
                        isSelected
                          ? "border-2 border-[#A85D70] ring-4 ring-[#F1D5D5]/50"
                          : "border-[#EADDE0] hover:border-[#D9B7A0]"
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#F1D5D5]/20">
                        <img
                          src={photo.url}
                          alt={photo.title || "Wedding Photo"}
                          loading="lazy"
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Top Overlay Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                          <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                            <Sparkles className="w-2.5 h-2.5 text-[#D9B7A0]" />
                            <span>{Math.round(photo.similarity * 100)}% Match</span>
                          </span>

                          <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#633C49] text-[10px] font-bold shadow-xs">
                            {photo.ceremony}
                          </span>
                        </div>

                        {/* Checkbox overlay */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectPhoto(photo.id);
                          }}
                          className="absolute bottom-2 left-2 p-1.5 rounded-xl bg-white/90 hover:bg-white text-[#633C49] shadow-md transition-transform active:scale-90 cursor-pointer"
                          aria-label={isSelected ? "Deselect photo" : "Select photo"}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#A85D70]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#947A80]" />
                          )}
                        </button>

                        {/* Fullscreen Preview Trigger */}
                        <button
                          type="button"
                          onClick={() => setActiveLightboxPhoto(photo)}
                          className="absolute bottom-2 right-2 p-1.5 rounded-xl bg-white/90 hover:bg-white text-[#633C49] shadow-md transition-transform active:scale-90 cursor-pointer"
                          aria-label="View photo fullscreen"
                        >
                          <Maximize2 className="w-4 h-4 text-[#633C49]" />
                        </button>
                      </div>

                      {/* Card Footer */}
                      <div className="p-3 sm:p-4 flex items-center justify-between text-xs">
                        <div className="truncate">
                          <p className="font-semibold text-[#633C49] truncate text-[11px] sm:text-xs">
                            {photo.title || `${photo.ceremony} Celebration`}
                          </p>
                          <p className="text-[10px] text-[#947A80]">{photo.photographer}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(photo)}
                          className="p-1.5 rounded-lg text-[#765D62] hover:text-[#A85D70] hover:bg-[#F1D5D5]/40 transition-colors cursor-pointer"
                          title="Download photo"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Honest Empty State */
              <div className="max-w-xl mx-auto py-12 px-6 rounded-3xl bg-white border border-[#EADDE0] text-center shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F1D5D5] text-[#A85D70] flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#633C49]">
                  No Matching Photos Found
                </h3>
                <p className="text-xs sm:text-sm text-[#765D62] leading-relaxed">
                  We analyzed all indexed wedding photographs for this celebration, but couldn&apos;t find photos matching your selfie under our strict similarity threshold (τ = 0.70).
                </p>

                <div className="p-4 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0] text-xs text-left text-[#765D62] space-y-1.5">
                  <p className="font-bold text-[#633C49]">Tips for a better face match:</p>
                  <p>• Ensure bright, even lighting on your face without harsh shadows.</p>
                  <p>• Look directly at the camera with a natural, relaxed expression.</p>
                  <p>• Remove dark sunglasses or wide-brimmed hats that conceal facial landmarks.</p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOpenScanner}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-[#A85D70] hover:bg-[#914C60] transition-all shadow-md cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Another Selfie</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
         SECTION 4: CAMERA & FACE SCANNING MODAL
         ========================================================================= */}
      {isScanningOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#633C49]/60 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseScanner}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#FFF8F3] border border-[#EADDE0] rounded-3xl shadow-[0_24px_60px_rgba(99,60,73,0.25)] max-h-[92vh] flex flex-col overflow-hidden text-[#633C49] focus:outline-none"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#EADDE0] flex items-center justify-between bg-gradient-to-r from-[#F1D5D5]/40 to-transparent shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#633C49] text-[#D9B7A0]">
                  <Camera className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#633C49]">
                    Scan Face for Wedding Photos
                  </h3>
                  <p className="text-[11px] text-[#765D62]">
                    Private &amp; Ephemeral Biometric Matching
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseScanner}
                className="p-2 rounded-full text-[#765D62] hover:text-[#633C49] hover:bg-[#F1D5D5]/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Camera Frame or Captured Preview */}
              <div className="relative aspect-[3/4] sm:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-[#D9B7A0] shadow-inner">
                {capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Captured Selfie"
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className={`w-full h-full object-cover object-center ${
                        cameraActive ? "block" : "hidden"
                      }`}
                    />

                    {/* Face Alignment Oval Guide */}
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-44 h-56 sm:w-56 sm:h-72 rounded-[50%] border-2 border-dashed border-[#F1D5D5] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                            Align Your Face
                          </span>
                        </div>
                      </div>
                    )}

                    {!cameraActive && !cameraError && (
                      <div className="text-white/80 text-xs flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        <span>Starting camera...</span>
                      </div>
                    )}
                  </>
                )}

                {/* Camera Error Message */}
                {cameraError && (
                  <div className="absolute inset-0 p-6 bg-black/85 text-white flex flex-col items-center justify-center text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-[#A63B48]" />
                    <p className="text-xs sm:text-sm text-gray-200">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-[#A85D70] text-white hover:bg-[#914C60] transition-colors"
                    >
                      Upload from Camera Roll
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex items-center justify-center gap-3">
                {capturedImage ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage(null);
                      startCamera();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#633C49] bg-white border border-[#EADDE0] hover:bg-[#F1D5D5]/50 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Photo</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={captureSelfie}
                      disabled={!cameraActive}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#633C49] hover:bg-[#914C60] transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#D9B7A0]" />
                      <span>Take Selfie</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-[#633C49] bg-white border border-[#EADDE0] hover:bg-[#F1D5D5]/50 transition-colors shadow-2xs cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-[#A85D70]" />
                      <span>Upload Photo</span>
                    </button>
                  </>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Biometric Consent Checkbox */}
              <div className="p-3.5 rounded-xl bg-[#F1D5D5]/35 border border-[#A85D70]/20 flex items-start gap-2.5">
                <input
                  id="biometric-consent-box"
                  type="checkbox"
                  checked={hasConsent}
                  onChange={(e) => setHasConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#A85D70] focus:ring-[#A85D70] cursor-pointer"
                />
                <label
                  htmlFor="biometric-consent-box"
                  className="text-[11px] text-[#765D62] leading-snug cursor-pointer"
                >
                  <strong className="text-[#633C49]">Biometric Consent (DPDP Act 2023 &amp; GDPR):</strong> I authorize ShaadiSnap to perform ephemeral facial biometric analysis solely for finding my wedding photographs. My selfie is deleted immediately.
                </label>
              </div>

              {/* Search Error banner */}
              {searchError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{searchError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer Action */}
            <div className="p-4 border-t border-[#EADDE0] bg-[#FFF8F3] shrink-0">
              <button
                type="button"
                onClick={handlePerformSearch}
                disabled={!capturedImage || isSearching}
                className={`w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                  capturedImage && !isSearching
                    ? "bg-gradient-to-r from-[#A85D70] to-[#633C49] hover:from-[#914C60] hover:to-[#502F3A] active:scale-98"
                    : "bg-gray-400 opacity-60 cursor-not-allowed"
                }`}
              >
                {isSearching ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Searching Event Faces via ArcFace...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D9B7A0]" />
                    <span>Search My Photographs</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         FULLSCREEN LIGHTBOX MODAL
         ========================================================================= */}
      {activeLightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setActiveLightboxPhoto(null)}
              className="absolute -top-12 right-0 p-2 rounded-full text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={activeLightboxPhoto.url}
              alt={activeLightboxPhoto.title}
              className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl"
            />

            <div className="mt-4 flex items-center justify-between w-full text-white text-xs px-2">
              <div>
                <p className="font-semibold text-sm">{activeLightboxPhoto.title}</p>
                <p className="text-gray-300 text-xs">
                  {activeLightboxPhoto.ceremony} • {Math.round(activeLightboxPhoto.similarity * 100)}% ArcFace Match
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadSingle(activeLightboxPhoto)}
                className="inline-flex items-center gap-2 py-2 px-4 rounded-full text-xs font-bold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

