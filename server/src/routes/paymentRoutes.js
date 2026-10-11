
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createPayment,
  createRazorpayOrder,
  verifyRazorpayPayment
} = require("../controllers/paymentController");

// Existing simulated payment endpoint
router.post("/", authMiddleware, createPayment);

// Razorpay Test Mode endpoints
router.post(
  "/create-order",
  authMiddleware,
  createRazorpayOrder
);

router.post(
  "/verify",
  authMiddleware,
  verifyRazorpayPayment
);

module.exports = router;
