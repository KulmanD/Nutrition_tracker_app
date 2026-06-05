const { getUsers } = require("../models/usersData"); //grab users
const { getSettings } = require("../models/settingsModel"); //grab settings
const { successResponse } = require("../utils/responseHelper"); //grab success helper
const AppError = require("../utils/AppError"); //grab custom error

function getCurrentUserId(req) { //get current user id
  const headerUserId = Number(req.header("x-user-id") || 1); //read user id header or use default

  if (!Number.isInteger(headerUserId) || headerUserId <= 0) { //if id is bad
    throw new AppError(400, "VALIDATION_ERROR", "Invalid current user id.", { //send error
      field: "x-user-id" //bad header
    });
  }

  return headerUserId; //send back good user id
}

function getMe(req, res) { //get logged in user
  const userId = getCurrentUserId(req); //get user id
  const user = getUsers().find((currentUser) => currentUser.userId === userId); //find user

  if (!user) { //if user is missing
    throw new AppError(404, "USER_NOT_FOUND", "Current user was not found.", { //send error
      userId: userId //missing user id
    });
  }

  const settings = getSettings(userId); //get profile settings

  return successResponse(res, 200, { //send user info
    userId: user.userId, //user id
    firstName: user.firstName, //first name
    lastName: user.lastName, //last name
    fullName: settings.username, //show editable full username
    email: settings.email, //profile email
    userRole: user.userRole //user role
  });
}

module.exports = { //share user functions
  getMe
};
