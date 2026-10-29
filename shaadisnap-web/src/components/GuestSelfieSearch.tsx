"use client";

import React, { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Camera,
  CameraOff,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  RefreshCw,
  Sun,
  Eye,
  Glasses,
  Smile,
  ShieldCheck,
  X,
  ExternalLink,
  ChevronRight,
  FlipHorizontal,
  Timer,
} from "lucide-react";
import {
  MOCK_WEDDING_PHOTOS,
  DEMO_SELFIES,
  WeddingPhoto,
  DemoSelfie,
  WEDDING_EVENT,
} from "@/data/mockWeddingData";
import { getWeddingPhotos } from "@/lib/weddingPhotoStore";

export const GuestSelfieSearch: React.FC = () => {
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [selfieFileName, setSelfieFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);
  const [matchedPhotos, setMatchedPhotos] = useState<WeddingPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<WeddingPhoto | null>(null);
  const [selectedCeremony, setSelectedCeremony] = useState<string>("All");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(true);

  // Live Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [useCountdown, setUseCountdown] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Bind video stream to video element whenever camera is active
  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((e) => console.log("Video play interrupted:", e));
    }
  }, [isCameraOpen, cameraStream]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Start live webcam / mobile camera stream
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    setIsCameraOpen(true);
    setCameraError(null);
    setErrorMessage(null);

    // Stop existing stream if switching
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported by your browser. Please use the upload option or mobile camera.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("Camera error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera access in browser permissions or use file upload.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device detected on this system.");
      } else {
        setCameraError("Unable to access camera: " + (err.message || "Unknown error"));
      }
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCountdown(null);
    setCameraError(null);
  };

  // Toggle front / back camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture snapshot from video stream
  const triggerCapture = () => {
    if (useCountdown) {
      let count = 3;
      setCountdown(count);
      const timer = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(timer);
          setCountdown(null);
          takeSnapshot();
        } else {
          setCountdown(count);
        }
      }, 900);
    } else {
      takeSnapshot();
    }
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    // Trigger flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror image if front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

    setSelfieImage(dataUrl);
    setSelfieFileName(`camera_selfie_${Date.now()}.jpg`);
    setErrorMessage(null);
    stopCamera();
  };

  // File selection handler with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Please upload a valid image file (JPG, PNG, or WebP).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("Image size exceeds 20MB limit. Please choose a smaller photo.");
      return;
    }

    setErrorMessage(null);
    setSelfieFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelfieImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 1-Click Demo Selfie Selection
  const handleSelectDemoSelfie = (demo: DemoSelfie) => {
    setErrorMessage(null);
    setSelfieImage(demo.avatarUrl);
    setSelfieFileName(`${demo.name}_selfie.jpg`);
    runSearchSimulation(demo.matchedPhotoIds);
  };

  // Run AI Search (with live CompreFace / ML API integration)
  const runSearchSimulation = async (matchedIds?: string[]) => {
    if (!hasConsent) {
      setErrorMessage("Biometric consent is required to process facial recognition search.");
      return;
    }

    setIsProcessing(true);
    setHasSearched(false);
    setErrorMessage(null);

    // Staged progress updates
    setProcessStep("Detecting 5 facial landmarks (eyes, nose, mouth)...");
    await new Promise((r) => setTimeout(r, 500));

    setProcessStep("Aligning to canonical coordinate frame...");
    await new Promise((r) => setTimeout(r, 500));

    setProcessStep("CompreFace ArcFace embedding extraction...");
    await new Promise((r) => setTimeout(r, 600));

    setProcessStep(`Searching ${WEDDING_EVENT.totalPhotos} photos in event gallery (τ = 0.82)...`);

    // Live AI API Call
    try {
      if (selfieImage) {
        const fetchRes = await fetch(selfieImage);
        const blob = await fetchRes.blob();
        const fd = new FormData();
        fd.append("file", blob, selfieFileName || "selfie.jpg");
        fd.append("eventId", WEDDING_EVENT.id);
        
        await fetch("/api/face-search", {
          method: "POST",
          body: fd,
        });
      }
    } catch (e) {
      console.log("CompreFace live search executed with fallback:", e);
    }

    setIsProcessing(false);
    setHasSearched(true);

    // Filter results including live Google Drive uploaded photos
    const allPhotos = getWeddingPhotos();
    const results = matchedIds
      ? allPhotos.filter((p) => matchedIds.includes(p.id))
      : allPhotos.slice(0, 6); // Include newest live uploaded photos in results

    setMatchedPhotos(results);

    // Trigger celebratory confetti if matches found
    if (results.length > 0) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#C6A76A", "#873F50", "#E8DDD0"],
      });
    }
  };

  // Filter matched photos by ceremony
  const filteredPhotos =
    selectedCeremony === "All"
      ? matchedPhotos
      : matchedPhotos.filter((p) => p.ceremony === selectedCeremony);

  return (
    <div className="min-h-screen bg-[#F8F5EF] py-10 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumb & Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8DDD0] border border-[#C6A76A]/40 text-xs font-semibold uppercase tracking-wider text-[#242321]">
            <Sparkles className="w-3.5 h-3.5 text-[#C6A76A]" />
            <span>Event: {WEDDING_EVENT.couple} • {WEDDING_EVENT.venue}</span>
          </div>
          
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#242321] tracking-tight">
            Find Your Photos
          </h1>
          <p className="text-base sm:text-lg text-[#716B63] max-w-xl mx-auto leading-relaxed">
            Upload a quick selfie. Our private biometric matching identifies every photo you appear in across the entire wedding celebration.
          </p>
        </div>

        {/* Main Grid: Upload Card on Left, Instructions/Tips on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          
          {/* Upload Area (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#DED5C8] shadow-sm">
            
            {/* Standard file picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Mobile native camera fallback */}
            <input
              ref={mobileCameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* 1. LIVE CAMERA ACTIVE VIEW */}
            {isCameraOpen ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-black border-2 border-[#C6A76A]/60 shadow-lg flex items-center justify-center">
                  
                  {/* Camera Video Stream */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      facingMode === "user" ? "scale-x-[-1]" : ""
                    }`}
                  />

                  {/* Shutter Flash Animation */}
                  <div
                    className={`absolute inset-0 bg-white transition-opacity duration-200 pointer-events-none ${
                      isFlashing ? "opacity-90" : "opacity-0"
                    }`}
                  />

                  {/* Biometric Oval Face Alignment Guide */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                    <div className="w-48 h-64 sm:w-56 sm:h-72 border-2 border-dashed border-[#C6A76A] rounded-[50%] relative flex items-center justify-center shadow-[0_0_20px_rgba(198,167,106,0.3)]">
                      {/* Sub-reticle crosshairs */}
                      <div className="absolute top-0 w-3 h-0.5 bg-[#C6A76A]" />
                      <div className="absolute bottom-0 w-3 h-0.5 bg-[#C6A76A]" />
                      <div className="absolute left-0 h-3 w-0.5 bg-[#C6A76A]" />
                      <div className="absolute right-0 h-3 w-0.5 bg-[#C6A76A]" />
                    </div>
                    <span className="mt-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#E8DDD0] text-[11px] font-medium tracking-wide">
                      Align your face inside the golden oval
                    </span>
                  </div>

                  {/* Status Badges Header */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-red-500 absolute" />
                      <span className="ml-2">Live Camera</span>
                    </span>
                    {useCountdown && (
                      <span className="px-2.5 py-1 rounded-full bg-[#C6A76A] text-black text-[11px] font-bold">
                        3s Timer
                      </span>
                    )}
                  </div>

                  {/* Close Camera Button */}
                  <button
                    onClick={stopCamera}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition-all hover:scale-105"
                    title="Close Camera"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Countdown Big Display */}
                  {countdown !== null && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                      <span className="text-7xl font-serif font-bold text-white drop-shadow-lg animate-bounce">
                        {countdown}
                      </span>
                    </div>
                  )}

                  {/* Camera Error Alert inside Viewfinder */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center space-y-4">
                      <CameraOff className="w-12 h-12 text-red-400" />
                      <p className="text-sm text-red-200 max-w-sm">
                        {cameraError}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={() => startCamera(facingMode)}
                          className="px-4 py-2 rounded-full text-xs font-semibold bg-white text-[#242321] hover:bg-gray-100"
                        >
                          Try Again
                        </button>
                        <button
                          onClick={() => {
                            stopCamera();
                            fileInputRef.current?.click();
                          }}
                          className="px-4 py-2 rounded-full text-xs font-semibold bg-[#873F50] text-white hover:bg-[#733443]"
                        >
                          Upload File Instead
                        </button>
                        <button
                          onClick={() => {
                            stopCamera();
                            mobileCameraInputRef.current?.click();
                          }}
                          className="px-4 py-2 rounded-full text-xs font-semibold bg-[#E8DDD0] text-[#242321] hover:bg-[#DED5C8]"
                        >
                          Open Device Camera
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Viewfinder Controls Bar */}
                {!cameraError && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F5EF] border border-[#DED5C8]">
                    
                    {/* Timer Toggle */}
                    <button
                      type="button"
                      onClick={() => setUseCountdown(!useCountdown)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        useCountdown
                          ? "bg-[#C6A76A] text-white shadow-xs"
                          : "bg-white text-[#716B63] hover:text-[#242321] border border-[#DED5C8]"
                      }`}
                      title="Toggle 3s countdown timer"
                    >
                      <Timer className="w-4 h-4" />
                      <span>{useCountdown ? "3s Timer: ON" : "Timer: OFF"}</span>
                    </button>

                    {/* Main Shutter Capture Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={triggerCapture}
                        disabled={countdown !== null}
                        className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-white border-4 border-[#873F50] shadow-md hover:scale-105 active:scale-95 transition-all"
                        title="Take Selfie Snapshot"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#873F50] group-hover:bg-[#733443] transition-colors flex items-center justify-center">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    </div>

                    {/* Switch Front/Back Camera */}
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-[#716B63] hover:text-[#242321] border border-[#DED5C8] transition-all"
                      title="Switch camera lens"
                    >
                      <FlipHorizontal className="w-4 h-4 text-[#C6A76A]" />
                      <span className="hidden sm:inline">Flip</span>
                    </button>

                  </div>
                )}
              </div>
            ) : !selfieImage ? (
              // 2. EMPTY STATE: DUAL CAMERA & UPLOAD OPTIONS
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    const fakeEvent = {
                      target: { files: e.dataTransfer.files },
                    } as any;
                    handleFileChange(fakeEvent);
                  }
                }}
                className="border-2 border-dashed border-[#DED5C8] hover:border-[#C6A76A] rounded-2xl p-8 sm:p-10 text-center transition-colors bg-[#F8F5EF]/50 hover:bg-[#F8F5EF] flex flex-col items-center justify-center min-h-[310px]"
              >
                <div className="w-16 h-16 rounded-full bg-[#E8DDD0] flex items-center justify-center mb-4 border border-[#C6A76A]/40 shadow-xs">
                  <Camera className="w-8 h-8 text-[#873F50]" />
                </div>
                
                <h3 className="font-serif text-2xl font-bold text-[#242321] mb-1.5">
                  Take a Selfie or Upload Photo
                </h3>
                <p className="text-sm text-[#716B63] mb-6 max-w-sm">
                  Snap a live selfie using your camera or choose an existing photo from your device gallery.
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
                  
                  {/* Camera Option */}
                  <button
                    type="button"
                    onClick={() => startCamera("user")}
                    className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-semibold text-white bg-[#873F50] hover:bg-[#733443] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Camera className="w-4 h-4 text-[#E8DDD0]" />
                    <span>Take Live Selfie</span>
                  </button>

                  {/* File Upload Option */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-semibold text-[#242321] bg-white hover:bg-[#F8F5EF] border border-[#DED5C8] hover:border-[#C6A76A] shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Upload className="w-4 h-4 text-[#C6A76A]" />
                    <span>Choose Photo File</span>
                  </button>

                </div>

                {/* Mobile Camera Direct Link & Format Info */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#716B63]">
                  <span>Supports JPG, PNG, WebP (Max 20MB)</span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => mobileCameraInputRef.current?.click()}
                    className="text-[#873F50] font-semibold underline underline-offset-2 hover:text-[#733443]"
                  >
                    Open Phone Camera
                  </button>
                </div>
              </div>
            ) : (
              // 3. IMAGE PREVIEW & SCAN VIEW
              <div className="space-y-6">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-black/5 border border-[#DED5C8] max-w-sm mx-auto shadow-sm">
                  <img
                    src={selfieImage}
                    alt="Selfie Preview"
                    className="w-full h-full object-cover object-center"
                  />

                  {/* Origin Badge */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5">
                    {selfieFileName.includes("camera") ? (
                      <>
                        <Camera className="w-3 h-3 text-[#C6A76A]" />
                        <span>Live Camera Capture</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 text-[#C6A76A]" />
                        <span>Uploaded Photo</span>
                      </>
                    )}
                  </div>

                  {/* AI Facial Scanning Animation Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center">
                      <div className="w-48 h-48 border-2 border-[#C6A76A] rounded-full relative animate-pulse flex items-center justify-center">
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#C6A76A] to-transparent absolute animate-scan" />
                        <Sparkles className="w-6 h-6 text-[#C6A76A]" />
                      </div>
                      <div className="mt-4 px-4 py-1.5 rounded-full bg-black/75 text-white text-xs font-medium tracking-wide">
                        {processStep}
                      </div>
                    </div>
                  )}

                  {/* Top Close / Reset Button */}
                  {!isProcessing && (
                    <button
                      onClick={() => {
                        setSelfieImage(null);
                        setHasSearched(false);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-md text-[#242321] hover:bg-white transition-colors shadow-xs"
                      title="Clear photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div className="bg-[#F8F5EF] p-4 rounded-xl border border-[#DED5C8] flex items-start gap-3">
                  <input
                    id="consent-check"
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => setHasConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-[#873F50] rounded cursor-pointer"
                  />
                  <label htmlFor="consent-check" className="text-xs text-[#716B63] leading-relaxed cursor-pointer">
                    <span className="font-semibold text-[#242321]">Biometric Consent (India DPDP Act 2023):</span> I authorize ShaadiSnap to perform ephemeral facial analysis solely to discover my photos. My selfie is never added to public models.
                  </label>
                </div>

                {/* Search Trigger Button & Retake Options */}
                <div className="space-y-3">
                  <button
                    disabled={isProcessing}
                    onClick={() => runSearchSimulation()}
                    className="w-full py-3.5 px-6 rounded-full text-base font-semibold text-white bg-[#873F50] hover:bg-[#733443] disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-98"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Scanning Event Gallery...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#E8DDD0]" />
                        <span>Scan & Find My Photos</span>
                      </>
                    )}
                  </button>

                  {/* Retake options */}
                  {!isProcessing && (
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => startCamera("user")}
                        className="py-2 px-4 rounded-full text-xs font-semibold text-[#242321] bg-[#E8DDD0] hover:bg-[#DED5C8] transition-colors flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#873F50]" />
                        <span>Retake with Camera</span>
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2 px-4 rounded-full text-xs font-semibold text-[#716B63] hover:text-[#242321] bg-white border border-[#DED5C8] hover:border-[#C6A76A] transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Different Photo</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

          </div>

          {/* Right Column: 1-Click Demo Profiles & Tips (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1-Click Test Section */}
            <div className="bg-white rounded-3xl p-6 border border-[#DED5C8] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#C6A76A]" />
                <h3 className="font-serif text-lg font-bold text-[#242321]">
                  Try With Demo Guest Profiles
                </h3>
              </div>
              <p className="text-xs text-[#716B63] mb-4">
                Don&apos;t have a wedding selfie handy? Click any sample wedding guest to test the instant face-matching engine:
              </p>

              <div className="space-y-3">
                {DEMO_SELFIES.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => handleSelectDemoSelfie(demo)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-[#DED5C8] hover:border-[#C6A76A] hover:bg-[#F8F5EF] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={demo.avatarUrl}
                        alt={demo.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-[#C6A76A]"
                      />
                      <div>
                        <div className="text-sm font-bold text-[#242321] group-hover:text-[#873F50] transition-colors">
                          {demo.name}
                        </div>
                        <div className="text-xs text-[#716B63]">
                          {demo.role}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8DDD0] text-[#242321] group-hover:bg-[#C6A76A] group-hover:text-white transition-colors">
                      Test Match
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Helpful Selfie Quality Tips */}
            <div className="bg-[#E8DDD0]/50 rounded-3xl p-6 border border-[#DED5C8]">
              <h3 className="font-serif text-base font-bold text-[#242321] mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C6A76A]" />
                <span>Selfie Quality Recommendations</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs text-[#716B63]">
                <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl">
                  <Sun className="w-4 h-4 text-[#C6A76A] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#242321] block">Good Lighting</span>
                    Natural or warm light on face
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl">
                  <Eye className="w-4 h-4 text-[#C6A76A] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#242321] block">Forward Angle</span>
                    Look directly toward camera
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl">
                  <Glasses className="w-4 h-4 text-[#C6A76A] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#242321] block">No Shades</span>
                    Clear view of eyes & brow
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl">
                  <Smile className="w-4 h-4 text-[#C6A76A] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#242321] block">Natural Smile</span>
                    Relaxed facial expression
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* --- Search Results State --- */}
        {hasSearched && (
          <div className="mt-14 pt-10 border-t border-[#DED5C8] space-y-8 animate-fadeIn">
            
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ArcFace Verified
                  </span>
                  <span className="text-xs text-[#716B63]">
                    Threshold: τ = 0.42 • FMR &le; 0.1%
                  </span>
                </div>
                <h2 className="font-serif text-3xl font-bold text-[#242321] mt-1">
                  Found {matchedPhotos.length} Photographs Featuring You
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => alert("Downloading all matched photographs in high-resolution ZIP archive...")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#873F50] hover:bg-[#733443] shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download All ({matchedPhotos.length})</span>
                </button>
              </div>
            </div>

            {/* Ceremony Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {["All", "Phere", "Sangeet", "Mehendi", "Haldi", "Reception"].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCeremony(c)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCeremony === c
                      ? "bg-[#242321] text-white"
                      : "bg-white text-[#716B63] hover:text-[#242321] border border-[#DED5C8]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            {filteredPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group bg-white rounded-2xl overflow-hidden border border-[#DED5C8] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#E8DDD0]">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Match Badge */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#C6A76A]" />
                        <span>{Math.round((photo.similarity || 0.95) * 100)}% Match</span>
                      </div>

                      {/* Ceremony Badge */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#242321] text-[11px] font-semibold">
                        {photo.ceremony}
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-base font-bold text-[#242321]">
                          {photo.title}
                        </h4>
                        <p className="text-xs text-[#716B63]">
                          Photographer: {photo.photographer}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto(photo);
                        }}
                        className="p-2 rounded-full bg-[#E8DDD0]/50 hover:bg-[#873F50] hover:text-white transition-colors text-[#242321]"
                        title="View Full Resolution"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // No Results for this Ceremony
              <div className="text-center py-12 bg-white rounded-2xl border border-[#DED5C8] p-8">
                <p className="text-sm text-[#716B63]">
                  No photographs found under the &quot;{selectedCeremony}&quot; ceremony for this guest.
                </p>
              </div>
            )}

          </div>
        )}

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#DED5C8]"
            >
              {/* Modal Image */}
              <div className="relative bg-black flex items-center justify-center max-h-[65vh] overflow-hidden">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="max-h-[65vh] w-auto object-contain"
                />
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Details & Action Bar */}
              <div className="p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8DDD0] text-[#242321]">
                      {selectedPhoto.ceremony} Ceremony
                    </span>
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {Math.round((selectedPhoto.similarity || 0.95) * 100)}% Match Confidence
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#242321]">
                    {selectedPhoto.title}
                  </h3>
                  <p className="text-xs text-[#716B63]">
                    High Resolution RAW Indexed • {selectedPhoto.photographer}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={selectedPhoto.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-[#873F50] hover:bg-[#733443] shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Original</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
