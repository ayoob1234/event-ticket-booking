
const pool = require("../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Broadcast seat updates
const broadcastSeatUpdate = (req, eventId, seatIds, status) => {
  if (!seatIds || seatIds.length === 0) return;

  const io = req.app.get("io");
  if (!io) {
    console.warn("Socket.io unavailable");
    return;
  }

  io.to(`event:${eventId}`).emit("seat_update", {
    eventId: String(eventId),
    seatIds,
    status
  });
};

// Existing simulated payment endpoint
const createPayment = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const { booking_id, provider, simulate_failure } = req.body;

    if (!booking_id || !provider) {
      return res.status(400).json({
        message: "booking_id and provider are required"
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const result = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [booking_id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = result.rows[0];

    if (String(booking.user_id) !== String(req.user.id)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(403).json({ message: "Access denied" });
    }

    // NEW: Lock and check the event before processing payment.
    const eventResult = await client.query(
      `SELECT id, status
       FROM events
       WHERE id = $1
       FOR UPDATE`,
      [booking.event_id]
    );

    if (!eventResult.rows.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Event not found"
      });
    }

    if (
      String(eventResult.rows[0].status).toUpperCase() === "CANCELLED"
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message: "This event has been cancelled. Payment is not allowed."
      });
    }

    if (booking.status !== "PENDING") {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(409).json({ message: "Booking is not pending" });
    }

    const seatsResult = await client.query(
      `SELECT s.id, s.status, s.locked_by, s.locked_until
       FROM booking_items bi
       JOIN seats s ON s.id = bi.seat_id
       WHERE bi.booking_id = $1
       FOR UPDATE OF s`,
      [booking_id]
    );

    const invalidSeats = seatsResult.rows.some(
      seat =>
        seat.status !== "LOCKED" ||
        String(seat.locked_by) !== String(req.user.id) ||
        !seat.locked_until ||
        new Date(seat.locked_until) <= new Date()
    );

    if (
      !booking.expires_at ||
      new Date(booking.expires_at) <= new Date() ||
      !seatsResult.rows.length ||
      invalidSeats
    ) {
      await client.query(
        `UPDATE bookings SET status = 'EXPIRED', updated_at = NOW()
         WHERE id = $1`,
        [booking_id]
      );

      const released = await client.query(
        `UPDATE seats
         SET status = 'AVAILABLE', locked_by = NULL, locked_until = NULL
         WHERE id IN (
           SELECT seat_id FROM booking_items WHERE booking_id = $1
         )
         AND status = 'LOCKED'
         AND locked_by = $2
         RETURNING id`,
        [booking_id, req.user.id]
      );

      await client.query("COMMIT");
      transactionStarted = false;

      broadcastSeatUpdate(
        req,
        booking.event_id,
        released.rows.map(seat => seat.id),
        "AVAILABLE"
      );

      return res.status(409).json({
        message: "Booking or seat lock has expired"
      });
    }

    if (simulate_failure === true) {
      const payment = await client.query(
        `INSERT INTO payments
         (booking_id, provider, transaction_id, amount, status)
         VALUES ($1, $2, $3, $4, 'FAILED')
         RETURNING *`,
        [
          booking_id,
          provider,
          `TEST_FAIL_${Date.now()}`,
          booking.total_amount
        ]
      );

      await client.query(
        `UPDATE bookings SET status = 'CANCELLED', updated_at = NOW()
         WHERE id = $1`,
        [booking_id]
      );

      const released = await client.query(
        `UPDATE seats
         SET status = 'AVAILABLE', locked_by = NULL, locked_until = NULL
         WHERE id IN (
           SELECT seat_id FROM booking_items WHERE booking_id = $1
         )
         RETURNING id`,
        [booking_id]
      );

      await client.query("COMMIT");
      transactionStarted = false;

      broadcastSeatUpdate(
        req,
        booking.event_id,
        released.rows.map(seat => seat.id),
        "AVAILABLE"
      );

      return res.status(402).json({
        message: "Simulated payment failed",
        payment: payment.rows[0]
      });
    }

    const payment = await client.query(
      `INSERT INTO payments
       (booking_id, provider, transaction_id, amount, status, paid_at)
       VALUES ($1, $2, $3, $4, 'SUCCESS', NOW())
       RETURNING *`,
      [
        booking_id,
        provider,
        `TEST_TXN_${Date.now()}`,
        booking.total_amount
      ]
    );

    const bookedSeats = await client.query(
      `UPDATE seats
       SET status = 'BOOKED', locked_by = NULL, locked_until = NULL
       WHERE id IN (
         SELECT seat_id FROM booking_items WHERE booking_id = $1
       )
       AND status = 'LOCKED'
       AND locked_by = $2
       RETURNING id`,
      [booking_id, req.user.id]
    );

    if (bookedSeats.rows.length !== seatsResult.rows.length) {
      throw new Error("Seat booking count mismatch");
    }

    const updatedBooking = await client.query(
      `UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [booking_id]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    broadcastSeatUpdate(
      req,
      booking.event_id,
      bookedSeats.rows.map(seat => seat.id),
      "BOOKED"
    );

    return res.status(200).json({
      message: "Test payment successful",
      payment: payment.rows[0],
      booking: updatedBooking.rows[0]
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (e) {
        console.error("Rollback error:", e.message);
      }
    }

    console.error("Create payment error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

// Create a Razorpay order for a pending booking
const createRazorpayOrder = async (req, res) => {
  let client;

  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ message: "booking_id is required" });
    }

    // Use a transaction so the event status is checked consistently
    // while creating/reusing the payment order.
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT id, user_id, event_id, total_amount, status, expires_at
       FROM bookings
       WHERE id = $1
       FOR UPDATE`,
      [booking_id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = result.rows[0];

    if (String(booking.user_id) !== String(req.user.id)) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Access denied" });
    }

    // NEW: Check whether the event has been cancelled.
    const eventResult = await client.query(
      `SELECT id, status
       FROM events
       WHERE id = $1
       FOR UPDATE`,
      [booking.event_id]
    );

    if (!eventResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Event not found" });
    }

    if (
      String(eventResult.rows[0].status).toUpperCase() === "CANCELLED"
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "This event has been cancelled. Payment is not allowed."
      });
    }

    if (
      booking.status !== "PENDING" ||
      !booking.expires_at ||
      new Date(booking.expires_at) <= new Date()
    ) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Booking is not pending or has expired"
      });
    }

    const amountPaise = Math.round(Number(booking.total_amount) * 100);

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid booking amount" });
    }

    // Reuse an existing Razorpay order for this booking when possible.
    const existing = await client.query(
      `SELECT razorpay_order_id
       FROM payments
       WHERE booking_id = $1 AND provider = 'RAZORPAY'
         AND razorpay_order_id IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [booking_id]
    );

    let order;

    if (existing.rows[0]?.razorpay_order_id) {
      order = await razorpay.orders.fetch(
        existing.rows[0].razorpay_order_id
      );
    } else {
      order = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `booking_${booking.id}`,
        notes: {
          booking_id: String(booking.id),
          user_id: String(req.user.id)
        }
      });

      await client.query(
        `INSERT INTO payments
         (booking_id, provider, transaction_id, amount, status, razorpay_order_id)
         VALUES ($1, 'RAZORPAY', $2, $3, 'PENDING', $4)`,
        [booking.id, order.id, booking.total_amount, order.id]
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Razorpay order created",
      key_id: process.env.RAZORPAY_KEY_ID,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      booking: {
        id: booking.id,
        total_amount: booking.total_amount,
        event_id: booking.event_id
      }
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Order rollback error:", rollbackError.message);
      }
    }

    console.error("Create Razorpay order error:", error.message);
    return res.status(500).json({
      message: "Unable to create payment order"
    });
  } finally {
    if (client) client.release();
  }
};

// Verify the Razorpay signature and confirm the booking
const verifyRazorpayPayment = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const {
      booking_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (
      !booking_id ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "All Razorpay payment fields are required"
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const supplied = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      supplied.length !== expected.length ||
      !crypto.timingSafeEqual(supplied, expected)
    ) {
      return res.status(400).json({
        message: "Invalid payment signature"
      });
    }

    // Fetch gateway payment details; do not trust browser-supplied amount/status.
    const gatewayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      gatewayPayment.order_id !== razorpay_order_id ||
      gatewayPayment.status !== "captured" ||
      gatewayPayment.currency !== "INR"
    ) {
      return res.status(409).json({
        message: "Payment is not captured or does not match this order"
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const bookingResult = await client.query(
      `SELECT id, user_id, event_id, total_amount, status, expires_at
       FROM bookings
       WHERE id = $1
       FOR UPDATE`,
      [booking_id]
    );

    if (!bookingResult.rows.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    if (String(booking.user_id) !== String(req.user.id)) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(403).json({ message: "Access denied" });
    }

    // NEW: Check the event status before confirming payment.
    const eventResult = await client.query(
      `SELECT id, status
       FROM events
       WHERE id = $1
       FOR UPDATE`,
      [booking.event_id]
    );

    if (!eventResult.rows.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Event not found"
      });
    }

    if (
      String(eventResult.rows[0].status).toUpperCase() === "CANCELLED"
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message: "This event has been cancelled. Payment cannot be confirmed."
      });
    }

    const expectedAmount = Math.round(Number(booking.total_amount) * 100);

    if (
      Number(gatewayPayment.amount) !== expectedAmount ||
      booking.status !== "PENDING" ||
      !booking.expires_at ||
      new Date(booking.expires_at) <= new Date()
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(409).json({
        message: "Payment amount or booking status is invalid"
      });
    }

    const paymentResult = await client.query(
      `SELECT id, amount, status
       FROM payments
       WHERE booking_id = $1 AND razorpay_order_id = $2
       FOR UPDATE`,
      [booking_id, razorpay_order_id]
    );

    if (!paymentResult.rows.length) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(404).json({
        message: "Order does not belong to this booking"
      });
    }

    const paymentRecord = paymentResult.rows[0];

    if (paymentRecord.status === "SUCCESS") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        message: "This payment has already been processed"
      });
    }

    const seatsResult = await client.query(
      `SELECT s.id, s.status, s.locked_by, s.locked_until
       FROM booking_items bi
       JOIN seats s ON s.id = bi.seat_id
       WHERE bi.booking_id = $1
       FOR UPDATE OF s`,
      [booking_id]
    );

    const invalidSeats = seatsResult.rows.some(
      seat =>
        seat.status !== "LOCKED" ||
        String(seat.locked_by) !== String(req.user.id) ||
        !seat.locked_until ||
        new Date(seat.locked_until) <= new Date()
    );

    if (!seatsResult.rows.length || invalidSeats) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return res.status(409).json({
        message: "Seat locks have expired or are no longer valid"
      });
    }

    const updatedPayment = await client.query(
      `UPDATE payments
       SET provider = 'RAZORPAY',
           transaction_id = $2,
           razorpay_payment_id = $2,
           status = 'SUCCESS',
           paid_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [paymentRecord.id, razorpay_payment_id]
    );

    const bookedSeats = await client.query(
      `UPDATE seats
       SET status = 'BOOKED', locked_by = NULL, locked_until = NULL
       WHERE id IN (
         SELECT seat_id FROM booking_items WHERE booking_id = $1
       )
       AND status = 'LOCKED'
       AND locked_by = $2
       RETURNING id`,
      [booking_id, req.user.id]
    );

    if (bookedSeats.rows.length !== seatsResult.rows.length) {
      throw new Error("Seat booking count mismatch");
    }

    const updatedBooking = await client.query(
      `UPDATE bookings
       SET status = 'CONFIRMED', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [booking_id]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    broadcastSeatUpdate(
      req,
      booking.event_id,
      bookedSeats.rows.map(seat => seat.id),
      "BOOKED"
    );

    return res.status(200).json({
      message: "Razorpay payment verified and booking confirmed",
      payment: updatedPayment.rows[0],
      booking: updatedBooking.rows[0]
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (e) {
        console.error("Verification rollback error:", e.message);
      }
    }

    console.error("Verify Razorpay payment error:", error.message);
    return res.status(500).json({
      message: "Unable to verify payment"
    });
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  createPayment,
  createRazorpayOrder,
  verifyRazorpayPayment
};
