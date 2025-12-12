import asyncHandler from "../utils/asyncHandler.js";
import errorResponse from "../utils/errorResponse.js";
import Offer from "../models/Offer.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js"
import Candidate from "../models/Candidate.js";
import JD from "../models/jobDescription.js";

export const gettotalOffers = asyncHandler(async (req, res, next) => {
    const totalOffers = await Offer.countDocuments();
    res.status(200).json({ success: true, totalOffers });
});

export const getToatalTicketsRaisedByRMG = asyncHandler(async (req, res, next) => {
    const totalTickets = await Ticket.countDocuments({ role: "RMG" });
    res.status(200).json({ success: true, totalTickets });
});

export const getTotalRecruitersAndTotalOfferMonthWise = asyncHandler(async (req, res, next) => {
    const totalRecruiterMonthWise = await User.aggregate([
        { $match: { role: "HR" } },
        { $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
        }}
    ]);

    // Get current year
    const currentYear = new Date().getFullYear();
    // Aggregate offers month-wise for the current year
    const offersMonthWise = await Offer.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(`${currentYear}-01-01`),
                    $lt: new Date(`${currentYear + 1}-01-01`)
                }
            }
        },
        {
            $group: {
                _id: { $month: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                month: "$_id",
                count: 1,
                _id: 0
            }
        }
    ]);

    

    res.status(200).json({ success: true, totalRecruiterMonthWise, offersMonthWise });
}); 


export const getCountOfTotalHRandTicketsMonthWise = asyncHandler(async (req, res, next) => {
    const totalHRMonthWise = await User.aggregate([
        { $match: { role: "HR" } },
        { $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
        }}
    ]);
    const totalTicketsMonthWise = await Ticket.aggregate([
        { $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
        }}
    ]); 
    res.status(200).json({ success: true, totalHRMonthWise, totalTicketsMonthWise });
});

export const getCountOfActiveHRandAssignedHRMonthWise = asyncHandler(async (req, res, next) => {
    const activeHRMonthWise = await User.aggregate([
        { $match: { role: "HR", isActive: true } },
        { $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
        }}
    ]);
    const assignedHRMonthWise = await Ticket.aggregate([
        { $match: { assignedTo: { $ne: null } } },
        { $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
        }}
    ]); 
    res.status(200).json({ success: true, activeHRMonthWise, assignedHRMonthWise });
});

export const getCurrentOffers = asyncHandler(async (req, res, next) => {
    const offers = await Offer.find({ dueDate: { $gte: new Date() } });
    res.status(200).json({
        success: true,
        offers,
    });
});

export const getTotalCandidateMonthWise = asyncHandler(async (req, res, next) => {
    const totalCandidateMonthWise = await Candidate.aggregate([
        { $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 }
        }}
    ]);

    const totalCandidates = await Candidate.countDocuments();
    res.status(200).json({ success: true, totalCandidateMonthWise, totalCandidates });
});

export const getRecentJobTittleswithnumberofvacancies = asyncHandler(async (req, res, next) => {
    const recentJobs = await Offer.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("jobTitle positionAvailable createdAt");

    const totalJobs = await Offer.countDocuments();
    res.status(200).json({ success: true, recentJobs, totalJobs });
});

export const getJdStatusPercentage = asyncHandler(async (req, res, next) => {
    const totalJds = await Offer.countDocuments();
    const openJds = await Offer.countDocuments({ status: "Open" });
    const inProgress = await Offer.countDocuments({ status: "In progress" });
    const jdPending = await Offer.countDocuments({ status: "JD pending" });
    const jdCreated = await Offer.countDocuments({ status: "JD created" });
    const closedJds = await Offer.countDocuments({ status: "Closed" });

    const openPercentage = totalJds ? (openJds / totalJds) * 100 : 0;
    const closedPercentage = totalJds ? (closedJds / totalJds) * 100 : 0;
    const inProgressPercentage = totalJds ? (inProgress / totalJds) * 100 : 0;
    const jdPendingPercentage = totalJds ? (jdPending / totalJds) * 100 : 0;
    const jdCreatedPercentage = totalJds ? (jdCreated / totalJds) * 100 : 0;

    res.status(200).json({
        success: true,
        jdStatusPercentage: {
            open: openPercentage,
            closed: closedPercentage,
            inProgress: inProgressPercentage,
            jdPending: jdPendingPercentage,
            jdCreated: jdCreatedPercentage
        }
    });
});

export const getallrecruitersandhisclosedpositions = asyncHandler(async (req, res, next) => {
    const recruiters = await User.find({ role: "HR" });

    const recruiterData = await Promise.all(recruiters.map(async (recruiter) => {
        
        const closedPositions = await Offer.countDocuments({ createdBy: recruiter._id, status: "Closed" });
        const activeJDs = await Offer.countDocuments({ createdBy: recruiter._id, status: { $ne: "Closed" } });
        const candidateShortlisted = await Candidate.countDocuments({ assignedRecruiter: recruiter._id, status: "Shortlisted" });
        const HRstatus = await User.findById(recruiter._id).select("isActive");
        return {
            recruiterName: recruiter.name,
            closedPositions,
            activeJDs,
            candidateShortlisted,
            isActive: HRstatus.isActive
        };
    }));

    res.status(200).json({ success: true, recruiterData });
});

//Recruiter Dashboard stats

export const getTotalFiltredandUnFilteredCandidatesFromAllJD = asyncHandler(async (req, res, next) => {
    const offers = await JD.find({ createdBy: req.user._id }).select("_id");
    const offerIds = offers.map(offer => offer._id);
    const totalFilteredCandidates = await Candidate.countDocuments({ offer: { $in: offerIds }, isFiltered: true });
    const totalUnfilteredCandidates = await Candidate.countDocuments({ offer: { $in: offerIds }, isFiltered: false });
    res.status(200).json({ success: true, totalFilteredCandidates, totalUnfilteredCandidates });
});
   

export const getTotalTicketOfSpecificHR = asyncHandler(async (req, res, next) => {
    const hrId = req.params.hrId;
    const totalTickets = await Ticket.countDocuments({ assignedTo: hrId });
    res.status(200).json({ success: true, totalTickets });
}   );
