// routes/authRoutes.js
import express from 'express';
import { register, login, getMe,} from '../controllers/authController.js';

import { protectCandidate } from '../middlewares/authCandidate.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protectCandidate, getMe);


export default router;
