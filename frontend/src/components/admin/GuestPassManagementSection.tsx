"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Key,
  Plus,
  Share2,
  Copy,
  Check,
  QrCode,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Eye,
  EyeOff,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  Layers,
  Calendar,
  MapPin,
  X,
  FileImage,
} from "lucide-react";
import { QrCodeSvg } from "@/lib/qrCodeSvg";
import { addUploadedPhoto } from "@/lib/weddingPhotoStore";

export interface GuestPassItem {
  id: string;
  tokenHash: string;
  rawTokenPreview?: string;
  rawToken?: string;
  eventId: string;
  eventName: string;
  guestName?: string;
  guestPhone?: string;
  expiresAt?: string;
  isRevoked: boolean;
  maxScans?: number;
  scanCount: number;
  lastAccessedAt?: string;
  createdAt: string;
}

export interface ProcessingJobItem {
  id: string;
  eventId: string;
  photoId: string;
  photoUrl: string;
  ceremony?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  facesDetected?: number;
  errorMessage?: string;
  attempts: number;
  createdAt: string;
}

export const GuestPassManagementSection: React.FC = () => {
  const [passes, setPasses] = useState<GuestPassItem[]>([]);
  const [stats, setStats] = useState({
    totalPasses: 0,
    activePasses: 0,
    revokedPasses: 0,
    totalScans: 0,
    successfulSearches: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string>("");

  // New Pass Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [eventName, setEventName] = useState<string>("Marwaha & Gulati Wedding Celebration");
  const [eventId, setEventId] = useState<string>("marwaha-gulati-2026");
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [expiresInHours, setExpiresInHours] = useState<string>("168"); // Default 7 days (168h)
  const [maxScans, setMaxScans] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Newly Created Pass Banner Modal
  const [createdPassResult, setCreatedPassResult] = useState<{
    rawToken: string;
    guestUrl: string;
    whatsappMessage: string;
    guestName?: string;
  } | null>(null);

  // QR Code Modal
  const [activeQrPass, setActiveQrPass] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // Bulk Upload state
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState<boolean>(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done">("idle");
  const [selectedCeremony, setSelectedCeremony] = useState<string>("Sangeet");

  // AI Face Indexing Jobs Queue
  const [jobs, setJobs] = useState<ProcessingJobItem[]>([]);
  const [isRetryingJobs, setIsRetryingJobs] = useState<boolean>(false);

  // Ceremony Visibility state
  const [ceremonyVisibility, setCeremonyVisibility] = useState<{ [key: string]: boolean }>({
    Phere: true,
    Sangeet: true,
    Mehendi: true,
    Haldi: true,
    Reception: true,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch Guest Passes and Stats
  const loadData = async () => {
    try {
      setLoading(true);
      const [passesRes, jobsRes] = await Promise.all([
        fetch(`/api/admin/guest-passes?eventId=${encodeURIComponent(eventId)}`),
        fetch(`/api/admin/photo-jobs?eventId=${encodeURIComponent(eventId)}`),
      ]);

      const passesData = await passesRes.json();
      const jobsData = await jobsRes.json();

      if (passesData.success) {
        setPasses(passesData.passes || []);
        if (passesData.stats) setStats(passesData.stats);
      }

      if (jobsData.success) {
        setJobs(jobsData.jobs || []);
      }
    } catch (err) {
      console.error("Failed to load admin guest passes or jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(""), 4000);
  };

  // Create Guest Pass
  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/guest-passes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          eventName,
          guestName: guestName.trim() || undefined,
          guestPhone: guestPhone.trim() || undefined,
          expiresInHours: expiresInHours ? parseInt(expiresInHours, 10) : null,
          maxScans: maxScans ? parseInt(maxScans, 10) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create guest pass");
      }

      setCreatedPassResult({
        rawToken: data.rawToken,
        guestUrl: data.guestUrl,
        whatsappMessage: data.whatsappMessage,
        guestName: data.pass.guestName,
      });

      setIsCreateOpen(false);
      setGuestName("");
      setGuestPhone("");
      loadData();
      showToast("High-entropy Guest Pass successfully created.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating pass";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revoke Pass
  const handleRevoke = async (passId: string) => {
    if (!confirm("Are you sure you want to revoke this guest pass? The guest will lose access immediately.")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/guest-passes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", passId, reason: "Revoked by host from Admin Dashboard" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Guest pass has been revoked.");
        loadData();
      }
    } catch {
      alert("Failed to revoke pass");
    }
  };

  // Regenerate Pass
  const handleRegenerate = async (passId: string) => {
    try {
      const res = await fetch("/api/admin/guest-passes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate", passId }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedPassResult({
          rawToken: data.rawToken,
          guestUrl: data.guestUrl,
          whatsappMessage: data.whatsappMessage,
          guestName: data.pass.guestName,
        });
        showToast("Guest pass refreshed with a new cryptographic token.");
        loadData();
      }
    } catch {
      alert("Failed to regenerate pass");
    }
  };

  // Copy Link
  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Guest pass link copied to clipboard!");
    } catch {
      showToast("Link: " + url);
    }
  };

  // WhatsApp Share Intent
  const handleShareWhatsapp = (message: string) => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Bulk File Selection
  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setBulkFiles(fileList);
    }
  };

  // Execute Bulk Upload & Queue Face Indexing
  const handleStartBulkUpload = async () => {
    if (bulkFiles.length === 0) return;
    setUploadStatus("uploading");

    for (let i = 0; i < bulkFiles.length; i++) {
      const file = bulkFiles[i];
      setUploadProgress((prev) => ({ ...prev, [file.name]: 15 }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("ceremony", selectedCeremony);
        formData.append("eventId", eventId);
        formData.append("uploaderEmail", "admin@maan-ai.com");

        setUploadProgress((prev) => ({ ...prev, [file.name]: 50 }));

        const res = await fetch("/api/upload-photo", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Register photo in live store
          addUploadedPhoto({
            id: data.fileId || `up_${Date.now()}_${i}`,
            url: data.url,
            title: file.name.replace(/\.[^/.]+$/, ""),
            ceremony: selectedCeremony as "Phere" | "Sangeet" | "Mehendi" | "Haldi" | "Reception",
            photographer: "Official Wedding Photography",
            uploaderEmail: "admin@maan-ai.com",
            approvalStatus: "approved",
          });

          // Register in background queue
          await fetch("/api/admin/photo-jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventId,
              photoId: data.fileId || `photo_${Date.now()}_${i}`,
              photoUrl: data.url,
              ceremony: selectedCeremony,
            }),
          });

          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        } else {
          setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }));
        }
      } catch {
        setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }));
      }
    }

    setUploadStatus("done");
    loadData();
    showToast(`Processed bulk upload of ${bulkFiles.length} wedding photographs.`);
  };

  // Retry Failed Indexing Jobs
  const handleRetryJobs = async () => {
    try {
      setIsRetryingJobs(true);
      const res = await fetch("/api/admin/photo-jobs/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Failed jobs queued for re-indexing.");
        loadData();
      }
    } catch {
      alert("Failed to retry jobs");
    } finally {
      setIsRetryingJobs(false);
    }
  };

  const toggleCeremony = (ceremony: string) => {
    setCeremonyVisibility((prev) => ({
      ...prev,
      [ceremony]: !prev[ceremony],
    }));
    showToast(`Visibility for "${ceremony}" updated.`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#633C49] text-white text-xs font-semibold shadow-xl border border-[#D9B7A0] flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#D9B7A0]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header and Stats */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1D5D5] text-[#633C49] text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Key className="w-3.5 h-3.5 text-[#A85D70]" />
              <span>Login-Free Guest Experience</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#633C49]">
              Guest Pass Management &amp; AI Biometrics
            </h2>
            <p className="text-xs sm:text-sm text-[#765D62] mt-0.5">
              Generate unique, cryptographically secure guest links for WhatsApp. Guests scan their face with zero login or signup.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsBulkUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-[#633C49] bg-[#FFF8F3] hover:bg-[#F1D5D5]/50 border border-[#EADDE0] transition-colors shadow-2xs cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-[#A85D70]" />
              <span>Bulk Upload Photos</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#633C49] hover:bg-[#914C60] transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D9B7A0]" />
              <span>Generate Guest Pass</span>
            </button>
          </div>
        </div>

        {/* 4 Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#947A80]">
              Total Passes Issued
            </span>
            <p className="text-2xl font-bold text-[#633C49] mt-1">{stats.totalPasses}</p>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <Check className="w-3 h-3" />
              <span>{stats.activePasses} Active</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#947A80]">
              Total Scans Performed
            </span>
            <p className="text-2xl font-bold text-[#633C49] mt-1">{stats.totalScans}</p>
            <span className="text-[10px] text-[#A85D70] font-semibold mt-1 block">
              Across all guests
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#947A80]">
              Verified Face Searches
            </span>
            <p className="text-2xl font-bold text-[#633C49] mt-1">{stats.successfulSearches}</p>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
              ArcFace zero-retention
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#947A80]">
              Face Indexing Queue
            </span>
            <p className="text-2xl font-bold text-[#633C49] mt-1">
              {jobs.filter((j) => j.status === "COMPLETED").length} / {jobs.length || 1}
            </p>
            <span className="text-[10px] text-[#765D62] mt-1 block">
              {jobs.filter((j) => j.status === "FAILED").length} failed
            </span>
          </div>
        </div>
      </div>

      {/* Ceremony Photo Visibility Manager */}
      <div className="bg-white rounded-3xl p-6 border border-[#EADDE0] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#A85D70]" />
            <h3 className="font-serif text-lg font-bold text-[#633C49]">
              Ceremony Photo Visibility
            </h3>
          </div>
          <span className="text-[11px] text-[#947A80]">Control which ceremonies are visible to guests</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(ceremonyVisibility).map(([ceremony, isVisible]) => (
            <button
              key={ceremony}
              type="button"
              onClick={() => toggleCeremony(ceremony)}
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                isVisible
                  ? "bg-[#FFF8F3] border-[#A85D70] text-[#633C49] shadow-xs"
                  : "bg-gray-50 border-gray-200 text-gray-400"
              }`}
            >
              <span>{ceremony}</span>
              {isVisible ? (
                <Eye className="w-4 h-4 text-[#A85D70]" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Guest Pass Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#633C49]">
              Active Guest Passes
            </h3>
            <p className="text-xs text-[#765D62]">
              Cryptographically secure links. Copy, share on WhatsApp, or download QR passes.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl text-[#765D62] hover:text-[#633C49] hover:bg-[#F1D5D5]/40 transition-colors"
            title="Refresh Passes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {passes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#633C49]">
              <thead>
                <tr className="border-b border-[#EADDE0] text-[10px] font-bold uppercase tracking-wider text-[#947A80]">
                  <th className="py-3 px-3">Recipient / Guest</th>
                  <th className="py-3 px-3">Token Hash</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Scans</th>
                  <th className="py-3 px-3">Expires</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADDE0]/50 font-medium">
                {passes.map((p) => {
                  const isExpired = p.expiresAt && new Date(p.expiresAt).getTime() < Date.now();
                  const fullUrl = `https://maan-gulati.vercel.app/guest/${p.rawToken || p.id}`;
                  const whatsappMsg = `Hey! ❤️ Your wedding memories are ready.\n\nOpen your private photo link and scan your face to discover all your pictures.\n\n${fullUrl}\n\nNo login required!`;

                  return (
                    <tr key={p.id} className="hover:bg-[#FFF8F3]/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-sm text-[#633C49]">
                          {p.guestName || "General Guest Pass"}
                        </div>
                        {p.guestPhone && (
                          <span className="text-[10px] text-[#947A80] font-mono">{p.guestPhone}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[11px] bg-[#FFF8F3] px-2.5 py-1 rounded-lg border border-[#EADDE0] text-[#765D62]">
                          {p.tokenHash ? `${p.tokenHash.slice(0, 8)}...` : p.id}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {p.isRevoked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            Revoked
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold">{p.scanCount}</span>
                        {p.maxScans && <span className="text-[#947A80]"> / {p.maxScans}</span>}
                      </td>

                      <td className="py-3.5 px-3 text-[#765D62] text-[11px]">
                        {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "Never"}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleShareWhatsapp(whatsappMsg)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(fullUrl)}
                            className="p-1.5 rounded-lg text-[#765D62] hover:text-[#633C49] hover:bg-[#F1D5D5]/40 transition-colors"
                            title="Copy Guest Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActiveQrPass({
                                url: fullUrl,
                                name: p.guestName || "Wedding Guest Pass",
                              })
                            }
                            className="p-1.5 rounded-lg text-[#765D62] hover:text-[#633C49] hover:bg-[#F1D5D5]/40 transition-colors"
                            title="Show QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {!p.isRevoked ? (
                            <button
                              type="button"
                              onClick={() => handleRevoke(p.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="Revoke Pass"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRegenerate(p.id)}
                              className="p-1.5 rounded-lg text-[#A85D70] hover:bg-[#F1D5D5]/40 transition-colors"
                              title="Regenerate Pass"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-[#765D62] text-xs space-y-2">
            <Key className="w-8 h-8 mx-auto text-[#D9B7A0]" />
            <p className="font-semibold text-sm text-[#633C49]">No Guest Passes Generated Yet</p>
            <p>Click &quot;Generate Guest Pass&quot; above to create your first unauthenticated guest link.</p>
          </div>
        )}
      </div>

      {/* Background AI Face Indexing Queue */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#633C49]">
              AI Facial Recognition Indexing Queue
            </h3>
            <p className="text-xs text-[#765D62]">
              Background status of photo uploads processed into event face vectors.
            </p>
          </div>

          {jobs.some((j) => j.status === "FAILED") && (
            <button
              type="button"
              onClick={handleRetryJobs}
              disabled={isRetryingJobs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingJobs ? "animate-spin" : ""}`} />
              <span>Retry Failed Jobs</span>
            </button>
          )}
        </div>

        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {jobs.slice(0, 9).map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileImage className="w-4 h-4 text-[#A85D70] shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-[#633C49] truncate">{job.photoId}</p>
                    <p className="text-[10px] text-[#947A80]">{job.ceremony || "Celebration"}</p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    job.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : job.status === "PROCESSING"
                      ? "bg-blue-100 text-blue-800 animate-pulse"
                      : job.status === "FAILED"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#765D62]">All uploaded photos indexed into ArcFace face index.</p>
        )}
      </div>

      {/* =========================================================================
         MODAL 1: CREATE GUEST PASS DIALOG
         ========================================================================= */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#633C49]/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#FFF8F3] border border-[#EADDE0] rounded-3xl shadow-2xl p-6 text-[#633C49] space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#EADDE0] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#633C49] text-white">
                  <Key className="w-4 h-4 text-[#D9B7A0]" />
                </span>
                <div>
                  <h3 className="font-serif text-xl font-bold">Generate New Guest Pass</h3>
                  <p className="text-[11px] text-[#765D62]">Zero login, high-entropy access pass</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full text-[#765D62] hover:bg-[#F1D5D5]/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePass} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[#947A80] mb-1">
                  Wedding Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#A85D70]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[#947A80] mb-1">
                  Guest Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Rohit &amp; Priya Sharma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#A85D70]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[#947A80] mb-1">
                  Guest WhatsApp / Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#A85D70]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[#947A80] mb-1">
                    Pass Expiration
                  </label>
                  <select
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#A85D70]"
                  >
                    <option value="24">24 Hours</option>
                    <option value="168">7 Days</option>
                    <option value="720">30 Days</option>
                    <option value="">Never Expire</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-[#947A80] mb-1">
                    Max Face Scans
                  </label>
                  <select
                    value={maxScans}
                    onChange={(e) => setMaxScans(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#A85D70]"
                  >
                    <option value="">Unlimited</option>
                    <option value="25">25 Scans</option>
                    <option value="50">50 Scans</option>
                    <option value="100">100 Scans</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 rounded-full text-xs font-bold text-white bg-[#633C49] hover:bg-[#914C60] transition-all shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Generating Cryptographic Pass..." : "Create & Authorize Pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 2: CREATED PASS BANNER (TOKEN & WHATSAPP)
         ========================================================================= */}
      {createdPassResult && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#633C49]/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setCreatedPassResult(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border-2 border-[#D9B7A0] rounded-3xl shadow-2xl p-6 text-[#633C49] space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-emerald-600 text-white">
                <CheckCircle2 className="w-6 h-6" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Guest Pass Generated
                </span>
                <h3 className="font-serif text-xl font-bold">
                  {createdPassResult.guestName || "Wedding Guest Pass"}
                </h3>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#947A80] mb-1 uppercase tracking-wider">
                Direct Unauthenticated Guest Link
              </label>
              <div className="p-2 rounded-xl bg-[#FFF8F3] border border-[#EADDE0] flex items-center justify-between text-xs">
                <span className="truncate font-mono text-[11px] text-[#633C49]">
                  {createdPassResult.guestUrl}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyLink(createdPassResult.guestUrl)}
                  className="p-1.5 rounded-lg text-[#A85D70] hover:bg-[#F1D5D5]/50 transition-colors"
                  title="Copy Link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">WhatsApp Sharing Message</span>
                <button
                  type="button"
                  onClick={() => handleShareWhatsapp(createdPassResult.whatsappMessage)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] transition-all shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send on WhatsApp</span>
                </button>
              </div>
              <pre className="text-[11px] text-gray-700 whitespace-pre-wrap font-sans bg-white/70 p-3 rounded-xl border border-emerald-100">
                {createdPassResult.whatsappMessage}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setCreatedPassResult(null)}
                className="px-5 py-2 rounded-full text-xs font-semibold text-[#633C49] bg-[#FFF8F3] hover:bg-[#F1D5D5]/50 border border-[#EADDE0]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 3: QR CODE PREVIEW MODAL
         ========================================================================= */}
      {activeQrPass && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#633C49]/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveQrPass(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white border border-[#EADDE0] rounded-3xl shadow-2xl p-6 text-center space-y-4"
          >
            <h3 className="font-serif text-lg font-bold text-[#633C49]">
              {activeQrPass.name}
            </h3>

            <div className="p-4 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0] flex flex-col items-center">
              <QrCodeSvg
                value={activeQrPass.url}
                size={200}
                fgColor="#633C49"
                bgColor="#FFF8F3"
                title="Guest Pass QR Code"
              />
              <span className="text-[10px] font-bold text-[#947A80] uppercase tracking-wider mt-2">
                Scan with any smartphone camera
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveQrPass(null)}
              className="w-full py-2.5 rounded-full text-xs font-bold text-white bg-[#633C49] hover:bg-[#914C60]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 4: BULK PHOTO UPLOAD DIALOG
         ========================================================================= */}
      {isBulkUploadOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#633C49]/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsBulkUploadOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#FFF8F3] border border-[#EADDE0] rounded-3xl shadow-2xl p-6 text-[#633C49] space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#EADDE0] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#633C49] text-white">
                  <UploadCloud className="w-4 h-4 text-[#D9B7A0]" />
                </span>
                <div>
                  <h3 className="font-serif text-xl font-bold">Bulk Wedding Photo Upload</h3>
                  <p className="text-[11px] text-[#765D62]">Unlimited photos with automatic AI face indexing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkUploadOpen(false)}
                className="p-1 rounded-full text-[#765D62] hover:bg-[#F1D5D5]/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[#947A80] mb-1">
                  Target Ceremony
                </label>
                <select
                  value={selectedCeremony}
                  onChange={(e) => setSelectedCeremony(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-xs font-semibold"
                >
                  <option value="Sangeet">Sangeet</option>
                  <option value="Phere">Phere</option>
                  <option value="Mehendi">Mehendi</option>
                  <option value="Haldi">Haldi</option>
                  <option value="Reception">Reception</option>
                </select>
              </div>

              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-[#A85D70]/40 hover:border-[#A85D70] bg-white rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
              >
                <UploadCloud className="w-10 h-10 text-[#A85D70] mb-2" />
                <p className="font-bold text-[#633C49]">
                  {bulkFiles.length > 0
                    ? `${bulkFiles.length} photos selected`
                    : "Click to Select Wedding Photographs"}
                </p>
                <p className="text-[11px] text-[#765D62] mt-0.5">JPG, PNG, WebP up to 20MB per photo</p>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="hidden"
                  onChange={handleSelectFiles}
                />
              </div>

              {/* Progress bars if uploading */}
              {uploadStatus === "uploading" && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {bulkFiles.map((f) => (
                    <div key={f.name} className="p-2 rounded-xl bg-white border border-[#EADDE0] text-[11px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="truncate max-w-[200px]">{f.name}</span>
                        <span className="font-bold">{uploadProgress[f.name] || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#A85D70] transition-all"
                          style={{ width: `${Math.max(0, uploadProgress[f.name] || 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartBulkUpload}
                  disabled={bulkFiles.length === 0 || uploadStatus === "uploading"}
                  className="w-full py-3 px-6 rounded-full text-xs font-bold text-white bg-[#633C49] hover:bg-[#914C60] transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {uploadStatus === "uploading" ? "Uploading & Indexing Faces..." : `Upload ${bulkFiles.length} Photos`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestPassManagementSection;

