"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Image as ImageIcon,
  Search,
  Sparkles,
  CheckCircle2,
  Trash2,
  ExternalLink,
  UploadCloud,
  Users,
  ShieldCheck,
  CheckSquare,
  Square,
  UserX,
  Sliders,
  Check,
  Award,
  Clock,
} from "lucide-react";
import {
  getWeddingPhotos,
  deleteUploadedPhoto,
  approvePhoto,
  batchApprovePhotos,
  getGuestLinkApprovalStatus,
  setGuestLinkApprovalStatus,
} from "@/lib/weddingPhotoStore";
import { WEDDING_EVENT, WeddingPhoto } from "@/data/mockWeddingData";

interface GuestRecord {
  id: string;
  name: string;
  role: "Immediate Family" | "Bridal Party" | "Groomsmen" | "VIP Guest";
  table: string;
  matchedCount: number;
  consentGiven: boolean;
  erased: boolean;
  lastActive: string;
}

const INITIAL_GUESTS: GuestRecord[] = [
  {
    id: "g-01",
    name: "Ananya Gulati",
    role: "Immediate Family",
    table: "Table 1 (Royal Pavilion)",
    matchedCount: 24,
    consentGiven: true,
    erased: false,
    lastActive: "12 mins ago",
  },
  {
    id: "g-02",
    name: "Vikramaditya Singh",
    role: "Bridal Party",
    table: "Table 2 (Mewar Courtyard)",
    matchedCount: 31,
    consentGiven: true,
    erased: false,
    lastActive: "25 mins ago",
  },
  {
    id: "g-03",
    name: "Rohan Mehta",
    role: "Groomsmen",
    table: "Table 4 (Lake Promenade)",
    matchedCount: 14,
    consentGiven: true,
    erased: false,
    lastActive: "1 hour ago",
  },
  {
    id: "g-04",
    name: "Priya Sharma",
    role: "Bridal Party",
    table: "Table 3 (Rose Garden)",
    matchedCount: 19,
    consentGiven: true,
    erased: false,
    lastActive: "40 mins ago",
  },
  {
    id: "g-05",
    name: "Siddharth Anand",
    role: "Immediate Family",
    table: "Table 1 (Royal Pavilion)",
    matchedCount: 42,
    consentGiven: true,
    erased: false,
    lastActive: "2 hours ago",
  },
  {
    id: "g-06",
    name: "Sunita Gulati",
    role: "Immediate Family",
    table: "Table 1 (Royal Pavilion)",
    matchedCount: 38,
    consentGiven: true,
    erased: false,
    lastActive: "35 mins ago",
  },
  {
    id: "g-07",
    name: "Karan Kapoor",
    role: "Groomsmen",
    table: "Table 5 (Zenana Mahal)",
    matchedCount: 9,
    consentGiven: true,
    erased: false,
    lastActive: "3 hours ago",
  },
  {
    id: "g-08",
    name: "Meera Patel",
    role: "VIP Guest",
    table: "Table 6 (Chini Mahal)",
    matchedCount: 16,
    consentGiven: true,
    erased: false,
    lastActive: "4 hours ago",
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"photos" | "guests">("photos");
  const [photos, setPhotos] = useState<WeddingPhoto[]>(() => getWeddingPhotos());
  const [selectedCeremony, setSelectedCeremony] = useState<string>("All");
  const [notice, setNotice] = useState<string>("");
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [guests, setGuests] = useState<GuestRecord[]>(INITIAL_GUESTS);
  const [guestSearch, setGuestSearch] = useState<string>("");
  const [isGuestLinkApproved, setIsGuestLinkApproved] = useState<boolean>(() =>
    getGuestLinkApprovalStatus()
  );

  useEffect(() => {
    const handleSync = () => {
      setPhotos(getWeddingPhotos());
    };
    window.addEventListener("shaadisnap_photos_updated", handleSync);
    return () => window.removeEventListener("shaadisnap_photos_updated", handleSync);
  }, []);

  const pendingCount = photos.filter(
    (p) => p.approvalStatus === "pending_ceo_approval"
  ).length;

  const handleDelete = (id: string, title: string) => {
    deleteUploadedPhoto(id);
    setPhotos(getWeddingPhotos());
    setSelectedPhotoIds((prev) => prev.filter((x) => x !== id));
    setNotice(`Photo "${title}" was removed from the live event album.`);
    setTimeout(() => setNotice(""), 4000);
  };

  const handleBatchDelete = () => {
    if (selectedPhotoIds.length === 0) return;
    const count = selectedPhotoIds.length;
    selectedPhotoIds.forEach((id) => deleteUploadedPhoto(id));
    setPhotos(getWeddingPhotos());
    setSelectedPhotoIds([]);
    setNotice(`${count} photograph${count === 1 ? "" : "s"} successfully removed from live gallery.`);
    setTimeout(() => setNotice(""), 4000);
  };

  const handleBatchApprove = () => {
    if (selectedPhotoIds.length === 0) return;
    const count = selectedPhotoIds.length;
    batchApprovePhotos(selectedPhotoIds);
    setPhotos(getWeddingPhotos());
    setSelectedPhotoIds([]);
    setNotice(`${count} photograph${count === 1 ? "" : "s"} approved for VIP master gallery.`);
    setTimeout(() => setNotice(""), 4000);
  };

  const handleCeoBatchApproveAll = () => {
    const pendingIds = photos
      .filter((p) => p.approvalStatus === "pending_ceo_approval")
      .map((p) => p.id);
    if (pendingIds.length === 0) return;
    batchApprovePhotos(pendingIds);
    setPhotos(getWeddingPhotos());
    setNotice(`All ${pendingIds.length} pending photographs approved by CEO Kabir Marwaha.`);
    setTimeout(() => setNotice(""), 4000);
  };

  const handleSingleApprove = (id: string, title: string) => {
    approvePhoto(id);
    setPhotos(getWeddingPhotos());
    setNotice(`Photo "${title}" approved by CEO.`);
    setTimeout(() => setNotice(""), 3000);
  };

  const toggleGuestLinkApproval = () => {
    const nextVal = !isGuestLinkApproved;
    setIsGuestLinkApproved(nextVal);
    setGuestLinkApprovalStatus(nextVal);
    setNotice(
      nextVal
        ? "Guest Access Link (/find-photos) is now LIVE & Authorized by CEO."
        : "Guest Access Link (/find-photos) has been gated for security review."
    );
    setTimeout(() => setNotice(""), 4000);
  };

  const handleCeremonyChange = (photoId: string, newCeremony: WeddingPhoto["ceremony"]) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, ceremony: newCeremony } : p))
    );
    setNotice(`Ceremony updated to "${newCeremony}".`);
    setTimeout(() => setNotice(""), 3000);
  };

  const handleErasureRequest = (guest: GuestRecord) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === guest.id ? { ...g, erased: true, matchedCount: 0 } : g))
    );
    setNotice(
      `Biometric index and facial embeddings for ${guest.name} purged permanently under DPDP Act 2023 & GDPR Article 17.`
    );
    setTimeout(() => setNotice(""), 5000);
  };

  const filteredPhotos =
    selectedCeremony === "All"
      ? photos
      : photos.filter((p) => p.ceremony === selectedCeremony);

  const filteredGuests = guests.filter((g) =>
    g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
    g.role.toLowerCase().includes(guestSearch.toLowerCase()) ||
    g.table.toLowerCase().includes(guestSearch.toLowerCase())
  );

  const ceremonies = ["All", "Phere", "Sangeet", "Mehendi", "Haldi", "Reception"];

  const toggleSelectPhoto = (id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllPhotos = () => {
    if (selectedPhotoIds.length === filteredPhotos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(filteredPhotos.map((p) => p.id));
    }
  };

  return (
    <main className="flex-1 p-6 sm:p-10 max-w-[1280px] w-full mx-auto space-y-8">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#EADDE0]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1D5D5]/60 border border-[#EADDE0] text-xs font-semibold tracking-wider uppercase text-[#633C49] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#A85D70]" />
            <span>ShaadiSnap AI Organizer Console</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#633C49]">
            {WEDDING_EVENT.couple}
          </h1>
          <p className="text-xs sm:text-sm text-[#765D62] mt-1">
            {WEDDING_EVENT.venue} • {WEDDING_EVENT.date}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/upload-photos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Photos</span>
          </Link>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-[#633C49] bg-white border border-[#EADDE0] hover:border-[#A85D70] transition-colors shadow-xs"
          >
            <ImageIcon className="w-4 h-4 text-[#A85D70]" />
            <span>Open Master Gallery</span>
          </Link>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice("")} className="text-emerald-700 hover:text-emerald-950 cursor-pointer ml-3 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 4 Key Metrics Cards with Rose Champagne Styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-[24px] p-6 border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] hover:border-[#D9B7A0] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#947A80]">
              Active Celebration
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F1D5D5]/50 flex items-center justify-center text-[#A85D70]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-[#633C49] mt-3 truncate">
            Marwaha &amp; Gulati Wedding
          </div>
          <p className="text-xs text-[#765D62] mt-1">
            Deventure Shimla Hills Resort, Solan (HP)
          </p>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] hover:border-[#D9B7A0] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#947A80]">
              Indexed Photos
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F1D5D5]/50 flex items-center justify-center text-[#A85D70]">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-[#633C49] mt-3">
            {photos.length}
          </div>
          <p className="text-xs text-[#765D62] mt-1">
            Uncompressed master files preserved
          </p>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] hover:border-[#D9B7A0] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#947A80]">
              Guest Searches
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F1D5D5]/50 flex items-center justify-center text-[#A85D70]">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-[#633C49] mt-3">
            2,410+
          </div>
          <p className="text-xs text-[#765D62] mt-1">
            Ephemeral ArcFace selfie lookups
          </p>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] hover:border-[#D9B7A0] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#947A80]">
              DPDP Compliance
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-bold text-[#633C49] mt-3">
            100%
          </div>
          <p className="text-xs text-[#765D62] mt-1">
            0 persistent biometric retainers
          </p>
        </div>
      </div>

      {/* CEO Executive Approval Station */}
      <div className="bg-gradient-to-r from-white via-[#FFF8F3] to-[#F1D5D5]/35 rounded-3xl p-6 border-2 border-[#D9B7A0] shadow-[0_12px_36px_rgba(99,60,73,0.08)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#633C49] text-[#D9B7A0] flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A85D70] bg-[#F1D5D5] px-2.5 py-0.5 rounded-full border border-[#A85D70]/20">
                Executive Governance • CEO Kabir Marwaha Desk
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#633C49] mt-1">
              CEO Master Approval Station
            </h3>
            <p className="text-xs sm:text-sm text-[#765D62] mt-0.5 max-w-xl">
              Strict approval protocol: Only photos signed off by the CEO desk go live in public guest galleries.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#EADDE0]">
          {/* Pending Photos Counter & 1-Click Approve */}
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#EADDE0] shadow-2xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#947A80]">
                Pending Photos
              </span>
              <span className="font-serif text-lg font-bold text-[#633C49]">
                {pendingCount} waiting
              </span>
            </div>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={handleCeoBatchApproveAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors shadow-2xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>1-Click CEO Batch Approve</span>
              </button>
            )}
          </div>

          {/* Guest Access Link Approval Switch */}
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#EADDE0] shadow-2xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#947A80]">
                Guest Link Access (/find-photos)
              </span>
              <span className="text-xs font-semibold text-[#633C49]">
                {isGuestLinkApproved ? "Active & Authorized" : "Temporarily Gated"}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleGuestLinkApproval}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isGuestLinkApproved ? "bg-emerald-600" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={isGuestLinkApproved}
              title="Toggle Guest Access Link Approval"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isGuestLinkApproved ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Console Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#EADDE0] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("photos")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "photos"
              ? "bg-[#633C49] text-white shadow-xs"
              : "bg-white text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Photo Moderation Queue ({photos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("guests")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "guests"
              ? "bg-[#633C49] text-white shadow-xs"
              : "bg-white text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Guest Management &amp; DPDP Vault ({guests.length})</span>
        </button>
      </div>

      {/* TAB 1: PHOTO MODERATION QUEUE */}
      {activeTab === "photos" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#633C49]">
                Photo Management &amp; Moderation
              </h2>
              <p className="text-xs text-[#947A80] mt-0.5">
                Multi-select moderation, batch approval, ceremony tagging, and live album controls.
              </p>
            </div>

            {/* Ceremony filter tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-[#633C49] mr-1 hidden sm:inline-flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-[#A85D70]" />
              </span>
              {ceremonies.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCeremony(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCeremony === c
                      ? "bg-[#633C49] text-white"
                      : "bg-[#FFF8F3] text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Batch Moderation Action Bar */}
          <div className="p-3.5 rounded-2xl bg-[#FFF8F3] border border-[#EADDE0] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAllPhotos}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold bg-white border border-[#EADDE0] hover:border-[#A85D70] text-[#633C49] transition-all cursor-pointer"
              >
                {selectedPhotoIds.length === filteredPhotos.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#A85D70]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-[#947A80]" />
                )}
                <span>
                  {selectedPhotoIds.length === filteredPhotos.length ? "Deselect All" : "Select All"}
                </span>
              </button>

              {selectedPhotoIds.length > 0 && (
                <span className="font-semibold text-[#A85D70]">
                  {selectedPhotoIds.length} photograph{selectedPhotoIds.length === 1 ? "" : "s"} selected
                </span>
              )}
            </div>

            {selectedPhotoIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBatchApprove}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Selected ({selectedPhotoIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedPhotoIds.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Photos Table */}
          {filteredPhotos.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#947A80] space-y-2 border border-dashed border-[#EADDE0] rounded-2xl">
              <ImageIcon className="w-8 h-8 text-[#A85D70] mx-auto opacity-50" />
              <p>No photographs found matching the selected ceremony filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EADDE0] text-[#947A80] uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2 w-10">Select</th>
                    <th className="pb-3">Photo Preview</th>
                    <th className="pb-3">Title &amp; Photographer</th>
                    <th className="pb-3">Ceremony Tag</th>
                    <th className="pb-3">Faces Indexed</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADDE0]">
                  {filteredPhotos.map((photo) => {
                    const isSelected = selectedPhotoIds.includes(photo.id);
                    return (
                      <tr
                        key={photo.id}
                        className={`transition-colors ${
                          isSelected ? "bg-[#F1D5D5]/30" : "hover:bg-[#FFF8F3]/60"
                        }`}
                      >
                        <td className="py-3 pl-2">
                          <button
                            type="button"
                            onClick={() => toggleSelectPhoto(photo.id)}
                            className="cursor-pointer text-[#633C49]"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#A85D70]" />
                            ) : (
                              <Square className="w-4 h-4 text-[#947A80]" />
                            )}
                          </button>
                        </td>
                        <td className="py-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FFF8F3] border border-[#EADDE0] shrink-0">
                            <img
                              src={photo.url}
                              alt={photo.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                if (photo.fallbackUrl && e.currentTarget.src !== photo.fallbackUrl) {
                                  e.currentTarget.src = photo.fallbackUrl;
                                }
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-[#633C49] block truncate max-w-xs">
                            {photo.title}
                          </span>
                          <span className="text-[11px] text-[#947A80]">
                            {photo.photographer || "Guest Live Upload"}
                          </span>
                        </td>
                        <td className="py-3">
                          {/* Ceremony Re-categorization Dropdown */}
                          <select
                            value={photo.ceremony}
                            onChange={(e) => handleCeremonyChange(photo.id, e.target.value as WeddingPhoto["ceremony"])}
                            className="text-[11px] font-semibold bg-[#FFF8F3] text-[#633C49] border border-[#EADDE0] rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-[#A85D70]"
                          >
                            {["Phere", "Sangeet", "Mehendi", "Haldi", "Reception"].map((cer) => (
                              <option key={cer} value={cer}>
                                {cer}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {photo.facesCount === 1 ? "1 Person" : `${photo.facesCount || 1} Persons`}
                          </span>
                        </td>
                        <td className="py-3">
                          {photo.approvalStatus === "pending_ceo_approval" ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 text-[10px]">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending CEO Review
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Approved by CEO
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            {photo.approvalStatus === "pending_ceo_approval" && (
                              <button
                                type="button"
                                onClick={() => handleSingleApprove(photo.id, photo.title)}
                                className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                                title="Approve Photo (CEO Sign-Off)"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            )}
                            <a
                              href={photo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[#765D62] hover:text-[#633C49] hover:bg-white border border-[#EADDE0] transition-colors"
                              title="View High-Res Photo"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDelete(photo.id, photo.title)}
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                              title="Remove from Album"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GUEST MANAGEMENT & DPDP ERASURE */}
      {activeTab === "guests" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#633C49]">
                Guest Directory &amp; Biometric Privacy Vault
              </h2>
              <p className="text-xs text-[#947A80] mt-0.5">
                Manage guest VIP designations, monitor search activity, and execute 1-click DPDP Act 2023 biometric erasure.
              </p>
            </div>

            {/* Guest Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#947A80] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                placeholder="Search guest or table..."
                className="w-full pl-9 pr-3 py-1.5 rounded-full text-xs bg-[#FFF8F3] border border-[#EADDE0] text-[#633C49] placeholder-[#947A80] focus:outline-none focus:border-[#A85D70]"
              />
            </div>
          </div>

          {/* Guest Directory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EADDE0] text-[#947A80] uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2">Guest Name</th>
                  <th className="pb-3">VIP Role</th>
                  <th className="pb-3">Table Assignment</th>
                  <th className="pb-3">Matched Photos</th>
                  <th className="pb-3">DPDP Consent</th>
                  <th className="pb-3">Last Active</th>
                  <th className="pb-3 pr-2 text-right">Data Rights (DPDP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADDE0]">
                {filteredGuests.map((guest) => {
                  const getRoleStyle = (role: GuestRecord["role"]) => {
                    switch (role) {
                      case "Immediate Family":
                        return "bg-[#633C49] text-white";
                      case "Bridal Party":
                        return "bg-[#A85D70] text-white";
                      case "Groomsmen":
                        return "bg-[#D9B7A0] text-[#633C49]";
                      default:
                        return "bg-[#F1D5D5] text-[#633C49]";
                    }
                  };

                  return (
                    <tr key={guest.id} className="hover:bg-[#FFF8F3]/60 transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="font-semibold text-[#633C49]">
                          {guest.name}
                        </div>
                        <span className="text-[10px] text-[#947A80]">{guest.id}</span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRoleStyle(
                            guest.role
                          )}`}
                        >
                          {guest.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-[#765D62]">
                        {guest.table}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                          {guest.matchedCount} Photos
                        </span>
                      </td>
                      <td className="py-3.5">
                        {guest.erased ? (
                          <span className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Purged (DPDP)
                          </span>
                        ) : guest.consentGiven ? (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Opt-in Granted
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#947A80]">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 text-[#947A80]">
                        {guest.lastActive}
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        {guest.erased ? (
                          <span className="text-[11px] text-[#947A80] italic">
                            Biometrics Cleared
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleErasureRequest(guest)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 transition-all cursor-pointer shadow-2xs"
                            title="Purge biometric index under DPDP Act 2023"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>1-Click Erase</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </main>
  );
}
