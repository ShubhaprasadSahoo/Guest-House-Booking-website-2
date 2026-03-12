import express from "express";
import Booking from "../models/Booking.js";
import { protect } from "../middleware/authMiddleware.js";
import nodemailer from "nodemailer";
import GuestHouse from "../models/GuestHouse.js";
import createAuditLog from "../middleware/createAuditLog.js"

const router = express.Router();



// Create new booking
 router.post("/", protect, async (req, res) => {
   try {
    const booking = await Booking.create(req.body);
    res.status(201).json({ msg: "Booking created successfully", booking });
    
    await createAuditLog({
  action: "BOOKING_CREATED",
  entity: "Booking",
  user: req.user,
  details: req.body
});
} catch (err) {
     res.status(500).json({ msg: "Failed to create booking", error: err.message });
    }
  });


// Get all bookings

// router.get("/", protect, async (req, res) => {
//   try {
//     const bookings = await Booking.find().sort({ createdAt: -1 });
//     res.json(bookings);
//   } catch (err) {
//     res.status(500).json({ msg: err.message });
//   }
// });


router.get("/", protect, async (req, res) => {
  try {
    let bookings = await Booking.find()
      .populate("guestHouse", "name rooms")  // include rooms
      .sort({ createdAt: -1 });

    // Attach room name & bed name manually
    bookings = bookings.map(b => {
      let roomName = "N/A";
      let bedName = "N/A";

      const house = b.guestHouse;
      if (house) {
        const room = house.rooms.find(r => r._id.toString() === b.roomId?.toString());
        if (room) {
          roomName = room.name;

          const bed = room.beds.find(bt => bt._id.toString() === b.bedId?.toString());
          if (bed) bedName = bed.name;
        }
      }

      return {
        ...b.toObject(),
        roomName,
        bedName,
      };
    });

    res.json(bookings);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});




// Approve booking
 router.put("/:id/approve", protect, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "Approved", rejectionReason: "" },
      { new: true }
     );
     res.json(booking);

     await createAuditLog({
  action: "BOOKING_APPROVED",
  entity: "Booking",
  user: req.user,
  details: { id: req.params.id }
});

   } catch (err) {
     res.status(500).json({ error: "Server error" });
   }
 });



// Reject booking
router.put("/:id/reject", protect, async (req, res) => {
   try {
    const { reason } = req.body;
    const booking = await Booking.findByIdAndUpdate(
       req.params.id,
       { status: "Rejected", rejectionReason: reason },
       { new: true }
     );
     res.json(booking);

  await createAuditLog({
  action: "BOOKING_REJECTED",
  entity: "Booking",
  user: req.user,
  details: { id: req.params.id, reason }
});


   } catch (err) {
     res.status(500).json({ error: "Server error" });
   }
 });


// 📌 Dashboard Stats API
router.get("/dashboard-stats", protect, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const approved = await Booking.countDocuments({ status: "Approved" });
    const rejected = await Booking.countDocuments({ status: "Rejected" });
    const pending = await Booking.countDocuments({ status: "Pending" });

    const guestHouses = await GuestHouse.countDocuments();

    // Today's bookings
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todaysBookings = await Booking.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // Occupancy Rate = Approved bookings / Total rooms & beds
    const allHouses = await GuestHouse.find();
    let totalBeds = 0;

    allHouses.forEach(h => {
      h.rooms.forEach(r => {
        totalBeds += r.beds.length > 0 ? r.beds.length : 1;
      });
    });

    const occupancyRate =
      totalBeds === 0 ? 0 : Math.round((approved / totalBeds) * 100);

    res.json({
      totalBookings,
      approved,
      rejected,
      pending,
      todaysBookings,
      guestHouses,
      occupancyRate
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});




export default router;
