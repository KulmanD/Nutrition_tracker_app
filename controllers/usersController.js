const { getUsers, setUsers, getNextUserId } = require("../models/usersData"); //grab data functions
const { successResponse } = require("../utils/responseHelper"); //grab success helper
const AppError = require("../utils/AppError"); //grab custom error

const allowedRoles = ['admin', 'user', 'manager']; //who is allowed to use this

function isValidNumericId(id) { //check if id is a good number
  const parsedId = Number(id); //make it a number
  return Number.isInteger(parsedId) && parsedId > 0; //must be positive whole number
}

function getAllUsers(req, res) { //get everyone
  return successResponse(res, 200, getUsers()); //send back the list
}

function getUserById(req, res) { //get one specific user
  const id = req.params.id; //get id from url

  if (!isValidNumericId(id)) { //if bad id
    throw new AppError(400, "VALIDATION_ERROR", "Invalid user id.", { //send error
      field: "id",
      value: id
    });
  }

  const userId = Number(id); //make it a number
  const users = getUsers(); //get all users
  let user; //prepare to hold our user

  for (let i = 0; i < users.length; i++) { //loop through users
    const currentUser = users[i]; //grab this user

    if (currentUser.userId === userId) { //if it matches
      user = currentUser; //save it
      break; //stop looking
    }
  }

  if (!user) { //if we didn't find them
    throw new AppError(404, "USER_NOT_FOUND", "User was not found.", { //send error
      userId: userId
    });
  }

  return successResponse(res, 200, user); //send back the user
}

function createUser(req, res) { //add a new user
  const firstName = req.body.firstName; //get first name
  const lastName = req.body.lastName; //get last name
  const userRole = req.body.userRole; //get their role

  if (!firstName) { //if missing first name
    throw new AppError(400, "VALIDATION_ERROR", "Missing required field: firstName", { //send error
      field: "firstName"
    });
  }

  if (typeof firstName !== 'string' || firstName.trim().length === 0) { //if it's not a valid name
    throw new AppError(400, "VALIDATION_ERROR", "First name must be a non-empty string.", { field: "firstName" }); //send error
  }


  if (!lastName) { //if missing last name
    throw new AppError(400, "VALIDATION_ERROR", "Missing required field: lastName", { //send error
      field: "lastName"
    });
  }

  if (typeof lastName !== 'string' || lastName.trim().length === 0) { //if it's not a valid name
    throw new AppError(400, "VALIDATION_ERROR", "Last name must be a non-empty string.", { field: "lastName" }); //send error
  }

  if (!userRole) { //if missing role
    throw new AppError(400, "VALIDATION_ERROR", "Missing required field: userRole", { //send error
      field: "userRole"
    });
  }

  if (typeof userRole !== 'string' || userRole.trim().length === 0) { //if bad role
    throw new AppError(400, "VALIDATION_ERROR", "User role must be a non-empty string.", { field: "userRole" }); //send error
  }

  if (!allowedRoles.includes(userRole)) { //if role is not one we allow
    throw new AppError(400, "VALIDATION_ERROR", "Invalid or missing userRole. Allowed roles: admin, user, manager.", { field: "userRole" }); //send error
  }

  const now = new Date().toISOString(); //get current time

  const newUser = { //build the new user
    userId: getNextUserId(), //get next id
    firstName: firstName, //their first name
    lastName: lastName, //their last name
    createDate: now, //when they were created
    updateDate: now, //when they were last updated
    userRole: userRole //their role
  };

  const users = getUsers(); //get the list
  users.push(newUser); //add them to the list

  return successResponse(res, 201, { //send back success
    userId: newUser.userId //tell them the new id
  });
}

function updateUser(req, res) { //change a user's details
  const id = req.params.id; //get id from url

  if (!isValidNumericId(id)) { //if bad id
    throw new AppError(400, "VALIDATION_ERROR", "Invalid user id.", { //send error
      field: "id",
      value: id
    });
  }

  const firstName = req.body.firstName; //get first name
  const lastName = req.body.lastName; //get last name
  const userRole = req.body.userRole; //get role

  if (!firstName) { //if missing first name
    throw new AppError(400, "VALIDATION_ERROR", "Missing required field: firstName", { //send error
      field: "firstName"
    });
  }

  if (!lastName) { //if missing last name
    throw new AppError(400, "VALIDATION_ERROR", "Missing required field: lastName", { //send error
      field: "lastName"
    });
  }

  if (!userRole) { //if missing role
    throw new AppError(400, "VALIDATION_ERROR", "Missing required field: userRole", { //send error
      field: "userRole"
    });
  }

  if (typeof firstName !== 'string' || firstName.trim().length === 0) { //if it's not a valid name
    throw new AppError(400, "VALIDATION_ERROR", "First name must be a non-empty string.", { field: "firstName" }); //send error
  }

  if (typeof lastName !== 'string' || lastName.trim().length === 0) { //if it's not a valid name
    throw new AppError(400, "VALIDATION_ERROR", "Last name must be a non-empty string.", { field: "lastName" }); //send error
  }

  if (typeof userRole !== 'string' || userRole.trim().length === 0) { //if bad role
    throw new AppError(400, "VALIDATION_ERROR", "User role must be a non-empty string.", { field: "userRole" }); //send error
  }

  if (!allowedRoles.includes(userRole)) { //if role is not one we allow
    throw new AppError(400, "VALIDATION_ERROR", "Invalid or missing userRole. Allowed roles: admin, user, manager.", { field: "userRole" }); //send error
  }

  const userId = Number(id); //make it a number
  const users = getUsers(); //get all users
  let userIndex = -1; //prepare to find where they are in the list

  for (let i = 0; i < users.length; i++) { //loop through list
    const currentUser = users[i]; //grab this user

    if (currentUser.userId === userId) { //if it's the one we want
      userIndex = i; //save where they are
      break; //stop looking
    }
  }

  if (userIndex === -1) { //if we didn't find them
    throw new AppError(404, "USER_NOT_FOUND", "User was not found.", { //send error
      userId: userId
    });
  }

  const existingUser = users[userIndex]; //get their current info
  const updatedUser = {}; //prepare to hold new info

  for (const key in existingUser) { //copy old info over
    if (Object.prototype.hasOwnProperty.call(existingUser, key)) { //make sure it's a real property
      updatedUser[key] = existingUser[key]; //copy it
    }
  }

  updatedUser.firstName = firstName; //update first name
  updatedUser.lastName = lastName; //update last name
  updatedUser.userRole = userRole; //update role
  updatedUser.updateDate = new Date().toISOString(); //update the timestamp

  users[userIndex] = updatedUser; //save back to the list

  return successResponse(res, 200, { //send back success
    userId: userId //confirm who we updated
  });
}

function deleteUser(req, res) { //remove a user
  const id = req.params.id; //get id from url

  if (!isValidNumericId(id)) { //if bad id
    throw new AppError(400, "VALIDATION_ERROR", "Invalid user id.", { //send error
      field: "id",
      value: id
    });
  }

  const userId = Number(id); //make it a number
  const users = getUsers(); //get all users
  let userExists = false; //assume they don't exist yet

  for (let i = 0; i < users.length; i++) { //look for them
    const currentUser = users[i]; //grab this user

    if (currentUser.userId === userId) { //if found
      userExists = true; //remember we found them
      break; //stop looking
    }
  }

  if (!userExists) { //if we didn't find them
    throw new AppError(404, "USER_NOT_FOUND", "User was not found.", { //send error
      userId: userId
    });
  }

  const filteredUsers = []; //prepare a new list without them

  for (let i = 0; i < users.length; i++) { //loop through list
    const currentUser = users[i]; //grab this user

    if (currentUser.userId !== userId) { //if it's not the one we want to delete
      filteredUsers.push(currentUser); //keep them
    }
  }

  setUsers(filteredUsers); //save the new list

  return successResponse(res, 200, { //send back success
    userId: userId //confirm who we deleted
  });
}

module.exports = { //share our user functions
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
