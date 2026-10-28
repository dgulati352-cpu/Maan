"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeatureStrip } from "@/components/FeatureStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { StatsSection } from "@/components/StatsSection";
import { LuxuryGalleryPreview } from "@/components/LuxuryGalleryPreview";
import { GuestSelfieSearch } from "@/components/GuestSelfieSearch";
import { GuestPhotoUpload } from "@/components/GuestPhotoUpload";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"landing" | "search" | "upload">("landing");

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EF] text-[#242321]">
      {/* Refined Navigation Bar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Dynamic Screen View */}
      {activeTab === "landing" && (
        <main className="flex-1">
          <Hero
            onFindPhotos={() => setActiveTab("search")}
            onUploadPhotos={() => setActiveTab("upload")}
          />
          <FeatureStrip />
          <LuxuryGalleryPreview onFindYourFace={() => setActiveTab("search")} />
          <HowItWorks onGetStarted={() => setActiveTab("search")} />
          <StatsSection />
        </main>
      )}

      {activeTab === "search" && (
        <main className="flex-1">
          <GuestSelfieSearch />
        </main>
      )}

      {activeTab === "upload" && (
        <main className="flex-1">
          <GuestPhotoUpload onNavigate={setActiveTab} />
        </main>
      )}

      {/* Luxury Footer (visible on landing and search screens) */}
      {activeTab !== "upload" && <Footer />}
    </div>
  );
}
