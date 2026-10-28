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
    <section className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#DED5C8] shadow-sm hover:shadow-md transition-shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 lg:divide-x divide-[#DED5C8]">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`flex items-center gap-4 ${
                  idx !== 0 ? "pt-6 sm:pt-0 lg:pl-8" : ""
                }`}
              >
                {/* Circular Gold Icon Container */}
                <div className="w-12 h-12 rounded-full bg-[#E8DDD0] flex-shrink-0 flex items-center justify-center border border-[#C6A76A]/40 shadow-xs">
                  <Icon className="w-5 h-5 text-[#C6A76A]" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#242321]">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#716B63] mt-0.5 leading-relaxed">
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
