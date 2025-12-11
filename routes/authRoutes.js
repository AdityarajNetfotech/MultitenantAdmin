// routes/authRoutes.js
import express from 'express';
import { register, login, getCandidateMe, getUserMe, } from '../controllers/authController.js';

import { protectCandidate } from '../middlewares/authCandidate.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roles.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protectCandidate, getCandidateMe);
router.get('/meAll', protect, authorize("RMG", "HR", "Admin"), getUserMe);


export default router;
