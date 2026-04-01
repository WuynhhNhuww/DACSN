const express = require("express");
const router = express.Router();
const {
  createComplaint, getComplaints, getComplaintById, sellerRespond, escalateComplaint, resolveComplaint,
} = require("../controllers/complaintController");
const { protect, admin } = require("../middleware/authMiddleware");

router.post("/", protect, createComplaint);
router.get("/", protect, getComplaints);
router.get("/:id", protect, getComplaintById);
router.put("/:id/seller-respond", protect, sellerRespond);
router.put("/:id/escalate", protect, escalateComplaint);
router.put("/:id/resolve", protect, admin, resolveComplaint);

module.exports = router;
