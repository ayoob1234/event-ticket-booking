const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  generateTicket,
  verifyTicket
} = require("../controllers/ticketController");

router.post(
  "/generate",
  authMiddleware,
  generateTicket
);

router.post(
  "/verify",
  authMiddleware,
  roleMiddleware("ADMIN"),
  verifyTicket
);

module.exports = router;