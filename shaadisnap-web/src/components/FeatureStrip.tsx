"use client";

import React from "react";
import { Search, UploadCloud, ShieldCheck, Image as ImageIcon } from "lucide-react";

export const FeatureStrip: React.FC = () => {
  const features = [
    {
      icon: Search,
      title: "AI Face Search",
      description: "Find your photos instantly with one selfie.",
    },
    {
      icon: UploadCloud,
      title: "Guest Uploads",
      description: "Everyone's wedding candids in one place.",
    },
    {
      icon: ShieldCheck,
      title: "Private & Secure",
      description: "Your biometric data remains strictly yours.",
    },
    {
      icon: ImageIcon,
      title: "Beautiful Galleries",
      description: "High-resolution downloads & shared albums.",
    },
  ];

  return (
    <section id="features" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 scroll-mt-24">
      <div className="glass-panel rounded-[24px] p-5 sm:p-7 hover:shadow-[0_24px_60px_rgba(99,60,73,0.12)] transition-shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7 divide-y sm:divide-y-0 lg:divide-x divide-[#EADDE0]">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3.5 ${
                  idx !== 0 ? "pt-6 sm:pt-0 lg:pl-8" : ""
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-[#F1D5D5]/60 flex-shrink-0 flex items-center justify-center border border-[#A85D70]/30 shadow-xs rotate-[-3deg]">
                  <Icon className="w-5 h-5 text-[#A85D70]" />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#A85D70] mb-1">0{idx + 1} / promise</p>
                  <h3 className="font-serif text-[15px] font-bold text-[#633C49]">
                    {feat.title}
                  </h3>
                  <p className="text-[11px] text-[#765D62] mt-0.5 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
