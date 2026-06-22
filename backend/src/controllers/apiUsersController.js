const userRepository = require("../repositories/userRepository");
const settingsRepository = require("../repositories/settingsRepository");
const { successResponse } = require("../utils/responseHelper");
const AppError = require("../utils/AppError");

function getCurrentUserId(req) {
  const headerUserId = Number(req.header("x-user-id") || 1);

  if (!Number.isInteger(headerUserId) || headerUserId <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid current user id.", {
      field: "x-user-id"
    });
  }

  return headerUserId;
}

async function getMe(req, res) {
  const userId = getCurrentUserId(req);
  const user = await userRepository.getUserById(userId);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "Current user was not found.", {
      userId
    });
  }

  const settings = await settingsRepository.getSettings(userId);

  return successResponse(res, 200, {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: settings.username,
    email: settings.email,
    userRole: user.userRole
  });
}

module.exports = {
  getMe
};
