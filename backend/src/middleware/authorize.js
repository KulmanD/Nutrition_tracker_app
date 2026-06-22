const AppError = require("../utils/AppError"); //grab our custom error

function roleIsAllowed(currentRole, allowedRoles) { //check if role is in the list
  for (let i = 0; i < allowedRoles.length; i++) { //loop through allowed roles
    const allowedRole = allowedRoles[i]; //grab this role

    if (allowedRole === currentRole) { //if it matches
      return true; //they are allowed
    }
  }

  return false; //not found
}

function getCurrentRole(req) { //read role from request
  return req.header("x-user-role"); //role header
}

function getCurrentUserId(req) { //read user id from request
  const currentUserId = req.header("x-user-id"); //user id header

  if (!currentUserId) { //if missing
    return null;
  }

  const parsedUserId = Number(currentUserId); //make it a number

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) { //must be positive whole number
    return null;
  }

  return parsedUserId; //good user id
}

function forbidden(message, details) { //build a forbidden error
  return new AppError(403, "FORBIDDEN", message, details);
}

function authorize(allowedRoles) { //function to check if user can do this
  return function (req, res, next) { //return the actual middleware
    const currentRole = getCurrentRole(req); //get their role from headers

    if (!currentRole) { //if they didn't send a role
      return next(forbidden("Missing user role. Please send x-user-role header.", {
        requiredHeader: "x-user-role", //what they need to send
        allowedRoles: allowedRoles //what roles are allowed
      }));
    }

    req.currentRole = currentRole; //save it for later middleware/controllers
    req.currentUserId = getCurrentUserId(req); //save user id if they sent it

    if (!roleIsAllowed(currentRole, allowedRoles)) { //if they still aren't allowed
      return next(forbidden("You do not have permission to perform this action.", {
        currentRole: currentRole, //what they sent
        allowedRoles: allowedRoles //what they need
      }));
    }

    next(); //they are allowed, move on
  };
}

function authorizeSelfOrRoles(allowedRoles, getOwnerId) { //allow admins/managers or user owning the record
  return function (req, res, next) {
    const currentRole = getCurrentRole(req); //get their role from headers

    if (!currentRole) { //if they didn't send a role
      return next(forbidden("Missing user role. Please send x-user-role header.", {
        requiredHeader: "x-user-role",
        allowedRoles: allowedRoles.concat(["user"])
      }));
    }

    req.currentRole = currentRole; //save it for later middleware/controllers
    req.currentUserId = getCurrentUserId(req); //save user id if they sent it

    if (roleIsAllowed(currentRole, allowedRoles)) { //admin/manager path
      return next();
    }

    if (currentRole !== "user") { //only regular user can use the self check
      return next(forbidden("You do not have permission to perform this action.", {
        currentRole: currentRole,
        allowedRoles: allowedRoles.concat(["user-own-record"])
      }));
    }

    if (!req.currentUserId) { //regular user must identify themselves
      return next(forbidden("Missing or invalid user id. Please send x-user-id header.", {
        requiredHeader: "x-user-id"
      }));
    }

    const ownerId = Number(getOwnerId(req)); //who owns the record

    if (!Number.isInteger(ownerId) || ownerId <= 0) { //let controller handle invalid route ids
      return next();
    }

    if (req.currentUserId !== ownerId) { //regular users can only touch themselves
      return next(forbidden("You do not have permission to modify another user's data.", {
        currentUserId: req.currentUserId,
        ownerId: ownerId
      }));
    }

    next(); //same user, let it through
  };
}

module.exports = { //share our auth checkers
  authorize,
  authorizeSelfOrRoles
};
