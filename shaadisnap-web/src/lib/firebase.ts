import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAPaVidPZ7fH2jShF2Ue1KGkCjFq-L0PqY",
  authDomain: "maan-d14f8.firebaseapp.com",
  projectId: "maan-d14f8",
  storageBucket: "maan-d14f8.firebasestorage.app",
  messagingSenderId: "828535566976",
  appId: "1:828535566976:web:723b72e91bc8e7072bec65",
  measurementId: "G-YVLBFDE190"
};

// Initialize Firebase client safely for Next.js SSR
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Drive Scopes
export function getGoogleDriveProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // Request Google Drive access so user's wedding photos can be accessed
  provider.addScope("https://www.googleapis.com/auth/drive.readonly");
  provider.addScope("https://www.googleapis.com/auth/drive.photos.readonly");
  provider.setCustomParameters({
    prompt: "select_account",
  });
  return provider;
}
