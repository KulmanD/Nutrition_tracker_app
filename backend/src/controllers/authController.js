const userRepository = require("../repositories/userRepository");
const settingsRepository = require("../repositories/settingsRepository");
const { successResponse } = require("../utils/responseHelper");
const AppError = require("../utils/AppError");

const demoAccounts = [
  {
    email: "denis@example.com",
    password: "test00",
    userId: 1
  },
  {
    email: "yael@example.com",
    password: "test00",
    userId: 2
  }
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function findDemoAccount(email, password) {
  for (const account of demoAccounts) {
    if (account.password !== password) {
      continue;
    }

    const settings = await settingsRepository.getSettings(account.userId);

    if (settings && settings.email === email) {
      return account;
    }
  }

  return null;
}

function buildUserResponse(user, settings) {
  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: settings.username,
    email: settings.email,
    userRole: user.userRole
  };
}

async function login(req, res) {
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

  const account = await findDemoAccount(email, password);

  if (!account) {
    throw new AppError(401, "LOGIN_FAILED", "Invalid email or password.", {});
  }

  const user = await userRepository.getUserById(account.userId);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Login user was not found.", {
      userId: account.userId
    });
  }

  const settings = await settingsRepository.getSettings(user.userId);

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
