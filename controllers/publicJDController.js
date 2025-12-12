import JD from "../models/jobDescription.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /jd/:token
export const getJDByToken = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const jd = await JD.findOne({ publicToken: token });
  if (!jd) return res.status(404).send("JD not found");

  // If user is authenticated, redirect to JD detail page (frontend route)
  if (req.user) {
    // You may want to send JD data or redirect to a frontend route
    return res.redirect(`/jd/${jd._id}`); // Adjust as per your frontend route
  }

  // If not authenticated, redirect to registration page, with token as query param
  return res.redirect(`/register?jdToken=${token}`);
});
