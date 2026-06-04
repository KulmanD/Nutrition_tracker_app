import { request } from "./api";

export const THEME_STORAGE_KEY = "nutritrackTheme";
export const THEME_CHANGE_EVENT = "nutritrack-theme-change";
export const PROFILE_NAME_STORAGE_KEY = "nutritrackProfileName";
export const PROFILE_CHANGE_EVENT = "nutritrack-profile-change";

export function normalizeTheme(theme) {
  return theme === "dark" ? "dark" : "light";
}

export function getStoredTheme() {
  return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY) || "light");
}

export function saveStoredTheme(theme) {
  const nextTheme = normalizeTheme(theme);
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  return nextTheme;
}

export function getStoredProfileName() {
  return localStorage.getItem(PROFILE_NAME_STORAGE_KEY) || "";
}

export function saveStoredProfileName(username) {
  const nextUsername = username || "";
  localStorage.setItem(PROFILE_NAME_STORAGE_KEY, nextUsername);
  return nextUsername;
}

export async function getSettings() {
  return request("/api/settings");
}

export async function saveSettings(settings) {
  return request("/api/settings", {
    method: "PUT",
    body: settings
  });
}
