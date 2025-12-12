import express from "express";
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roles.js';
import { createTicket, getAllTickets, updateTicketStatus } from "../controllers/ticketController.js";

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

export default router;