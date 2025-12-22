import Offer from "../models/Offer.js";
import asyncHandler from "../utils/asyncHandler.js";
import ErrorResponse from "../utils/errorResponse.js";
import sendEmail from "../utils/sendEmail.js"
import {offerAssignedTemplate} from "../utils/emailTemplates/offerAssignedTemplate.js"
import JobDescription from "../models/jobDescription.js";
import User from "../models/User.js"

export const createOffer = asyncHandler(async(req, res, next) => {
    const {
        jobTitle,
        priority,
        dueDate,
        assignedTo,
        description,
        skills,
        preferredSkills,
        experience,
        positionAvailable,
        location,
        city,
        state,
        country,
        employmentType,
        salary,
        currency,
        attachments,
        companyName

    } = req.body;

    const hrUser = await User.findById(assignedTo);
    if(!hrUser || hrUser.role !== "HR"){
        return next(new ErrorResponse("Assigned HR not Found",404));
    }

    const offer = await Offer.create({
        jobTitle,
        priority,
        dueDate,
        createdBy:req.user._id,
        assignedTo,
        description,
        skills,
        preferredSkills,
        experience,
        positionAvailable,
        location,
        city,
        state,
        country,
        employmentType,
        salary,
        currency,
        attachments,
        companyName,
        status:"JD pending",
        
    });

    const html = offerAssignedTemplate(
        hrUser.name,
        offer.jobTitle,
        offer.priority,
        offer.dueDate,
        req.user.name
    );

    await sendEmail({
        to:hrUser.email,
        subject:`New Offer Assigned : ${offer.jobTitle}`,
        html
    });

    res.status(201).json({
        success:true,
        message:"Offer Created and Assigned to HR, HR has Been Notified Via Email.",
        offer,
    });
});

export const getAllHr = asyncHandler(async(req, res, next) => {
    const hrUsers = await User.find({role:"HR"}).select('-password');
    res.status(200).json({
        success:true,
        count:hrUsers.length,
        data:hrUsers,
    });
});
    
// export const getRmgOffersOverview = asyncHandler(async (req, res, next) => {
//   // authorization: ensure requester is RMG
//   if (!req.user || req.user.role !== 'RMG') {
//     return next(new ErrorResponse('Unauthorized', 403));
//   }

//   const { status, assignedTo, from, to, search } = req.query;

//   const filter = { createdBy: req.user._id };
//   if (status) filter.status = status;
//   if (assignedTo) filter.assignedTo = assignedTo;
//   if (search) filter.jobTitle = { $regex: search, $options: 'i' };
//   if (from || to) {
//     filter.createdAt = {};
//     if (from) filter.createdAt.$gte = new Date(from);
//     if (to) filter.createdAt.$lte = new Date(to);
//   }

//   // fetch offers created by this RMG
//   const offers = await Offer.find(filter).populate('assignedTo', 'name email').lean();

//   // attempt to dynamically load a common Application model if one exists
//   let ApplicationModel = null;
//   const candidateModelPaths = [
//     '../models/Application.js',
//     '../models/Applicant.js',
//     '../models/CandidateApplication.js',
//     '../models/Candidate.js'
//   ];

//   for (const p of candidateModelPaths) {
//     try {
//       // dynamic import works with ESM; ignore if not present
//       const mod = await import(p);
//       if (mod && mod.default) {
//         ApplicationModel = mod.default;
//         break;
//       }
//     } catch (e) {
//       // ignore and try next path
//     }
//   }

//   const result = await Promise.all(
//     offers.map(async (o) => {
//       let totalApplicants = 0;
//       let applicantsByStatus = {};

//       // 1) If the Offer document itself stores an applicants array
//       if (Array.isArray(o.applicants) && o.applicants.length) {
//         totalApplicants = o.applicants.length;
//         // try to build breakdown by status if available on applicant objects
//         applicantsByStatus = o.applicants.reduce((acc, a) => {
//           const s = a.status || 'unknown';
//           acc[s] = (acc[s] || 0) + 1;
//           return acc;
//         }, {});
//       }
//       // 2) If Offer has a numeric applicationsCount field
//       else if (typeof o.applicationsCount === 'number') {
//         totalApplicants = o.applicationsCount;
//       }
//       // 3) If a separate Application model exists, count and aggregate from it
//       else if (ApplicationModel) {
//         try {
//           totalApplicants = await ApplicationModel.countDocuments({ offer: o._id });
//           // aggregation for status breakdown (if ApplicationModel has a 'status' field)
//           const agg = await ApplicationModel.aggregate([
//             { $match: { offer: o._id } },
//             { $group: { _id: '$status', count: { $sum: 1 } } }
//           ]);
//           agg.forEach((a) => {
//             applicantsByStatus[a._id || 'unknown'] = a.count;
//           });
//         } catch (e) {
//           // non-fatal: leave totals as 0
//         }
//       }

//       return {
//         ...o,
//         totalApplicants,
//         applicantsByStatus,
//       };
//     })
//   );

//   res.status(200).json({
//     success: true,
//     count: result.length,
//     data: result,
//   });
// });


export const getRmgOffersWithJDs = asyncHandler(async (req, res, next) => {

  // ensure requester is RMG
  if (!req.user || req.user.role !== 'RMG') {
    return next(new ErrorResponse('Unauthorized', 403));
  }

  const { status, assignedTo, from, to, search } = req.query;

  const filter = { createdBy: req.user._id };
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) filter.jobTitle = { $regex: search, $options: 'i' };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  // fetch offers created by this RMG
  const offers = await Offer.find(filter).populate('assignedTo', 'name email').lean();

  // Use imported JobDescription model (field is offerId, not offer)
  const result = await Promise.all(
    offers.map(async (o) => {
      // build JD filter: match offerId and ensure JD was created by the assigned HR (use id whether populated or not)
      const jdFilter = {
        offerId: o._id,
        createdBy: o.assignedTo && o.assignedTo._id ? o.assignedTo._id : o.assignedTo
      };

      // Debug log for filter
      console.log('JD Filter:', jdFilter);

      // Find JDs for this offer and HR
      const jds = await JobDescription.find(jdFilter).lean();
      console.log('JD Results:', jds);

      const jdDetails = jds.map((jd) => {
        // extract counts from JD (JD model is said to hold applicant/filtered counts) 
        const totalApplicants = Array.isArray(jd.applicants) ? jd.applicants.length
          : (typeof jd.applicantsCount === 'number' ? jd.applicantsCount : 0);

        const filteredCount = Array.isArray(jd.filteredApplicants) ? jd.filteredApplicants.length
          : (typeof jd.filteredCount === 'number' ? jd.filteredCount : (typeof jd.filtered === 'number' ? jd.filtered : 0));

        const unfilteredCount = Math.max(0, totalApplicants - filteredCount);

        let applicantsByStatus = {};
        if (Array.isArray(jd.applicants)) {
          jd.applicants.forEach(a => { 
            const s = a && a.status ? a.status : 'unknown';
            applicantsByStatus[s] = (applicantsByStatus[s] || 0) + 1;
          });
        } else if (Array.isArray(jd.applicantsByStatus)) {
          jd.applicantsByStatus.forEach(a => {
            const key = a._id || 'unknown';
            applicantsByStatus[key] = a.count || 0;
          });
        } else if (jd.applicantsByStatus && typeof jd.applicantsByStatus === 'object') {
          applicantsByStatus = jd.applicantsByStatus;
        }

        return {
          id: jd._id,
          title: jd.title || jd.jobTitle || null,
          createdBy: jd.createdBy,
          createdAt: jd.createdAt,
          totalApplicants,
          filteredCount,
          unfilteredCount,
          applicantsByStatus,
          raw: jd,
        };
      });

      return {
        ...o,
        jdCount: jdDetails.length,
        jds: jdDetails,
      };
    })
  );

  res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
});


export const getAllOffers = asyncHandler(async (req, res, next) => {
  try {
    const offers = await Offer.find().populate('createdBy', 'name email').populate('assignedTo', 'name email'); 
    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (err) {
    return next(new ErrorResponse(err.message || 'Failed to fetch offers', 500));
  }
});

export const assignOfferToHr = asyncHandler(async (req, res, next) => {
    const { offerId, hrId } = req.body;
    const offer = await Offer.findById(offerId);
    if (!offer) {
        return next(new ErrorResponse('Offer not found', 404));
    }
    const hrUser = await User.findById(hrId);
    if (!hrUser || hrUser.role !== "HR") {
        return next(new ErrorResponse('HR user not found', 404));
    }
    offer.assignedTo = hrId;
    await offer.save();

    res.status(200).json({ success: true, message: 'Offer assigned to HR', data: offer });
});

export const updateOffer = asyncHandler(async (req, res, next) => {
    const offerId = req.params.id;
    const updates = req.body;
    const offer = await Offer.findByIdAndUpdate(offerId, updates, { new: true });
    if (!offer) {
        return next(new ErrorResponse('Offer not found', 404));
    }
    res.status(200).json({ success: true, message: 'Offer updated', data: offer });
});


export const deleteOffer = asyncHandler(async (req, res, next) => {
    const offerId = req.params.id;
    const offer = await Offer.findByIdAndDelete(offerId);
    if (!offer) {
        return next(new ErrorResponse('Offer not found', 404));
    }
    res.status(200).json({ success: true, message: 'Offer deleted', data: offer });
});