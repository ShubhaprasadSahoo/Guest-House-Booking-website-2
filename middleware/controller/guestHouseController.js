 import GuestHouse from "../models/GuestHouse.js";
 import Booking from "../models/Booking.js";
 import mongoose from "mongoose";
import createAuditLog from "../middleware/createAuditLog.js";
 export const listGuestHouses = async (req, res) => {
  try {
     const houses = await GuestHouse.find().sort({ createdAt: -1 });
     res.json(houses);
  } catch (err) {
     res.status(500).json({ message: err.message });
   }
 };

 export const createGuestHouse = async (req, res) => {
  try {
    const payload = req.body;
    const newHouse = new GuestHouse(payload);
     await newHouse.save();
    res.status(201).json(newHouse);

    await createAuditLog({
  action: "GUESTHOUSE_CREATED",
  entity: "GuestHouse",
  user: req.user,
  details: payload
});



  } catch (err) {
    res.status(400).json({ message: err.message });
   }
 };

 export const updateGuestHouse = async (req, res) => {
  try {
     const { id } = req.params;
     const updated = await GuestHouse.findByIdAndUpdate(id, req.body, { new: true });
     res.json(updated);
   } catch (err) {
     res.status(400).json({ message: err.message });
   }
 };

 export const deleteGuestHouse = async (req, res) => {
   try {
     const { id } = req.params;
     await GuestHouse.findByIdAndDelete(id);
     res.json({ message: "Deleted" });
   } catch (err) {
     res.status(500).json({ message: err.message });
       }
 };

 // Rooms
 export const addRoom = async (req, res) => {
  //  try {
  //    const { id } = req.params; // guest house id
  //    const room = req.body;
  //    const house = await GuestHouse.findById(id);
  //    house.rooms.push(room);
  //    await house.save();
  //    res.status(201).json(house);
  //  } catch (err) {
  //    res.status(400).json({ message: err.message });
  //  }

  try {
    const { id } = req.params; // guest house id
    const { name, type, price, totalBeds = 1, amenities = [], beds = [] } = req.body;
    const house = await GuestHouse.findById(id);
    if (!house) return res.status(404).json({ message: "Guest house not found" });

    const room = {
      name, type, price, totalBeds,
      amenities,
      beds: Array.isArray(beds) ? beds.map(b => ({ name: b.name || String(b) })) : []
    };

    house.rooms.push(room);
    await house.save();
    res.status(201).json(house);


    await createAuditLog({
  action: "ROOM_CREATED",
  entity: "Room",
  user: req.user,
  details: { guestHouseId: id, room }
});

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
 };

 export const deleteRoom = async (req, res) => {
//    try {
//      const { id, roomId } = req.params;
//      const house = await GuestHouse.findById(id);
//      house.rooms.id(roomId).remove();
//      await house.save();
//      res.json(house);
//    } catch (err) {
//      res.status(400).json({ message: err.message });
//    }
//  };

try {
    const { id, roomId } = req.params;

    const house = await GuestHouse.findById(id);
    if (!house) return res.status(404).json({ message: "Guest house not found" });

    const index = house.rooms.findIndex(r => r._id.toString() === roomId);
    if (index === -1) return res.status(404).json({ message: "Room not found" });

    house.rooms.splice(index, 1);
    await house.save();

    res.json({ message: "Room deleted successfully" });

createAuditLog({
  action: "ROOM_DELETED",
  entity: "Room",
  user: req.user,
  details: { guestHouseId: id, roomId }
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }



 };


 // Availability: returns rooms with availability boolean for given start & end dates
 export const checkAvailability = async (req, res) => {
  //  try {
  //    const { id } = req.params;
  //    const { startDate, endDate } = req.query;
  //    if (!startDate || !endDate) return res.status(400).json({ message: "Provide startDate and endDate as query params" });

  //    const house = await GuestHouse.findById(id);
  //    if (!house) return res.status(404).json({ message: "Not found" });

  //    // find bookings overlapping dates
  //    const bookings = await Booking.find({
  //      guestHouse: id,
  //      $or: [
  //        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
  //      ],
  //      status: { $ne: "cancelled" }
  //    });

  //   const bookedRoomIds = bookings.map(b => b.roomId.toString());

  //    const roomsWithAvailability = house.rooms.map(r => ({
  //      _id: r._id,
  //      name: r.name,
  //      type: r.type,
  //      price: r.price,
  //      available: !bookedRoomIds.includes(String(r._id))
  //    }));

  //    res.json({ rooms: roomsWithAvailability });
  //  } catch (err) {
  //    res.status(500).json({ message: err.message });
  //  }

try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const house = await GuestHouse.findById(id);
    if (!house) return res.status(404).json({ message: "Guest house not found" });

    // const bookings = await Booking.find({
    //   guestHouse: id,
    //   status:"Approved",
    //   $or: [
    //     { checkInDate: { $lte: endDate }, checkOutDate: { $gte: startDate } }
    //   ]
    // });
    const bookings = await Booking.find({
  guestHouse: id,
  status: "Approved",  // ✅ Only approved bookings block rooms
  $or: [
    { checkInDate: { $lte: endDate }, checkOutDate: { $gte: startDate } }
  ]
});


    const bookedRoomIds = bookings.map(b => b.roomId.toString());

    const rooms = house.rooms.map(r => ({
      _id: r._id,
      name: r.name,
      type: r.type,
      available: !bookedRoomIds.includes(r._id.toString())
    }));

    res.json({ rooms });

 

await createAuditLog({
  action: "AVAILABILITY_CHECKED",
  entity: "GuestHouse",
  user: req.user,
  details: { id, startDate, endDate }
});

  } catch (err) {
    res.status(500).json({ message: err.message });
  }

 };
 

// Add a bed to a specific room
export const addBed = async (req, res) => {
  try {
    const { id, roomId } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Bed name required" });

    const house = await GuestHouse.findById(id);
    if (!house) return res.status(404).json({ message: "Guest house not found" });

    const room = house.rooms.id(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.beds.push({ name });
    await house.save();
    res.status(201).json(room);

   await createAuditLog({
  action: "BED_CREATED",
  entity: "Bed",
  user: req.user,
  details: { guestHouseId: id, roomId, bedName: name }
});



  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a bed
export const deleteBed = async (req, res) => {
//   try {
//     const { id, roomId, bedId } = req.params;
//     const house = await GuestHouse.findById(id);
//     if (!house) return res.status(404).json({ message: "Guest house not found" });

//     const room = house.rooms.id(roomId);
//     if (!room) return res.status(404).json({ message: "Room not found" });

//     const bed = room.beds.id(bedId);
//     if (!bed) return res.status(404).json({ message: "Bed not found" });

//     bed.remove();
//     await house.save();
//     res.json(room);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }


try {
    const { id, roomId, bedId } = req.params;

    const house = await GuestHouse.findById(id);
    if (!house) return res.status(404).json({ message: "Guest house not found" });

    const room = house.rooms.find(r => r._id.toString() === roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.beds = room.beds.filter(b => b._id.toString() !== bedId);
    await house.save();

    res.json({ message: "Bed deleted successfully" });

  createAuditLog({
  action: "BED_DELETED",
  entity: "Bed",
  user: req.user,
  details: { guestHouseId: id, roomId, bedId }
});


  } catch (err) {
    res.status(500).json({ message: err.message });
  }




};













