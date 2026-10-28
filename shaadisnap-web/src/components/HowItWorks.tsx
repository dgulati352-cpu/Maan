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
    <section id="how-it-works" className="py-20 lg:py-28 bg-[#F8F5EF] relative">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Editorial Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#C6A76A]">
            Effortless Experience
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#242321] tracking-tight">
            How ShaadiSnap AI Works
          </h2>
          <p className="text-base sm:text-lg text-[#716B63] font-normal leading-relaxed">
            From upload to unforgettable memories — in just a few simple steps.
          </p>
        </div>

        {/* 4 Elegant Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative bg-white rounded-2xl p-7 border border-[#DED5C8] shadow-xs hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Numbered Gold Marker & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-2xl font-bold text-[#C6A76A]">
                      {step.number}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-[#E8DDD0]/60 border border-[#C6A76A]/40 flex items-center justify-center group-hover:bg-[#C6A76A] transition-colors duration-300">
                      <Icon className="w-5 h-5 text-[#873F50] group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-serif text-xl font-bold text-[#242321] mb-2.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#716B63] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Subtle bottom decorative line */}
                <div className="mt-6 pt-4 border-t border-[#DED5C8]/60 flex items-center justify-between text-xs font-medium text-[#C6A76A]">
                  <span>Step {idx + 1} of 4</span>
                  <div className="w-2 h-2 rounded-full bg-[#C6A76A]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Centered Burgundy CTA Button */}
        <div className="text-center mt-14">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-base font-semibold text-white bg-[#873F50] hover:bg-[#733443] transition-all duration-200 shadow-md hover:shadow-xl active:scale-98"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
