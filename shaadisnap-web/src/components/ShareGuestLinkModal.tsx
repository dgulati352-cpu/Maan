"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Copy,
  Check,
  Share2,
  QrCode,
  Download,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { QrCodeSvg } from "@/lib/qrCodeSvg";

export interface ShareGuestLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPath?: string;
  title?: string;
  eventName?: string;
  venueName?: string;
}

export const ShareGuestLinkModal: React.FC<ShareGuestLinkModalProps> = ({
  isOpen,
  onClose,
  defaultPath = "/find-photos",
  title = "Share Guest Facial Photo Pass",
  eventName = "Marwaha & Gulati Wedding Celebration",
  venueName = "Deventure Shimla Hills Resort, Solan (HP)",
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"link" | "qr">("link");
  const modalRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute full URL dynamically with window.location fallback
  const fullUrl = React.useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${defaultPath}`;
    }
    return `https://shaadisnap.vercel.app${defaultPath}`;
  }, [defaultPath]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // ESC key and backdrop click listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus lock
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Pre-filled WhatsApp invitation text
  const invitationMessage = `✨ *${eventName}* 💍\n📍 ${venueName}\n\nFind all your wedding photos instantly using our private AI facial retrieval!\n\nSimply take or upload a selfie, and the AI will uncover every moment you were part of across all ceremonies (Phere, Sangeet, Mehendi, Haldi, Reception).\n\n👉 *Click to find your photos:* ${fullUrl}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(invitationMessage)}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = fullUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleDownloadQr = () => {
    if (typeof window === "undefined") return;
    // Download SVG element as an SVG file
    const svgElem = modalRef.current?.querySelector("svg");
    if (!svgElem) return;

    const svgData = new XMLSerializer().serializeToString(svgElem);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "ShaadiSnap_Guest_Facial_Pass_QR.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#633C49]/45 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FFF8F3] border border-[#EADDE0] rounded-3xl shadow-[0_20px_50px_rgba(99,60,73,0.18)] overflow-hidden transition-all text-[#633C49] focus:outline-none"
      >
        {/* Modal Header */}
        <div className="relative p-6 pb-4 border-b border-[#EADDE0]/60 bg-gradient-to-b from-[#F1D5D5]/35 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#F1D5D5] text-[#633C49]">
                <Share2 className="w-5 h-5 text-[#A85D70]" />
              </span>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F1D5D5] text-[#633C49] border border-[#A85D70]/20">
                  Guest Invitation Pass
                </span>
                <h3
                  id="share-modal-title"
                  className="font-serif text-xl sm:text-2xl font-bold text-[#633C49] mt-0.5"
                >
                  {title}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-[#765D62] hover:text-[#633C49] hover:bg-[#F1D5D5]/50 transition-colors cursor-pointer"
              aria-label="Close share dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-2 text-xs sm:text-sm text-[#765D62] leading-relaxed">
            Invite family and wedding guests to uncover their candid moments using AI facial retrieval at{" "}
            <span className="font-semibold text-[#633C49]">{venueName}</span>.
          </p>

          {/* Tab Selector */}
          <div className="flex mt-4 p-1 bg-[#F1D5D5]/40 rounded-full border border-[#EADDE0]">
            <button
              type="button"
              onClick={() => setActiveTab("link")}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "link"
                  ? "bg-[#633C49] text-white shadow-xs"
                  : "text-[#765D62] hover:text-[#633C49]"
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Link & WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "qr"
                  ? "bg-[#633C49] text-white shadow-xs"
                  : "text-[#765D62] hover:text-[#633C49]"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scannable QR Code</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {activeTab === "link" ? (
            <div className="space-y-4">
              {/* Copy URL Row */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#947A80] mb-1.5">
                  Direct Guest Facial Retrieval URL
                </label>
                <div className="flex items-center gap-2 p-1.5 bg-white border border-[#EADDE0] rounded-2xl shadow-inner">
                  <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="flex-1 px-3 py-1.5 text-xs text-[#633C49] font-mono bg-transparent outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-[#A85D70] hover:bg-[#914C60] text-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="mt-1.5 text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied to clipboard! Ready to paste into SMS or group chats.</span>
                  </p>
                )}
              </div>

              {/* WhatsApp Share Intent */}
              <div className="p-4 rounded-2xl bg-[#F1D5D5]/30 border border-[#A85D70]/20 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#633C49] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#A85D70]" />
                      <span>One-Click WhatsApp Broadcast</span>
                    </h4>
                    <p className="text-xs text-[#765D62] mt-0.5">
                      Share with family groups or friends with a pre-written invitation message.
                    </p>
                  </div>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-full text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] transition-all shadow-[0_6px_20px_rgba(37,211,102,0.25)] hover:shadow-md cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>
          ) : (
            /* QR Code Tab */
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-white rounded-2xl border-2 border-[#D9B7A0] shadow-[0_8px_24px_rgba(99,60,73,0.08)] flex flex-col items-center">
                <QrCodeSvg
                  value={fullUrl}
                  size={210}
                  fgColor="#633C49"
                  bgColor="#FFF8F3"
                  title="Guest Facial Photo Pass QR Code"
                />
                <span className="text-[10px] font-semibold text-[#947A80] tracking-wider uppercase mt-2">
                  Scan with any phone camera
                </span>
              </div>

              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-semibold text-[#633C49] bg-white hover:bg-[#F1D5D5]/50 border border-[#EADDE0] transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#A85D70]" />
                  <span>Download QR (SVG)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-semibold text-white bg-[#633C49] hover:bg-[#914C60] transition-colors shadow-2xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy URL"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#F1D5D5]/20 border-t border-[#EADDE0]/60 flex items-center justify-between text-[11px] text-[#947A80]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Private Facial Discovery • Zero Data Retention</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-[#633C49] hover:text-[#A85D70] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareGuestLinkModal;
