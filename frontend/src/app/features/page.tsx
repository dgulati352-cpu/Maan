"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { FeatureStrip } from "@/components/FeatureStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { StatsSection } from "@/components/StatsSection";
import { Footer } from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function FeaturesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#765D62]">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 px-4">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#A85D70]">
            Platform Capabilities
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#633C49] tracking-tight">
            Engineered for Luxury Celebrations
          </h1>
          <p className="text-base sm:text-lg text-[#947A80] max-w-xl mx-auto leading-relaxed">
            Discover the technology behind ShaadiSnap AI: privacy-first biometric indexing, high-resolution original downloads, and seamless guest experiences.
          </p>
        </div>
        <FeatureStrip />
        <HowItWorks onGetStarted={() => router.push("/find-photos")} />
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
}

