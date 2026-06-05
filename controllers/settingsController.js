const { getUsers } = require("../models/usersData"); //grab users
const { getSettings, updateSettings } = require("../models/settingsModel"); //grab settings functions
const { successResponse } = require("../utils/responseHelper"); //grab success helper
const AppError = require("../utils/AppError"); //grab custom error

const allowedThemes = ["light", "dark"]; //themes we allow

function getCurrentUserId(req) { //get current user id
  const headerUserId = Number(req.header("x-user-id") || req.query.userId || 1); //read header or query

  if (!Number.isInteger(headerUserId) || headerUserId <= 0) { //if id is bad
    throw new AppError(400, "VALIDATION_ERROR", "Invalid current user id.", { //send error
      field: "x-user-id" //bad header
    });
  }

  const userExists = getUsers().some((user) => user.userId === headerUserId); //check user exists

  if (!userExists) { //if user is missing
    throw new AppError(404, "USER_NOT_FOUND", "Settings user was not found.", { //send error
      userId: headerUserId //missing user id
    });
  }

  return headerUserId; //send back user id
}

function isValidEmail(email) { //check email format
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); //true if email looks ok
}

function validateSettings(body) { //check settings body
  if (!body.username || typeof body.username !== "string" || body.username.trim().length === 0) { //if username is missing
    return { //send validation info
      isValid: false, //not valid
      field: "username", //bad field
      message: "Username is required." //error message
    };
  }

  if (!body.email || typeof body.email !== "string" || !isValidEmail(body.email)) { //if email is missing or bad
    return { //send validation info
      isValid: false, //not valid
      field: "email", //bad field
      message: "Valid email is required." //error message
    };
  }

  if (!body.theme || !allowedThemes.includes(body.theme)) { //if theme is not allowed
    return { //send validation info
      isValid: false, //not valid
      field: "theme", //bad field
      message: "Theme must be light or dark." //error message
    };
  }

  return { //settings are good
    isValid: true //valid settings
  };
}

function getUserSettings(req, res) { //get user settings
  const userId = getCurrentUserId(req); //get current user
  return successResponse(res, 200, getSettings(userId)); //send settings
}

function updateUserSettings(req, res) { //update user settings
  const validation = validateSettings(req.body); //check body

  if (!validation.isValid) { //if settings are bad
    throw new AppError(400, "VALIDATION_ERROR", validation.message, { //send error
      field: validation.field //bad field
    });
  }

  const userId = getCurrentUserId(req); //get current user
  const settings = updateSettings(userId, { //save settings
    username: req.body.username.trim(), //clean username
    email: req.body.email.trim(), //clean email
    theme: req.body.theme //save theme
  });

  return successResponse(res, 200, settings); //send updated settings
}

module.exports = { //share settings functions
  getUserSettings,
  updateUserSettings
};
