"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Image as ImageIcon,
  Download,
  Search,
  Filter,
  Check,
  X,
  RefreshCw,
  HardDrive,
  Eye,
  Plus,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
  HeartHandshake,
} from "lucide-react";

export interface WeddingEventItem {
  id: string;
  slug?: string;
  title: string;
  bride_name: string;
  groom_name: string;
  event_date: string;
  venue: string;
  location: string;
  cover_image?: string;
  description?: string;
  status: string;
  storage_allocated_bytes: number;
  storage_used_bytes: number;
  total_photos: number;
  active_passes_count: number;
}

export interface ModerationItem {
  upload_id: string;
  guest_name: string;
  moderation_status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: number;
  photo_id: string;
  url: string;
  thumbnail_url: string;
  filename: string;
  ceremony_name: string;
  faces_count: number;
  size_bytes: number;
}

export interface RsvpItem {
  id: string;
  event_id: string;
  guest_name: string;
  email: string | null;
  phone: string | null;
  attendance_status: "ATTENDING" | "NOT_ATTENDING" | "TENTATIVE";
  attendee_count: number;
  dietary_preferences: string | null;
  message: string | null;
  created_at: number;
}

interface EventMonitorSectionProps {
  currentEventId: string;
  onSelectEvent: (eventId: string, eventName: string) => void;
  onRefreshEvents?: () => void;
}

export const EventMonitorSection: React.FC<EventMonitorSectionProps> = ({
  currentEventId,
  onSelectEvent,
  onRefreshEvents,
}) => {
  // Events
  const [events, setEvents] = useState<WeddingEventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Event Form
  const [newTitle, setNewTitle] = useState("");
  const [newBride, setNewBride] = useState("");
  const [newGroom, setNewGroom] = useState("");
  const [newDate, setNewDate] = useState("2026-12-14");
  const [newVenue, setNewVenue] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Moderation state
  const [moderationItems, setModerationItems] = useState<ModerationItem[]>([]);
  const [moderationFilter, setModerationFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [loadingModeration, setLoadingModeration] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // RSVP state
  const [rsvps, setRsvps] = useState<RsvpItem[]>([]);
  const [rsvpFilter, setRsvpFilter] = useState<string>("ALL");
  const [rsvpSearch, setRsvpSearch] = useState<string>("");
  const [loadingRsvps, setLoadingRsvps] = useState<boolean>(false);
  const [rsvpStats, setRsvpStats] = useState({ total: 0, attending: 0, notAttending: 0, headcount: 0 });

  // Notifications
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showNotify = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Fetch Moderation Queue
  const fetchModeration = useCallback(async (eventId: string, status: string) => {
    setLoadingModeration(true);
    try {
      const res = await fetch(`/api/admin/moderation?eventId=${encodeURIComponent(eventId)}&status=${encodeURIComponent(status)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.submissions)) {
        setModerationItems(data.submissions);
      } else {
        setModerationItems([]);
      }
    } catch {
      setModerationItems([]);
    } finally {
      setLoadingModeration(false);
    }
  }, []);

  // Fetch RSVPs
  const fetchRsvps = useCallback(async (eventId: string, status: string, search: string) => {
    setLoadingRsvps(true);
    try {
      const query = new URLSearchParams({ eventId });
      if (status !== "ALL") query.set("status", status);
      if (search.trim()) query.set("search", search.trim());

      const res = await fetch(`/api/admin/rsvp?${query.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.rsvps)) {
        setRsvps(data.rsvps);
        if (data.stats) {
          setRsvpStats({
            total: data.stats.total || 0,
            attending: data.stats.attending || 0,
            notAttending: data.stats.notAttending || 0,
            headcount: data.stats.totalGuestCount || 0,
          });
        }
      } else {
        setRsvps([]);
      }
    } catch {
      setRsvps([]);
    } finally {
      setLoadingRsvps(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchModeration(currentEventId, moderationFilter);
    fetchRsvps(currentEventId, rsvpFilter, rsvpSearch);
  }, [currentEventId, moderationFilter, rsvpFilter, rsvpSearch, fetchModeration, fetchRsvps]);

  const currentEvent = events.find((e) => e.id === currentEventId) || events[0] || {
    id: "marwaha-gulati-2026",
    title: "Marwaha & Gulati Grand Wedding",
    bride_name: "Mahine Marwaha",
    groom_name: "Anand Gulati",
    event_date: "2026-12-14",
    venue: "Deventure Shimla Hills Resort",
    location: "Solan (HP), India",
    status: "ACTIVE",
    storage_allocated_bytes: 53687091200,
    storage_used_bytes: 4294967296,
    total_photos: 148,
    active_passes_count: 8,
  };

  // Moderation Action (Approve / Reject)
  const handleModerationAction = async (uploadId: string, action: "APPROVE" | "REJECT") => {
    setActionInProgress(uploadId);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, action }),
      });
      const data = await res.json();
      if (data.success) {
        showNotify(`Photo successfully ${action === "APPROVE" ? "Approved & added to gallery" : "Rejected"}!`);
        fetchModeration(currentEventId, moderationFilter);
      } else {
        showNotify(data.error || "Failed to update moderation status", "error");
      }
    } catch {
      showNotify("Network error while updating moderation", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Create Event Handler
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBride.trim() || !newGroom.trim()) {
      showNotify("Title, Bride name, and Groom name are required", "error");
      return;
    }

    setCreatingEvent(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          bride_name: newBride,
          groom_name: newGroom,
          event_date: newDate,
          venue: newVenue || "Luxury Resort Lawn",
          location: newLocation || "India",
          description: newDesc,
          storage_allocated_bytes: 53687091200, // 50GB default
        }),
      });

      const data = await res.json();
      if (data.success && data.event) {
        showNotify(`Wedding "${data.event.title}" created successfully!`);
        setShowCreateModal(false);
        setNewTitle("");
        setNewBride("");
        setNewGroom("");
        setNewVenue("");
        setNewLocation("");
        setNewDesc("");
        await fetchEvents();
        onSelectEvent(data.event.id, data.event.title);
        if (onRefreshEvents) onRefreshEvents();
      } else {
        showNotify(data.error || "Failed to create event", "error");
      }
    } catch {
      showNotify("Network error while creating wedding event", "error");
    } finally {
      setCreatingEvent(false);
    }
  };

  // Format Bytes Helper
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 MB";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const storageUsedPercent = Math.min(
    100,
    Math.round(((currentEvent.storage_used_bytes || 0) / (currentEvent.storage_allocated_bytes || 53687091200)) * 100)
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all ${
            notification.type === "success"
              ? "bg-[#633C49] text-white border border-[#D9B7A0]"
              : "bg-rose-700 text-white"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* EVENT TELEMETRY COMMAND CARD */}
      <div className="bg-gradient-to-r from-white via-[#FFF8F3] to-[#F1D5D5]/30 rounded-3xl p-6 sm:p-8 border-2 border-[#D9B7A0] shadow-[0_12px_36px_rgba(99,60,73,0.08)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#EADDE0]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#A85D70] bg-[#F1D5D5] px-2.5 py-0.5 rounded-full border border-[#A85D70]/20">
                Live Event Monitor &amp; Controls
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold text-emerald-700">Online</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#633C49]">
              {currentEvent.title || `${currentEvent.bride_name} & ${currentEvent.groom_name}`}
            </h2>
            <p className="text-xs sm:text-sm text-[#765D62]">
              {currentEvent.venue} • {currentEvent.location} • Date: {currentEvent.event_date}
            </p>
          </div>

          {/* Event Selector & New Event Trigger */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-[#D9B7A0] shadow-2xs">
              <Calendar className="w-4 h-4 text-[#A85D70]" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#947A80]">Current Event</span>
                <select
                  value={currentEventId}
                  onChange={(e) => {
                    const chosen = events.find((ev) => ev.id === e.target.value);
                    onSelectEvent(e.target.value, chosen?.title || "Wedding");
                  }}
                  className="text-xs font-bold text-[#633C49] bg-transparent outline-none cursor-pointer pr-4"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title || `${ev.bride_name} & ${ev.groom_name}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#633C49] hover:bg-[#4E2D38] transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Wedding Event</span>
            </button>
          </div>
        </div>

        {/* 4 Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-2xs">
            <div className="flex items-center justify-between text-[#947A80]">
              <span className="text-[10px] uppercase font-bold tracking-wider">Event Photos</span>
              <ImageIcon className="w-4 h-4 text-[#A85D70]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#633C49] mt-2">
              {currentEvent.total_photos || 0}
            </div>
            <span className="text-[11px] text-[#765D62]">Master album assets</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-2xs">
            <div className="flex items-center justify-between text-[#947A80]">
              <span className="text-[10px] uppercase font-bold tracking-wider">Active Guest Passes</span>
              <Users className="w-4 h-4 text-[#A85D70]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#633C49] mt-2">
              {currentEvent.active_passes_count || 0}
            </div>
            <span className="text-[11px] text-[#765D62]">QR &amp; WhatsApp links</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-2xs">
            <div className="flex items-center justify-between text-[#947A80]">
              <span className="text-[10px] uppercase font-bold tracking-wider">RSVP Responses</span>
              <HeartHandshake className="w-4 h-4 text-[#A85D70]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#633C49] mt-2">
              {rsvpStats.attending} Attending
            </div>
            <span className="text-[11px] text-[#765D62]">{rsvpStats.headcount} total headcounts</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EADDE0] shadow-2xs">
            <div className="flex items-center justify-between text-[#947A80]">
              <span className="text-[10px] uppercase font-bold tracking-wider">Private Storage</span>
              <HardDrive className="w-4 h-4 text-[#A85D70]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#633C49] mt-2">
              {formatBytes(currentEvent.storage_used_bytes)}
            </div>
            <div className="w-full bg-[#EADDE0] h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-[#A85D70] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, storageUsedPercent)}%` }}
              />
            </div>
            <span className="text-[10px] text-[#947A80] mt-1 block">
              {storageUsedPercent}% of {formatBytes(currentEvent.storage_allocated_bytes || 53687091200)}
            </span>
          </div>
        </div>
      </div>

      {/* MODERATION QUEUE FOR EVENT GUEST SUBMISSIONS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#A85D70]" />
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#633C49]">
                Guest Candid Moderation Queue
              </h3>
            </div>
            <p className="text-xs text-[#947A80] mt-0.5">
              Review candid photographs submitted by wedding guests before publishing to the master guest gallery.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(["PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setModerationFilter(status)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  moderationFilter === status
                    ? "bg-[#633C49] text-white shadow-2xs"
                    : "bg-[#FFF8F3] text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
                }`}
              >
                {status}
              </button>
            ))}
            <button
              type="button"
              onClick={() => fetchModeration(currentEventId, moderationFilter)}
              className="p-2 rounded-full border border-[#EADDE0] text-[#765D62] hover:text-[#633C49] hover:bg-[#FFF8F3]"
              title="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingModeration ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Moderation Grid */}
        {loadingModeration ? (
          <div className="py-12 text-center text-xs text-[#947A80]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#A85D70] mb-2" />
            Loading submissions for {currentEvent.title}...
          </div>
        ) : moderationItems.length === 0 ? (
          <div className="py-10 text-center rounded-2xl bg-[#FFF8F3]/60 border border-dashed border-[#EADDE0] p-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
            <h4 className="font-serif text-base font-bold text-[#633C49]">
              Queue is all clear ({moderationFilter.toLowerCase()})
            </h4>
            <p className="text-xs text-[#765D62] mt-1 max-w-sm mx-auto">
              No photos currently matching this status for this event. Guests can submit candid photos via the Guest Upload portal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {moderationItems.map((item) => (
              <div
                key={item.upload_id}
                className="bg-[#FFF8F3]/50 rounded-2xl p-4 border border-[#EADDE0] hover:border-[#D9B7A0] transition-all space-y-3"
              >
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-stone-100 border border-[#EADDE0]">
                  <img
                    src={item.thumbnail_url || item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
                    {item.ceremony_name || "Candid"}
                  </span>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-[#633C49] backdrop-blur-xs">
                    {item.faces_count} {item.faces_count === 1 ? "face" : "faces"}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#633C49]">{item.guest_name || "Guest"}</span>
                    <span className="text-[10px] text-[#947A80]">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#765D62] truncate">{item.filename}</p>
                </div>

                {/* Moderation Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#EADDE0]">
                  <button
                    type="button"
                    disabled={actionInProgress === item.upload_id}
                    onClick={() => handleModerationAction(item.upload_id, "APPROVE")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    disabled={actionInProgress === item.upload_id}
                    onClick={() => handleModerationAction(item.upload_id, "REJECT")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIVE RSVP MONITOR & EXPORT SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADDE0] shadow-[0_12px_32px_rgba(99,60,73,0.06)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#A85D70]" />
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#633C49]">
                Live Event RSVP Registry
              </h3>
            </div>
            <p className="text-xs text-[#947A80] mt-0.5">
              Live guest attendance responses, headcount tracking, dietary requests, and CSV export for wedding caterers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/admin/rsvp?eventId=${encodeURIComponent(currentEventId)}&format=csv`}
              download={`rsvp_${currentEventId}.csv`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-[#633C49] bg-[#FFF8F3] hover:bg-[#F1D5D5] border border-[#EADDE0] transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#A85D70]" />
              <span>Export RSVP CSV</span>
            </a>
          </div>
        </div>

        {/* RSVP Search & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {["ALL", "ATTENDING", "NOT_ATTENDING"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setRsvpFilter(st)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  rsvpFilter === st
                    ? "bg-[#633C49] text-white shadow-2xs"
                    : "bg-[#FFF8F3] text-[#765D62] hover:text-[#633C49] border border-[#EADDE0]"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#947A80]" />
            <input
              type="text"
              placeholder="Search RSVP guest..."
              value={rsvpSearch}
              onChange={(e) => setRsvpSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-[#EADDE0] bg-[#FFF8F3] text-[#633C49] focus:outline-none focus:border-[#A85D70]"
            />
          </div>
        </div>

        {/* RSVP Table */}
        {loadingRsvps ? (
          <div className="py-12 text-center text-xs text-[#947A80]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#A85D70] mb-2" />
            Loading RSVPs for this event...
          </div>
        ) : rsvps.length === 0 ? (
          <div className="py-10 text-center rounded-2xl bg-[#FFF8F3]/60 border border-dashed border-[#EADDE0] p-6">
            <Users className="w-8 h-8 text-[#A85D70] mx-auto mb-2 opacity-60" />
            <h4 className="font-serif text-base font-bold text-[#633C49]">No RSVP records yet</h4>
            <p className="text-xs text-[#765D62] mt-1 max-w-sm mx-auto">
              When guests complete the RSVP form on the wedding landing page, their responses will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EADDE0] text-[#947A80] uppercase tracking-wider font-semibold">
                  <th className="pb-3 pl-2">Guest Name</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Attendees</th>
                  <th className="pb-3">Dietary / Notes</th>
                  <th className="pb-3">Wishes / Message</th>
                  <th className="pb-3 pr-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADDE0]">
                {rsvps.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FFF8F3]/60 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="font-bold text-[#633C49]">{r.guest_name}</div>
                      <div className="text-[10px] text-[#947A80]">{r.email || r.phone || "Direct response"}</div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.attendance_status === "ATTENDING"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {r.attendance_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-[#633C49]">{r.attendee_count} guests</td>
                    <td className="py-3 text-[#765D62] max-w-xs truncate">
                      {r.dietary_preferences || "Standard catering"}
                    </td>
                    <td className="py-3 text-[#765D62] max-w-xs truncate italic">
                      {r.message ? `"${r.message}"` : "—"}
                    </td>
                    <td className="py-3 pr-2 text-right text-[11px] text-[#947A80]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE NEW WEDDING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#EADDE0] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#EADDE0] pb-4">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#633C49]">
                  Create New Wedding Event
                </h3>
                <p className="text-xs text-[#947A80] mt-0.5">
                  Set up an isolated event with private photo albums, face indexing, and guest passes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full text-[#947A80] hover:text-[#633C49] hover:bg-[#FFF8F3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#633C49] mb-1">
                  Wedding Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marwaha & Gulati Grand Wedding"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#EADDE0] bg-[#FFF8F3] text-[#633C49] focus:outline-none focus:border-[#A85D70]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#633C49] mb-1">Bride Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahine"
                    value={newBride}
                    onChange={(e) => setNewBride(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#EADDE0] bg-[#FFF8F3] text-[#633C49] focus:outline-none focus:border-[#A85D70]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#633C49] mb-1">Groom Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand"
                    value={newGroom}
                    onChange={(e) => setNewGroom(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#EADDE0] bg-[#FFF8F3] text-[#633C49] focus:outline-none focus:border-[#A85D70]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#633C49] mb-1">Event Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#EADDE0] bg-[#FFF8F3] text-[#633C49] focus:outline-none focus:border-[#A85D70]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#633C49] mb-1">Location City</label>
                  <input
                    type="text"
                    placeholder="e.g. Solan (HP), India"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#EADDE0] bg-[#FFF8F3] text-[#633C49] focus:outline-none focus:border-[#A85D70]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#633C49] mb-1">Venue Name</label>
                <input
                  type="text"
                  placeholder="e.g. Deventure Shimla Hills Resort"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#EADDE0] bg-[#FFF8F3] text-[#633C49] focus:outline-none focus:border-[#A85D70]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#633C49] mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Ceremony schedule, special notes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#EADDE0] bg-[#FFF8F3] text-[#633C49] focus:outline-none focus:border-[#A85D70]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EADDE0]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#765D62] hover:bg-[#FFF8F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#633C49] hover:bg-[#4E2D38] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {creatingEvent ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Create Wedding Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

