const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createBooking,
  getMyBookings,
  cancelBooking
} = require("../controllers/bookingController");

// Get logged-in user's bookings
router.get(
  "/me",
  authMiddleware,
  getMyBookings
);

// Create booking
router.post(
  "/",
  authMiddleware,
  createBooking
);

// Cancel booking
router.post(
  "/:id/cancel",
  authMiddleware,
  cancelBooking
);

module.exports = router;