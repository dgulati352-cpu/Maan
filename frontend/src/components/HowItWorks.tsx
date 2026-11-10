"use client";

import React from "react";
import { Upload, Cpu, Search, HeartHandshake, ArrowRight } from "lucide-react";

interface HowItWorksProps {
  onGetStarted: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onGetStarted }) => {
  const steps = [
    {
      number: "01",
      icon: Upload,
      title: "Upload Photos",
      description:
        "Official photographers and wedding guests upload high-resolution event photographs via web or QR code.",
    },
    {
      number: "02",
      icon: Cpu,
      title: "AI Processes",
      description:
        "Our deep learning backbone detects faces, aligns facial landmarks, and indexes secure mathematical embeddings.",
    },
    {
      number: "03",
      icon: Search,
      title: "Find Your Photos",
      description:
        "Guests snap or upload a single selfie. Calibrated ArcFace matching searches thousands of photos in under a second.",
    },
    {
      number: "04",
      icon: HeartHandshake,
      title: "Relive & Share",
      description:
        "Browse your personal gallery, download uncompressed originals, and share memories with loved ones.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-[#FFF8F3] relative border-t border-[#EADDE0] scroll-mt-20 overflow-hidden">
      <div className="absolute left-1/2 top-20 w-[32rem] h-[32rem] -translate-x-1/2 rounded-full bg-[#F1D5D5]/30 blur-3xl pointer-events-none" />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16 relative">
          <span className="editorial-kicker">
            Effortless Experience
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#633C49] tracking-[-0.03em]">
            How ShaadiSnap AI Works
          </h2>
          <p className="text-base sm:text-lg text-[#765D62] font-normal leading-relaxed">
            From upload to unforgettable memories — in just a few simple steps.
          </p>
        </div>

        {/* 4 Elegant Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative bg-white/80 rounded-[24px] p-7 border border-white shadow-[0_12px_30px_rgba(99,60,73,0.07)] hover:shadow-[0_22px_44px_rgba(99,60,73,0.14)] transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between backdrop-blur-sm"
              >
                <div>
                  {/* Top Bar: Numbered Gold Marker & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-2xl font-bold text-[#A85D70] tracking-tight">
                      {step.number}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-[#F1D5D5]/60 border border-[#A85D70]/30 flex items-center justify-center group-hover:bg-[#A85D70] group-hover:rotate-6 transition-all duration-300">
                      <Icon className="w-5 h-5 text-[#633C49] group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-serif text-xl font-bold text-[#633C49] mb-2.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#765D62] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Subtle bottom decorative line */}
                <div className="mt-6 pt-4 border-t border-[#EADDE0] flex items-center justify-between text-xs font-medium text-[#A85D70]">
                  <span>Step {idx + 1} of 4</span>
                  <div className="w-2 h-2 rounded-full bg-[#A85D70]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Centered Burgundy CTA Button */}
        <div className="text-center mt-14">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-sm font-semibold text-white bg-[#633C49] hover:bg-[#914C60] transition-all duration-200 shadow-[0_12px_24px_rgba(99,60,73,0.24)] hover:shadow-xl active:scale-98 cursor-pointer"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
