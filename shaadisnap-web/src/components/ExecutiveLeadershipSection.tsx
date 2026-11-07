"use client";

import React, { useState } from "react";
import {
  Award,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Crown,
  Camera,
  Utensils,
  Music,
  Heart,
  Palette,
} from "lucide-react";
import { CeoApprovalModal } from "@/components/CeoApprovalModal";

export interface LeadershipMember {
  id: string;
  name: string;
  title: string;
  role: string;
  bio: string;
  avatar: string;
  clearance: string;
  isCeo?: boolean;
  department: string;
}

const LEADERSHIP_TEAM: LeadershipMember[] = [
  {
    id: "kabir-marwaha",
    name: "Kabir Marwaha",
    title: "Chief Executive Officer & Grand Host",
    role: "Celebration Patron & Executive Chairperson",
    clearance: "Level 1: Final CEO Approval Authority",
    isCeo: true,
    department: "Executive Governance",
    bio: "Grand Host and Executive Patron overseeing the two-day Marwaha & Gulati wedding celebration at Deventure Shimla Hills Resort, Solan. Holds final CEO sign-off authority for all public photo releases, VIP fast-track credentials, and ceremonial protocol.",
    avatar: "/avatars/avatar-1.jpg",
  },
  {
    id: "dhairya-gulati",
    name: "Dhairya Gulati",
    title: "Chief Technology Officer & Principal AI Architect",
    role: "Head of Biometrics & Platform Architecture",
    clearance: "Level 1: Cryptographic Biometric Authority",
    department: "Technology & AI Systems",
    bio: "Pioneered ShaadiSnap AI's zero-retention facial recognition pipeline and DPDP-compliant vector index. Architected high-precision ArcFace biometric search and automated photo sync for guests across all ceremonies.",
    avatar: "/avatars/avatar-2.jpg",
  },
  {
    id: "simran-marwaha",
    name: "Simran Marwaha",
    title: "Chief Financial Officer & Treasury Custodian",
    role: "Hospitality Treasury & Procurement Lead",
    clearance: "Level 2: Strategic Treasury Clearance",
    department: "Finance & Vendor Operations",
    bio: "Directs luxury hospitality vendor governance, five-star resort accommodations, and multi-ceremony contracts at Deventure Shimla Hills Resort to deliver an effortless royal guest experience.",
    avatar: "/avatars/avatar-3.jpg",
  },
  {
    id: "ananya-gulati",
    name: "Ananya Gulati",
    title: "Director of Guest Concierge & VIP Protocol",
    role: "Royal Hospitality & Welcome Experience",
    clearance: "Level 2: VIP Concierge Access",
    department: "Guest Experience",
    bio: "Curates bespoke suite allocations, airport transit hospitality, customized welcome hampers, and round-the-clock family concierge support throughout the Solan mountain retreat.",
    avatar: "/avatars/avatar-4.jpg",
  },
  {
    id: "rajeshwari-anand",
    name: "Rajeshwari Anand",
    title: "Creative Director of Scenography & Floral Architecture",
    role: "Grand Mandap & Himalayan Ambient Design",
    clearance: "Level 3: Aesthetic Architecture Lead",
    department: "Creative Scenography",
    bio: "Masterminded the ethereal Rose Champagne floral architecture, 40-foot crystal chandeliers, and Himalayan-view panoramic mandap staging for Phere, Sangeet, and Reception.",
    avatar: "/avatars/avatar-5.jpg",
  },
  {
    id: "chef-vikramaditya-rathore",
    name: "Chef Vikramaditya Rathore",
    title: "Executive Chef & Director of Banqueting",
    role: "Gourmet Curation & Royal Feasts",
    clearance: "Level 3: Banqueting Authority",
    department: "Culinary Arts",
    bio: "Curated multi-course culinary banquets blending authentic Himachali Dham traditions, royal Awadhi dum pukht, and contemporary global gastronomy across all five wedding meals.",
    avatar: "/avatars/avatar-6.jpg",
  },
  {
    id: "meera-kapoor",
    name: "Meera Kapoor",
    title: "Master of Ceremonies & Cultural Director",
    role: "Sangeet Choreography & Event Timeline",
    clearance: "Level 3: Ceremonial Timeline Lead",
    department: "Cultural Orchestration",
    bio: "Orchestrates ceremony timelines, Sangeet musical performances, family tributes, and authentic cultural rituals, ensuring seamless transitions from daytime Haldi to evening celebrations.",
    avatar: "/avatars/avatar-7.jpg",
  },
  {
    id: "joseph-matthew",
    name: "Joseph Matthew",
    title: "Lead Visual Director & Master Cinematographer",
    role: "High-Fashion RAW Coverage & Visual Curation",
    clearance: "Level 2: Visual Production Authority",
    department: "Visual Media",
    bio: "Leads a 12-camera cinematic unit capturing uncompressed 4K video and master HDR photography, directly feeding curated albums into ShaadiSnap AI's facial indexing vault.",
    avatar: "/avatars/avatar-8.jpg",
  },
];

export const ExecutiveLeadershipSection: React.FC = () => {
  const [isCeoModalOpen, setIsCeoModalOpen] = useState(false);

  return (
    <section className="relative py-16 sm:py-24 bg-[#FFF8F3] overflow-hidden border-t border-[#EADDE0]">
      {/* Background Decorative Accents */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 rounded-full bg-[#F1D5D5]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#A85D70]/10 blur-3xl pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F1D5D5]/60 border border-[#A85D70]/25 text-xs font-bold uppercase tracking-wider text-[#633C49] shadow-2xs">
            <Crown className="w-3.5 h-3.5 text-[#A85D70]" />
            <span>Executive Leadership &amp; Organizing Team</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#633C49] tracking-tight">
            The Visionaries Behind the Celebration
          </h2>

          <p className="text-sm sm:text-base text-[#765D62] max-w-2xl mx-auto leading-relaxed">
            Meet the executive patrons and organizing leaders orchestrating the royal{" "}
            <strong className="text-[#633C49] font-semibold">Marwaha &amp; Gulati Wedding</strong> at{" "}
            <span className="text-[#633C49]">Deventure Shimla Hills Resort, Solan (HP)</span>.
          </p>
        </div>

        {/* CEO Banner Callout */}
        <div className="mb-10 p-6 rounded-3xl bg-gradient-to-r from-white via-[#FFF8F3] to-[#F1D5D5]/40 border-2 border-[#D9B7A0] shadow-[0_12px_36px_rgba(99,60,73,0.08)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#633C49] to-[#A85D70] flex items-center justify-center text-white shadow-md shrink-0">
              <Award className="w-7 h-7 text-[#D9B7A0]" />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#A85D70]">
                  Official Executive Authority
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#633C49] mt-0.5">
                CEO Kabir Marwaha Executive Desk
              </h3>
              <p className="text-xs sm:text-sm text-[#765D62] mt-1 max-w-xl">
                Need VIP fast-track facial indexing, special ceremony inclusion, or official approval for private photo releases? Submit a direct inquiry to the CEO&apos;s desk.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCeoModalOpen(true)}
            className="shrink-0 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-bold text-white bg-[#633C49] hover:bg-[#914C60] transition-all shadow-[0_8px_20px_rgba(99,60,73,0.25)] hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Award className="w-4 h-4 text-[#D9B7A0]" />
            <span>Ask CEO for Approval</span>
          </button>
        </div>

        {/* 8 Leadership Profile Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {LEADERSHIP_TEAM.map((member) => {
            return (
              <div
                key={member.id}
                className={`flex flex-col justify-between rounded-3xl p-6 bg-white border transition-all duration-300 hover:-translate-y-1 ${
                  member.isCeo
                    ? "border-2 border-[#A85D70] shadow-[0_12px_32px_rgba(168,93,112,0.18)] ring-4 ring-[#F1D5D5]/40"
                    : "border-[#EADDE0] shadow-[0_4px_20px_rgba(99,60,73,0.04)] hover:shadow-[0_12px_30px_rgba(99,60,73,0.10)] hover:border-[#D9B7A0]"
                }`}
              >
                <div>
                  {/* Card Header: Avatar & Clearance Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F1D5D5] to-[#EADDE0] border-2 border-[#D9B7A0] flex items-center justify-center overflow-hidden shadow-xs">
                        {member.isCeo ? (
                          <div className="w-full h-full bg-[#633C49] flex items-center justify-center text-[#D9B7A0]">
                            <Crown className="w-8 h-8" />
                          </div>
                        ) : member.department === "Technology & AI Systems" ? (
                          <div className="w-full h-full bg-[#FFF8F3] flex items-center justify-center text-[#A85D70]">
                            <Sparkles className="w-7 h-7" />
                          </div>
                        ) : member.department === "Finance & Vendor Operations" ? (
                          <div className="w-full h-full bg-[#FFF8F3] flex items-center justify-center text-[#633C49]">
                            <ShieldCheck className="w-7 h-7" />
                          </div>
                        ) : member.department === "Guest Experience" ? (
                          <div className="w-full h-full bg-[#FFF8F3] flex items-center justify-center text-[#A85D70]">
                            <Heart className="w-7 h-7" />
                          </div>
                        ) : member.department === "Creative Scenography" ? (
                          <div className="w-full h-full bg-[#FFF8F3] flex items-center justify-center text-[#633C49]">
                            <Palette className="w-7 h-7" />
                          </div>
                        ) : member.department === "Culinary Arts" ? (
                          <div className="w-full h-full bg-[#FFF8F3] flex items-center justify-center text-[#A85D70]">
                            <Utensils className="w-7 h-7" />
                          </div>
                        ) : member.department === "Cultural Orchestration" ? (
                          <div className="w-full h-full bg-[#FFF8F3] flex items-center justify-center text-[#633C49]">
                            <Music className="w-7 h-7" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-[#FFF8F3] flex items-center justify-center text-[#A85D70]">
                            <Camera className="w-7 h-7" />
                          </div>
                        )}
                      </div>
                      {member.isCeo && (
                        <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#633C49] text-[#D9B7A0] border border-white shadow-xs">
                          <Crown className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#947A80] bg-[#FFF8F3] px-2 py-1 rounded-full border border-[#EADDE0]">
                      {member.department.split(" ")[0]}
                    </span>
                  </div>

                  {/* Name and Titles */}
                  <div className="space-y-1 mb-3">
                    <h4 className="font-serif text-lg font-bold text-[#633C49] tracking-tight">
                      {member.name}
                    </h4>
                    <p className="text-xs font-bold text-[#A85D70] leading-snug">
                      {member.title}
                    </p>
                    <p className="text-[11px] font-medium text-[#947A80]">
                      {member.role}
                    </p>
                  </div>

                  {/* Clearance Badge */}
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F1D5D5] text-[#633C49] border border-[#A85D70]/20">
                      <CheckCircle2 className="w-3 h-3 text-[#A85D70]" />
                      <span>{member.clearance}</span>
                    </span>
                  </div>

                  {/* Bio Card */}
                  <p className="text-xs text-[#765D62] leading-relaxed">
                    {member.bio}
                  </p>
                </div>

                {/* Card Footer Action (For CEO: Interactive Approval Trigger) */}
                <div className="mt-5 pt-4 border-t border-[#EADDE0]/60">
                  {member.isCeo ? (
                    <button
                      type="button"
                      onClick={() => setIsCeoModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-full text-xs font-bold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors shadow-2xs cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Ask CEO for Approval</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-[#947A80]">
                      <span className="font-medium text-[#633C49]">Organizing Lead</span>
                      <span>Solan (HP)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive CEO Approval Modal */}
      <CeoApprovalModal
        isOpen={isCeoModalOpen}
        onClose={() => setIsCeoModalOpen(false)}
      />
    </section>
  );
};

export default ExecutiveLeadershipSection;
