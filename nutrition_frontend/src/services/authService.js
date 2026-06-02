import { clearStoredAuth, getAuthUser, getStoredAuth, request, saveStoredAuth } from "./api";

export async function login(email, password) {
  const authData = await request("/api/auth/login", {
    method: "POST",
    body: {
      email,
      password
    }
  });

  saveStoredAuth(authData);
  return authData;
}

export async function logout() {
  try {
    await request("/api/auth/logout", {
      method: "POST"
    });
  } finally {
    clearStoredAuth();
  }
}

export async function getCurrentUser() {
  return request("/api/users/me");
}

export function isLoggedIn() {
  return Boolean(getStoredAuth() && getAuthUser());
}

export function getLoggedInUser() {
  return getAuthUser();
}
