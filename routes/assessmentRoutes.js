import express from 'express';
import { generateTest, finalizeTest, getFinalizedTest } from '../controllers/assessmentController.js';

const router = express.Router();

// Get finalized test for candidate and JD
router.get('/finalized-test', getFinalizedTest);

// Generate test questions
router.post('/generate-test', generateTest);

// Finalize and save test
router.post('/finalize-test', finalizeTest);

export default router;
