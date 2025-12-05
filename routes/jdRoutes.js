import express from "express";
import {protect} from "../middlewares/auth.js";
import { authorize } from '../middlewares/roles.js';
import { createJD, createJDWithAI, getAllJds, getAllCandidates, addresumeToJD, getAllCandidatesAppliedToJD, getAssignedJDsByRMG, getAssignedOffersByRMG } from "../controllers/jdController.js";
import { filterResumes } from "../controllers/aiResumeFilterController.js";
import { protectCandidate } from "../middlewares/authCandidate.js";

const router = express.Router();

// Manual JD creation
router.post("/:offerId", protect, authorize("HR"), createJD);

// AI-powered JD creation
router.post("/:offerId/ai", protect, authorize("HR"), createJDWithAI);
router.post("/:jdId/filter-resumes", protect, authorize("HR"), filterResumes);
router.get("/all-jd", protectCandidate, getAllJds);
router.get("/all-candidates", protect, authorize("HR"), getAllCandidates);
router.post("/:jdId/add-resume", protect, authorize("HR"), addresumeToJD);
router.get("/:jdId/candidates", protect, authorize("HR"), getAllCandidatesAppliedToJD);
router.get("/assigned-jds/hr", protect, authorize("HR"), getAssignedJDsByRMG);
router.get("/assigned-offers/hr", protect, authorize("HR"), getAssignedOffersByRMG);

export default router;