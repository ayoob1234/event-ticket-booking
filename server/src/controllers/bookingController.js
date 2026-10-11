
const pool = require("../config/db");

// Broadcast seat updates to users watching this event
const broadcastSeatUpdate = (req, eventId, seatIds, status) => {
  const io = req.app.get("io");

  if (!io) {
    console.warn("Socket.io unavailable; seat update not broadcast");
    return;
  }

  io.to(`event:${eventId}`).emit("seat_update", {
    eventId: String(eventId),
    seatIds,
    status
  });

  console.log(
    `Seat update broadcast: event=${eventId}, status=${status}`
  );
};

// Create Booking
const createBooking = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const { event_id, seat_ids } = req.body;

    if (
      !event_id ||
      !Array.isArray(seat_ids) ||
      seat_ids.length === 0
    ) {
      return res.status(400).json({
        message: "event_id and seat_ids are required"
      });
    }

    // Reject duplicate seat IDs
    const uniqueSeatIds = [...new Set(seat_ids)];

    if (uniqueSeatIds.length !== seat_ids.length) {
      return res.status(400).json({
        message: "Duplicate seat IDs are not allowed"
      });
    }

    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    
const eventResult = await client.query(
  `SELECT id, title, status
   FROM events
   WHERE id = $1
   FOR UPDATE`,
  [event_id]
);

if (eventResult.rows.length === 0) {
  await client.query("ROLLBACK");
  transactionStarted = false;

  return res.status(404).json({
    message: "Event not found"
  });
}

const event = eventResult.rows[0];

if (String(event.status).toUpperCase() === "CANCELLED") {
  await client.query("ROLLBACK");
  transactionStarted = false;

  return res.status(400).json({
    message: "This event has been cancelled. Booking is not allowed."
  });
}


    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Event not found"
      });
    }

    // Release expired locks for this event
    const expiredSeatsResult = await client.query(
      `UPDATE seats
       SET status = 'AVAILABLE',
           locked_by = NULL,
           locked_until = NULL
       WHERE event_id = $1
         AND status = 'LOCKED'
         AND locked_until <= NOW()
       RETURNING id`,
      [event_id]
    );

    // Lock requested seat rows while validating
    const seatsResult = await client.query(
      `SELECT
        id,
        event_id,
        seat_number,
        category,
        price,
        status,
        locked_by,
        locked_until
       FROM seats
       WHERE event_id = $1
         AND id = ANY($2::uuid[])
       FOR UPDATE`,
      [event_id, uniqueSeatIds]
    );

    if (seatsResult.rows.length !== uniqueSeatIds.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "One or more seats not found"
      });
    }

    // Seats must still be locked by the current user
    const invalidSeats = seatsResult.rows.filter(
      (seat) =>
        seat.status !== "LOCKED" ||
        String(seat.locked_by) !== String(req.user.id) ||
        !seat.locked_until ||
        new Date(seat.locked_until) <= new Date()
    );

    if (invalidSeats.length > 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        message: "One or more seats are not locked by you",
        seats: invalidSeats
      });
    }

    const totalAmount = seatsResult.rows.reduce(
      (total, seat) => total + Number(seat.price),
      0
    );

    const expiresAt = new Date(
      Math.min(
        ...seatsResult.rows.map(
          (seat) => new Date(seat.locked_until).getTime()
        )
      )
    );

    // Create pending booking; seats remain LOCKED until payment succeeds
    const bookingResult = await client.query(
      `INSERT INTO bookings
       (user_id, event_id, total_amount, status, expires_at)
       VALUES ($1, $2, $3, 'PENDING', $4)
       RETURNING *`,
      [
        req.user.id,
        event_id,
        totalAmount,
        expiresAt
      ]
    );

    const booking = bookingResult.rows[0];

    // Link the locked seats to the booking
    for (const seat of seatsResult.rows) {
      await client.query(
        `INSERT INTO booking_items
         (booking_id, seat_id, price)
         VALUES ($1, $2, $3)`,
        [
          booking.id,
          seat.id,
          seat.price
        ]
      );
    }

    await client.query("COMMIT");
    transactionStarted = false;

    // Broadcast any expired seats released during this transaction
    if (expiredSeatsResult.rows.length > 0) {
      broadcastSeatUpdate(
        req,
        event_id,
        expiredSeatsResult.rows.map((seat) => seat.id),
        "AVAILABLE"
      );
    }

    return res.status(201).json({
      message: "Booking created successfully. Complete payment before the booking expires.",
      booking: {
        id: booking.id,
        user_id: booking.user_id,
        event_id: booking.event_id,
        event_title: eventResult.rows[0].title,
        total_amount: booking.total_amount,
        status: booking.status,
        expires_at: booking.expires_at,
        created_at: booking.created_at
      },
      seats: seatsResult.rows.map((seat) => ({
        id: seat.id,
        seat_number: seat.seat_number,
        category: seat.category,
        price: seat.price,
        status: seat.status
      }))
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Booking rollback error:",
          rollbackError.message
        );
      }
    }

    console.error("Create booking error:", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Get My Bookings
const getMyBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        b.id AS booking_id,
        b.event_id,
        e.title AS event_title,
        e.venue,
        e.city,
        e.event_date,
        b.total_amount,
        b.status,
        b.expires_at,
        b.created_at,
        bi.id AS booking_item_id,
        s.id AS seat_id,
        s.seat_number,
        s.category,
        bi.price
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       JOIN booking_items bi ON b.id = bi.booking_id
       JOIN seats s ON bi.seat_id = s.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      message: "Bookings fetched successfully",
      count: result.rows.length,
      bookings: result.rows
    });
  } catch (error) {
    console.error("Get my bookings error:", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Cancel Booking
const cancelBooking = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const { id } = req.params;

    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    const bookingResult = await client.query(
      `SELECT id, user_id, event_id, status
       FROM bookings
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Booking not found"
      });
    }

    const booking = bookingResult.rows[0];

    if (String(booking.user_id) !== String(req.user.id)) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(403).json({
        message: "You are not allowed to cancel this booking"
      });
    }

    if (booking.status !== "CONFIRMED") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message:
          `Booking cannot be cancelled because its status is ${booking.status}`
      });
    }

    await client.query(
      `UPDATE bookings
       SET status = 'CANCELLED',
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    const releasedSeatsResult = await client.query(
      `UPDATE seats
       SET status = 'AVAILABLE',
           locked_by = NULL,
           locked_until = NULL
       WHERE id IN (
         SELECT seat_id
         FROM booking_items
         WHERE booking_id = $1
       )
       RETURNING id`,
      [id]
    );

    await client.query(
      `UPDATE tickets
       SET status = 'CANCELLED'
       WHERE booking_id = $1
         AND status = 'ACTIVE'`,
      [id]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    broadcastSeatUpdate(
      req,
      booking.event_id,
      releasedSeatsResult.rows.map((seat) => seat.id),
      "AVAILABLE"
    );

    return res.status(200).json({
      message: "Booking cancelled successfully"
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Cancellation rollback error:",
          rollbackError.message
        );
      }
    }

    console.error("Cancel booking error:", error.message);

    return res.status(500).json({
      message: "Failed to cancel booking"
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking
};
