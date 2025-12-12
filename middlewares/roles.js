// middlewares/roles.js
import ErrorResponse from '../utils/errorResponse.js';

// usage: authorize('Admin', 'HR')
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ErrorResponse('Not authorized', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ErrorResponse('Forbidden: insufficient role', 403));
    }
    next();
  };
};  
