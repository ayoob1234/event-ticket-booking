
const pool = require("../config/db");

// Release expired seat locks
const releaseExpiredLocks = async (db) => {
  await db.query(`
    UPDATE seats
    SET
      status = 'AVAILABLE',
      locked_by = NULL,
      locked_until = NULL
    WHERE status = 'LOCKED'
      AND locked_until < NOW()
  `);
};

// Broadcast an update to clients watching an event
const broadcastSeatUpdate = (req, eventId, seats, status) => {
  const io = req.app.get("io");

  if (!io) {
    console.warn("Socket.io is unavailable; seat update not broadcast");
    return;
  }

  io.to(`event:${eventId}`).emit("seat_update", {
    eventId: String(eventId),
    seatIds: seats.map((seat) => seat.id),
    status
  });

  console.log(`Seat update broadcast for event: ${eventId}`);
};

// Create Event
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      venue,
      city,
      event_date,
      status
    } = req.body;

    if (!title || !venue || !city || !event_date) {
      return res.status(400).json({
        message: "Title, venue, city and event date are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO events
       (organizer_id, title, description, venue, city, event_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        title,
        description || null,
        venue,
        city,
        event_date,
        status || "DRAFT"
      ]
    );

    return res.status(201).json({
      message: "Event created successfully",
      event: result.rows[0]
    });
  } catch (error) {
    console.error("Create event error:", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Get All Events + Filters
// Users do not receive cancelled events.
// Admins can receive cancelled events when authentication middleware
// attaches req.user to the request.
const getEvents = async (req, res) => {
  try {
    const { city, date, category } = req.query;
    const isAdmin =
      req.user && String(req.user.role).toUpperCase() === "ADMIN";

    let query = `
      SELECT
        e.id,
        e.organizer_id,
        e.title,
        e.description,
        e.venue,
        e.city,
        e.event_date,
        e.status,
        e.category_id,
        c.name AS category,
        e.created_at,
        e.updated_at
      FROM events e
      LEFT JOIN event_categories c
        ON e.category_id = c.id
      WHERE 1=1
    `;

    const values = [];

    if (!isAdmin) {
      query += ` AND UPPER(e.status) <> 'CANCELLED'`;
    }

    if (city) {
      values.push(city);
      query += ` AND LOWER(e.city) = LOWER($${values.length})`;
    }

    if (date) {
      values.push(date);
      query += ` AND DATE(e.event_date) = $${values.length}`;
    }

    if (category) {
      values.push(category);
      query += ` AND LOWER(c.name) = LOWER($${values.length})`;
    }

    query += ` ORDER BY e.event_date ASC`;

    const result = await pool.query(query, values);

    return res.status(200).json({
      message: "Events fetched successfully",
      count: result.rows.length,
      events: result.rows
    });
  } catch (error) {
    console.error("Get events error:", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Get Event By ID
// Cancelled events are hidden from non-admin users.
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const isAdmin =
      req.user && String(req.user.role).toUpperCase() === "ADMIN";

    let query = `
      SELECT
        id,
        organizer_id,
        title,
        description,
        venue,
        city,
        event_date,
        status,
        category_id,
        created_at,
        updated_at
      FROM events
      WHERE id = $1
    `;

    if (!isAdmin) {
      query += ` AND UPPER(status) <> 'CANCELLED'`;
    }

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    return res.status(200).json({
      message: "Event fetched successfully",
      event: result.rows[0]
    });
  } catch (error) {
    console.error("Get event by ID error:", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Get Event Seats
const getEventSeats = async (req, res) => {
  try {
    const { id } = req.params;

    const eventResult = await pool.query(
      `SELECT id, title, status
       FROM events
       WHERE id = $1`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const isAdmin =
      req.user && String(req.user.role).toUpperCase() === "ADMIN";

    if (
      !isAdmin &&
      String(eventResult.rows[0].status).toUpperCase() === "CANCELLED"
    ) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    await releaseExpiredLocks(pool);

    const seatsResult = await pool.query(
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
       ORDER BY seat_number ASC`,
      [id]
    );

    return res.status(200).json({
      message: "Seats fetched successfully",
      event: eventResult.rows[0],
      count: seatsResult.rows.length,
      seats: seatsResult.rows
    });
  } catch (error) {
    console.error("Get event seats error:", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Lock Seats - Cancelled events cannot be booked
const lockSeats = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const { id } = req.params;
    const { seat_ids } = req.body;

    if (!Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.status(400).json({
        message: "seat_ids must be a non-empty array"
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const eventResult = await client.query(
      `SELECT id, status
       FROM events
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Event not found"
      });
    }

    if (String(eventResult.rows[0].status).toUpperCase() === "CANCELLED") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message: "This event has been cancelled. Seat booking is not allowed."
      });
    }

    await client.query(
      `UPDATE seats
       SET
         status = 'AVAILABLE',
         locked_by = NULL,
         locked_until = NULL
       WHERE event_id = $1
         AND status = 'LOCKED'
         AND locked_until <= NOW()`,
      [id]
    );

    const seatsResult = await client.query(
      `SELECT
        id,
        seat_number,
        category,
        price,
        status
       FROM seats
       WHERE event_id = $1
         AND id = ANY($2::uuid[])
       FOR UPDATE`,
      [id, seat_ids]
    );

    if (seatsResult.rows.length !== seat_ids.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "One or more seats not found"
      });
    }

    const unavailableSeats = seatsResult.rows.filter(
      (seat) => seat.status !== "AVAILABLE"
    );

    if (unavailableSeats.length > 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        message: "One or more seats are not available",
        seats: unavailableSeats
      });
    }

    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);

    const updateResult = await client.query(
      `UPDATE seats
       SET
         status = 'LOCKED',
         locked_by = $1,
         locked_until = $2
       WHERE event_id = $3
         AND id = ANY($4::uuid[])
       RETURNING
         id,
         event_id,
         seat_number,
         category,
         price,
         status,
         locked_by,
         locked_until`,
      [req.user.id, lockedUntil, id, seat_ids]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    broadcastSeatUpdate(req, id, updateResult.rows, "LOCKED");

    return res.status(200).json({
      message: "Seats locked successfully",
      lock_duration_minutes: 10,
      seats: updateResult.rows
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Seat lock rollback error:", rollbackError.message);
      }
    }

    console.error("Lock seats error:", error.message);

    return res.status(500).json({
      message: "Internal server error"
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Update Event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      venue,
      city,
      event_date,
      category_id,
      status
    } = req.body;

    const eventResult = await pool.query(
      `SELECT id
       FROM events
       WHERE id = $1`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const result = await pool.query(
      `UPDATE events
       SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         venue = COALESCE($3, venue),
         city = COALESCE($4, city),
         event_date = COALESCE($5, event_date),
         category_id = COALESCE($6, category_id),
         status = COALESCE($7, status),
         updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        title,
        description,
        venue,
        city,
        event_date,
        category_id,
        status,
        id
      ]
    );

    return res.status(200).json({
      message: "Event updated successfully",
      event: result.rows[0]
    });
  } catch (error) {
    console.error("Update event error:", error);

    return res.status(500).json({
      message: "Failed to update event",
      error: error.message
    });
  }
};

// Get Event Stats
const getEventStats = async (req, res) => {
  try {
    const { id } = req.params;

    const eventResult = await pool.query(
      `SELECT
        id,
        title,
        venue,
        city,
        event_date,
        status
       FROM events
       WHERE id = $1`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    const seatStatsResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_seats,
        COUNT(*) FILTER (WHERE status = 'AVAILABLE')::int AS available_seats,
        COUNT(*) FILTER (WHERE status = 'LOCKED')::int AS locked_seats,
        COUNT(*) FILTER (WHERE status = 'BOOKED')::int AS booked_seats
       FROM seats
       WHERE event_id = $1`,
      [id]
    );

    const bookingStatsResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_bookings,
        COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_bookings,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED')::int AS confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'EXPIRED')::int AS expired_bookings
       FROM bookings
       WHERE event_id = $1`,
      [id]
    );

    const revenueResult = await pool.query(
      `SELECT
        COALESCE(SUM(p.amount), 0) AS total_revenue
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE b.event_id = $1
         AND p.status = 'SUCCESS'`,
      [id]
    );

    return res.status(200).json({
      message: "Event statistics fetched successfully",
      event: eventResult.rows[0],
      seats: seatStatsResult.rows[0],
      bookings: bookingStatsResult.rows[0],
      revenue: {
        total_revenue: revenueResult.rows[0].total_revenue
      }
    });
  } catch (error) {
    console.error("Get event stats error:", error);

    return res.status(500).json({
      message: "Failed to fetch event statistics",
      error: error.message
    });
  }
};

// Cancel Event
const cancelEvent = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const { id } = req.params;

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const eventResult = await client.query(
      `SELECT id, title, status
       FROM events
       WHERE id = $1
       FOR UPDATE`,
      [id]
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
        message: "Event is already cancelled"
      });
    }

    const result = await client.query(
      `UPDATE events
       SET status = 'CANCELLED',
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, venue, city, event_date, status, updated_at`,
      [id]
    );

    const releasedSeats = await client.query(
      `UPDATE seats
       SET
         status = 'AVAILABLE',
         locked_by = NULL,
         locked_until = NULL
       WHERE event_id = $1
         AND status = 'LOCKED'
       RETURNING id`,
      [id]
    );

    const cancelledTickets = await client.query(
      `UPDATE tickets t
       SET status = 'CANCELLED'
       FROM bookings b
       WHERE t.booking_id = b.id
         AND b.event_id = $1
         AND t.status = 'ACTIVE'
       RETURNING t.id`,
      [id]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    broadcastSeatUpdate(req, id, releasedSeats.rows, "AVAILABLE");

    return res.status(200).json({
      message: "Event cancelled successfully",
      event: result.rows[0],
      released_seat_count: releasedSeats.rows.length,
      cancelled_ticket_count: cancelledTickets.rows.length
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Cancel event rollback error:", rollbackError.message);
      }
    }

    console.error("Cancel event error:", error.message);

    return res.status(500).json({
      message: "Failed to cancel event"
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Get Categories
const getCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description
      FROM event_categories
      ORDER BY name ASC
    `);

    return res.json({
      message: "Categories fetched successfully",
      categories: result.rows
    });
  } catch (error) {
    console.error("Get categories error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch categories"
    });
  }
};

// Create Seats
const createSeats = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const { id: eventId } = req.params;
    const { seats } = req.body;

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        message: "Seats array is required"
      });
    }

    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    const eventResult = await client.query(
      `SELECT id, status
       FROM events
       WHERE id = $1
       FOR UPDATE`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Event not found"
      });
    }

    if (String(eventResult.rows[0].status).toUpperCase() === "CANCELLED") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message: "Cannot create seats for a cancelled event"
      });
    }

    const createdSeats = [];

    for (const seat of seats) {
      const { seat_number, category, price } = seat;

      if (!seat_number || !category || price === undefined) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(400).json({
          message: "Each seat must have seat_number, category and price"
        });
      }

      const existingSeat = await client.query(
        `SELECT id
         FROM seats
         WHERE event_id = $1
           AND seat_number = $2`,
        [eventId, seat_number]
      );

      if (existingSeat.rows.length > 0) {
        await client.query("ROLLBACK");
        transactionStarted = false;

        return res.status(409).json({
          message: `Seat ${seat_number} already exists for this event`
        });
      }

      const result = await client.query(
        `INSERT INTO seats
         (
           event_id,
           seat_number,
           category,
           price,
           status
         )
         VALUES ($1, $2, $3, $4, 'AVAILABLE')
         RETURNING
           id,
           event_id,
           seat_number,
           category,
           price,
           status`,
        [eventId, seat_number, category, price]
      );

      createdSeats.push(result.rows[0]);
    }

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      message: "Seats created successfully",
      seats: createdSeats
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Create seats rollback error:", rollbackError.message);
      }
    }

    console.error("Create seats error:", error.message);

    return res.status(500).json({
      message: "Failed to create seats"
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
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
};
