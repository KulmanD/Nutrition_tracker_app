const { getUsers } = require("../models/usersData"); //grab users
const { getSettings } = require("../models/settingsModel"); //grab settings
const { successResponse } = require("../utils/responseHelper"); //grab success helper
const AppError = require("../utils/AppError"); //grab custom error

const demoAccounts = [ //mock login accounts
  {
    email: "denis@example.com", //login email
    password: "password123", //login password
    userId: 1 //linked user id
  },
  {
    email: "yael@example.com", //login email
    password: "password123", //login password
    userId: 2 //linked user id
  }
];

function isValidEmail(email) { //check if email looks valid
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); //true if email format is ok
}

function findDemoAccount(email, password) { //find matching mock account
  return demoAccounts.find((account) => account.email === email && account.password === password); //match email and password
}

function buildUserResponse(user, settings) { //build user data for frontend
  return { //send only the fields frontend needs
    userId: user.userId, //user id
    firstName: user.firstName, //first name
    lastName: user.lastName, //last name
    fullName: `${user.firstName} ${user.lastName}`, //full name
    email: settings.email, //profile email
    userRole: user.userRole //user role
  };
}

function login(req, res) { //login mock user
  const email = req.body.email; //get email
  const password = req.body.password; //get password

  if (!email || !isValidEmail(email)) { //if email is missing or bad
    throw new AppError(400, "VALIDATION_ERROR", "Valid email is required.", { //send error
      field: "email" //bad field
    });
  }

  if (!password || password.length < 6) { //if password is too short
    throw new AppError(400, "VALIDATION_ERROR", "Password must be at least 6 characters.", { //send error
      field: "password" //bad field
    });
  }

  const account = findDemoAccount(email, password); //look for mock account

  if (!account) { //if no matching login
    throw new AppError(401, "LOGIN_FAILED", "Invalid email or password.", {}); //send login error
  }

  const user = getUsers().find((currentUser) => currentUser.userId === account.userId); //find linked user

  if (!user) { //if linked user is missing
    throw new AppError(404, "USER_NOT_FOUND", "Login user was not found.", { //send error
      userId: account.userId //missing user id
    });
  }

  const settings = getSettings(user.userId); //grab user settings

  return successResponse(res, 200, { //send login success
    token: "mock-assignment-token", //fake token
    user: buildUserResponse(user, settings) //user info
  });
}

function logout(req, res) { //logout mock user
  return successResponse(res, 200, { //send logout success
    message: "Logged out successfully." //success message
  });
}

module.exports = { //share auth functions
  login,
  logout
};
