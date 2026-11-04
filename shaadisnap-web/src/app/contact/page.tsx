"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, Phone, MapPin, Send, CheckCircle2, Sparkles, Clock, ShieldCheck } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [role, setRole] = useState("Couple / Family");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg("Please fill in your name, email, and inquiry details.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#765D62]">
      <Navbar />

      <main className="flex-1 py-12 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1D5D5]/60 border border-[#EADDE0] text-xs font-semibold tracking-widest uppercase text-[#633C49]">
              <Sparkles className="w-4 h-4 text-[#A85D70]" />
              <span>Wedding Concierge & Support</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#633C49]">
              Get in Touch with Our Team
            </h1>
            <p className="text-base sm:text-lg text-[#765D62] max-w-2xl mx-auto leading-relaxed">
              Planning a royal destination wedding or looking to integrate ShaadiSnap AI with your photography studio? Our luxury event concierges are ready to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left: Contact Channels & Location (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white rounded-3xl p-8 border border-[#EADDE0] shadow-xs space-y-6">
                <h2 className="font-serif text-2xl font-bold text-[#633C49]">
                  Concierge Desks
                </h2>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#F1D5D5]/50 border border-[#A85D70]/20 flex items-center justify-center text-[#A85D70] shrink-0 mt-0.5">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#947A80] block">
                        General & Couple Inquiries
                      </span>
                      <a href="mailto:concierge@shaadisnap.ai" className="font-serif text-base font-bold text-[#633C49] hover:text-[#A85D70] transition-colors">
                        concierge@shaadisnap.ai
                      </a>
                      <p className="text-xs text-[#765D62] mt-0.5">
                        Guaranteed response within 24 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#F1D5D5]/50 border border-[#A85D70]/20 flex items-center justify-center text-[#A85D70] shrink-0 mt-0.5">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#947A80] block">
                        VIP Event Day Hotline
                      </span>
                      <a href="tel:+912942431000" className="font-serif text-base font-bold text-[#633C49] hover:text-[#A85D70] transition-colors">
                        +91 (0294) 243-1000
                      </a>
                      <p className="text-xs text-[#765D62] mt-0.5">
                        Available 24/7 for live celebrations
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#F1D5D5]/50 border border-[#A85D70]/20 flex items-center justify-center text-[#A85D70] shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#947A80] block">
                        Headquarters & Studios
                      </span>
                      <span className="font-serif text-base font-bold text-[#633C49] block">
                        The Oberoi Udaivilas & New Delhi
                      </span>
                      <p className="text-xs text-[#765D62] mt-0.5">
                        Haridas Ji Ki Magri, Udaipur, Rajasthan 313001
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#EADDE0] flex items-center gap-3 text-xs text-[#947A80]">
                  <Clock className="w-4 h-4 text-[#A85D70] shrink-0" />
                  <span>Support hours: Mon – Sun, 9:00 AM – 9:00 PM IST (24/7 on booked wedding days)</span>
                </div>
              </div>

              {/* Trust Badge Card */}
              <div className="bg-[#FFF8F3] rounded-3xl p-6 border border-[#EADDE0] flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white border border-[#A85D70]/30 flex items-center justify-center text-[#477A5B] shrink-0 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#633C49]">
                    Strict Privacy Protection
                  </h3>
                  <p className="text-xs text-[#765D62] mt-0.5">
                    Your contact details are used solely to assist with your wedding inquiry and are never sold or shared with external parties.
                  </p>
                </div>
              </div>

            </div>

            {/* Right: Interactive Inquiry Form (7 cols) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#EADDE0] shadow-xs">
                
                {isSubmitted ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-[#F1D5D5]/60 border border-[#A85D70]/30 text-[#A85D70] flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h2 className="font-serif text-3xl font-bold text-[#633C49]">
                      Message Received
                    </h2>
                    <p className="text-sm text-[#765D62] max-w-md mx-auto leading-relaxed">
                      Thank you for reaching out, <span className="font-semibold text-[#633C49]">{name}</span>. Our wedding concierge team has received your inquiry and will contact you at <span className="font-semibold text-[#633C49]">{email}</span> within 24 hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setName("");
                        setEmail("");
                        setPhone("");
                        setMessage("");
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-[#A85D70] hover:bg-[#914C60] transition-colors mt-4 cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-[#633C49]">
                        Send an Inquiry
                      </h2>
                      <p className="text-xs sm:text-sm text-[#947A80] mt-1">
                        Fill in your event details below, and our wedding concierge will curate a personalized discovery demo.
                      </p>
                    </div>

                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                        {errorMsg}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#633C49]">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Mahine Kapoor"
                          className="w-full h-12 px-4 rounded-xl bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-none focus:border-[#A85D70] transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#633C49]">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full h-12 px-4 rounded-xl bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-none focus:border-[#A85D70] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#633C49]">
                          Phone / WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full h-12 px-4 rounded-xl bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-none focus:border-[#A85D70] transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#633C49]">
                          Tentative Event Date
                        </label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] focus:outline-none focus:border-[#A85D70] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#633C49]">
                        I am a...
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] focus:outline-none focus:border-[#A85D70] transition-colors cursor-pointer"
                      >
                        <option value="Couple / Family">Bride / Groom / Wedding Couple</option>
                        <option value="Wedding Planner">Wedding Planner / Event Designer</option>
                        <option value="Photographer / Studio">Official Studio Photographer</option>
                        <option value="Guest">Wedding Guest with Photo Inquiry</option>
                        <option value="Press / Partner">Press or Business Partner</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#633C49]">
                        Your Inquiry / Wedding Details *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us about your celebration, guest count, venue, or technical questions..."
                        className="w-full p-4 rounded-xl bg-[#FFF8F3]/50 border border-[#EADDE0] text-sm text-[#633C49] placeholder:text-[#947A80] focus:outline-none focus:border-[#A85D70] transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-full font-semibold text-sm tracking-wide text-white bg-[#A85D70] hover:bg-[#914C60] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Sending message...</span>
                      ) : (
                        <>
                          <span>Submit Concierge Inquiry</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
