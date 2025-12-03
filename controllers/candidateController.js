import Candidate from "../models/candidate.js";
import sendEmail from '../utils/sendEmail.js';
import { bulkJDInviteTemplate } from '../utils/emailTemplates/bulkJDInviteTemplate.js';
/**
 * Send bulk JD invite emails to selected candidates for a new opening
 * Params: jdId (JobDescription id)
 * Body: { candidateIds: [array of candidate _id] }
 */
import JD from "../models/jobDescription.js";
import asyncHandler from "../utils/asyncHandler.js";
import errorResponse from "../utils/errorResponse.js";
import cloudinary, { uploadBuffer } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

// Register candidate
export const registerCandidate = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || !phone) return next(new errorResponse("All fields required", 400));
  const existing = await Candidate.findOne({ email });
  if (existing) return next(new errorResponse("Email already exists", 400));
  const candidate = await Candidate.create({ name, email, password, phone, resume: "" });
  sendTokenResponse(candidate, 201, res);
});

// Login candidate
export const loginCandidate = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new errorResponse("Email and password required", 400));
  const candidate = await Candidate.findOne({ email }).select("+password");
  if (!candidate) return next(new errorResponse("Invalid credentials", 401));
  const isMatch = await candidate.matchPassword(password);
  if (!isMatch) return next(new errorResponse("Invalid credentials", 401));
  sendTokenResponse(candidate, 200, res);
});

// Apply for a job (JD)
// export const applyJob = asyncHandler(async (req, res, next) => {
//   const { jdId } = req.params;
//   const { name, email, phone, reallocate } = req.body;
//   if (!req.files || !req.files.resume) return next(new errorResponse("Resume file required", 400));
//   const resumeFile = req.files.resume;
//   const resumeUrl = await cloudinary.uploader.upload(resumeFile.tempFilePath, { folder: 'candidates' });
//   const candidate = await Candidate.findOne({ email });
//   if (!candidate) return next(new errorResponse("Candidate not found", 404));
//   const jd = await JD.findById(jdId);
//   if (!jd) return next(new errorResponse("JD not found", 404));
//   // Prevent duplicate application
//   if (jd.appliedCandidates.some(c => c.candidate.toString() === candidate._id.toString())) {
//     return next(new errorResponse("Already applied to this job", 400));
//   }
//   jd.appliedCandidates.push({
//     candidate: candidate._id,
//     resume: resumeUrl,
//     name,
//     email,
//     phone,
//     reallocate: reallocate === "yes" || reallocate === true,
//     status: "pending",
//   });
//   await jd.save();
//   res.status(201).json({ success: true, message: "Applied successfully" });
// });


export const applyJob = asyncHandler(async (req, res, next) => {
  const { jdId } = req.params;
  const { name, email, phone, reallocate } = req.body;

  if (!req.file) {
    return next(new errorResponse("Resume file required", 400));
  }

  const uploadResult = await uploadBuffer(req.file.buffer, "candidates");
  const resumeUrl = uploadResult.secure_url + `?v=${Date.now()}`;

  const candidate = await Candidate.findOne({ email });
  if (!candidate) return next(new errorResponse("Candidate not found", 404));

  // 🔥 FIX — ALWAYS UPDATE CANDIDATE'S RESUME
  candidate.resume = resumeUrl;
  await candidate.save();

  const jd = await JD.findById(jdId);
  if (!jd) return next(new errorResponse("JD not found", 404));

  if (jd.appliedCandidates.some(c => c.candidate.toString() === candidate._id.toString())) {
    return next(new errorResponse("Already applied to this job", 400));
  }

  jd.appliedCandidates.push({
    candidate: candidate._id,
    resume: resumeUrl,
    name,
    email,
    phone,
    reallocate: reallocate === "yes" || reallocate === true,
    status: "pending",
  });

  await jd.save();

  res.status(201).json({
    success: true,
    message: "Applied successfully",
  });
});


// Get all jobs applied by candidate
export const getAppliedJobs = asyncHandler(async (req, res, next) => {
  const candidateId = req.user._id;
  const jds = await JD.find({ "appliedCandidates.candidate": candidateId });
  res.json({ success: true, jobs: jds });
});

// Helper: send JWT
function sendTokenResponse(candidate, statusCode, res) {
  const payload = { id: candidate._id, role: "Candidate" };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpire });
  res.status(statusCode).json({ success: true, token });
}

export const getAllCandidates = asyncHandler(async (req, res, next) => {
  const candidates = await Candidate.find();
  res.json({ success: true, candidates });
});

export const sendBulkJDInvite = asyncHandler(async (req, res, next) => {
  const { jdId } = req.params;
  const { candidateIds } = req.body;
  if (!jdId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return next(new errorResponse('JD id and candidateIds are required', 400));
  }

  // Fetch JD details
  const jd = await JD.findById(jdId);
  if (!jd) {
    return next(new errorResponse('Job Description not found', 404));
  }

  // Fetch candidates
  const candidates = await Candidate.find({ _id: { $in: candidateIds } });
  if (!candidates.length) {
    return next(new errorResponse('No valid candidates found', 404));
  }

  // Build apply URL (customize as needed)
  const applyUrl = `${process.env.FRONTEND_URL || 'https://your-portal.example.com'}/apply/${jdId}`;

  // Send emails
  let sentCount = 0;
  for (const candidate of candidates) {
    const html = bulkJDInviteTemplate(
      candidate.name,
      jd.jobSummary || jd.title || jd.jobTitle || 'Job Opening',
      jd.companyName || 'Our Company',
      applyUrl
    );
    try {
      await sendEmail({
        to: candidate.email,
        subject: `New Opening: ${jd.jobSummary || jd.title || jd.jobTitle}`,
        html
      });
      sentCount++;
    } catch (e) {
      // Optionally log or collect failed emails
    }
  }

  res.status(200).json({
    success: true,
    message: `Bulk JD invites sent to ${sentCount} candidates.`,
    jdId,
    sentCount
  });
});

