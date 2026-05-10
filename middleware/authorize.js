const { errorResponse } = require("../utils/responseHelper"); //grab our error helper

function authorize(allowedRoles) { //function to check if user can do this
  return function (req, res, next) { //return the actual middleware
    const currentRole = req.header("x-user-role"); //get their role from headers

    if (!currentRole) { //if they didn't send a role
      return errorResponse( //send back an error
        res,
        403,
        "FORBIDDEN", //tell them it's forbidden
        "Missing user role. Please send x-user-role header.",
        {
          requiredHeader: "x-user-role", //what they need to send
          allowedRoles: allowedRoles //what roles are allowed
        }
      );
    }

    let roleIsAllowed = false;

    for (let i = 0; i < allowedRoles.length; i++) { //loop through allowed roles
      const allowedRole = allowedRoles[i]; //grab this role

      if (allowedRole === currentRole) { //if it matches
        roleIsAllowed = true; //they are allowed!
        break; //stop checking
      }
    }

    if (!roleIsAllowed) { //if they still aren't allowed
      return errorResponse( //send back an error
        res,
        403,
        "FORBIDDEN", //tell them it's forbidden
        "You do not have permission to perform this action.",
        {
          currentRole: currentRole, //what they sent
          allowedRoles: allowedRoles //what they need
        }
      );
    }

    next(); //they are allowed, move on
  };
}

module.exports = authorize; //share our auth checker
