// controllers/authController.js
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import errorResponse from '../utils/errorResponse.js';
import User from '../models/User.js';
import { config } from '../config/index.js';
import Candidate from '../models/Candidate.js';

// @desc   Register user
// @route  POST /api/auth/register
// @access Public (you may change)
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return next(new errorResponse('Please provide name, email and password', 400));

  const existing = await User.findOne({ email });
  if (existing) return next(new errorResponse('Email already exists', 400));

  const user = await User.create({ name, email, password, role });
  sendTokenResponse(user, 201, res);
});

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new errorResponse('Please provide email and password', 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new errorResponse('Invalid credentials', 401));

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return next(new errorResponse('Invalid credentials', 401));

  sendTokenResponse(user, 200, res);
});

// @desc   Get current user
// @route  GET /api/auth/me
// @access Private
export const getCandidateMe = asyncHandler(async (req, res) => {
  const user = await Candidate.findById(req.candidate.id);
  res.status(200).json({ success: true, data: user });
});

export const getUserMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// helper 
const sendTokenResponse = (user, statusCode, res) => {
  const payload = { id: user._id, role: user.role };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpire });

  // option: set httpOnly cookie
  const options = {
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token });
};
