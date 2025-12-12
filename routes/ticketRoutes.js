import express from "express";
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roles.js';
import { createTicket, getAllTickets, updateTicketStatus, raiseTicket, receiveSuperAdminReply, replyToTicket} from "../controllers/ticketController.js";

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("RMG","HR"),
    createTicket
);

router.get(
    "/",
    protect,
    authorize("Admin", "RMG"),
    getAllTickets
);

router.put(
    "/:id",
    protect,
    authorize("Admin"),
    updateTicketStatus
);
router.post("/raise-ticket-admin", protect, authorize("Admin"), raiseTicket);
router.post("/reply-to-ticket/:ticketId", protect, authorize("Admin"), replyToTicket);
router.post("/receive-superadmin-reply",  receiveSuperAdminReply);

export default router;