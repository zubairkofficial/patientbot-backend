import express from "express";
import roomControllers from "../controllers/roomsControllers.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply authMiddleware to all routes in this router
router.use(authMiddleware);

// CRUD routes for rooms
router.post("/", roomControllers.createRooms); // Create a new room
router.get("/", roomControllers.getAllRooms); // Get all rooms
router.post("/assign-rooms", roomControllers.assignStudentsToRoom);
router.get("/students", roomControllers.getRoomsAndStudents);
router.get("/room-scores/:roomId", roomControllers.getScoresByRoomId);

router.get("/:id", roomControllers.getRoomById); // Get a room by ID
router.put("/:id", roomControllers.updateRoom); // Update a room by ID
router.delete("/:id", roomControllers.deleteRoom); // Delete a room by ID

export default router;
