import express from "express";
import { protect } from "../middlewares/auth.js";
import { authorize } from '../middlewares/roles.js';
import { createJD, createJDWithAI, getAllJds, getAllCandidates, addresumeToJD, getAllCandidatesAppliedToJD, getAssignedJDsByRMG, getAssignedOffersByRMG, getFilteredCandidatesForJD } from "../controllers/jdController.js";
import { filterResumes } from "../controllers/aiResumeFilterController.js";
import { protectCandidate } from "../middlewares/authCandidate.js";

const router = express.Router();

// Manual JD creation
router.post("/:offerId", protect, authorize("HR"), createJD);

// AI-powered JD creation
router.post("/:offerId/ai", protect, authorize("HR"), createJDWithAI);
router.post("/:jdId/filter-resumes", protect, authorize("HR"), filterResumes);
router.get("/all-jd", protectCandidate, getAllJds);
router.get("/all-jd-admin", protect, authorize("Admin"), getAllJds);
router.get("/all-jd-hr", protect, authorize("HR"), getAllJds);
router.get("/all-candidates", protect, authorize("HR", "Admin"), getAllCandidates);
router.post("/:jdId/add-resume", protect, authorize("HR"), addresumeToJD);
// router.get("/:jdId/candidates", protect, authorize("HR"), getAllCandidatesAppliedToJD); // Disabled HR-only route for candidates
router.get("/:jdId/candidates", protectCandidate, getAllCandidatesAppliedToJD); // Enable for candidate JWT
router.get("/:jdId/candidatess", protect, authorize("HR"), getAllCandidatesAppliedToJD); // Enable for candidate JWT
// Route for filtered candidates only
router.get("/:jdId/filtered-candidates", protect, authorize("HR"), getFilteredCandidatesForJD);
router.get("/assigned-jds/hr", protect, authorize("HR"), getAssignedJDsByRMG);
router.get("/assigned-offers/hr", protect, authorize("HR"), getAssignedOffersByRMG);

export default router;