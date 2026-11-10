"use client";

import { useState, useEffect, useCallback } from "react";

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export interface GooglePickerItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  thumbnailUrl?: string;
  isFolder: boolean;
}

export interface UseGooglePickerOptions {
  onSelected?: (items: GooglePickerItem[], accessToken: string) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

export function useGooglePicker(options: UseGooglePickerOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pickerConfig, setPickerConfig] = useState<{
    clientId: string;
    developerKey: string;
    appId: string;
  } | null>(null);

  // 1. Fetch picker configuration from backend
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/google-drive/picker-config");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPickerConfig({
              clientId: data.clientId,
              developerKey: data.developerKey,
              appId: data.appId,
            });
          }
        }
      } catch (err) {
        console.warn("Could not load Google Picker config from server:", err);
      }
    }
    loadConfig();
  }, []);

  // 2. Load Google Identity Services & Google Picker scripts dynamically
  useEffect(() => {
    let gapiLoaded = false;
    let gisLoaded = false;

    const checkReady = () => {
      if (gapiLoaded && gisLoaded) {
        setIsLoaded(true);
      }
    };

    // Load GAPI
    if (typeof window !== "undefined" && !window.gapi) {
      const gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/api.js";
      gapiScript.async = true;
      gapiScript.defer = true;
      gapiScript.onload = () => {
        window.gapi.load("picker", () => {
          gapiLoaded = true;
          checkReady();
        });
      };
      document.body.appendChild(gapiScript);
    } else if (window.gapi) {
      window.gapi.load("picker", () => {
        gapiLoaded = true;
        checkReady();
      });
    }

    // Load GIS (Google Identity Services)
    if (typeof window !== "undefined" && !window.google?.accounts?.oauth2) {
      const gisScript = document.createElement("script");
      gisScript.src = "https://accounts.google.com/gsi/client";
      gisScript.async = true;
      gisScript.defer = true;
      gisScript.onload = () => {
        gisLoaded = true;
        checkReady();
      };
      document.body.appendChild(gisScript);
    } else if (window.google?.accounts?.oauth2) {
      gisLoaded = true;
      checkReady();
    }
  }, []);

  const openPicker = useCallback(
    async (tokenOverride?: string) => {
      if (!pickerConfig) {
        options.onError?.("Google Picker credentials are not configured yet.");
        return;
      }

      const activeToken = tokenOverride || accessToken;

      // If no token yet, request token via GIS token client
      if (!activeToken) {
        setIsAuthenticating(true);
        try {
          if (!window.google?.accounts?.oauth2) {
            options.onError?.("Google Identity Services script is still loading. Please retry.");
            setIsAuthenticating(false);
            return;
          }

          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: pickerConfig.clientId,
            scope: "https://www.googleapis.com/auth/drive.readonly",
            callback: (response: any) => {
              setIsAuthenticating(false);
              if (response.error !== undefined) {
                options.onError?.(`Google Authentication Error: ${response.error}`);
                return;
              }
              const receivedToken = response.access_token;
              setAccessToken(receivedToken);
              // Open picker once token is received
              buildAndShowPicker(receivedToken);
            },
          });

          tokenClient.requestAccessToken({ prompt: "consent" });
        } catch (err: unknown) {
          setIsAuthenticating(false);
          const msg = err instanceof Error ? err.message : "Authentication failed";
          options.onError?.(msg);
        }
        return;
      }

      // If token already present, build picker directly
      buildAndShowPicker(activeToken);
    },
    [pickerConfig, accessToken, options]
  );

  const buildAndShowPicker = (token: string) => {
    if (!window.google?.picker) {
      options.onError?.("Google Picker API is still initializing.");
      return;
    }

    try {
      const google = window.google;

      // 1. Folders View
      const foldersView = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setMimeTypes("application/vnd.google-apps.folder");

      // 2. Images View
      const imagesView = new google.picker.DocsView(google.picker.ViewId.DOCS_IMAGES)
        .setIncludeFolders(true)
        .setMimeTypes("image/jpeg,image/png,image/webp,image/heic");

      const picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .enableFeature(google.picker.Feature.SUPPORT_DRIVES)
        .setAppId(pickerConfig?.appId || "")
        .setOAuthToken(token)
        .setDeveloperKey(pickerConfig?.developerKey || "")
        .addView(imagesView)
        .addView(foldersView)
        .setTitle("Select Wedding Photos or Folders from Google Drive")
        .setCallback((data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            const docs = data[google.picker.Response.DOCUMENTS] || [];
            const selectedItems: GooglePickerItem[] = docs.map((doc: any) => ({
              id: doc.id,
              name: doc.name,
              mimeType: doc.mimeType,
              sizeBytes: doc.sizeBytes ? parseInt(doc.sizeBytes, 10) : undefined,
              thumbnailUrl: doc.thumbnails?.[0]?.url || (doc.id ? `https://drive.google.com/thumbnail?id=${doc.id}&sz=w400` : undefined),
              isFolder: doc.mimeType === "application/vnd.google-apps.folder",
            }));

            options.onSelected?.(selectedItems, token);
          } else if (data.action === google.picker.Action.CANCEL) {
            options.onCancel?.();
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error displaying Google Picker";
      options.onError?.(msg);
    }
  };

  return {
    isLoaded,
    isAuthenticating,
    accessToken,
    openPicker,
  };
}

