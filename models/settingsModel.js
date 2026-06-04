const { getUsers } = require("./usersData");

let settingsByUserId = {
  1: {
    userId: 1,
    username: "Denis",
    email: "denis@example.com",
    theme: "light"
  },
  2: {
    userId: 2,
    username: "Yael",
    email: "yael@example.com",
    theme: "light"
  },
  3: {
    userId: 3,
    username: "Amit",
    email: "amit@example.com",
    theme: "dark"
  }
};

function buildDefaultSettings(userId) {
  const users = getUsers();
  const user = users.find((currentUser) => currentUser.userId === userId);

  return {
    userId: userId,
    username: user ? user.firstName : "Guest",
    email: `user${userId}@example.com`,
    theme: "light"
  };
}

function getSettings(userId) {
  if (!settingsByUserId[userId]) {
    settingsByUserId[userId] = buildDefaultSettings(userId);
  }

  return settingsByUserId[userId];
}

function updateSettings(userId, nextSettings) {
  const currentSettings = getSettings(userId);
  const now = new Date().toISOString();

  settingsByUserId[userId] = {
    userId: userId,
    username: nextSettings.username,
    email: nextSettings.email,
    theme: nextSettings.theme,
    createDate: currentSettings.createDate || now,
    updateDate: now
  };

  return settingsByUserId[userId];
}

module.exports = {
  getSettings,
  updateSettings
};
