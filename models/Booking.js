import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    guestHouse: { type: mongoose.Schema.Types.ObjectId, ref: "GuestHouse", required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, required: true },
    bedId: { type: mongoose.Schema.Types.ObjectId, required: false }, // optional
    guestName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    roomType: { type: String, required: true },
    numberOfGuests: { type: Number, required: true },
    status: { type: String, default: "Pending", enum: ["Pending", "Approved", "Rejected"] },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
