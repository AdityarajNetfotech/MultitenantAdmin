// middlewares/candidateRole.js
import ErrorResponse from "../utils/errorResponse.js";

export const candidateOnly = (req, res, next) => {
  if (!req.candidate) {
    return next(new ErrorResponse("Not authorized as candidate", 401));
  }
  next();
};
