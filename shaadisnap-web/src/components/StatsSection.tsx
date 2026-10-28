"use client";

import React from "react";
import { Users, Heart, Camera, CheckCircle2, Lock } from "lucide-react";

export const StatsSection: React.FC = () => {
  const stats = [
    {
      icon: Users,
      value: "24,500+",
      label: "Happy Guests",
      subtext: "Found in wedding candids",
    },
    {
      icon: Heart,
      value: "180+",
      label: "Luxury Weddings",
      subtext: "Across India & destination events",
    },
    {
      icon: Camera,
      value: "650,000+",
      label: "Photos Processed",
      subtext: "With high-res face indexing",
    },
    {
      icon: CheckCircle2,
      value: "99.4%",
      label: "Matching Accuracy",
      subtext: "Calibrated ArcFace precision",
    },
  ];

  return (
    <section className="bg-[#242321] text-white py-20 lg:py-28 relative overflow-hidden">
      {/* Subtle gold glow behind stats */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#C6A76A]/10 blur-[120px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#C6A76A]/30 text-xs font-semibold tracking-widest uppercase text-[#C6A76A]">
            <Lock className="w-3 h-3 text-[#C6A76A]" />
            <span>DPDP Act 2023 & GDPR Compliant</span>
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F8F5EF]">
            More Than Photos.<br />
            <span className="text-[#C6A76A] italic font-normal">It&apos;s Your Story.</span>
          </h2>
          <p className="text-base sm:text-lg text-[#E8DDD0]/80 font-normal max-w-xl mx-auto">
            From the grand Baraat procession to the quietest candid smile, ShaadiSnap AI preserves every emotion.
          </p>
        </div>

        {/* 4 Configurable Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#C6A76A]/50 transition-all duration-300 text-center flex flex-col items-center group"
              >
                <div className="w-12 h-12 rounded-full bg-[#C6A76A]/15 border border-[#C6A76A]/40 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-[#C6A76A]" />
                </div>
                <div className="font-serif text-4xl lg:text-5xl font-bold text-[#F8F5EF] mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-base font-semibold text-[#C6A76A] mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-[#E8DDD0]/60">
                  {stat.subtext}
                </div>
              </div>
            );
          })}
        </div>

        {/* Demo Data Disclaimer Badge */}
        <div className="mt-12 text-center">
          <span className="text-[11px] text-[#E8DDD0]/50 tracking-wider uppercase font-medium">
            * Showcase metrics based on pilot platform testing. Production metrics update in real-time.
          </span>
        </div>

      </div>
    </section>
  );
};
