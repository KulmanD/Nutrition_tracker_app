import { io } from "socket.io-client";
import { API_BASE_URL, getAuthUser } from "./api";

// One shared Socket.IO connection for the whole app. The connection lives on the same
// origin as the REST API (API_BASE_URL). See docs/API_CONTRACT.md (3.3).
let socket = null;

// Opens the connection if it isn't open yet, and returns it. Idempotent: calling it
// from several places only ever creates one socket.
export function connectSocket() {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: true,
      reconnection: true
    });
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Announces the logged-in user as online. Safe to call again on reconnect.
export function emitPresenceJoin() {
  const user = getAuthUser();

  if (socket && user) {
    socket.emit("presence:join", {
      userId: user.userId,
      fullName: user.fullName || user.firstName || "User"
    });
  }
}
