"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { HowItWorks } from "@/components/HowItWorks";
import { FeatureStrip } from "@/components/FeatureStrip";
import { Footer } from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#765D62]">
      <Navbar />
      <main className="flex-1">
        <HowItWorks onGetStarted={() => router.push("/find-photos")} />
        <FeatureStrip />
      </main>
      <Footer />
    </div>
  );
}

