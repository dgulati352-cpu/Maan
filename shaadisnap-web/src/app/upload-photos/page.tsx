"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { GuestPhotoUpload } from "@/components/GuestPhotoUpload";
import { useRouter } from "next/navigation";

export default function UploadPhotosPage() {
  const router = useRouter();

  const handleNavigate = (tab: "landing" | "search" | "upload") => {
    if (tab === "landing") router.push("/");
    if (tab === "search") router.push("/find-photos");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#765D62]">
      <Navbar activeTab="upload" />
      <main className="flex-1">
        <GuestPhotoUpload onNavigate={handleNavigate} />
      </main>
    </div>
  );
}

