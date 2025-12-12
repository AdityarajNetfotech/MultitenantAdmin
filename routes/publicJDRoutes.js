import express from "express";
import { protect } from "../middlewares/auth.js";
import { getJDByToken } from "../controllers/publicJDController.js";

const router = express.Router();

// This route is public, but will check auth if token is present
router.get("/jd/:token", protectOptional, getJDByToken);

// Middleware to optionally attach user if token is present
function protectOptional(req, res, next) {
  // Try to authenticate, but don't fail if not authenticated
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    return protect(req, res, next);
  }
  next();
}

export default router;
