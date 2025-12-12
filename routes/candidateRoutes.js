import express from "express";
import { registerCandidate, loginCandidate, applyJob, getAppliedJobs, getCandidateJdCounts, showlatestFiveJdsForCandidate, getAppliedjd, sendBulkJDInvite} from "../controllers/candidateController.js";
// import { registerCandidate, loginCandidate, applyJob, getAppliedJobs} from "../controllers/candidateController.js";
import { protect } from "../middlewares/auth.js";
import { protectCandidate } from "../middlewares/authCandidate.js";
import multer from "multer";
import { authorize } from "../middlewares/roles.js";

const router = express.Router();
const upload = multer();

router.post("/register", registerCandidate);
router.post("/login", loginCandidate);
router.post("/apply/:jdId", upload.single("resume"), applyJob);
router.get("/applied-jobs", protectCandidate, getAppliedJobs);
router.get("/jd-counts", protectCandidate, getCandidateJdCounts);
router.get("/latest-five-jds", protectCandidate, showlatestFiveJdsForCandidate);
router.get("/applied-jds", protectCandidate, getAppliedjd);
router.post("/bulk-invite/:jdId", protect, authorize("HR"), sendBulkJDInvite);


export default router;
