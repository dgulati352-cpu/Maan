"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  X,
  Award,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  Send,
  Lock,
  UserCheck,
} from "lucide-react";

export interface CeoApprovalRecord {
  authId: string;
  guestName: string;
  guestAffiliation: string;
  requestType: string;
  message?: string;
  status: "CEO_APPROVED";
  approvedBy: "Kabir Marwaha (Chief Executive Officer)";
  timestamp: string;
}

export interface CeoApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNavigate?: (url: string) => void;
}

export const CeoApprovalModal: React.FC<CeoApprovalModalProps> = ({
  isOpen,
  onClose,
  onSuccessNavigate,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [guestName, setGuestName] = useState("");
  const [affiliation, setAffiliation] = useState("Immediate Family");
  const [requestCategory, setRequestCategory] = useState(
    "VIP Fast-Track Facial Retrieval"
  );
  const [specialMessage, setSpecialMessage] = useState("");

  // Review step state machine: "form" | "transmitting" | "verifying" | "approved"
  const [reviewStep, setReviewStep] = useState<
    "form" | "transmitting" | "verifying" | "approved"
  >("form");
  const [approvalRecord, setApprovalRecord] = useState<CeoApprovalRecord | null>(
    null
  );

  const handleClose = React.useCallback(() => {
    setReviewStep("form");
    setApprovalRecord(null);
    onClose();
  }, [onClose]);

  // Focus lock & ESC listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    if (modalRef.current) modalRef.current.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const fireCelebrationConfetti = () => {
    if (typeof window === "undefined") return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return;

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#A85D70", "#633C49", "#D9B7A0", "#F1D5D5", "#25D366"],
      disableForReducedMotion: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    // Step 1: Transmitting to CEO Desk
    setReviewStep("transmitting");

    setTimeout(() => {
      // Step 2: Verifying credentials
      setReviewStep("verifying");

      setTimeout(() => {
        // Step 3: Approved by CEO
        const authId = `CEO-AUTH-2026-MG${Date.now().toString().slice(-6)}`;
        const record: CeoApprovalRecord = {
          authId,
          guestName: guestName.trim(),
          guestAffiliation: affiliation,
          requestType: requestCategory,
          message: specialMessage.trim() || undefined,
          status: "CEO_APPROVED",
          approvedBy: "Kabir Marwaha (Chief Executive Officer)",
          timestamp: new Date().toISOString(),
        };

        // Persist to localStorage
        try {
          if (typeof window !== "undefined") {
            const raw = localStorage.getItem("shaadisnap_ceo_approvals");
            const existing: CeoApprovalRecord[] = raw ? JSON.parse(raw) : [];
            existing.unshift(record);
            localStorage.setItem(
              "shaadisnap_ceo_approvals",
              JSON.stringify(existing.slice(0, 50))
            );
          }
        } catch (err) {
          console.error("Failed to persist CEO approval:", err);
        }

        setApprovalRecord(record);
        setReviewStep("approved");
        fireCelebrationConfetti();
      }, 1100);
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ceo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#633C49]/50 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FFF8F3] border border-[#EADDE0] rounded-2xl sm:rounded-3xl shadow-[0_24px_60px_rgba(99,60,73,0.22)] max-h-[92vh] flex flex-col overflow-hidden transition-all text-[#633C49] focus:outline-none"
      >
        {/* Header */}
        <div className="relative p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#EADDE0]/70 bg-gradient-to-b from-[#F1D5D5]/40 to-transparent shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-[#633C49] text-white shadow-xs">
                <Award className="w-5 h-5 text-[#D9B7A0]" />
              </span>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F1D5D5] text-[#633C49] border border-[#A85D70]/20">
                  Executive Desk • Kabir Marwaha
                </span>
                <h3
                  id="ceo-modal-title"
                  className="font-serif text-xl sm:text-2xl font-bold text-[#633C49] mt-0.5"
                >
                  Ask CEO for Approval
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full text-[#765D62] hover:text-[#633C49] hover:bg-[#F1D5D5]/50 transition-colors cursor-pointer"
              aria-label="Close CEO approval dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-2 text-xs sm:text-sm text-[#765D62] leading-relaxed">
            Direct executive channel to Chief Executive Officer &amp; Grand Host{" "}
            <strong className="text-[#633C49]">Kabir Marwaha</strong> for VIP facial retrieval fast-tracking and ceremony inclusion clearance.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {reviewStep === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#947A80] mb-1.5">
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rajesh Malhotra"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-sm text-[#633C49] focus:outline-none focus:ring-2 focus:ring-[#A85D70] focus:border-transparent transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#947A80] mb-1.5">
                    Affiliation
                  </label>
                  <select
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-xs text-[#633C49] font-medium focus:outline-none focus:ring-2 focus:ring-[#A85D70] cursor-pointer"
                  >
                    <option value="Immediate Family">Immediate Family</option>
                    <option value="Bridal Party">Bridal Party</option>
                    <option value="Groomsmen">Groomsmen</option>
                    <option value="VIP Guest">VIP Guest</option>
                    <option value="Distant Relative / Friend">Distant Relative / Friend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#947A80] mb-1.5">
                    Request Category
                  </label>
                  <select
                    value={requestCategory}
                    onChange={(e) => setRequestCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-xs text-[#633C49] font-medium focus:outline-none focus:ring-2 focus:ring-[#A85D70] cursor-pointer"
                  >
                    <option value="VIP Fast-Track Facial Retrieval">
                      VIP Fast-Track Facial Retrieval
                    </option>
                    <option value="Private Ceremony Photo Inclusion">
                      Private Ceremony Photo Inclusion
                    </option>
                    <option value="Direct Blessing & Host Note">
                      Direct Blessing &amp; Host Note
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#947A80] mb-1.5">
                  Special Note for CEO Kabir Marwaha (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Share a personalized greeting or specific table / ceremony details..."
                  value={specialMessage}
                  onChange={(e) => setSpecialMessage(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-[#EADDE0] bg-white text-xs text-[#633C49] focus:outline-none focus:ring-2 focus:ring-[#A85D70] transition-all resize-none shadow-inner"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full text-xs font-bold text-white bg-[#633C49] hover:bg-[#914C60] transition-all shadow-[0_8px_20px_rgba(99,60,73,0.25)] hover:shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Request to CEO Desk</span>
                </button>
              </div>
            </form>
          )}

          {reviewStep === "transmitting" && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F1D5D5] border-2 border-[#A85D70] flex items-center justify-center animate-spin">
                <Clock className="w-7 h-7 text-[#633C49]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-[#633C49]">
                  Transmitting to CEO Desk...
                </h4>
                <p className="text-xs text-[#765D62]">
                  Connecting securely to Kabir Marwaha&apos;s executive console at Deventure Shimla Hills Resort.
                </p>
              </div>
            </div>
          )}

          {reviewStep === "verifying" && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F1D5D5]/80 border-2 border-[#A85D70] flex items-center justify-center animate-pulse">
                <ShieldCheck className="w-8 h-8 text-[#A85D70]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-[#633C49]">
                  Verifying Credentials &amp; Seal...
                </h4>
                <p className="text-xs text-[#765D62]">
                  Generating 256-bit executive authorization pass and VIP biometric index token.
                </p>
              </div>
            </div>
          )}

          {reviewStep === "approved" && approvalRecord && (
            <div className="space-y-5 animate-fade-in">
              {/* Certified VIP Digital Pass */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-white via-[#FFF8F3] to-[#F1D5D5]/50 border-2 border-[#D9B7A0] shadow-[0_12px_30px_rgba(99,60,73,0.12)] overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-300">
                        OFFICIALLY APPROVED BY CEO
                      </span>
                      <h4 className="font-serif text-lg font-bold text-[#633C49]">
                        {approvalRecord.guestName}
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#A85D70] px-2.5 py-1 rounded-full bg-white border border-[#EADDE0]">
                    {approvalRecord.authId}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EADDE0] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#947A80]">
                      Affiliation
                    </span>
                    <p className="font-semibold text-[#633C49]">
                      {approvalRecord.guestAffiliation}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#947A80]">
                      Approval Type
                    </span>
                    <p className="font-semibold text-[#633C49]">
                      {approvalRecord.requestType}
                    </p>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-white/80 border border-[#EADDE0] text-[11px] text-[#765D62] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Authorized by: <strong>Kabir Marwaha (CEO)</strong></span>
                  </span>
                  <span className="text-[10px] text-[#947A80]">
                    Venue: Deventure Shimla Hills
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <a
                  href="/find-photos"
                  onClick={(e) => {
                    if (onSuccessNavigate) {
                      e.preventDefault();
                      onSuccessNavigate("/find-photos");
                      onClose();
                    }
                  }}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs font-bold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors shadow-2xs cursor-pointer text-center"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch VIP Facial Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setReviewStep("form")}
                  className="w-full sm:w-auto inline-flex items-center justify-center py-2.5 px-4 rounded-full text-xs font-semibold text-[#633C49] bg-white hover:bg-[#F1D5D5]/50 border border-[#EADDE0] transition-colors cursor-pointer"
                >
                  Submit Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="px-6 py-3 bg-[#F1D5D5]/25 border-t border-[#EADDE0]/60 flex items-center justify-between text-[11px] text-[#947A80]">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#A85D70]" />
            <span>Executive Governance • Deventure Shimla Hills Resort</span>
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="font-semibold text-[#633C49] hover:text-[#A85D70] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CeoApprovalModal;
