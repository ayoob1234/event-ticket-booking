
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createEvent,
  getEvents,
  getEventById,
  getEventSeats,
  lockSeats,
  updateEvent,
  getEventStats,
  cancelEvent,
  getCategories,
  createSeats
} = require("../controllers/eventController");

// Public listing: token ho to role identify hoga, warna public access
router.get("/", optionalAuthMiddleware, getEvents);

router.get("/categories", getCategories);

router.get(
  "/:id/seats",
  optionalAuthMiddleware,
  getEventSeats
);

router.get(
  "/:id",
  optionalAuthMiddleware,
  getEventById
);

// Admin-only routes
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createEvent
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateEvent
);

router.post(
  "/:id/seats",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createSeats
);

router.get(
  "/:id/stats",
  authMiddleware,
  roleMiddleware("ADMIN"),
  getEventStats
);

router.put(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("ADMIN"),
  cancelEvent
);

// Logged-in users only
router.post(
  "/:id/seats/lock",
  authMiddleware,
  lockSeats
);

module.exports = router;
