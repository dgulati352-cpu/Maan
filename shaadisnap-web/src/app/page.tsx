"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeatureStrip } from "@/components/FeatureStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { EventScheduleSection } from "@/components/EventScheduleSection";
import { LuxuryGalleryPreview } from "@/components/LuxuryGalleryPreview";
import { FullWeddingGallery } from "@/components/FullWeddingGallery";
import { GuestSelfieSearch } from "@/components/GuestSelfieSearch";
import { GuestPhotoUpload } from "@/components/GuestPhotoUpload";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"landing" | "gallery" | "search" | "upload">("landing");

  const handleTabChange = (tab: "landing" | "gallery" | "search" | "upload") => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#633C49] w-full overflow-x-hidden">
      {/* Sticky Top Navigation */}
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Screen 1: Home / Landing */}
      {activeTab === "landing" && (
        <main className="flex-1 w-full">
          <Hero
            onFindPhotos={() => handleTabChange("search")}
            onUploadPhotos={() => handleTabChange("upload")}
          />
          <FeatureStrip />
          <LuxuryGalleryPreview
            onFindYourFace={() => handleTabChange("search")}
            onViewAllGallery={() => handleTabChange("gallery")}
          />
          <HowItWorks onGetStarted={() => handleTabChange("search")} />
          <section id="schedule" className="scroll-mt-20">
            <EventScheduleSection />
          </section>
        </main>
      )}

      {/* Screen 2: Dedicated Full Gallery Screen */}
      {activeTab === "gallery" && (
        <main className="flex-1 w-full py-6 md:py-10">
          <FullWeddingGallery
            onFindPhotos={() => handleTabChange("search")}
          />
        </main>
      )}

      {/* Screen 3: Dedicated Find Photos Screen (AI Facial Search) */}
      {activeTab === "search" && (
        <main className="flex-1 w-full py-6 md:py-10">
          <GuestSelfieSearch />
        </main>
      )}

      {/* Screen 4: Dedicated Upload Photos & Event Studio Screen */}
      {activeTab === "upload" && (
        <main className="flex-1 w-full py-6 md:py-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto">
          <GuestPhotoUpload onNavigate={handleTabChange} />
        </main>
      )}

      {/* Luxury Footer (on all screens) */}
      <Footer />
    </div>
  );
}
