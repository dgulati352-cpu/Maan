import { formatGoogleDriveImage } from "@/lib/googleDrive";

export interface WeddingPhoto {
  id: string;
  url: string;
  fallbackUrl?: string;
  driveFileId?: string;
  title: string;
  ceremony: "All" | "Mehendi" | "Haldi" | "Sangeet" | "Phere" | "Reception";
  facesCount: number;
  photographer: string;
  similarity?: number;
  confidenceTier?: "high" | "medium";
  aspectRatio?: "portrait" | "landscape" | "square";
}

export interface DemoSelfie {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  matchedPhotoIds: string[];
}

export const WEDDING_EVENT = {
  id: "simran-karan-udaipur-2026",
  couple: "Simran & Karan",
  date: "December 14-16, 2026",
  venue: "The Oberoi Udaivilas, Udaipur",
  totalPhotos: 1420,
  photographer: "The Wedding Story & Stories by Joseph Radhik",
  accessCode: "SIMRAN-KARAN-2026",
  // Direct Google Drive Folder for the wedding album:
  googleDriveFolderUrl: "https://drive.google.com/drive/folders/188n-f26gJUCpngyyxnXuHTLsobGdqqqQ",
  googleDriveFolderId: "188n-f26gJUCpngyyxnXuHTLsobGdqqqQ",
};

/**
 * Direct Google Drive Photo resolver
 * Pass any Google Drive share link, file ID, or direct image URL.
 * Automatically converts to high-speed Google CDN display link!
 */
export function drivePhotoUrl(driveLinkOrId: string, fallbackUrl: string): string {
  if (!driveLinkOrId) return fallbackUrl;
  return formatGoogleDriveImage(driveLinkOrId, 1200);
}

export const MOCK_WEDDING_PHOTOS: WeddingPhoto[] = [
  {
    id: "photo_01",
    // Paste your Google Drive Share Link or File ID directly here:
    url: drivePhotoUrl(
      "https://drive.google.com/file/d/1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b/view?usp=sharing",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85"
    ),
    title: "Regal Royal Portrait",
    ceremony: "Phere",
    facesCount: 2,
    photographer: "Stories by Joseph",
    similarity: 0.984,
    confidenceTier: "high",
    aspectRatio: "portrait",
  },
  {
    id: "photo_02",
    url: drivePhotoUrl(
      "https://drive.google.com/file/d/1mN84kL2vP0xQ3rS6tU8w1Y4z7B2c5D9e/view?usp=sharing",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85"
    ),
    title: "The Golden Vows",
    ceremony: "Phere",
    facesCount: 2,
    photographer: "The Wedding Story",
    similarity: 0.962,
    confidenceTier: "high",
    aspectRatio: "landscape",
  },
  {
    id: "photo_03",
    url: drivePhotoUrl(
      "https://drive.google.com/file/d/1kL93mN1vP2xQ4rS7tU9w2Y5z8B3c6D0f/view?usp=sharing",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85"
    ),
    title: "Bridal Mehendi & Henna Intricacies",
    ceremony: "Mehendi",
    facesCount: 1,
    photographer: "Stories by Joseph",
    similarity: 0.941,
    confidenceTier: "high",
    aspectRatio: "portrait",
  },
  {
    id: "photo_04",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85",
    title: "Reception Grand Entrance",
    ceremony: "Reception",
    facesCount: 3,
    photographer: "The Wedding Story",
    similarity: 0.895,
    confidenceTier: "high",
    aspectRatio: "landscape",
  },
  {
    id: "photo_05",
    url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80",
    title: "Sangeet Dance Floor Candids",
    ceremony: "Sangeet",
    facesCount: 4,
    photographer: "Stories by Joseph",
    similarity: 0.864,
    confidenceTier: "medium",
    aspectRatio: "landscape",
  },
  {
    id: "photo_06",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    title: "Bridesmaids Laughter at Haldi",
    ceremony: "Haldi",
    facesCount: 2,
    photographer: "The Wedding Story",
    similarity: 0.932,
    confidenceTier: "high",
    aspectRatio: "portrait",
  },
  {
    id: "photo_07",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    title: "Baraat Celebration & Dhol Beats",
    ceremony: "Phere",
    facesCount: 5,
    photographer: "Stories by Joseph",
    similarity: 0.812,
    confidenceTier: "medium",
    aspectRatio: "portrait",
  },
  {
    id: "photo_08",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    title: "Evening Cocktail Toasts",
    ceremony: "Reception",
    facesCount: 3,
    photographer: "The Wedding Story",
    similarity: 0.785,
    confidenceTier: "medium",
    aspectRatio: "portrait",
  },
];

export const DEMO_SELFIES: DemoSelfie[] = [
  {
    id: "selfie_ananya",
    name: "Ananya Sharma",
    role: "Maid of Honor / Sister",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    matchedPhotoIds: ["photo_01", "photo_03", "photo_06"],
  },
  {
    id: "selfie_rohit",
    name: "Rohit Malhotra",
    role: "Best Man & Groomsman",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    matchedPhotoIds: ["photo_02", "photo_05", "photo_07"],
  },
  {
    id: "selfie_priya",
    name: "Priya Varma",
    role: "Close Family Friend",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
    matchedPhotoIds: ["photo_04", "photo_05", "photo_08"],
  },
];
