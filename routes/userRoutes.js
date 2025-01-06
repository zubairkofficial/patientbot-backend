// userRoutes.js
import express from "express";
import userController from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

// Apply authMiddleware to all routes in this router
const router = express.Router();
router.use(authMiddleware);

router.post("/", userController.createUser); // Add new user
router.get("/", userController.getAllUsers);
router.get("/students", userController.getAllStudents); // Get all users
router.get("/:id", userController.getUserById); // Get user by ID
router.put("/:id", userController.updateUser); // Update user
router.delete("/:id", userController.deleteUser); // Delete user
router.put("/:id/update-password", userController.updatePassword);

router.post("/assign-patients", userController.assignPatient);
router.get("/assigned", (req, res) => {
  console.log("Hello World");
  res.send("Hello World"); // Respond to the request
});

export default router;
