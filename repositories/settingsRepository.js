const { User, UserSetting } = require("../models/orm");
const { serializeSettings } = require("./serializers");

function buildDefaultSettings(user) {
  return {
    userId: user.userId,
    username: `${user.firstName} ${user.lastName}`,
    email: `user${user.userId}@example.com`,
    theme: "light"
  };
}

async function getSettings(userId) {
  const user = await User.findByPk(userId);

  if (!user) {
    return null;
  }

  const [settings] = await UserSetting.findOrCreate({
    where: { userId },
    defaults: buildDefaultSettings(user)
  });

  return serializeSettings(settings);
}

async function getSettingsByEmail(email) {
  const settings = await UserSetting.findOne({
    where: { email }
  });

  return settings ? serializeSettings(settings) : null;
}

async function updateSettings(userId, nextSettings) {
  const existing = await getSettings(userId);

  if (!existing) {
    return null;
  }

  const settings = await UserSetting.findOne({
    where: { userId }
  });

  await settings.update({
    username: nextSettings.username,
    email: nextSettings.email,
    theme: nextSettings.theme
  });

  return serializeSettings(settings);
}

module.exports = {
  getSettings,
  getSettingsByEmail,
  updateSettings
};
