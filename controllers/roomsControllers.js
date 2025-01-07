import { Room, User, Assignment } from "../models/index.js";

const roomControllers = {
  async createRooms(req, res) {
    const { name, roomNumber } = req.body;

    // Validate required fields
    if (!name || !roomNumber) {
      return res.status(400).json({
        message:
          "All fields (name and roomNumber) are required to create a room.",
      });
    }

    try {
      // Get the admin's userId from the authenticated request (via middleware)
      const userId = req.user?.id;

      if (!userId) {
        return res.status(403).json({
          message: "Unauthorized. User ID is required to create a room.",
        });
      }

      // Generate slug by transforming the name to lowercase and removing spaces
      const slug = name.toLowerCase().replace(/\s+/g, "");

      // Check if a room with the same slug already exists
      const existingRoom = await Room.findOne({ where: { slug } });
      if (existingRoom) {
        return res.status(400).json({
          message:
            "A room with the same name already exists. Please use a different name.",
        });
      }

      // Create a new room with the generated slug and admin's userId
      const newRoom = await Room.create({ name, roomNumber, slug, userId });

      res.status(201).json({
        message: "Room created successfully.",
        room: newRoom,
      });
    } catch (error) {
      console.error("Error creating Room:", error.message || error);
      res.status(500).json({
        error: "An error occurred while creating the room.",
      });
    }
  },

  async getAllRooms(req, res) {
    try {
      const rooms = await Room.findAll();
      res.status(200).json({ rooms });
    } catch (error) {
      console.error("Error fetching Rooms:", error);
      res.status(500).json({ error: "An error occurred while fetching Rooms" });
    }
  },

  async assignStudentsToRoom(req, res) {
    const { roomId, studentIds } = req.body;

    if (!roomId || !studentIds || studentIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Room ID and Student IDs are required." });
    }

    try {
      // Check if the room exists
      const room = await Room.findByPk(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found." });
      }

      // Fetch students to validate their existence
      const students = await User.findAll({
        where: {
          id: studentIds,
          isAdmin: false, // Ensure they're students
        },
      });

      if (students.length !== studentIds.length) {
        return res
          .status(400)
          .json({ message: "Some student IDs are invalid." });
      }

      // Assign the roomId to each student
      await Promise.all(
        students.map((student) => {
          student.roomId = roomId;
          return student.save();
        })
      );

      res.status(200).json({
        message: "Students successfully assigned to the room.",
        roomId,
        studentIds,
      });
    } catch (error) {
      console.error("Error assigning students to room:", error);
      res.status(500).json({
        error: "An error occurred while assigning students to the room.",
      });
    }
  },

  async getRoomById(req, res) {
    const { id } = req.params;

    try {
      const room = await Room.findByPk(id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.status(200).json(room);
    } catch (error) {
      console.error("Error fetching Room:", error);
      res.status(500).json({ error: "An error occurred while fetching Room" });
    }
  },
  async getRoomsAndStudents(req, res) {
    try {
      // Fetch all rooms with their assigned students
      const rooms = await Room.findAll({
        include: [
          {
            model: User,
            as: "students", // Ensure this matches the alias in the relationship
            attributes: ["id", "name", "email"],
            where: { isAdmin: false }, // Fetch only students (filter applied here)
            required: false, // Include rooms even if no students are assigned
          },
          {
            model: User,
            as: "creator", // Fetch the admin who created the room
            attributes: ["id", "name", "email"],
          },
        ],
        attributes: ["id", "name", "roomNumber"], // Fields to include for rooms
      });

      res.status(200).json({
        message: "Rooms and assigned students fetched successfully.",
        data: rooms,
      });
    } catch (error) {
      console.error("Error fetching rooms and students:", error);
      res.status(500).json({
        message: "An error occurred while fetching the rooms and students.",
      });
    }
  },
  async getScoresByRoomId(req, res) {
    const { roomId } = req.params;
  
    // Validate input
    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required." });
    }
  
    try {
      // Step 1: Fetch students in the room
      const students = await User.findAll({
        where: { roomId },
        attributes: ["id", "name", "email"],
      });
  
      if (students.length === 0) {
        return res.status(404).json({ message: "No students found in this room." });
      }
  
      // Step 2: Fetch assignments for the students in the room
      const studentIds = students.map((student) => student.id);
      const assignments = await Assignment.findAll({
        where: { userId: studentIds },
        attributes: [
          "userId",
          "score",
          "mandatoryQuestionScore",
          "symptomsScore",
          "treatmentScore",
          "diagnosisScore",
        ],
      });
  
      // Step 3: Structure the response
      const studentScores = students.map((student) => {
        const studentAssignments = assignments.filter(
          (assignment) => assignment.userId === student.id
        );
  
        return {
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
          },
          scores: studentAssignments.map((assignment) => ({
            score: assignment.score,
            mandatoryQuestionScore: assignment.mandatoryQuestionScore,
            symptomsScore: assignment.symptomsScore,
            treatmentScore: assignment.treatmentScore,
            diagnosisScore: assignment.diagnosisScore,
          })),
        };
      });
  
      res.status(200).json({
        message: "Scores fetched successfully.",
        data: studentScores,
      });
    } catch (error) {
      console.error("Error fetching scores by room ID:", error);
      res.status(500).json({
        message: "An error occurred while fetching the scores.",
      });
    }
  },
  
  async updateRoom(req, res) {
    const { id } = req.params;
    const { name, roomNumber } = req.body;

    try {
      const room = await Room.findByPk(id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Generate slug by transforming the name to lowercase and removing spaces
      let slug = name.toLowerCase().replace(/\s+/g, "");

      // Check if a patient with the same slug already exists
      const existingRoom = await Room.findOne({ where: { slug } });
      if (existingRoom && existingRoom.id !== id) {
        return res.status(400).json({
          message:
            "A Room with the same name already exists. Please use a different name.",
        });
      }

      room.name = name;
      room.roomNumber = roomNumber;
      room.slug = slug;

      await room.save();

      res.status(200).json({
        message: "Room updated successfully",
        room,
      });
    } catch (error) {
      console.error("Error updating Room:", error);
      res.status(500).json({
        error: "An error occurred while updating the Room",
      });
    }
  },

  async deleteRoom(req, res) {
    const { id } = req.params;
    try {
      const room = await Room.findByPk(id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      await room.destroy();

      res.status(200).json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Error deleting Room:", error);
      res.status(500).json({
        error: "An error occurred while deleting the Room",
      });
    }
  },
};

export default roomControllers;
