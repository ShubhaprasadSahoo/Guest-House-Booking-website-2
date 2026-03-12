import mongoose from "mongoose";

const BedSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Bed 1" or "Upper bunk"
}, { timestamps: false });

const RoomSchema = new mongoose.Schema({
  name: String,
  type: String,
  price: Number,
  totalBeds: Number,
  amenities: [String],
  status: { type: String, default: "available" }, // available/maintenance
  beds: [BedSchema] // <-- manually-added beds
}, { timestamps: true });

const GuestHouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  description: String,
  imageUrl: String,
  status: { type: String, default: "active" }, // active/inactive
  rooms: [RoomSchema]
}, { timestamps: true });

export default mongoose.model("GuestHouse", GuestHouseSchema);

