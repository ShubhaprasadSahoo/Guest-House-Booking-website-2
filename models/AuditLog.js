import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },       // e.g. BOOKING_CREATED
    entity: { type: String, required: true },       // Booking / Room / Bed / GuestHouse
    performedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      role: String
    },
    details: { type: Object, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
