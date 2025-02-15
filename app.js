import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js"; // Ensure to include the .js extension
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import symptomRoutes from "./routes/symptomRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";
import openaiRoutes from "./routes/openaiRoutes.js";
import apiKeyRoutes from "./routes/apiKeyRoutes.js";
import testRoutes from "./routes/testRoutes.js"; // Import the test route
import requestRoutes from "./routes/requestRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";

const app = express();

app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// Define routes for user and authentication management
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/symptoms", symptomRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/requests", requestRoutes);
app.use("/api/v1/home", homeRoutes);
app.use("/api/v1/openai", openaiRoutes);
app.use("/api/v1/apiKeys", apiKeyRoutes);
app.use("/api/v1/testing", testRoutes);
app.use("/api/v1/rooms", roomRoutes);

app.get("/api/v1/", (req, res) => {
  res.send({ Hello: "World" });
});

export default app; // Use export default instead of module.exports
