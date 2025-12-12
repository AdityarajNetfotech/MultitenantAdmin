import express from "express";
import {protect} from "../middlewares/auth.js";
import {authorize} from "../middlewares/roles.js";
import {gettotalOffers, getToatalTicketsRaisedByRMG, getTotalRecruitersAndTotalOfferMonthWise, getCountOfTotalHRandTicketsMonthWise, getCountOfActiveHRandAssignedHRMonthWise, getCurrentOffers, getTotalCandidateMonthWise, getRecentJobTittleswithnumberofvacancies,getJdStatusPercentage, getallrecruitersandhisclosedpositions} from "../controllers/dashboardController.js";
import { getTotalFiltredandUnFilteredCandidatesFromAllJD } from "../controllers/dashboardController.js";

const router = express.Router();
router.get("/total-offers", protect, authorize("RMG", "HR"), gettotalOffers);
router.get("/total-tickets-rmg", protect, authorize("RMG"), getToatalTicketsRaisedByRMG);
router.get("/jobs-recruiters-month-wise", protect, authorize("RMG", "HR"), getTotalRecruitersAndTotalOfferMonthWise);
router.get("/count-hr-tickets-month-wise", protect, authorize("RMG", "HR"), getCountOfTotalHRandTicketsMonthWise);
router.get("/count-active-hr-assigned-hr-month-wise", protect, authorize("RMG", "HR"), getCountOfActiveHRandAssignedHRMonthWise);
router.get("/current-offers", protect, authorize("RMG", "HR"), getCurrentOffers);
router.get("/total-candidates-month-wise", protect, authorize("RMG", "HR"), getTotalCandidateMonthWise);
router.get("/recent-jobs", protect, authorize("RMG", "HR"), getRecentJobTittleswithnumberofvacancies);
router.get("/jd-status-percentage", protect, authorize("RMG", "HR"), getJdStatusPercentage);
router.get("/getAll-recruiters-closed", protect, authorize("RMG", "HR"), getallrecruitersandhisclosedpositions);



//Recruiter Dashboard stats
// router.get("/total-filtered-unfiltered-candidates", protect, authorize("HR"), getTotalFiltredandUnFilteredCandidates);
router.get("/total-filtered-unfiltered-candidates-all-jd", protect, authorize("HR"), getTotalFiltredandUnFilteredCandidatesFromAllJD);

export default router;