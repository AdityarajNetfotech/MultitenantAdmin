// controllers/authController.js
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import errorResponse from '../utils/errorResponse.js';
import User from '../models/User.js';
import { config } from '../config/index.js';
import Candidate from '../models/Candidate.js';
import axios from "axios";
import Company from "../models/company.js";


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

  const userObj = user.toObject();
  delete userObj.password;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ 
      success: true,
      user: userObj, 
      token 
    });
};

// @desc    Fetch company from external DB and save to local DB
// @route   POST /api/auth/sync-company
// @access  Private (SuperAdmin / Admin)
export const syncCompanyFromExternalDB = asyncHandler(async (req, res, next) => {
  const { companyId } = req.body;

  if (!companyId) {
    return next(new errorResponse("Company ID is required", 400));
  }

  try {
    // 🔗 External backend URL
    const EXTERNAL_API = `http://localhost:5000/api/superadmin/companies/${companyId}`;

    // 🌐 Fetch company details from other DB
    const response = await axios.get(EXTERNAL_API);

    if (!response.data || !response.data.data) {
      return next(new errorResponse("Company not found in external database", 404));
    }

    const companyData = response.data.data;

    if (!companyData) {
    return next(new errorResponse("Invalid company data received", 400));
  }


    // 💾 Save / Update company in your DB
  const savedCompany = await Company.findOneAndUpdate(
    { externalCompanyId: companyData._id }, // unique identifier
    {
      externalCompanyId: companyData._id,
      companyName: companyData.companyName,
      email: companyData.email,
      companyType: companyData.companyType,
      gstNumber: companyData.gstNumber,
      typeOfStaffing: companyData.typeOfStaffing,
      panNumber: companyData.panNumber,
      phoneNo: companyData.phoneNo,
      numberOfEmployees: companyData.numberOfEmployees,
      address1: companyData.address1,
      address2: companyData.address2,
      city: companyData.city,
      state: companyData.state,
      logo: companyData.logo,
    },
    { new: true, upsert: true }
  );

    res.status(200).json({
      success: true,
      message: "Company fetched and saved successfully",
      data: savedCompany,
    });

  } catch (error) {
    console.error(error.response?.data || error.message);
    return next(
      new errorResponse(
        error.response?.data?.message || "Failed to fetch company data",
        error.response?.status || 500
      )
    );
  }
});

// export const getCompanyMe = asyncHandler(async (req, res) => {
//   const company = await Company.findById(companyId); 
//   if (!company) {
//     return res.status(404).json({ success: false, message: "Company not found" });
//   }
//   res.status(200).json({ success: true, data: company });
// });
// @desc    Get company by ID (for sync)

export const getAllCompanies = asyncHandler(async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json({ success: true, count: companies.length, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});