"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Plus,
  Trash2,
  FolderOpen,
} from "lucide-react";
import {
  extractGoogleDriveId,
  formatGoogleDriveImage,
  parseGoogleDriveInputs,
  GoogleDriveItem,
} from "@/lib/googleDrive";

interface GoogleDriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: { id: string; name: string; url: string; ceremony: string }[]) => void;
  defaultCeremony?: string;
}

// Sample Google Drive photo IDs for immediate 1-click testing
const SAMPLE_DRIVE_LINKS = [
  "https://drive.google.com/file/d/1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b/view?usp=sharing",
  "https://drive.google.com/file/d/1mN84kL2vP0xQ3rS6tU8w1Y4z7B2c5D9e/view?usp=sharing",
  "https://drive.google.com/file/d/1kL93mN1vP2xQ4rS7tU9w2Y5z8B3c6D0f/view?usp=sharing",
];

export const GoogleDriveImportModal: React.FC<GoogleDriveImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  defaultCeremony = "Sangeet",
}) => {
  const [inputText, setInputText] = useState<string>("");
  const [selectedCeremony, setSelectedCeremony] = useState<string>(defaultCeremony);
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);

  if (!isOpen) return null;

  const parsedItems: GoogleDriveItem[] = parseGoogleDriveInputs(inputText);
  const validItems = parsedItems.filter((i) => i.isValid);

  const handleUseSample = () => {
    setInputText(SAMPLE_DRIVE_LINKS.join("\n"));
  };

  const handleConfirmImport = () => {
    if (validItems.length === 0) return;

    const formatted = validItems.map((item, idx) => ({
      id: `gdrive_${Date.now()}_${idx}`,
      name: item.name || `Drive_Photo_${item.fileId.slice(0, 6)}.jpg`,
      url: item.directUrl,
      ceremony: selectedCeremony,
    }));

    onImport(formatted);
    setInputText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#DED5C8] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-[#DED5C8] flex items-center justify-between bg-[#F8F5EF]/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white border border-[#DED5C8] flex items-center justify-center shadow-xs">
              <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#242321]">
                Import from Google Drive
              </h2>
              <p className="text-xs text-[#716B63]">
                Photos stay stored in Google Drive; high-speed previews display on ShaadiSnap.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#716B63] hover:text-[#242321] hover:bg-[#E8DDD0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto flex-1">
          {/* Quick Step Guide Toggle */}
          <div className="bg-[#F8F5EF] p-4 rounded-2xl border border-[#DED5C8]/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#242321] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#C6A76A]" />
                How to get Google Drive Share links:
              </span>
              <button
                type="button"
                onClick={() => setShowHelpGuide(!showHelpGuide)}
                className="text-xs font-semibold text-[#873F50] hover:underline"
              >
                {showHelpGuide ? "Hide instructions" : "Show step-by-step"}
              </button>
            </div>

            {showHelpGuide && (
              <ol className="text-xs text-[#716B63] list-decimal list-inside space-y-1.5 pt-2 border-t border-[#DED5C8]/60">
                <li>
                  Open your <strong>Google Drive</strong> folder with wedding photos.
                </li>
                <li>
                  Right-click the photo or folder &rarr; click <strong>Share</strong> &rarr; <strong>Share</strong>.
                </li>
                <li>
                  Under General Access, change <em>Restricted</em> to{" "}
                  <strong className="text-emerald-700">“Anyone with the link” (Viewer)</strong>.
                </li>
                <li>
                  Click <strong>Copy Link</strong> and paste it into the box below.
                </li>
              </ol>
            )}
          </div>

          {/* Ceremony Selector */}
          <div>
            <label className="block text-xs font-bold text-[#242321] uppercase tracking-wider mb-2">
              Assign Ceremony Tag
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {["Mehendi", "Haldi", "Sangeet", "Phere", "Reception"].map((ceremony) => (
                <button
                  key={ceremony}
                  type="button"
                  onClick={() => setSelectedCeremony(ceremony)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCeremony === ceremony
                      ? "bg-[#873F50] text-white shadow-xs"
                      : "bg-[#F8F5EF] text-[#716B63] hover:text-[#242321] border border-[#DED5C8]"
                  }`}
                >
                  {ceremony}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#242321] uppercase tracking-wider">
                Paste Google Drive Links
              </label>
              <button
                type="button"
                onClick={handleUseSample}
                className="text-xs font-semibold text-[#873F50] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fill Demo Drive Links</span>
              </button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste one or multiple Google Drive links (one per line):&#10;https://drive.google.com/file/d/1AbCdEfG.../view?usp=sharing&#10;https://drive.google.com/file/d/1XyZaBcD.../view?usp=sharing"
              rows={4}
              className="w-full p-4 rounded-2xl bg-white border border-[#DED5C8] focus:outline-none focus:ring-2 focus:ring-[#C6A76A] text-xs font-mono text-[#242321] placeholder-[#716B63]/60 resize-none shadow-xs"
            />
            <p className="text-[11px] text-[#716B63] mt-1.5">
              Supports standard share links, direct file IDs, or folder URLs. Multiple links can be separated by newlines or commas.
            </p>
          </div>

          {/* Parsed Previews */}
          {parsedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#242321]">
                  Detected Links ({validItems.length} valid / {parsedItems.length} total)
                </span>
                {validItems.length > 0 && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Direct CDN format ready
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                      item.isValid
                        ? "bg-[#F8F5EF]/60 border-[#DED5C8]"
                        : "bg-red-50/50 border-red-200"
                    }`}
                  >
                    {item.isValid ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0 border border-[#DED5C8] relative">
                        <img
                          src={item.directUrl}
                          alt="Drive preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to sample wedding thumbnail if demo link is used
                            (e.target as HTMLImageElement).src =
                              idx % 3 === 0
                                ? "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=300&q=80"
                                : idx % 3 === 1
                                ? "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80"
                                : "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 text-red-500">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#242321] truncate">
                        {item.name}
                      </p>
                      {item.isValid ? (
                        <>
                          <p className="text-[10px] font-mono text-[#716B63] truncate">
                            ID: {item.fileId}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                            Public CDN Active
                          </span>
                        </>
                      ) : (
                        <p className="text-[10px] text-red-600">
                          Invalid Drive link or ID
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-[#DED5C8] bg-[#F8F5EF]/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#716B63] hover:text-[#242321] hover:bg-[#E8DDD0] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={validItems.length === 0}
            onClick={handleConfirmImport}
            className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#873F50] hover:bg-[#733443] disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>
              Add {validItems.length > 0 ? `${validItems.length} Photos` : "Photos"} to Album
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
