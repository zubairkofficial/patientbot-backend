import { ChatGPTModel, ApiKey } from "./../models/index.js"; // Adjust the import path to your models directory
import crypto from "crypto";

const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY || "";

const encryptAPIKey = (key) => {
  const algorithm = "aes-256-cbc"; // AES with CBC mode
  const iv = crypto.randomBytes(16); // 16-byte IV for CBC mode

  // Ensure the encryption key is 256 bits (32 bytes) by hashing it with SHA-256
  const hashedKey = crypto
    .createHash("sha256")
    .update(process.env.ENCRYPTION_SECRET_KEY)
    .digest(); // 32-byte key

  const cipher = crypto.createCipheriv(algorithm, hashedKey, iv); // Create cipher with the hashed key and IV
  let encrypted = cipher.update(key, "utf-8", "hex"); // Ensure hex encoding
  encrypted += cipher.final("hex"); // Complete encryption process

  return {
    encryptedKey: encrypted, // Encrypted key in hex
    iv: iv.toString("hex"), // Initialization vector in hex format
  };
};

class ApiKeyController {
  /**
   * Create a ChatGPT Model
   */
  static async createModel(req, res) {
    try {
      const { modelName, description, maxTokens } = req.body;

      const model = await ChatGPTModel.create({
        modelName,
        description,
        maxTokens,
      });

      return res
        .status(201)
        .json({ message: "Model created successfully", model });
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Error creating model", error: error.message });
    }
  }

  /**
   * Get All Models
   */
  static async getModels(req, res) {
    try {
      const models = await ChatGPTModel.findAll();
      return res.status(200).json(models);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error fetching models", error: error.message });
    }
  }

  /**
   * Get Active API Key for Deepgram
   */
  static async getActiveDeepgramKey(req, res) {
    try {
      const apiKey = await ApiKey.findOne({
        where: { service: "Deepgram", isActive: true },
      });
      // Encrypt the API key before sending it
      const encrypted = encryptAPIKey(apiKey.apiKey);
      console.log("Encrypted Key:", encrypted.encryptedKey);
      console.log("IV:", encrypted.iv);
      if (!apiKey) {
        return res
          .status(404)
          .json({ message: "No active API key found for Deepgram." });
      }

      return res.status(200).json({
        encryptedKey: encrypted.encryptedKey,
        iv: encrypted.iv,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error fetching API key", error: error.message });
    }
  }

  /**
   * Get Active API Key for OpenAI
   */
  static async getActiveOpenAiKey(req, res) {
    try {
      const apiKey = await ApiKey.findOne({
        where: { service: "OpenAI", isActive: true },
      });

      if (!apiKey) {
        return res
          .status(404)
          .json({ message: "No active API key found for OpenAI." });
      }

      // Encrypt the API key before sending it
      const encrypted = encryptAPIKey(apiKey.apiKey);
      console.log("Encrypted Key:", encrypted.encryptedKey);
      console.log("IV:", encrypted.iv);

      return res.status(200).json({
        encryptedKey: encrypted.encryptedKey,
        iv: encrypted.iv,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error fetching API key", error: error.message });
    }
  }

  /**
   * Create an API Key
   */
  static async createApiKey(req, res) {
    try {
      const { keyName, apiKey, service, modelId, usageLimit } = req.body;

      // Validate if the model exists
      const model = await ChatGPTModel.findByPk(modelId);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }

      const apiKeyInstance = await ApiKey.create({
        keyName,
        apiKey,
        service,
        modelId,
        usageLimit,
      });

      return res.status(201).json({
        message: "API Key created successfully",
        apiKey: apiKeyInstance,
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Error creating API key", error: error.message });
    }
  }

  /**
   * Get All API Keys
   */
  static async getApiKeys(req, res) {
    try {
      const apiKeys = await ApiKey.findAll({
        include: [{ model: ChatGPTModel, as: "model" }],
      });

      return res.status(200).json(apiKeys);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error fetching API keys", error: error.message });
    }
  }

  /**
   * Update an API Key
   */
  static async updateApiKey(req, res) {
    try {
      const { id } = req.params;
      const { keyName, apiKey, service, usageLimit, isActive } = req.body;

      const apiKeyInstance = await ApiKey.findByPk(id);
      if (!apiKeyInstance) {
        return res.status(404).json({ message: "API Key not found" });
      }

      await apiKeyInstance.update({
        keyName,
        apiKey,
        service,
        usageLimit,
        isActive,
      });

      return res.status(200).json({
        message: "API Key updated successfully",
        apiKey: apiKeyInstance,
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Error updating API key", error: error.message });
    }
  }

  /**
   * Delete an API Key
   */
  static async deleteApiKey(req, res) {
    try {
      const { id } = req.params;

      const apiKeyInstance = await ApiKey.findByPk(id);
      if (!apiKeyInstance) {
        return res.status(404).json({ message: "API Key not found" });
      }

      await apiKeyInstance.destroy();

      return res.status(200).json({ message: "API Key deleted successfully" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error deleting API key", error: error.message });
    }
  }
}

export default ApiKeyController;
