import JD from "../models/jobDescription.js";
import Candidate from "../models/candidate.js";
import asyncHandler from "../utils/asyncHandler.js";
import { filterResumesWithAI } from "../utils/geminiAI.js";

// POST /api/jd/:jdId/filter-resumes
// Utility to ensure ObjectId
const cleanId = (val, jd) => {
  // AI sometimes returns email instead of ObjectId
  const byEmail = jd.appliedCandidates.find(c => c.email === val);
  if (byEmail) return byEmail.candidate._id.toString();

  return val; 
};


export const filterResumes = asyncHandler(async (req, res) => {
  const { jdId } = req.params;

  const jd = await JD.findById(jdId).populate("appliedCandidates.candidate");
  if (!jd) return res.status(404).json({ success: false, message: "JD not found" });

  const candidatesData = jd.appliedCandidates.map((c) => ({
    id: c.candidate?._id.toString(), // FIXED
    name: c.name,
    email: c.email,
    phone: c.phone,
    resume: c.resume,
    reallocate: c.reallocate || false,
  }));

  const aiResult = await filterResumesWithAI(jd, candidatesData);

  if (!aiResult.success) {
    return res.status(500).json({ success: false, error: aiResult.error });
  }

  // FIX: Convert AI id to ObjectId reliably
  jd.filteredCandidates = aiResult.filtered.map((f) => ({
    candidate: cleanId(f.id, jd),
    aiScore: f.score,
    aiExplanation: f.explanation,
  }));

  jd.unfilteredCandidates = aiResult.unfiltered.map((f) => ({
    candidate: cleanId(f.id, jd),
    aiScore: f.score,
    aiExplanation: f.explanation,
  }));

  jd.appliedCandidates = jd.appliedCandidates.map((c) => {
    const id = c.candidate._id.toString();

    const filtered = aiResult.filtered.find((f) => cleanId(f.id, jd) === id);
    const unfiltered = aiResult.unfiltered.find((u) => cleanId(u.id, jd) === id);

    if (filtered) {
      return {
        ...c.toObject(),
        status: "filtered",
        aiScore: filtered.score,
        aiExplanation: filtered.explanation,
      };
    }

    if (unfiltered) {
      return {
        ...c.toObject(),
        status: "unfiltered",
        aiScore: unfiltered.score,
        aiExplanation: unfiltered.explanation,
      };
    }

    return c;
  });

  await jd.save();

  res.json({
    success: true,
    message: "AI resume filtering done",
    filtered: aiResult.filtered,
    unfiltered: aiResult.unfiltered,
  });
});








// import JD from "../models/jobDescription.js";
// import Candidate from "../models/candidate.js";
// import asyncHandler from "../utils/asyncHandler.js";
// import { filterResumesWithAI } from "../utils/geminiAI.js";

// // POST /api/jd/:jdId/filter-resumes
// export const filterResumes = asyncHandler(async (req, res, next) => {
//   const { jdId } = req.params;
//   const jd = await JD.findById(jdId).populate("appliedCandidates.candidate");
//   if (!jd) return res.status(404).json({ success: false, message: "JD not found" });
//   if (!jd.appliedCandidates || jd.appliedCandidates.length === 0) {
//     return res.status(400).json({ success: false, message: "No candidates to filter" });
//   }

//   // Prepare data for AI
//   const candidatesData = jd.appliedCandidates.map(c => ({
//     id: c.candidate._id,
//     name: c.name,
//     email: c.email,
//     phone: c.phone,
//     resume: c.resume,
//     reallocate: c.reallocate,
//   }));

//   // Call AI utility to filter resumes
//   const aiResult = await filterResumesWithAI(jd, candidatesData);
//   if (!aiResult.success) {
//     return res.status(500).json({ success: false, message: aiResult.error });
//   }

//   // Update JD with filtered/unfiltered candidates and explanations
//   jd.filteredCandidates = aiResult.filtered.map(f => ({
//     candidate: f.id,
//     aiScore: f.score,
//     aiExplanation: f.explanation,
//   }));
//   jd.unfilteredCandidates = aiResult.unfiltered.map(f => ({
//     candidate: f.id,
//     aiScore: f.score,
//     aiExplanation: f.explanation,
//   }));
//   // Update appliedCandidates status and explanations
//   jd.appliedCandidates = jd.appliedCandidates.map(c => {
//     const filtered = aiResult.filtered.find(f => f.id.toString() === c.candidate._id.toString());
//     const unfiltered = aiResult.unfiltered.find(f => f.id.toString() === c.candidate._id.toString());
//     if (filtered) {
//       return { ...c.toObject(), status: "filtered", aiScore: filtered.score, aiExplanation: filtered.explanation };
//     } else if (unfiltered) {
//       return { ...c.toObject(), status: "unfiltered", aiScore: unfiltered.score, aiExplanation: unfiltered.explanation };
//     }
//     return c;
//   });
//   await jd.save();
//   res.json({ success: true, filtered: aiResult.filtered, unfiltered: aiResult.unfiltered });
// });
