const Message = require("../models/messageModel");

exports.getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const count = await Message.countDocuments({
      receiver: currentUserId,
      read: false
    });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.params; // The ID of the person we are chatting with
    const currentUserId = req.user._id;

    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { $set: { read: true } }
    );

    // Phát event qua socket cho tất cả các tab của user hiện tại
    const io = req.app.get("io");
    if (io && global.userSockets) {
      const socketId = global.userSockets.get(currentUserId.toString());
      if (socketId) {
        io.to(socketId).emit("messages_read");
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const currentUserId = req.user._id;

    if (!receiverId || !text) {
      return res.status(400).json({ message: "Vui lòng nhập nội dung và người nhận" });
    }

    const message = await Message.create({
      sender: currentUserId,
      receiver: receiverId,
      text
    });

    // Real-time: gửi qua socket
    const io = req.app.get("io");
    if (io && global.userSockets) {
      const receiverSocketId = global.userSockets.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("new_message", message);
      }
      
      // Implicitly mark as read for sender
      const senderSocketId = global.userSockets.get(currentUserId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_read");
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name email sellerInfo")
      .populate("receiver", "name email sellerInfo");

    const conversationsMap = new Map();

    messages.forEach(msg => {
      // Vì populate có thể bị null nếu record user bị xóa
      if (!msg.sender || !msg.receiver) return;

      const isSender = msg.sender._id.toString() === currentUserId.toString();
      const otherUser = isSender ? msg.receiver : msg.sender;
      const otherId = otherUser._id.toString();

        if (!conversationsMap.has(otherId)) {
          conversationsMap.set(otherId, {
            user: {
              _id: otherUser._id,
              name: otherUser.name,
              shopName: otherUser.sellerInfo?.shopName || null
            },
            lastMessage: msg.text,
            updatedAt: msg.createdAt,
            unreadCount: 0
          });
        }
        
        // Count unread messages from this user
        if (msg.receiver.toString() === currentUserId.toString() && !msg.read) {
            conversationsMap.get(otherId).unreadCount += 1;
        }
    });

    res.json(Array.from(conversationsMap.values()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
