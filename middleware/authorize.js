const { errorResponse } = require("../utils/responseHelper");

function authorize(allowedRoles) {
  return function (req, res, next) {
    const currentRole = req.header("x-user-role");

    if (!currentRole) {
      return errorResponse(
        res,
        403,
        "FORBIDDEN",
        "Missing user role. Please send x-user-role header.",
        {
          requiredHeader: "x-user-role",
          allowedRoles: allowedRoles
        }
      );
    }

    if (!allowedRoles.includes(currentRole)) {
      return errorResponse(
        res,
        403,
        "FORBIDDEN",
        "You do not have permission to perform this action.",
        {
          currentRole: currentRole,
          allowedRoles: allowedRoles
        }
      );
    }

    next();
  };
}

module.exports = authorize;