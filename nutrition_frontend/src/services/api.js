export const API_BASE_URL = "http://localhost:3000";
export const AUTH_STORAGE_KEY = "nutritrackAuth";
export const AUTH_USER_CHANGE_EVENT = "nutritrack-auth-user-change";

export function getStoredAuth() {
  const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveStoredAuth(authData) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function updateStoredAuthUser(userUpdates) {
  const authData = getStoredAuth();

  if (!authData || !authData.user) {
    return null;
  }

  const nextAuthData = {
    ...authData,
    user: {
      ...authData.user,
      ...userUpdates
    }
  };

  saveStoredAuth(nextAuthData);
  window.dispatchEvent(new Event(AUTH_USER_CHANGE_EVENT));
  return nextAuthData.user;
}

export function getAuthUser() {
  const authData = getStoredAuth();
  return authData ? authData.user : null;
}

function getAuthHeaders() {
  const user = getAuthUser();

  return {
    "x-user-id": String(user ? user.userId : 1),
    "x-user-role": user ? user.userRole : "user"
  };
}

export async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const fetchOptions = {
    ...options,
    headers
  };

  if (options.body && typeof options.body !== "string") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
  const result = await response.json().catch(() => null);

  if (!response.ok || (result && result.success === false)) {
    const message = result && result.error ? result.error.message : "The request failed.";
    throw new Error(message);
  }

  return result && Object.prototype.hasOwnProperty.call(result, "data") ? result.data : result;
}
