// middlewares/auth.js
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import errorResponse from '../utils/errorResponse.js';
import User from '../models/User.js';
import { config } from '../config/index.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // get token from header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) return next(new errorResponse('Not authorized, token missing', 401));

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return next(new errorResponse('No user found for this token', 401));
    next();
  } catch (err) {
    return next(new errorResponse('Token invalid', 401));
  }
});
