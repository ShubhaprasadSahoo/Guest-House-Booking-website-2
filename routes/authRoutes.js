import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  updateProfile
} from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/update-profile", protect, updateProfile);


// ✅ Protected route
router.get("/dashboard", protect, (req, res) => {
  res.json({ msg: `Welcome, ${req.user.name}!`, user: req.user });
});

export default router;
