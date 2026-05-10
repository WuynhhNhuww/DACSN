const express = require("express");
const router = express.Router();
const { getMessages, sendMessage, getConversations, getUnreadCount, markAsRead } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

router.get("/unread", protect, getUnreadCount);
router.get("/conversations", protect, getConversations);
router.patch("/:userId/read", protect, markAsRead);
router.get("/:userId", protect, getMessages);
router.post("/", protect, sendMessage);

module.exports = router;
