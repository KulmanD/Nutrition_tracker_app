const userRepository = require("../repositories/userRepository");
const { successResponse } = require("../utils/responseHelper");
const AppError = require("../utils/AppError");

const allowedRoles = ["admin", "user", "manager"];

function isValidNumericId(id) {
  const parsedId = Number(id);
  return Number.isInteger(parsedId) && parsedId > 0;
}

function validateUserBody(body) {
  const firstName = body.firstName;
  const lastName = body.lastName;
  const userRole = body.userRole;

  if (!firstName) {
    return { isValid: false, field: "firstName", message: "Missing required field: firstName" };
  }

  if (typeof firstName !== "string" || firstName.trim().length === 0) {
    return { isValid: false, field: "firstName", message: "First name must be a non-empty string." };
  }

  if (!lastName) {
    return { isValid: false, field: "lastName", message: "Missing required field: lastName" };
  }

  if (typeof lastName !== "string" || lastName.trim().length === 0) {
    return { isValid: false, field: "lastName", message: "Last name must be a non-empty string." };
  }

  if (!userRole) {
    return { isValid: false, field: "userRole", message: "Missing required field: userRole" };
  }

  if (typeof userRole !== "string" || userRole.trim().length === 0) {
    return { isValid: false, field: "userRole", message: "User role must be a non-empty string." };
  }

  if (!allowedRoles.includes(userRole)) {
    return {
      isValid: false,
      field: "userRole",
      message: "Invalid or missing userRole. Allowed roles: admin, user, manager."
    };
  }

  return { isValid: true };
}

function validationError(message, field, value) {
  throw new AppError(400, "VALIDATION_ERROR", message, {
    field,
    value
  });
}

async function getAllUsers(req, res) {
  const users = await userRepository.getAllUsers();
  return successResponse(res, 200, users);
}

async function getUserById(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    validationError("Invalid user id.", "id", id);
  }

  const userId = Number(id);
  const user = await userRepository.getUserById(userId);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User was not found.", {
      userId
    });
  }

  return successResponse(res, 200, user);
}

async function createUser(req, res) {
  const validation = validateUserBody(req.body);

  if (!validation.isValid) {
    throw new AppError(400, "VALIDATION_ERROR", validation.message, {
      field: validation.field
    });
  }

  const user = await userRepository.createUser({
    firstName: req.body.firstName.trim(),
    lastName: req.body.lastName.trim(),
    userRole: req.body.userRole
  });

  return successResponse(res, 201, {
    userId: user.userId
  });
}

async function updateUser(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    validationError("Invalid user id.", "id", id);
  }

  const validation = validateUserBody(req.body);

  if (!validation.isValid) {
    throw new AppError(400, "VALIDATION_ERROR", validation.message, {
      field: validation.field
    });
  }

  const userId = Number(id);
  const user = await userRepository.updateUser(userId, {
    firstName: req.body.firstName.trim(),
    lastName: req.body.lastName.trim(),
    userRole: req.body.userRole
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User was not found.", {
      userId
    });
  }

  return successResponse(res, 200, {
    userId
  });
}

async function deleteUser(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    validationError("Invalid user id.", "id", id);
  }

  const userId = Number(id);
  const deleted = await userRepository.deleteUser(userId);

  if (!deleted) {
    throw new AppError(404, "USER_NOT_FOUND", "User was not found.", {
      userId
    });
  }

  return successResponse(res, 200, {
    userId
  });
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
