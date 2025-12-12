import express from 'express';
import {generateJD,editJD,deleteJD } from '../controllers/Recruiter.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

        router.post('/generate-jd', protect, generateJD);
        router.put('/edit-jd/:id', protect, editJD);
        router.delete('/delete-jd/:id', protect, deleteJD);
export default router;