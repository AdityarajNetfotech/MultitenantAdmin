import express from "express";
import {protect} from "../middlewares/auth.js";
import { authorize } from '../middlewares/roles.js';
import { createOffer, getAllHr, getRmgOffersWithJDs, getAllOffers, assignOfferToHr } from "../controllers/offerController.js";

const router = express.Router();

router.post("/", protect, authorize("RMG"), createOffer);
router.get("/hr", protect, authorize("RMG"), getAllHr);
router.get("/overview", protect, authorize("RMG"), getRmgOffersWithJDs);
router.get("/all-offers", protect, authorize("RMG"), getAllOffers);
router.post("/assign", protect, authorize("RMG"), assignOfferToHr);

export default router;