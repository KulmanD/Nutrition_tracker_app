import { request } from "./api";

export const THEME_STORAGE_KEY = "nutritrackTheme";
export const THEME_CHANGE_EVENT = "nutritrack-theme-change";

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

export async function getSettings() {
  return request("/api/settings");
}

export async function saveSettings(settings) {
  return request("/api/settings", {
    method: "PUT",
    body: settings
  });
}
