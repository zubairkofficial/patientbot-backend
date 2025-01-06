import { Room } from "../models/index.js";

const roomControllers = {
  async createRooms(req, res) {
    const { name, roomNumber } = req.body;

    // Validate required fields
    if (!name || !roomNumber) {
      return res.status(400).json({
        message: "All the fields are required to create Room.",
      });
    }

    try {
      // Generate slug by transforming the name to lowercase and removing spaces
      let slug = name.toLowerCase().replace(/\s+/g, "");

      // Check if a patient with the same slug already exists
      const existingRoom = await Room.findOne({ where: { slug } });
      if (existingRoom) {
        return res.status(400).json({
          message:
            "A Room with the same name already exists. Please use a different name.",
        });
      }

      // Create a new patient with the generated slug
      const newRoom = await newRoom.create({ name, roomNumber, slug });
      const newRoomId = newRoom.id;

      res.status(201).json({
        message: "Room created successfully",
        room: newRoom,
      });
    } catch (error) {
      console.error("Error creating Room:", error);
      res.status(500).json({
        error: "An error occurred while creating the Room",
      });
    }
  },

  async getRooms(req, res) {
    try {
      const rooms = await Room.findAll();
      res.status(200).json(rooms);
    } catch (error) {
      console.error("Error fetching Rooms:", error);
      res.status(500).json({ error: "An error occurred while fetching Rooms" });
    }
  },
};
