import Ticket from "../models/Ticket.js"
import axios from "axios";
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




export const raiseTicket = async (req, res) => {
  try {
    const adminId = req.user._id; // from auth middleware
    const admin = await User.findById(adminId);

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const { subject, message } = req.body;

    // sending request to superadmin backend
    const response = await axios.post(
      "http://localhost:5000/api/superadmin/receiveTickets",
      {
        adminId: admin._id,
        adminName: admin.name,
        adminEmail: admin.email,
        subject,
        message
      }
    );

    res.status(201).json({
      message: "Ticket sent to Super Admin successfully",
      ticket: response.data.ticket
    });

  } catch (error) {
    res.status(500).json({ message: "Error raising ticket", error: error });
  }
};



export const replyToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    // 1️⃣ Update admin DB
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const reply = {
      by: "admin",
      message,
      timestamp: new Date()
    };

    ticket.replies.push(reply);
    await ticket.save();

    // 2️⃣ Sync reply to superadmin backend
    await axios.post(
      "http://localhost:5000/api/superadmin/reply-from-admin",
      {
        ticketId,
        reply
      }
    );

    res.status(200).json({
      message: "Reply sent successfully",
      ticket
    });

  } catch (error) {
    res.status(500).json({ message: "Error replying to ticket", error: error.message });
  }
};

export const receiveSuperAdminReply = async (req, res) => {
  try {
    const { ticketId, reply } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.replies.push(reply);
    await ticket.save();

    res.status(200).json({
      message: "Reply synced successfully",
      ticket
    });

  } catch (error) {
    res.status(500).json({ message: "Error syncing reply", error: error.message });
  }
};
