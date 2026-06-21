const dashboardRepository = require("../repositories/dashboardRepository");
const { successResponse } = require("../utils/responseHelper");
const AppError = require("../utils/AppError");
const { getLocalDateString } = require("../utils/dateHelper");

function isValidNumericId(id) {
  const parsedId = Number(id);
  return Number.isInteger(parsedId) && parsedId > 0;
}

async function getTodayDashboard(req, res) {
  const userId = req.query.userId;
  const date = req.query.date || getLocalDateString();

  if (!userId) {
    throw new AppError(400, "VALIDATION_ERROR", "Missing required query parameter: userId", {
      field: "userId"
    });
  }

  if (!isValidNumericId(userId)) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid userId query parameter.", {
      field: "userId",
      value: userId
    });
  }

  const numericUserId = Number(userId);
  const dashboard = await dashboardRepository.getDashboard(numericUserId, date);

  if (!dashboard) {
    throw new AppError(404, "USER_NOT_FOUND", "Cannot generate dashboard for a non-existent user.", {
      userId: numericUserId
    });
  }

  return successResponse(res, 200, dashboard);
}

module.exports = {
  getTodayDashboard
};
