import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import User from '../models/User.js';
import generatePassword from '../utils/generatePassword.js';
import sendEmail from '../utils/sendEmail.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import JD from '../models/jdhard.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateJD = async (req, res) => {
  const {
    title,
    company,
    experience,
    skills,
    location,
    Qualification,
    employmentType,
    salaryRange,
  } = req.body;

  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const jdPrompt = `
Write a professional job description using the following:
- Job Title: ${title}
- Company: ${company}
- Required Experience: ${experience} years
- Skills: ${skills.join(", ")}
- Location: ${location}
- Qualification: ${Qualification}
- Employment Type: ${employmentType}
${salaryRange ? `- Salary Range: ${salaryRange}` : ""}

Include:
1. Company Overview
2. Job Summary
3. Required Skills
4. Preferred Skills
5. Perks & Benefits
6. How to Apply: Click here to apply → (http://localhost:5173/CandidateRegister)

Use markdown format. Do NOT include recruiter email.
`;

  const summaryPrompt = `
Summarize in 3–5 lines:
- Job Title: ${title}
- Experience: ${experience} years
- Skills: ${skills.join(", ")}

Do NOT include company name, location, or salary.
Only return the summary text.
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Generate Full JD
    const jdResult = await model.generateContent(jdPrompt);
    const fullJD = jdResult.response.text();

    // Generate Summary
    const summaryResult = await model.generateContent(summaryPrompt);
    const jobSummary = summaryResult.response.text().trim();

    const newJD = await JD.create({
      HR: req.user._id,
      title,
      company,
      experience,
      skills,
      location,
      Qualification,
      employmentType,
      salaryRange,
      fullJD,
      jobSummary,
    });

    res.status(201).json({
      message: "Job Description generated successfully.",
      jd: newJD,
    });
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({ message: "Gemini JD generation failed." });
  }
};

export const editJD = async (req, res) => {
  const { id } = req.params;

  const {
    title,
    company,
    experience,
    skills,
    location,
    Qualification,
    employmentType,
    salaryRange,
  } = req.body;

  try {
    const jd = await JD.findById(id);

    if (!jd) {
      return res.status(404).json({ message: "JD not found." });
    }

    // if (jd.recruiter.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ message: "Unauthorized to edit this JD." });
    // } 

    // AI prompt for rewriting JD
    const editPrompt = `
Rewrite the job description professionally based on the updated data.

Updated Details:
- Job Title: ${title}
- Company: ${company}
- Experience: ${experience} years
- Skills: ${skills.join(", ")}
- Location: ${location}
- Qualification: ${Qualification}
- Employment Type: ${employmentType}
${salaryRange ? `- Salary Range: ${salaryRange}` : ""}

Instructions:
- Rewrite the entire JD using the updated information.
- Improve formatting, clarity, and structure.
- Use Markdown formatting.
- Do not mention recruiter email.
- Include:
  1. Company Overview  
  2. Job Summary  
  3. Required Skills  
  4. Preferred Skills  
  5. Benefits  
  6. How to Apply (keep the same link)
`;

    const summaryPrompt = `
Summarize in 3–5 lines using ONLY:
- Job Title: ${title}
- Experience: ${experience} years
- Skills: ${skills.join(", ")}

No headings. No bullet points.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Generate updated JD
    const jdResult = await model.generateContent(editPrompt);
    const updatedJD = jdResult.response.text();

    // Generate updated summary
    const summaryResult = await model.generateContent(summaryPrompt);
    const updatedSummary = summaryResult.response.text().trim();

    // Update DB
    jd.title = title;
    jd.company = company;
    jd.experience = experience;
    jd.skills = skills;
    jd.location = location;
    jd.Qualification = Qualification;
    jd.employmentType = employmentType;
    jd.salaryRange = salaryRange;
    jd.fullJD = updatedJD;
    jd.jobSummary = updatedSummary;

    await jd.save();

    res.json({
      message: "JD updated successfully.",
      jd,
    });
  } catch (err) {
    console.error("Edit JD Error:", err);
    res.status(500).json({ message: "Failed to update JD." });
  }
};

export const deleteJD = asyncHandler(async (req, res, next) => {
  try {
    const jdId = req.params.id; 
    const jd = await JD.findByIdAndDelete(jdId);

    if (!jd) {
      return next(new ErrorResponse('JD not found', 404));
    }
    res.status(200).json({ success: true, message: 'JD deleted' });
  }
    catch (err) {
    return next(new ErrorResponse(err.message || 'Failed to delete JD', 500));
  }
});