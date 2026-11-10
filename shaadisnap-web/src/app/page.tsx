"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeatureStrip } from "@/components/FeatureStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { EventScheduleSection } from "@/components/EventScheduleSection";
import { FullWeddingGallery } from "@/components/FullWeddingGallery";
import { GuestSelfieSearch } from "@/components/GuestSelfieSearch";
import { GuestPhotoUpload } from "@/components/GuestPhotoUpload";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"landing" | "gallery" | "search" | "upload">("landing");

  const scrollToSection = (id: string) => {
    if (id === "hero" || id === "landing") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveTab("landing");
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Active section scroll spy for mobile and desktop devices
  useEffect(() => {
    const sections: { id: string; tab: "landing" | "gallery" | "search" | "upload" }[] = [
      { id: "hero", tab: "landing" },
      { id: "search", tab: "search" },
      { id: "upload", tab: "upload" },
      { id: "gallery", tab: "gallery" },
      { id: "schedule", tab: "landing" },
    ];

    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveTab(sections[i].tab);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#633C49] w-full overflow-x-hidden">
      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          const targetId =
            tab === "search"
              ? "search"
              : tab === "upload"
              ? "upload"
              : tab === "gallery"
              ? "gallery"
              : "hero";
          scrollToSection(targetId);
        }}
      />

      {/* Unified Vertical Flow: Up-to-Down Scroll Across All Devices */}
      <main className="flex-1 w-full space-y-0">
        {/* 1. Hero Welcome & Portrait */}
        <section id="hero" className="scroll-mt-20">
          <Hero
            onFindPhotos={() => scrollToSection("search")}
            onUploadPhotos={() => scrollToSection("upload")}
          />
        </section>

        {/* 2. Feature Highlights Strip */}
        <FeatureStrip />

        {/* 3. AI Facial Photo Search */}
        <section id="search" className="scroll-mt-20 border-t border-[#EADDE0]">
          <GuestSelfieSearch />
        </section>

        {/* 4. Guest Candid Upload Studio */}
        <section id="upload" className="scroll-mt-20 border-t border-[#EADDE0] bg-[#FFF8F3] py-12 lg:py-16">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <GuestPhotoUpload
              onNavigate={(tab) => {
                const targetId = tab === "landing" ? "hero" : tab === "search" ? "search" : "upload";
                scrollToSection(targetId);
              }}
            />
          </div>
        </section>

        {/* 5. Complete Wedding Gallery */}
        <section id="gallery" className="scroll-mt-20 border-t border-[#EADDE0]">
          <FullWeddingGallery
            onFindPhotos={() => scrollToSection("search")}
            onUploadPhotos={() => scrollToSection("upload")}
          />
        </section>

        {/* 6. How AI Discovery Works */}
        <section id="how-it-works" className="scroll-mt-20">
          <HowItWorks onGetStarted={() => scrollToSection("search")} />
        </section>

        {/* 7. Event Timeline & Venue Map */}
        <section id="schedule" className="scroll-mt-20">
          <EventScheduleSection />
        </section>
      </main>

      {/* Luxury Wedding Footer */}
      <Footer />
    </div>
  );
}
