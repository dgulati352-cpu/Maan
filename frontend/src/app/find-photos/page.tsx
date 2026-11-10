"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { GuestSelfieSearch } from "@/components/GuestSelfieSearch";
import { Footer } from "@/components/Footer";

export default function FindPhotosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#765D62]">
      <Navbar activeTab="search" />
      <main className="flex-1">
        <GuestSelfieSearch />
      </main>
      <Footer />
    </div>
  );
}

