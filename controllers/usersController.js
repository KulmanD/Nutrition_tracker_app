const { getUsers, setUsers, getNextUserId } = require("../models/usersData");
const { successResponse, errorResponse } = require("../utils/responseHelper");

const allowedRoles = ['admin', 'user', 'manager'];

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
  const users = getUsers();
  let user;

  for (let i = 0; i < users.length; i++) {
    const currentUser = users[i];

    if (currentUser.userId === userId) {
      user = currentUser;
      break;
    }
  }

  if (!user) {
    return errorResponse(res, 404, "USER_NOT_FOUND", "User was not found.", {
      userId: userId
    });
  }

  return successResponse(res, 200, user);
}

function createUser(req, res) {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const userRole = req.body.userRole;

  if (!firstName) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required field: firstName", {
      field: "firstName"
    });
  }

  if (typeof firstName !== 'string' || firstName.trim().length === 0) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "First name must be a non-empty string.", { field: "firstName" });
  }


  if (!lastName) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required field: lastName", {
      field: "lastName"
    });
  }

  if (typeof lastName !== 'string' || lastName.trim().length === 0) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Last name must be a non-empty string.", { field: "lastName" });
  }

  if (!userRole) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Missing required field: userRole", {
      field: "userRole"
    });
  }

  if (typeof userRole !== 'string' || userRole.trim().length === 0) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "User role must be a non-empty string.", { field: "userRole" });
  }

  if (!allowedRoles.includes(userRole)) {
    return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid or missing userRole. Allowed roles: admin, user, manager.", { field: "userRole" });
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

  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const userRole = req.body.userRole;

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
  let userIndex = -1;

  for (let i = 0; i < users.length; i++) {
    const currentUser = users[i];

    if (currentUser.userId === userId) {
      userIndex = i;
      break;
    }
  }

  if (userIndex === -1) {
    return errorResponse(res, 404, "USER_NOT_FOUND", "User was not found.", {
      userId: userId
    });
  }

  const existingUser = users[userIndex];
  const updatedUser = {};

  for (const key in existingUser) {
    if (Object.prototype.hasOwnProperty.call(existingUser, key)) {
      updatedUser[key] = existingUser[key];
    }
  }

  updatedUser.firstName = firstName;
  updatedUser.lastName = lastName;
  updatedUser.userRole = userRole;
  updatedUser.updateDate = new Date().toISOString();

  users[userIndex] = updatedUser;

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
  let userExists = false;

  for (let i = 0; i < users.length; i++) {
    const currentUser = users[i];

    if (currentUser.userId === userId) {
      userExists = true;
      break;
    }
  }

  if (!userExists) {
    return errorResponse(res, 404, "USER_NOT_FOUND", "User was not found.", {
      userId: userId
    });
  }

  const filteredUsers = [];

  for (let i = 0; i < users.length; i++) {
    const currentUser = users[i];

    if (currentUser.userId !== userId) {
      filteredUsers.push(currentUser);
    }
  }

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
