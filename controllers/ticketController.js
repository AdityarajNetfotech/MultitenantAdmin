import Ticket from "../models/Ticket.js"
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js"
import ErrorResponse from "../utils/errorResponse.js"
import sendEmail from "../utils/sendEmail.js";
import { ticketCreatedTemplate } from "../utils/emailTemplates/ticketCreatedTemplate.js";
import { ticketUpdateTemplate } from "../utils/emailTemplates/ticketUpdateTemplate.js";

export const createTicket = asyncHandler(async (req, res, next)=>{
    const {subject, description, priority} = req.body;
    const ticket = await Ticket.create({
        raisedBy: req.user._id,
        role: req.user.role,
        subject,
        description,
        priority
    });

    const admins = await User.find({ role: "Admin"});
    if (admins && admins.length > 0){
        admins.forEach(async(admin)=>{
            const html = ticketCreatedTemplate(
                admin.name,
                req.user.name,
                req.user.role,
                subject,
                description,
                priority
            );
            await sendEmail({
                to: admin.email,
                subject: `New Ticket Raised: ${subject}`,
                html,
            });
        });
    }

    res.status(201).json({
        success: true,
        message:"Ticket Raised Successfully. admin notified Via Email.",
        ticket
    });
});


export const getAllTickets = asyncHandler(async(req, res, next) => {
    const tickets = await Ticket.find()
    .populate("raisedBy", "name email role")
    .populate("assignedTo", "name email");

    res.status(200).json({
        success:true,
        tickets,
    });
});

export const updateTicketStatus = asyncHandler(async(req, res, next) => {
    const {status, assignedTo} =  req.body;
    const ticketId = req.params.id;

    const ticket = await Ticket.findById(ticketId);
    if(!ticket) return next (new ErrorResponse("Ticket not Found", 404));

    let assignedToUser = null;

    if (assignedTo){
        assignedToUser = await
        User.findById(assignedTo);
        ticket.assignedTo = assignedTo;
    }

    if (status) ticket.status = status;
    await ticket.save();
    
    const user = await User.findById(ticket.raisedBy);

    if(user){
        const html = ticketUpdateTemplate(
            user.name,
            ticket._id,
            ticket.status,
            assignedToUser ? assignedToUser.name : null
        );

        await sendEmail({
            to: user.email,
            subject:`Your Ticket #${ticket._id} Has Been Updated`,
            html,
        });
    }
    res.status(200).json({
        success: true,
        message: "Ticket Updated & User Notified Via Email",
        ticket,
    });
});

// export const getCountOfTicketsByRmg = asyncHandler(async (req, res, next) => {
//     const count = await Ticket.countDocuments({ raisedByRole: "RMG" });
//     res.status(200).json({ success: true, count });
// });