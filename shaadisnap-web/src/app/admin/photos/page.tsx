"use client";

import React, { useState, useEffect } from "react";
import { AdminPhotoManagementStudio } from "@/components/admin/AdminPhotoManagementStudio";
import { WEDDING_EVENT } from "@/data/mockWeddingData";
import { Sparkles, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";

export default function AdminPhotosPage() {
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("marwaha-gulati-2026");
  const [selectedEventName, setSelectedEventName] = useState<string>("Marwaha & Gulati Grand Wedding");

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/admin/events");
        const data = await res.json();
        if (data.success && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
          setSelectedEventId(data.events[0].id);
          setSelectedEventName(data.events[0].title);
        }
      } catch {
        // Fallback to default
      }
    }
    loadEvents();
  }, []);

  return (
    <main className="flex-1 p-6 sm:p-10 max-w-[1360px] w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#EADDE0]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1D5D5]/60 border border-[#EADDE0] text-xs font-semibold tracking-wider uppercase text-[#633C49] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#A85D70]" />
            <span>ShaadiSnap AI • Photo Operations Hub</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#633C49]">
            Wedding Photo Management Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#765D62] mt-1">
            {selectedEventName} • {WEDDING_EVENT.venue} • {WEDDING_EVENT.date}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {events.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-[#D9B7A0] shadow-2xs">
              <Calendar className="w-4 h-4 text-[#A85D70]" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#947A80]">Selected Event</span>
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    const chosen = events.find((ev) => ev.id === e.target.value);
                    setSelectedEventId(e.target.value);
                    if (chosen) setSelectedEventName(chosen.title);
                  }}
                  className="text-xs font-bold text-[#633C49] bg-transparent outline-none cursor-pointer pr-4"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[#633C49] bg-white border border-[#EADDE0] hover:border-[#A85D70] transition-colors shadow-xs w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </Link>
        </div>
      </div>

      {/* Flagship Admin Photo Management Studio Component bound to selectedEventId */}
      <AdminPhotoManagementStudio
        eventId={selectedEventId}
        eventName={selectedEventName}
      />
    </main>
  );
}
