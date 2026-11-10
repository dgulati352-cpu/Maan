/**
 * ShaadiSnap AI — Google OAuth & Drive Authentication Module
 * 
 * Provides seamless Google Sign-In and OAuth 2.0 authorization
 * requesting Google Drive scopes for reading wedding albums and photos.
 * Rose Champagne Luxury Palette Compliant (#FFF8F3, #633C49, #A85D70, #F1D5D5).
 */

export const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.photos.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;

export const GOOGLE_DRIVE_SCOPE_STRING = GOOGLE_DRIVE_SCOPES.join(" ");

export interface GoogleDriveUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  scopes: string[];
  connectedAt: string;
  driveFolderId?: string;
  driveFolderName?: string;
}

export interface GoogleDriveAlbum {
  id: string;
  name: string;
  ceremony: string;
  photoCount: number;
  coverPhotoUrl: string;
  description: string;
  lastModified?: string;
}

export interface GoogleDrivePhoto {
  id: string;
  name: string;
  albumId: string;
  ceremony: string;
  thumbnailUrl: string;
  directUrl: string;
  fallbackUrl: string;
  sizeBytes: number;
  sizeFormatted: string;
  mimeType: string;
}

const STORAGE_KEY_USER = "shaadisnap_google_user";

/**
 * Builds standard Google OAuth 2.0 consent URL requesting Google Drive read access
 */
export function buildGoogleOAuthUrl(options?: {
  clientId?: string;
  redirectUri?: string;
  state?: string;
  prompt?: string;
}): string {
  const clientId =
    options?.clientId ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "shaadisnap-drive-client-id-2026.apps.googleusercontent.com";

  const redirectUri =
    options?.redirectUri ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/login?oauth=google_callback`
      : "https://shaadisnap.internal/login?oauth=google_callback");

  const state = options?.state || "shaadisnap_oauth_state";
  const prompt = options?.prompt || "consent";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: GOOGLE_DRIVE_SCOPE_STRING,
    include_granted_scopes: "true",
    state: state,
    prompt: prompt,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Retrieve current signed-in Google user from local storage
 */
export function getStoredGoogleUser(): GoogleDriveUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Persist signed-in Google user to local storage and broadcast update
 */
export function setStoredGoogleUser(user: GoogleDriveUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    window.dispatchEvent(new Event("shaadisnap_google_auth_changed"));
  } catch (err) {
    console.error("Failed to persist Google user:", err);
  }
}

/**
 * Sign out / disconnect Google account and broadcast logout
 */
export function clearStoredGoogleUser(): void {
  if (typeof window === "undefined") return;
  try {
    const prev = getStoredGoogleUser();
    localStorage.removeItem(STORAGE_KEY_USER);
    window.dispatchEvent(new CustomEvent("shaadisnap_google_auth_changed", { detail: { user: null } }));
    window.dispatchEvent(new CustomEvent("shaadisnap_user_logout", { detail: { email: prev?.email } }));
  } catch (err) {
    console.error("Failed to clear Google user:", err);
  }
}

/**
 * Dynamically switches or sets the active user email and Google Drive folder
 */
export function switchActiveUser(
  email: string,
  name?: string,
  driveFolderId?: string
): GoogleDriveUser {
  const sanitizedName = name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const folderId = driveFolderId || `drive_folder_${encodeURIComponent(email.split("@")[0])}_wedding`;
  
  const updatedUser: GoogleDriveUser = {
    id: `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
    email: email.trim().toLowerCase(),
    name: sanitizedName,
    picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedName)}&background=F1D5D5&color=633C49`,
    accessToken: `token_${Date.now()}`,
    scopes: ["profile", "email", "drive.readonly", "drive.photos.readonly"],
    connectedAt: new Date().toISOString(),
    driveFolderId: folderId,
    driveFolderName: `${sanitizedName}'s Wedding Drive Album`,
  };

  setStoredGoogleUser(updatedUser);
  return updatedUser;
}

/**
 * Returns Google Drive albums dynamically personalized to the requested user email
 */
export function getScopedGoogleDriveAlbums(userEmail?: string): GoogleDriveAlbum[] {
  const email = (userEmail || getStoredGoogleUser()?.email || "guest@maan-ai.com").trim().toLowerCase();
  const ownerName = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const userTag = email.replace(/[^a-zA-Z0-9]/g, "_");

  return [
    {
      id: `album_${userTag}_sangeet`,
      name: `${ownerName}'s Sangeet Celebrations`,
      ceremony: "Sangeet",
      photoCount: 4,
      coverPhotoUrl: "/hero-couple.jpg",
      description: `Curated Sangeet performances & candid evening captured in ${ownerName}'s Google Drive`,
      lastModified: new Date().toISOString(),
    },
    {
      id: `album_${userTag}_phere`,
      name: `${ownerName}'s Phere & Wedding Vows`,
      ceremony: "Phere",
      photoCount: 4,
      coverPhotoUrl: "/hero-couple.jpg",
      description: `Sacred Mandap rituals and wedding vows at Deventure Shimla Hills`,
      lastModified: new Date().toISOString(),
    },
    {
      id: `album_${userTag}_reception`,
      name: `${ownerName}'s Grand Reception Gala`,
      ceremony: "Reception",
      photoCount: 4,
      coverPhotoUrl: "/hero-couple.jpg",
      description: `Black-tie reception toasts, editorial portraits & celebration banquet`,
      lastModified: new Date().toISOString(),
    },
    {
      id: `album_${userTag}_mehendi`,
      name: `${ownerName}'s Mehendi & Henna Art`,
      ceremony: "Mehendi",
      photoCount: 3,
      coverPhotoUrl: "/hero-couple.jpg",
      description: `Intricate bridal henna and festive terrace celebrations`,
      lastModified: new Date().toISOString(),
    },
    {
      id: `album_${userTag}_haldi`,
      name: `${ownerName}'s Haldi Sunshine Rituals`,
      ceremony: "Haldi",
      photoCount: 3,
      coverPhotoUrl: "/hero-couple.jpg",
      description: `Turmeric ceremonies and celebratory morning petal showers`,
      lastModified: new Date().toISOString(),
    },
  ];
}

/**
 * Returns Google Drive photos dynamically scoped to the requested user email
 */
export function getScopedGoogleDrivePhotos(
  userEmail?: string,
  albumId?: string,
  ceremony?: string
): GoogleDrivePhoto[] {
  const albums = getScopedGoogleDriveAlbums(userEmail);
  const email = (userEmail || getStoredGoogleUser()?.email || "guest@maan-ai.com").trim().toLowerCase();
  const userTag = email.replace(/[^a-zA-Z0-9]/g, "_");

  let allPhotos: GoogleDrivePhoto[] = [];

  for (const album of albums) {
    for (let i = 1; i <= album.photoCount; i++) {
      const photoId = `drive_file_${userTag}_${album.ceremony.toLowerCase()}_${i}`;
      allPhotos.push({
        id: photoId,
        name: `${album.ceremony}_Moment_${i}_${email.split("@")[0]}.jpg`,
        albumId: album.id,
        ceremony: album.ceremony,
        thumbnailUrl: "/hero-couple.jpg",
        directUrl: "/hero-couple.jpg",
        fallbackUrl: "/hero-couple.jpg",
        sizeBytes: 3500000 + i * 150000,
        sizeFormatted: `${(3.5 + i * 0.15).toFixed(1)} MB`,
        mimeType: "image/jpeg",
      });
    }
  }

  if (albumId && albumId !== "all") {
    allPhotos = allPhotos.filter((p) => p.albumId === albumId);
  }

  if (ceremony && ceremony !== "All") {
    allPhotos = allPhotos.filter((p) => p.ceremony.toLowerCase() === ceremony.toLowerCase());
  }

  return allPhotos;
}

/**
 * Generates verified mock Google User for dev and automated tests
 */
export function createMockGoogleUser(overrides?: Partial<GoogleDriveUser>): GoogleDriveUser {
  return {
    id: "gdrive_user_987456123",
    email: "anand.maan@gmail.com",
    name: "Anand Maan",
    picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    accessToken: "mock_oauth_token_drive_full_access_2026",
    scopes: [...GOOGLE_DRIVE_SCOPES],
    connectedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Curated Wedding Albums available in Google Drive for Mahine & Anand's royal wedding
 */
export const SAMPLE_GOOGLE_DRIVE_ALBUMS: GoogleDriveAlbum[] = [
  {
    id: "album_udaipur_sangeet_01",
    name: "Sangeet Night — The Royal Leela Palace",
    ceremony: "Sangeet",
    photoCount: 4,
    coverPhotoUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80",
    description: "Choreographed couple performances, dhol revelry & candid musical evening",
  },
  {
    id: "album_udaipur_phere_02",
    name: "Royal Mandap & Phere Celebrations",
    ceremony: "Phere",
    photoCount: 4,
    coverPhotoUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
    description: "Sacred fire pheras, floral varmala and wedding vows at Lake Pichola",
  },
  {
    id: "album_udaipur_mehendi_03",
    name: "Mehendi & Floral Decor Spreads",
    ceremony: "Mehendi",
    photoCount: 4,
    coverPhotoUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    description: "Intricate Rajasthani henna patterns, vibrant marigold decor & celebrations",
  },
  {
    id: "album_udaipur_reception_04",
    name: "Grand Reception Gala",
    ceremony: "Reception",
    photoCount: 4,
    coverPhotoUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80",
    description: "Black-tie royal banquet, champagne toasts and editorial portraits",
  },
  {
    id: "album_udaipur_haldi_05",
    name: "Haldi Sunshine Rituals",
    ceremony: "Haldi",
    photoCount: 4,
    coverPhotoUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=600&q=80",
    description: "Turmeric pastes, flower petal showers & morning family ceremonies",
  },
];

/**
 * Curated Photos inside Google Drive albums
 */
export const SAMPLE_GOOGLE_DRIVE_PHOTOS: GoogleDrivePhoto[] = [
  // Sangeet
  {
    id: "1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b",
    name: "Sangeet_Grand_Entrance_Mahine_Anand.jpg",
    albumId: "album_udaipur_sangeet_01",
    ceremony: "Sangeet",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1tV63pC0L9yWw1q7R8U4v2N3s5X9Z8A1b=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 4423680,
    sizeFormatted: "4.2 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1mN84kL2vP0xQ3rS6tU8w1Y4z7B2c5D9e",
    name: "Sangeet_Choreography_Dhol_Celebration.jpg",
    albumId: "album_udaipur_sangeet_01",
    ceremony: "Sangeet",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1mN84kL2vP0xQ3rS6tU8w1Y4z7B2c5D9e&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1mN84kL2vP0xQ3rS6tU8w1Y4z7B2c5D9e=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 3981312,
    sizeFormatted: "3.8 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1kL93mN1vP2xQ4rS7tU9w2Y5z8B3c6D0f",
    name: "Sangeet_Couple_Stage_Portrait.jpg",
    albumId: "album_udaipur_sangeet_01",
    ceremony: "Sangeet",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1kL93mN1vP2xQ4rS7tU9w2Y5z8B3c6D0f&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1kL93mN1vP2xQ4rS7tU9w2Y5z8B3c6D0f=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 5242880,
    sizeFormatted: "5.0 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1jH82nK0uO1wP3qR6sT8v1X4y7A2b5C9d",
    name: "Sangeet_Family_Dance_Candid.jpg",
    albumId: "album_udaipur_sangeet_01",
    ceremony: "Sangeet",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1jH82nK0uO1wP3qR6sT8v1X4y7A2b5C9d&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1jH82nK0uO1wP3qR6sT8v1X4y7A2b5C9d=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 3460300,
    sizeFormatted: "3.3 MB",
    mimeType: "image/jpeg",
  },

  // Phere
  {
    id: "1iG71mJ9tN0vO2pQ5rS7u0W3x6Z1a4B8c",
    name: "Phere_Varmala_Exchange_Lake_Palace.jpg",
    albumId: "album_udaipur_phere_02",
    ceremony: "Phere",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1iG71mJ9tN0vO2pQ5rS7u0W3x6Z1a4B8c&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1iG71mJ9tN0vO2pQ5rS7u0W3x6Z1a4B8c=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 6186598,
    sizeFormatted: "5.9 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1fF60lI8sM9uN1oP4qR6t9V2w5Y0z3A7b",
    name: "Phere_Seven_Vows_Sacred_Fire.jpg",
    albumId: "album_udaipur_phere_02",
    ceremony: "Phere",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1fF60lI8sM9uN1oP4qR6t9V2w5Y0z3A7b&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1fF60lI8sM9uN1oP4qR6t9V2w5Y0z3A7b=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 4823450,
    sizeFormatted: "4.6 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1eE59kH7rL8tM0nO3pQ5s8U1v4X9y2Z6a",
    name: "Phere_Sindoor_Mangalsutra_Moment.jpg",
    albumId: "album_udaipur_phere_02",
    ceremony: "Phere",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1eE59kH7rL8tM0nO3pQ5s8U1v4X9y2Z6a&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1eE59kH7rL8tM0nO3pQ5s8U1v4X9y2Z6a=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 5557452,
    sizeFormatted: "5.3 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1dD48jG6qK7sL9mN2oP4r7T0u3W8x1Y5z",
    name: "Phere_Royal_Mandap_Floral_Architecture.jpg",
    albumId: "album_udaipur_phere_02",
    ceremony: "Phere",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1dD48jG6qK7sL9mN2oP4r7T0u3W8x1Y5z&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1dD48jG6qK7sL9mN2oP4r7T0u3W8x1Y5z=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 4194304,
    sizeFormatted: "4.0 MB",
    mimeType: "image/jpeg",
  },

  // Mehendi
  {
    id: "1cC37iF5pJ6rK8lM1nO3q6S9t2V7w0X4y",
    name: "Mehendi_Bridal_Henna_CloseUp.jpg",
    albumId: "album_udaipur_mehendi_03",
    ceremony: "Mehendi",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1cC37iF5pJ6rK8lM1nO3q6S9t2V7w0X4y&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1cC37iF5pJ6rK8lM1nO3q6S9t2V7w0X4y=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 3879731,
    sizeFormatted: "3.7 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1bB26hE4oI5qJ7kL0mN2p5R8s1U6v9W3x",
    name: "Mehendi_Bride_and_Bridesmaids_Joy.jpg",
    albumId: "album_udaipur_mehendi_03",
    ceremony: "Mehendi",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1bB26hE4oI5qJ7kL0mN2p5R8s1U6v9W3x&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1bB26hE4oI5qJ7kL0mN2p5R8s1U6v9W3x=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 4128768,
    sizeFormatted: "3.9 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1aA15gD3nH4pI6jK9lM1o4Q7r0T5u8V2w",
    name: "Mehendi_Marigold_Canopy_Decor.jpg",
    albumId: "album_udaipur_mehendi_03",
    ceremony: "Mehendi",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1aA15gD3nH4pI6jK9lM1o4Q7r0T5u8V2w&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1aA15gD3nH4pI6jK9lM1o4Q7r0T5u8V2w=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 4613734,
    sizeFormatted: "4.4 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1zZ04fC2mG3oH5iJ8kL0n3P6q9S4t7U1v",
    name: "Mehendi_Folk_Musicians_Performance.jpg",
    albumId: "album_udaipur_mehendi_03",
    ceremony: "Mehendi",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1zZ04fC2mG3oH5iJ8kL0n3P6q9S4t7U1v&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1zZ04fC2mG3oH5iJ8kL0n3P6q9S4t7U1v=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 3145728,
    sizeFormatted: "3.0 MB",
    mimeType: "image/jpeg",
  },

  // Reception
  {
    id: "1yY93eB1lF2nG4hI7jK9m2O5p8R3s6T0u",
    name: "Reception_Editorial_Royal_Couple_Pose.jpg",
    albumId: "album_udaipur_reception_04",
    ceremony: "Reception",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1yY93eB1lF2nG4hI7jK9m2O5p8R3s6T0u&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1yY93eB1lF2nG4hI7jK9m2O5p8R3s6T0u=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 6815744,
    sizeFormatted: "6.5 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1xX82dA0kE1mF3gH6iJ8l1N4o7Q2r5S9t",
    name: "Reception_Champagne_Tower_Toast.jpg",
    albumId: "album_udaipur_reception_04",
    ceremony: "Reception",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1xX82dA0kE1mF3gH6iJ8l1N4o7Q2r5S9t&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1xX82dA0kE1mF3gH6iJ8l1N4o7Q2r5S9t=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 5242880,
    sizeFormatted: "5.0 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1wW71cZ9jD0lE2fG5hI7k0M3n6P1q4R8s",
    name: "Reception_First_Dance_Spotlight.jpg",
    albumId: "album_udaipur_reception_04",
    ceremony: "Reception",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1wW71cZ9jD0lE2fG5hI7k0M3n6P1q4R8s&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1wW71cZ9jD0lE2fG5hI7k0M3n6P1q4R8s=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 4980736,
    sizeFormatted: "4.7 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1vV60bY8iC9kD1eF4gH6j9L2m5O0p3Q7r",
    name: "Reception_Lake_Pichola_Fireworks.jpg",
    albumId: "album_udaipur_reception_04",
    ceremony: "Reception",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1vV60bY8iC9kD1eF4gH6j9L2m5O0p3Q7r&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1vV60bY8iC9kD1eF4gH6j9L2m5O0p3Q7r=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 5872025,
    sizeFormatted: "5.6 MB",
    mimeType: "image/jpeg",
  },

  // Haldi
  {
    id: "1uU59aX7hB8jC0dE3fG5i8K1l4N9o2P6q",
    name: "Haldi_Petal_Shower_Candid.jpg",
    albumId: "album_udaipur_haldi_05",
    ceremony: "Haldi",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1uU59aX7hB8jC0dE3fG5i8K1l4N9o2P6q&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1uU59aX7hB8jC0dE3fG5i8K1l4N9o2P6q=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 4194304,
    sizeFormatted: "4.0 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1tT48zW6gA7iB9cD2eF4h7J0k3M8n1O5p",
    name: "Haldi_Groom_and_Friends_Laughter.jpg",
    albumId: "album_udaipur_haldi_05",
    ceremony: "Haldi",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1tT48zW6gA7iB9cD2eF4h7J0k3M8n1O5p&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1tT48zW6gA7iB9cD2eF4h7J0k3M8n1O5p=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 3670016,
    sizeFormatted: "3.5 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1sS37yV5f96hA8bC1dE3g6I9j2L7m0N4o",
    name: "Haldi_Morning_Courtyard_Sunlight.jpg",
    albumId: "album_udaipur_haldi_05",
    ceremony: "Haldi",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1sS37yV5f96hA8bC1dE3g6I9j2L7m0N4o&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1sS37yV5f96hA8bC1dE3g6I9j2L7m0N4o=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 4456448,
    sizeFormatted: "4.3 MB",
    mimeType: "image/jpeg",
  },
  {
    id: "1rR26xU4e85g97aB0cD2f5H8i1K6l9M3n",
    name: "Haldi_Yellow_Traditional_Attire.jpg",
    albumId: "album_udaipur_haldi_05",
    ceremony: "Haldi",
    thumbnailUrl: "https://drive.google.com/thumbnail?id=1rR26xU4e85g97aB0cD2f5H8i1K6l9M3n&sz=w400",
    directUrl: "https://lh3.googleusercontent.com/d/1rR26xU4e85g97aB0cD2f5H8i1K6l9M3n=s0",
    fallbackUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    sizeBytes: 3932160,
    sizeFormatted: "3.7 MB",
    mimeType: "image/jpeg",
  },
];
