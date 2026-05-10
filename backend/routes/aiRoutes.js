const express = require("express");
const router = express.Router();
const { chatWithAI, generateDescription, getRecommendations, searchAI } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// Các route AI công khai hoặc cần protect tùy tính năng
router.post("/chat", chatWithAI);
router.post("/generate-description", protect, generateDescription);
router.post("/recommendations", getRecommendations);
router.post("/search", searchAI);

module.exports = router;
