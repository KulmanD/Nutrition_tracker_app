const { getUsers } = require("./usersData"); //grab users

let settingsByUserId = { //mock settings by user id
  1: { //settings for denis
    userId: 1, //user id
    username: "Denis Kulman", //full username
    email: "denis@example.com", //profile email
    theme: "light" //theme choice
  },
  2: { //settings for yael
    userId: 2, //user id
    username: "Yael Durahly", //full username
    email: "yael@example.com", //profile email
    theme: "dark" //theme choice
  },
  3: { //settings for amit
    userId: 3, //user id
    username: "Amit Levi", //full username
    email: "amit@example.com", //profile email
    theme: "dark" //theme choice
  }
};

function buildDefaultSettings(userId) { //make default settings
  const users = getUsers(); //get all users
  const user = users.find((currentUser) => currentUser.userId === userId); //find user

  return { //send back defaults
    userId: userId, //user id
    username: user ? `${user.firstName} ${user.lastName}` : "Guest", //use full name or guest
    email: `user${userId}@example.com`, //default profile email
    theme: "light" //default theme
  };
}

function getSettings(userId) { //get settings for user
  if (!settingsByUserId[userId]) { //if settings do not exist yet
    settingsByUserId[userId] = buildDefaultSettings(userId); //make default settings
  }

  return settingsByUserId[userId]; //send settings back
}

function updateSettings(userId, nextSettings) { //update settings for user
  const currentSettings = getSettings(userId); //get current settings
  const now = new Date().toISOString(); //get current time

  settingsByUserId[userId] = { //save new settings
    userId: userId, //user id
    username: nextSettings.username, //full username
    email: nextSettings.email, //profile email
    theme: nextSettings.theme, //theme choice
    createDate: currentSettings.createDate || now, //keep old create date or make one
    updateDate: now //last update time
  };

  return settingsByUserId[userId]; //send updated settings
}

module.exports = { //share settings functions
  getSettings,
  updateSettings
};
