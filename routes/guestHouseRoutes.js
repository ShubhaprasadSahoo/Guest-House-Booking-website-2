import express from "express";
import {
  listGuestHouses,
  createGuestHouse,
  updateGuestHouse,
  deleteGuestHouse,
  addRoom,
  deleteRoom,
  checkAvailability,
  addBed,
  deleteBed
} from "../controller/guestHouseController.js";

const router = express.Router();

router.get("/", listGuestHouses);
router.post("/", createGuestHouse);
router.put("/:id", updateGuestHouse);
router.delete("/:id", deleteGuestHouse);

// Rooms
router.post("/:id/rooms", addRoom);
router.delete("/:id/rooms/:roomId", deleteRoom);

// beds (new)
router.post("/:id/rooms/:roomId/beds", addBed);
router.delete("/:id/rooms/:roomId/beds/:bedId", deleteBed);


// Availability
router.get("/:id/availability", checkAvailability);

export default router;
