"use client";

import React, { useState, useEffect } from "react";
import { Users, Heart, Camera, CheckCircle2, Lock } from "lucide-react";
import { getWeddingPhotos } from "@/lib/weddingPhotoStore";
import { WEDDING_EVENT } from "@/data/mockWeddingData";

export const StatsSection: React.FC = () => {
  const [liveCount, setLiveCount] = useState<number>(1);

  useEffect(() => {
    const syncCount = () => {
      const photos = getWeddingPhotos();
      setLiveCount(photos.length);
    };
    syncCount();
    window.addEventListener("shaadisnap_photos_updated", syncCount);
    return () => window.removeEventListener("shaadisnap_photos_updated", syncCount);
  }, []);

  const stats = [
    {
      icon: Heart,
      value: "Marwaha & Gulati",
      label: "Royal Celebration",
      subtext: "Deventure Shimla Hills Resort, Solan (HP)",
    },
    {
      icon: Camera,
      value: liveCount.toString(),
      label: liveCount === 1 ? "Indexed Photo" : "Indexed Photos",
      subtext: "High-resolution RAW album",
    },
    {
      icon: CheckCircle2,
      value: "< 1 Sec",
      label: "Instant Discovery",
      subtext: "Ephemeral facial retrieval",
    },
    {
      icon: Users,
      value: "100%",
      label: "Private Biometrics",
      subtext: "Ephemeral zero-retention search",
    },
  ];

  return (
    <section className="bg-[#FFF8F3] text-[#765D62] py-20 lg:py-28 relative overflow-hidden border-t border-[#EADDE0]">
      {/* Subtle rose champagne glow behind stats */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-br from-[#F1D5D5]/40 via-[#D9B7A0]/20 to-transparent blur-[120px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="editorial-kicker inline-flex items-center gap-2">
            <Lock className="w-3 h-3 text-[#A85D70]" />
            <span>DPDP Act 2023 & GDPR Compliant</span>
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.04em] text-[#633C49]">
            More Than Photos.<br />
            <span className="text-[#A85D70] italic font-normal">It&apos;s Your Story.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#765D62] font-normal max-w-xl mx-auto">
            From the grand Baraat procession to the quietest candid smile, Maan Memories preserves every emotion.
          </p>
        </div>

        {/* 4 Configurable Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white/80 rounded-[24px] p-7 border border-white shadow-[0_12px_28px_rgba(99,60,73,0.07)] hover:shadow-[0_20px_38px_rgba(99,60,73,0.13)] hover:border-[#A85D70]/40 transition-all duration-300 text-center flex flex-col items-center group backdrop-blur-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#F1D5D5]/50 border border-[#A85D70]/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                  <Icon className="w-5 h-5 text-[#A85D70]" />
                </div>
                <div className="font-serif text-4xl lg:text-5xl font-bold text-[#633C49] mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-base font-semibold text-[#A85D70] mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-[#947A80]">
                  {stat.subtext}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Metrics Disclaimer Badge */}
        <div className="mt-12 text-center">
          <span className="text-[11px] text-[#947A80] tracking-wider uppercase font-medium">
            Live event metrics synchronized in real time for {WEDDING_EVENT.couple}.
          </span>
        </div>

      </div>
    </section>
  );
};
