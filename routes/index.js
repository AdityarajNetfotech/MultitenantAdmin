// routes/index.js
import express from 'express';
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import recruiterRoutes from './Recruiter.js';
import ticketRoutes from './ticketRoutes.js'
import offerRoutes from "./offerRoutes.js"
import jdRoutes from "./jdRoutes.js"
import publicJDRoutes from "./publicJDRoutes.js"
import candidateRoutes from './candidateRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import assesmentRoutes from './assessmentRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/recruiter', recruiterRoutes);
router.use('/tickets', ticketRoutes);
router.use('/offer', offerRoutes);
router.use('/jd', jdRoutes);
router.use('/', publicJDRoutes);
router.use('/candidate', candidateRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/finalise',assesmentRoutes);

// add other routes: /users, /jobs, etc.

export default router;
