import express from "express";
import { registerCandidate, loginCandidate, applyJob, getAppliedJobs } from "../controllers/candidateController.js";
import { protect } from "../middlewares/auth.js";
import { protectCandidate } from "../middlewares/authCandidate.js";
import multer from "multer";

const router = express.Router();
const upload = multer();

router.post("/register", registerCandidate);
router.post("/login", loginCandidate);
router.post("/apply/:jdId", upload.single("resume"), applyJob);
router.get("/applied-jobs", protect, getAppliedJobs);

export default router;
