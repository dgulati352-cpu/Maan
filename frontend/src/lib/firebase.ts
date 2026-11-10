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

// Standard Google Auth Provider (Clean, Instant, Zero Warning for Guests)
export function getStandardGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  provider.setCustomParameters({
    prompt: "select_account",
  });
  return provider;
}

// Google Auth Provider (Clean, Standard, Zero Sensitive Scopes)
export function getGoogleDriveProvider(): GoogleAuthProvider {
  return getStandardGoogleProvider();
}
