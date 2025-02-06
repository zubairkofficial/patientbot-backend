import { Room, User, Assignment } from "../models/index.js";

const roomControllers = {
  // ✅ Create a new room
  async createRoom(req, res) {
    const { name, roomNumber } = req.body;

    if (!name || !roomNumber) {
      return res.status(400).json({
        message: "Name and room number are required.",
      });
    }

    try {
      const userId = req.user?.id; // Get the authenticated user's ID
      if (!userId) {
        return res.status(403).json({ message: "Unauthorized action." });
      }

      const slug = name.toLowerCase().replace(/\s+/g, "");

      // Check if the room already exists
      const existingRoom = await Room.findOne({ where: { slug } });
      if (existingRoom) {
        return res.status(400).json({
          message: "A room with this name already exists.",
        });
      }

      const newRoom = await Room.create({ name, roomNumber, slug, userId });

      res.status(201).json({ message: "Room created successfully.", room: newRoom });
    } catch (error) {
      console.error("Error creating Room:", error);
      res.status(500).json({ error: "An error occurred while creating the room." });
    }
  },

  // ✅ Get all rooms
  async getAllRooms(req, res) {
    try {
      const rooms = await Room.findAll();
      res.status(200).json({ rooms });
    } catch (error) {
      console.error("Error fetching Rooms:", error);
      res.status(500).json({ error: "An error occurred while fetching Rooms." });
    }
  },

  // ✅ Assign students to a room
  async assignStudentsToRoom(req, res) {
    const { roomId, studentIds } = req.body;

    if (!roomId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "Room ID and Student IDs are required." });
    }

    try {
      const room = await Room.findByPk(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found." });
      }

      const students = await User.findAll({
        where: { id: studentIds, isAdmin: false },
      });

      if (students.length !== studentIds.length) {
        return res.status(400).json({ message: "Some student IDs are invalid." });
      }

      // Assign students to the room
      await Promise.all(
        students.map((student) => {
          student.roomId = roomId;
          return student.save();
        })
      );

      res.status(200).json({ message: "Students assigned to the room successfully.", roomId, studentIds });
    } catch (error) {
      console.error("Error assigning students:", error);
      res.status(500).json({ error: "An error occurred while assigning students." });
    }
  },

  // ✅ Get a specific room by ID
  async getRoomById(req, res) {
    const { id } = req.params;

    try {
      const room = await Room.findByPk(id);
      if (!room) {
        return res.status(404).json({ message: "Room not found." });
      }

      res.status(200).json(room);
    } catch (error) {
      console.error("Error fetching Room:", error);
      res.status(500).json({ error: "An error occurred while fetching the room." });
    }
  },

  // ✅ Get all rooms along with their students
  async getRoomsAndStudents(req, res) {
    try {
      const rooms = await Room.findAll({
        include: [
          {
            model: User,
            as: "students",
            attributes: ["id", "name", "email"],
            where: { isAdmin: false },
            required: false,
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
        ],
        attributes: ["id", "name", "roomNumber"],
      });

      res.status(200).json({ message: "Rooms with students fetched successfully.", data: rooms });
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "An error occurred while fetching rooms." });
    }
  },

  // ✅ Get students' scores in a specific room
  async getScoresByRoomId(req, res) {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required." });
    }

    try {
      const students = await User.findAll({
        where: { roomId },
        attributes: ["id", "name", "email"],
      });

      if (students.length === 0) {
        return res.status(404).json({ message: "No students found in this room." });
      }

      const studentIds = students.map((student) => student.id);
      const assignments = await Assignment.findAll({
        where: { userId: studentIds },
        attributes: ["userId", "score", "mandatoryQuestionScore", "symptomsScore", "treatmentScore", "diagnosisScore"],
      });

      const studentScores = students.map((student) => ({
        student: { id: student.id, name: student.name, email: student.email },
        scores: assignments.filter((a) => a.userId === student.id),
      }));

      res.status(200).json({ message: "Scores fetched successfully.", data: studentScores });
    } catch (error) {
      console.error("Error fetching scores:", error);
      res.status(500).json({ message: "An error occurred while fetching scores." });
    }
  },

  // ✅ Update a room
  async updateRoom(req, res) {
    const { id } = req.params;
    const { name, roomNumber } = req.body;

    try {
      const room = await Room.findByPk(id);
      if (!room) {
        return res.status(404).json({ message: "Room not found." });
      }

      const slug = name.toLowerCase().replace(/\s+/g, "");
      const existingRoom = await Room.findOne({ where: { slug } });
      if (existingRoom && existingRoom.id !== id) {
        return res.status(400).json({ message: "A Room with this name already exists." });
      }

      room.name = name;
      room.roomNumber = roomNumber;
      room.slug = slug;
      await room.save();

      res.status(200).json({ message: "Room updated successfully", room });
    } catch (error) {
      console.error("Error updating Room:", error);
      res.status(500).json({ error: "An error occurred while updating the room." });
    }
  },

  // ✅ Delete a room
  async deleteRoom(req, res) {
    const { id } = req.params;

    try {
      const room = await Room.findByPk(id);
      if (!room) {
        return res.status(404).json({ message: "Room not found." });
      }

      await room.destroy({ force: true }); // Add force: true to perform hard delete
      res.status(200).json({ message: "Room permanently deleted successfully." });
    } catch (error) {
      console.error("Error deleting Room:", error);
      res.status(500).json({ error: "An error occurred while deleting the room." });
    }
  },

  // ✅ Delete student from room
  async removeStudentFromRoom(req, res) {
    const { studentId } = req.params; // Student ID from URL params

    try {
        // Check if the student exists
        const student = await User.findByPk(studentId);

        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        // Ensure the student is not an admin
        if (student.isAdmin) {
            return res.status(400).json({ message: "Admins cannot be removed from rooms." });
        }

        // Check if the student is already unassigned
        if (!student.roomId) {
            return res.status(400).json({ message: "Student is not assigned to any room." });
        }

        // Remove student from the room by setting roomId to NULL
        student.roomId = null;
        await student.save();

        res.status(200).json({ message: "Student removed from the room successfully." });
    } catch (error) {
        console.error("Error removing student from room:", error);
        res.status(500).json({ error: "An error occurred while removing the student from the room." });
    }
}



};

export default roomControllers;
