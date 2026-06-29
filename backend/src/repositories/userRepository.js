const { Admin, User } = require("../../models/orm");
const { serializeUser } = require("./serializers");

async function syncAdminProfile(user, transaction) {
  if (user.userRole === "admin") {
    await Admin.findOrCreate({
      where: { userId: user.userId },
      defaults: { adminLevel: "standard" },
      transaction
    });
  } else {
    await Admin.destroy({
      where: { userId: user.userId },
      transaction
    });
  }
}

async function getAllUsers() {
  const users = await User.findAll({
    order: [["userId", "ASC"]]
  });

  return users.map(serializeUser);
}

async function getUserById(userId) {
  const user = await User.findByPk(userId);
  return user ? serializeUser(user) : null;
}

async function userExists(userId) {
  const count = await User.count({
    where: { userId }
  });

  return count > 0;
}

async function createUser(data, options = {}) {
  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    userRole: data.userRole
  }, {
    transaction: options.transaction
  });

  await syncAdminProfile(user, options.transaction);
  return serializeUser(user);
}

async function updateUser(userId, data) {
  const user = await User.findByPk(userId);

  if (!user) {
    return null;
  }

  await user.update({
    firstName: data.firstName,
    lastName: data.lastName,
    userRole: data.userRole
  });

  await syncAdminProfile(user);
  return serializeUser(user);
}

async function deleteUser(userId) {
  const user = await User.findByPk(userId);

  if (!user) {
    return false;
  }

  await user.destroy();
  return true;
}

module.exports = {
  getAllUsers,
  getUserById,
  userExists,
  createUser,
  updateUser,
  deleteUser
};
