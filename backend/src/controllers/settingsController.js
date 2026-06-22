const userRepository = require("../repositories/userRepository");
const settingsRepository = require("../repositories/settingsRepository");
const { successResponse } = require("../utils/responseHelper");
const AppError = require("../utils/AppError");

const allowedThemes = ["light", "dark"];

async function getCurrentUserId(req) {
  const headerUserId = Number(req.header("x-user-id") || req.query.userId || 1);

  if (!Number.isInteger(headerUserId) || headerUserId <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid current user id.", {
      field: "x-user-id"
    });
  }

  const exists = await userRepository.userExists(headerUserId);

  if (!exists) {
    throw new AppError(404, "USER_NOT_FOUND", "Settings user was not found.", {
      userId: headerUserId
    });
  }

  return headerUserId;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateSettings(body) {
  if (!body.username || typeof body.username !== "string" || body.username.trim().length === 0) {
    return { isValid: false, field: "username", message: "Username is required." };
  }

  if (!body.email || typeof body.email !== "string" || !isValidEmail(body.email)) {
    return { isValid: false, field: "email", message: "Valid email is required." };
  }

  if (!body.theme || !allowedThemes.includes(body.theme)) {
    return { isValid: false, field: "theme", message: "Theme must be light or dark." };
  }

  return { isValid: true };
}

async function getUserSettings(req, res) {
  const userId = await getCurrentUserId(req);
  const settings = await settingsRepository.getSettings(userId);
  return successResponse(res, 200, settings);
}

async function updateUserSettings(req, res) {
  const validation = validateSettings(req.body);

  if (!validation.isValid) {
    throw new AppError(400, "VALIDATION_ERROR", validation.message, {
      field: validation.field
    });
  }

  const userId = await getCurrentUserId(req);
  const settings = await settingsRepository.updateSettings(userId, {
    username: req.body.username.trim(),
    email: req.body.email.trim(),
    theme: req.body.theme
  });

  return successResponse(res, 200, settings);
}

module.exports = {
  getUserSettings,
  updateUserSettings
};
