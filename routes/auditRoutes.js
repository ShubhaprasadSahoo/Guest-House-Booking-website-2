import express from "express";
import AuditLog from "../models/AuditLog.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all logs
router.get("/", protect, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch audit logs" });
  }
});

export default router;
