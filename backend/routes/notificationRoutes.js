const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} = require("../controllers/notificationController");

router.get("/", protect, getMyNotifications);
router.patch("/read-all", protect, markAllAsRead);
router.patch("/:id/read", protect, markAsRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
