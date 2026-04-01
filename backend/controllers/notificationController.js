const Notification = require("../models/notificationModel");

// Utility function để tạo thông báo từ code khác (orderController, v.v.)
const createNotification = async ({ user, type, title, message, link = "" }) => {
    try {
        await Notification.create({ user, type, title, message, link });
    } catch (err) {
        console.error("Notification create error:", err.message);
    }
};

// GET /api/notifications - Lấy thông báo của user đang đăng nhập
const getMyNotifications = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
        res.json({ notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/notifications/:id/read - Đánh dấu đã đọc
const markAsRead = async (req, res) => {
    try {
        const notif = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notif) return res.status(404).json({ message: "Không tìm thấy thông báo" });
        res.json(notif);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/notifications/read-all - Đánh dấu tất cả đã đọc
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
        res.json({ message: "Đã đọc tất cả thông báo" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/notifications/:id - Xóa một thông báo
const deleteNotification = async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ message: "Đã xóa thông báo" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createNotification,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
