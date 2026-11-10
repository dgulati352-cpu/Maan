"use client";

import React from "react";
import { AdminPhotoManagementStudio } from "@/components/admin/AdminPhotoManagementStudio";
import { WEDDING_EVENT } from "@/data/mockWeddingData";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminPhotosPage() {
  return (
    <main className="flex-1 p-6 sm:p-10 max-w-[1360px] w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADDE0]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1D5D5]/60 border border-[#EADDE0] text-xs font-semibold tracking-wider uppercase text-[#633C49] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#A85D70]" />
            <span>ShaadiSnap AI • Photo Operations Hub</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#633C49]">
            Wedding Photo Management Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#765D62] mt-1">
            {WEDDING_EVENT.couple} • {WEDDING_EVENT.venue} • {WEDDING_EVENT.date}
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[#633C49] bg-white border border-[#EADDE0] hover:border-[#A85D70] transition-colors shadow-xs w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* Flagship Admin Photo Management Studio Component */}
      <AdminPhotoManagementStudio />
    </main>
  );
}

