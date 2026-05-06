const { getUsers, setUsers, getNextUserId } = require("../models/usersData");
const { successResponse, errorResponse } = require("../utils/responseHelper");

function isValidNumericId(id) {
  const parsedId = Number(id);
  return Number.isInteger(parsedId) && parsedId > 0;
}

function getAllUsers(req, res) {
  return successResponse(res, 200, getUsers());
}

function getUserById(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid user id.", {
      field: "id",
      value: id
    });
  }

  const userId = Number(id);
  const user = getUsers().find((currentUser) => currentUser.userId === userId);

  if (!user) {
    return errorResponse(res, 404, "USER_NOT_FOUND", "User was not found.", {
      userId: userId
    });
  }

  return successResponse(res, 200, user);
}

function createUser(req, res) {
  const { firstName, lastName, userRole } = req.body;

  if (!firstName) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required field: firstName", {
      field: "firstName"
    });
  }

  if (!lastName) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required field: lastName", {
      field: "lastName"
    });
  }

  if (!userRole) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required field: userRole", {
      field: "userRole"
    });
  }

  const now = new Date().toISOString();

  const newUser = {
    userId: getNextUserId(),
    firstName: firstName,
    lastName: lastName,
    createDate: now,
    updateDate: now,
    userRole: userRole
  };

  const users = getUsers();
  users.push(newUser);

  return successResponse(res, 201, {
    userId: newUser.userId
  });
}

function updateUser(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid user id.", {
      field: "id",
      value: id
    });
  }

  const { firstName, lastName, userRole } = req.body;

  if (!firstName) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required field: firstName", {
      field: "firstName"
    });
  }

  if (!lastName) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required field: lastName", {
      field: "lastName"
    });
  }

  if (!userRole) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required field: userRole", {
      field: "userRole"
    });
  }

  const userId = Number(id);
  const users = getUsers();
  const userIndex = users.findIndex((user) => user.userId === userId);

  if (userIndex === -1) {
    return errorResponse(res, 404, "USER_NOT_FOUND", "User was not found.", {
      userId: userId
    });
  }

  users[userIndex] = {
    ...users[userIndex],
    firstName: firstName,
    lastName: lastName,
    userRole: userRole,
    updateDate: new Date().toISOString()
  };

  return successResponse(res, 200, {
    userId: userId
  });
}

function deleteUser(req, res) {
  const id = req.params.id;

  if (!isValidNumericId(id)) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid user id.", {
      field: "id",
      value: id
    });
  }

  const userId = Number(id);
  const users = getUsers();
  const userExists = users.some((user) => user.userId === userId);

  if (!userExists) {
    return errorResponse(res, 404, "USER_NOT_FOUND", "User was not found.", {
      userId: userId
    });
  }

  const filteredUsers = users.filter((user) => user.userId !== userId);
  setUsers(filteredUsers);

  return successResponse(res, 200, {
    userId: userId
  });
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};