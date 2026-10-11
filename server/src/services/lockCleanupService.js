
const pool = require("../config/db");

const releaseExpiredLocks = async (io) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Release all expired seat locks
    const result = await client.query(`
      UPDATE seats
      SET
        status = 'AVAILABLE',
        locked_by = NULL,
        locked_until = NULL
      WHERE status = 'LOCKED'
        AND locked_until IS NOT NULL
        AND locked_until < NOW()
      RETURNING id, event_id
    `);

    // 2. Mark expired pending bookings as EXPIRED
    const bookingResult = await client.query(`
      UPDATE bookings
      SET status = 'EXPIRED'
      WHERE status = 'PENDING'
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
      RETURNING id
    `);

    await client.query("COMMIT");

    // 3. Group released seats by event
    const seatsByEvent = {};

    for (const seat of result.rows) {
      const eventId = String(seat.event_id);

      if (!seatsByEvent[eventId]) {
        seatsByEvent[eventId] = [];
      }

      seatsByEvent[eventId].push(seat.id);
    }

    // 4. Notify connected users through Socket.io
    for (const [eventId, seatIds] of Object.entries(seatsByEvent)) {
      if (io) {
        io.to(`event:${eventId}`).emit("seat_update", {
          eventId,
          seatIds,
          status: "AVAILABLE"
        });
      }

      console.log(
        `Released ${seatIds.length} expired seat(s) for event ${eventId}`
      );
    }

    if (bookingResult.rowCount > 0) {
      console.log(
        `${bookingResult.rowCount} pending booking(s) marked EXPIRED`
      );
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Expired lock cleanup error:", error.message);
  } finally {
    client.release();
  }
};

const startLockCleanup = (io) => {
  // Run once when the server starts
  releaseExpiredLocks(io);

  // Repeat every minute
  setInterval(() => {
    releaseExpiredLocks(io);
  }, 60 * 1000);
};

module.exports = {
  startLockCleanup
};
