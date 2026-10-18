
const pool = require("../config/db");

let cleanupRunning = false;
let cleanupInterval = null;

const releaseExpiredLocks = async (io) => {
  // Prevent overlapping cleanup runs
  if (cleanupRunning) return;

  cleanupRunning = true;
  let client;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

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

    const bookingResult = await client.query(`
      UPDATE bookings
      SET status = 'EXPIRED'
      WHERE status = 'PENDING'
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
      RETURNING id
    `);

    await client.query("COMMIT");

    const seatsByEvent = {};

    for (const seat of result.rows) {
      const eventId = String(seat.event_id);

      if (!seatsByEvent[eventId]) {
        seatsByEvent[eventId] = [];
      }

      seatsByEvent[eventId].push(seat.id);
    }

    for (const [eventId, seatIds] of Object.entries(seatsByEvent)) {
      if (io) {
        io.to(`event:${eventId}`).emit("seat_update", {
          eventId,
          seatIds,
          status: "AVAILABLE",
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
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Expired lock cleanup error:", error.message);
  } finally {
    if (client) {
      client.release();
    }

    cleanupRunning = false;
  }
};

const startLockCleanup = (io) => {
  if (cleanupInterval) return;

  // Run immediately, then every minute
  void releaseExpiredLocks(io);

  cleanupInterval = setInterval(() => {
    void releaseExpiredLocks(io);
  }, 60 * 1000);
};

module.exports = {
  startLockCleanup,
};
