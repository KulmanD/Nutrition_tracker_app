const userRepository = require("../repositories/userRepository");
const settingsRepository = require("../repositories/settingsRepository");
const { successResponse } = require("../utils/responseHelper");
const AppError = require("../utils/AppError");
const { sequelize } = require("../../models/orm");

const DEMO_PASSWORD = "test00";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validationError(message, field) {
  throw new AppError(400, "VALIDATION_ERROR", message, {
    field
  });
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function findLoginAccount(email, password) {
  if (password !== DEMO_PASSWORD) {
    return null;
  }

  const settings = await settingsRepository.getSettingsByEmail(email);
  return settings ? { userId: settings.userId } : null;
}

function validateRegistrationBody(body) {
  const firstName = cleanString(body.firstName);
  const lastName = cleanString(body.lastName);
  const email = cleanString(body.email);

  if (!firstName) {
    validationError("First name is required.", "firstName");
  }

  if (!lastName) {
    validationError("Last name is required.", "lastName");
  }

  if (!email || !isValidEmail(email)) {
    validationError("Valid email is required.", "email");
  }

  return {
    firstName,
    lastName,
    email
  };
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
  const email = cleanString(req.body.email);
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

  const account = await findLoginAccount(email, password);

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

async function register(req, res) {
  const registration = validateRegistrationBody(req.body);
  const existingSettings = await settingsRepository.getSettingsByEmail(registration.email);

  if (existingSettings) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "A user with this email already exists.", {
      field: "email"
    });
  }

  const { user, settings } = await sequelize.transaction(async (transaction) => {
    const createdUser = await userRepository.createUser({
      firstName: registration.firstName,
      lastName: registration.lastName,
      userRole: "user"
    }, {
      transaction
    });

    const createdSettings = await settingsRepository.createSettings({
      userId: createdUser.userId,
      username: `${registration.firstName} ${registration.lastName}`,
      email: registration.email,
      theme: "light"
    }, {
      transaction
    });

    return {
      user: createdUser,
      settings: createdSettings
    };
  });

  return successResponse(res, 201, {
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
  register,
  logout
};
