const { Server } = require("socket.io");
const { getAllowedOrigins } = require("../middleware/cors");

let io;
const onlineSockets = new Map();

function serializeOnlineUsers() {
  const usersById = new Map();

  for (const user of onlineSockets.values()) {
    usersById.set(user.userId, user);
  }

  return Array.from(usersById.values())
    .sort((left, right) => left.userId - right.userId);
}

function emitPresenceUpdated() {
  if (!io) {
    return;
  }

  io.emit("presence:updated", {
    onlineUsers: serializeOnlineUsers()
  });
}

function normalizeJoinedUser(payload) {
  const userId = Number(payload && payload.userId);
  const fullName = String((payload && payload.fullName) || "").trim();

  if (!Number.isInteger(userId) || userId <= 0 || !fullName) {
    return null;
  }

  return {
    userId,
    fullName
  };
}

function initializeSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    socket.on("presence:join", (payload) => {
      const joinedUser = normalizeJoinedUser(payload);

      if (!joinedUser) {
        return;
      }

      onlineSockets.set(socket.id, joinedUser);
      emitPresenceUpdated();
    });

    socket.on("disconnect", () => {
      if (onlineSockets.delete(socket.id)) {
        emitPresenceUpdated();
      }
    });
  });

  return io;
}

function emitMealCreated(payload) {
  if (!io) {
    return;
  }

  io.emit("meal:created", payload);
}

function emitDashboardUpdated(payload) {
  if (!io) {
    return;
  }

  io.emit("dashboard:updated", payload);
}

module.exports = {
  initializeSocketServer,
  emitMealCreated,
  emitDashboardUpdated
};
