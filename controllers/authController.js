const { getUsers } = require("../models/usersData");
const { getSettings } = require("../models/settingsModel");
const { successResponse } = require("../utils/responseHelper");
const AppError = require("../utils/AppError");

const demoAccounts = [
  {
    email: "denis@example.com",
    password: "password123",
    userId: 1
  },
  {
    email: "yael@example.com",
    password: "password123",
    userId: 2
  }
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function findDemoAccount(email, password) {
  return demoAccounts.find((account) => account.email === email && account.password === password);
}

function buildUserResponse(user, settings) {
  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    email: settings.email,
    userRole: user.userRole
  };
}

function login(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !isValidEmail(email)) {
    throw new AppError(400, "VALIDATION_ERROR", "Valid email is required.", {
      field: "email"
    });
  }

  if (!password || password.length < 6) {
    throw new AppError(400, "VALIDATION_ERROR", "Password must be at least 6 characters.", {
      field: "password"
    });
  }

  const account = findDemoAccount(email, password);

  if (!account) {
    throw new AppError(401, "LOGIN_FAILED", "Invalid email or password.", {});
  }

  const user = getUsers().find((currentUser) => currentUser.userId === account.userId);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Login user was not found.", {
      userId: account.userId
    });
  }

  const settings = getSettings(user.userId);

  return successResponse(res, 200, {
    token: "mock-assignment-token",
    user: buildUserResponse(user, settings)
  });
}

function logout(req, res) {
  return successResponse(res, 200, {
    message: "Logged out successfully."
  });
}

module.exports = {
  login,
  logout
};
