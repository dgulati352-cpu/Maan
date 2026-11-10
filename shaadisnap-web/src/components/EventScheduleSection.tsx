"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  MapPin,
  Mail,
  Heart,
  Send,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const EventScheduleSection: React.FC = () => {
  // Target date: Nov 12, 2026 11:00 AM IST
  const targetDate = new Date("2026-11-12T11:00:00+05:30").getTime();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // RSVP Form State
  const [rsvpName, setRsvpName] = useState("");
  const [attending, setAttending] = useState("yes");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;

    setIsSubmitting(true);

    // 1. Post directly to SQLite database backend
    try {
      await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rsvpName.trim(),
          attending,
          message: message.trim(),
          eventId: "marwaha-gulati-2026",
        }),
      });
    } catch {
      // Offline fallback
    }

    // 2. Save to local storage for instant feedback
    try {
      const existing = JSON.parse(localStorage.getItem("wedding_rsvps") || "[]");
      existing.push({
        id: "rsvp_" + Date.now(),
        name: rsvpName.trim(),
        attending,
        message: message.trim(),
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem("wedding_rsvps", JSON.stringify(existing));
    } catch {
      // Storage fallback
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#A85D70", "#F1D5D5", "#D9B7A0", "#633C49"],
    });
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FFF8F3] text-[#765D62] relative overflow-hidden font-sans border-t border-[#EADDE0]">
      {/* Decorative Warm Ambient Glow */}
      <div className="absolute left-1/2 top-10 w-[36rem] h-[36rem] -translate-x-1/2 rounded-full bg-[#F1D5D5]/30 blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-20 relative">
        
        {/* 1. COUNTDOWN SECTION */}
        <div className="text-center space-y-6">
          <h2 className="font-serif italic text-3xl sm:text-4xl text-[#633C49] font-normal tracking-wide">
            Counting Down to Forever
          </h2>

          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-px bg-[#EADDE0]" />
            <Heart className="w-3.5 h-3.5 text-[#A85D70] fill-[#A85D70]" />
            <div className="w-12 h-px bg-[#EADDE0]" />
          </div>

          {/* Countdown Boxes */}
          <div className="grid grid-cols-4 gap-3 sm:gap-5 max-w-md mx-auto">
            {[
              { label: "DAYS", val: timeLeft.days },
              { label: "HOURS", val: timeLeft.hours },
              { label: "MINUTES", val: timeLeft.minutes },
              { label: "SECONDS", val: timeLeft.seconds },
            ].map((box) => (
              <div
                key={box.label}
                className="bg-white/90 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-[#EADDE0] shadow-[0_4px_20px_rgba(99,60,73,0.06)] flex flex-col items-center justify-center"
              >
                <span className="font-serif text-2xl sm:text-4xl font-bold text-[#633C49] tabular-nums">
                  {String(box.val).padStart(2, "0")}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-[#A85D70] mt-1">
                  {box.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. PROGRAM TIMELINE SECTION */}
        <div className="text-center space-y-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-[#A85D70]" />
            <h3 className="font-serif italic text-3xl sm:text-4xl text-[#633C49] font-normal tracking-wide">
              Program Timeline
            </h3>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="w-12 h-px bg-[#EADDE0]" />
              <Heart className="w-2.5 h-2.5 text-[#A85D70] fill-[#A85D70]" />
              <div className="w-12 h-px bg-[#EADDE0]" />
            </div>
          </div>

          <div className="space-y-10 text-left max-w-xl mx-auto">
            {/* THURSDAY, NOV 12, 2026 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#EADDE0]" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#A85D70]">
                  Thursday, Nov 12, 2026
                </h4>
                <div className="flex-1 h-px bg-[#EADDE0]" />
              </div>

              <div className="space-y-3.5 pl-2">
                <div className="flex items-baseline gap-4 sm:gap-6">
                  <span className="w-20 text-xs sm:text-sm font-bold text-[#A85D70] shrink-0">
                    11:00 AM
                  </span>
                  <div className="border-l-2 border-[#A85D70] pl-3">
                    <p className="text-sm sm:text-base font-semibold text-[#633C49]">
                      Kesariya Rasam (Haldi)
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-4 sm:gap-6">
                  <span className="w-20 text-xs sm:text-sm font-bold text-[#A85D70] shrink-0">
                    6:00 PM
                  </span>
                  <div className="border-l-2 border-[#A85D70] pl-3">
                    <p className="text-sm sm:text-base font-semibold text-[#633C49]">
                      Beats before Vows (Sangeet)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FRIDAY, NOV 13, 2026 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#EADDE0]" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#A85D70]">
                  Friday, Nov 13, 2026
                </h4>
                <div className="flex-1 h-px bg-[#EADDE0]" />
              </div>

              <div className="space-y-3.5 pl-2">
                <div className="flex items-baseline gap-4 sm:gap-6">
                  <span className="w-20 text-xs sm:text-sm font-bold text-[#A85D70] shrink-0">
                    10:00 AM
                  </span>
                  <div className="border-l-2 border-[#A85D70] pl-3">
                    <p className="text-sm sm:text-base font-semibold text-[#633C49]">
                      Gaana Ceremony
                    </p>
                    <p className="text-xs italic text-[#947A80]">At Groom&apos;s place</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-4 sm:gap-6">
                  <span className="w-20 text-xs sm:text-sm font-bold text-[#A85D70] shrink-0">
                    10:00 AM
                  </span>
                  <div className="border-l-2 border-[#A85D70] pl-3">
                    <p className="text-sm sm:text-base font-semibold text-[#633C49]">
                      Chooda Ceremony
                    </p>
                    <p className="text-xs italic text-[#947A80]">At Bride&apos;s place</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-4 sm:gap-6">
                  <span className="w-20 text-xs sm:text-sm font-bold text-[#A85D70] shrink-0">
                    1:00 PM
                  </span>
                  <div className="border-l-2 border-[#A85D70] pl-3">
                    <p className="text-sm sm:text-base font-semibold text-[#633C49]">
                      Sehra Bandi and Band Baja Baraat
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-4 sm:gap-6">
                  <span className="w-20 text-xs sm:text-sm font-bold text-[#A85D70] shrink-0">
                    3:00 PM
                  </span>
                  <div className="border-l-2 border-[#A85D70] pl-3">
                    <p className="text-sm sm:text-base font-semibold text-[#633C49]">
                      Baraat Welcome and Jai Mala
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-4 sm:gap-6">
                  <span className="w-20 text-xs sm:text-sm font-bold text-[#A85D70] shrink-0">
                    5:00 PM
                  </span>
                  <div className="border-l-2 border-[#A85D70] pl-3">
                    <p className="text-sm sm:text-base font-semibold text-[#633C49]">
                      Prem Sankalp (Pheras)
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-4 sm:gap-6">
                  <span className="w-20 text-xs sm:text-sm font-bold text-[#A85D70] shrink-0">
                    7:00 PM
                  </span>
                  <div className="border-l-2 border-[#A85D70] pl-3">
                    <p className="text-sm sm:text-base font-semibold text-[#633C49]">
                      Wedding Reception
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. VENUE SECTION */}
        <div className="text-center space-y-6 max-w-xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-2">
            <MapPin className="w-5 h-5 text-[#A85D70]" />
            <h3 className="font-serif italic text-3xl sm:text-4xl text-[#633C49] font-normal tracking-wide">
              Venue
            </h3>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="w-12 h-px bg-[#EADDE0]" />
              <Heart className="w-2.5 h-2.5 text-[#A85D70] fill-[#A85D70]" />
              <div className="w-12 h-px bg-[#EADDE0]" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-serif text-lg sm:text-xl font-bold text-[#633C49]">
              Deventure Shimla Hills Resort
            </p>
            <p className="text-xs sm:text-sm text-[#765D62]">
              Vill. Anji, Near Kandaghat, Kalka Shimla NH, Dist Solan (HP)
            </p>
          </div>

          {/* Interactive Google Maps Frame */}
          <div className="rounded-2xl overflow-hidden border border-[#EADDE0] shadow-[0_8px_24px_rgba(99,60,73,0.07)] bg-white relative">
            <iframe
              title="Deventure Shimla Hills Resort Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13693.425785089354!2d77.1065406!3d30.9850239!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390f845075677567%3A0x6739922a8ebcf3d4!2sDeventure%20Shimla%20Hills!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="260"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-64"
            />
            <div className="p-3 bg-white flex items-center justify-between border-t border-[#EADDE0]">
              <span className="text-xs text-[#765D62] font-medium truncate">
                Vill. Anji, Kandaghat, Solan (HP)
              </span>
              <a
                href="https://maps.google.com/?q=Deventure+Shimla+Hills+Resort+Kandaghat+Solan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors shadow-xs"
              >
                <span>Open in Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* 4. RSVP FORM */}
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="flex flex-col items-center justify-center gap-2">
            <Mail className="w-5 h-5 text-[#A85D70]" />
            <h3 className="font-serif italic text-3xl sm:text-4xl text-[#633C49] font-normal tracking-wide">
              RSVP
            </h3>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="w-12 h-px bg-[#EADDE0]" />
              <Heart className="w-2.5 h-2.5 text-[#A85D70] fill-[#A85D70]" />
              <div className="w-12 h-px bg-[#EADDE0]" />
            </div>
          </div>

          {isSubmitted ? (
            <div className="p-6 rounded-2xl bg-white border border-[#EADDE0] text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#F1D5D5] text-[#633C49] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-[#633C49]">
                Thank You, {rsvpName}!
              </h4>
              <p className="text-xs text-[#765D62]">
                Your response has been sent to the Marwaha &amp; Gulati families. We look forward to celebrating together!
              </p>
            </div>
          ) : (
            <form onSubmit={handleRsvpSubmit} className="space-y-4 text-left bg-white/80 p-6 sm:p-7 rounded-2xl border border-[#EADDE0] shadow-[0_8px_24px_rgba(99,60,73,0.05)] backdrop-blur-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#633C49] block">
                  Your Name <span className="text-[#A85D70]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-sm text-[#633C49] placeholder:text-[#C5AAB2] focus:outline-none focus:ring-2 focus:ring-[#A85D70]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#633C49] block">
                  Will you be attending? <span className="text-[#A85D70]">*</span>
                </label>
                <select
                  value={attending}
                  onChange={(e) => setAttending(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-sm text-[#633C49] focus:outline-none focus:ring-2 focus:ring-[#A85D70]"
                >
                  <option value="yes">Joyfully Accept (Attending)</option>
                  <option value="no">Regretfully Decline</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#633C49] block">
                  Your Message
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your wishes..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EADDE0] bg-white text-sm text-[#633C49] placeholder:text-[#C5AAB2] focus:outline-none focus:ring-2 focus:ring-[#A85D70] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-xl font-semibold text-sm text-white bg-[#633C49] hover:bg-[#914C60] transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
              </button>
            </form>
          )}
        </div>

        {/* 5. CELEBRATION SIGN-OFF FOOTER */}
        <div className="text-center space-y-3 pt-6 border-t border-[#EADDE0]">
          <h3 className="font-serif italic text-2xl sm:text-3xl text-[#633C49]">
            Eagerly waiting to celebrate with you !
          </h3>
          <p className="font-serif italic text-lg sm:text-xl text-[#A85D70] font-medium">
            Marwaha&apos;s and Gulati&apos;s
          </p>
        </div>

      </div>
    </section>
  );
};

export default EventScheduleSection;
