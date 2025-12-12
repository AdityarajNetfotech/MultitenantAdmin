// middlewares/authCandidate.js
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import errorResponse from "../utils/errorResponse.js";
import Candidate from "../models/candidate.js";
import { config } from "../config/index.js";

export const protectCandidate = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new errorResponse("Candidate token missing", 401));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    req.candidate = await Candidate.findById(decoded.id).select("-password");

    if (!req.candidate) {
      return next(new errorResponse("Candidate not found", 401));
    }

    next();
  } catch (err) {
    return next(new errorResponse("Invalid candidate token", 401));
  }
});
