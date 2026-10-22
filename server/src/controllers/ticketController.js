
const pool = require("../config/db");
const QRCode = require("qrcode");
const { sendEmail } = require("../services/emailService");

const generateTicket = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({
        message: "booking_id is required",
      });
    }

    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    // Lock and check booking
    const bookingResult = await client.query(
      `SELECT id, user_id, event_id, total_amount, status
       FROM bookings
       WHERE id = $1
       FOR UPDATE`,
      [booking_id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Booking not found",
      });
    }

    const booking = bookingResult.rows[0];

    // Verify booking owner before fetching personal details
    if (String(booking.user_id) !== String(req.user.id)) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(403).json({
        message: "You are not allowed to generate ticket for this booking",
      });
    }

    // Fetch email and event details
    const detailsResult = await client.query(
      `SELECT
         u.name AS user_name,
         u.email AS user_email,
         e.title AS event_title,
         e.venue,
         e.city,
         e.event_date
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       JOIN events e ON e.id = b.event_id
       WHERE b.id = $1`,
      [booking_id]
    );

    if (detailsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Booking or email details not found",
      });
    }

    const emailDetails = detailsResult.rows[0];

    // Lock and check event status
    const eventResult = await client.query(
      `SELECT id, status
       FROM events
       WHERE id = $1
       FOR UPDATE`,
      [booking.event_id]
    );

    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Event not found",
      });
    }

    if (String(eventResult.rows[0].status).toUpperCase() === "CANCELLED") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message:
          "This event has been cancelled. Ticket generation is not allowed.",
      });
    }

    // Booking must be confirmed
    if (booking.status !== "CONFIRMED") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message: "Ticket can only be generated for a confirmed booking",
      });
    }

    // Check if ticket already exists
    const existingTicket = await client.query(
      `SELECT id, booking_id, ticket_code, qr_code, status, created_at
       FROM tickets
       WHERE booking_id = $1`,
      [booking_id]
    );

    if (existingTicket.rows.length > 0) {
      await client.query("COMMIT");
      transactionStarted = false;

      return res.status(200).json({
        message: "Ticket already exists",
        ticket: existingTicket.rows[0],
        emailSent: null,
        emailNote:
          "No new email was sent because this ticket already exists.",
      });
    }

    // Generate unique ticket code
    const ticketCode =
      "TKT-" +
      Date.now() +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(ticketCode);

    const eventDate = new Date(emailDetails.event_date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }
    );

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#222">
        <h2 style="color:#16a34a">Your Evently Ticket is Ready!</h2>
        <p>Hi ${escapeHtml(emailDetails.user_name)},</p>
        <p>Your booking is confirmed and your ticket has been generated.</p>

        <h3>${escapeHtml(emailDetails.event_title)}</h3>
        <p><strong>Venue:</strong> ${escapeHtml(emailDetails.venue || "To be announced")}, ${escapeHtml(emailDetails.city || "")}</p>
        <p><strong>Date:</strong> ${escapeHtml(eventDate)}</p>

        <p><strong>Ticket Code:</strong> ${escapeHtml(ticketCode)}</p>
        <p>Show the QR code below at the event entrance:</p>
        <img src="${qrCode}" alt="Ticket QR Code" style="width:220px;max-width:100%;height:auto" />
        <p style="color:#666;font-size:13px">
          Please keep this email safe and do not share your ticket QR code publicly.
        </p>
        <p>Thank you for choosing Evently!</p>
      </div>
    `;

    const emailText = `
Your Evently ticket is ready!

Event: ${emailDetails.event_title}
Venue: ${emailDetails.venue || "To be announced"}, ${emailDetails.city || ""}
Date: ${eventDate}
Ticket Code: ${ticketCode}

Please open the HTML version of this email to view your QR code.
`;

    // Insert ticket
    const ticketResult = await client.query(
      `INSERT INTO tickets
       (booking_id, ticket_code, qr_code, status)
       VALUES ($1, $2, $3, 'ACTIVE')
       RETURNING id, booking_id, ticket_code, qr_code, status, created_at`,
      [booking_id, ticketCode, qrCode]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    // Send email after successful commit.
    // Email failure must not undo the generated ticket.
    let emailSent = true;

    try {
      await sendEmail({
        to: emailDetails.user_email,
        subject: `Your Evently Ticket - ${emailDetails.event_title}`,
        text: emailText,
        html: emailHtml,
      });
    } catch (emailError) {
      emailSent = false;
      console.error("Ticket email failed:", emailError.message);
    }

    return res.status(201).json({
      message: "Ticket generated successfully",
      ticket: ticketResult.rows[0],
      emailSent,
      ...(emailSent
        ? {}
        : {
            emailNote:
              "Ticket was generated, but the email could not be sent. Please contact support if needed.",
          }),
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Generate ticket rollback error:",
          rollbackError.message
        );
      }
    }

    console.error("Generate ticket error:", error.message);

    return res.status(500).json({
      message: "Failed to generate ticket",
    });
  } finally {
    if (client) client.release();
  }
};

// Escape database text before inserting it into HTML.
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

const verifyTicket = async (req, res) => {
  let client;
  let transactionStarted = false;

  try {
    const { ticket_code } = req.body;

    if (!ticket_code) {
      return res.status(400).json({
        message: "ticket_code is required",
      });
    }

    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    // Lock ticket, booking and event rows for verification
    const ticketResult = await client.query(
      `SELECT
         t.id,
         t.ticket_code,
         t.status,
         t.used_at,
         t.booking_id,
         b.user_id,
         b.event_id,
         b.status AS booking_status,
         e.title,
         e.venue,
         e.event_date,
         e.status AS event_status
       FROM tickets t
       JOIN bookings b ON t.booking_id = b.id
       JOIN events e ON b.event_id = e.id
       WHERE t.ticket_code = $1
       FOR UPDATE OF t, b, e`,
      [ticket_code]
    );

    if (ticketResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        message: "Invalid ticket",
      });
    }

    const ticket = ticketResult.rows[0];

    if (String(ticket.event_status).toUpperCase() === "CANCELLED") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message:
          "This event has been cancelled. Ticket is not valid for entry.",
        ticket: {
          ticket_code: ticket.ticket_code,
          status: ticket.status,
        },
        event: {
          id: ticket.event_id,
          title: ticket.title,
          status: ticket.event_status,
        },
      });
    }

    if (ticket.booking_status !== "CONFIRMED") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message: "Booking is not confirmed. Ticket cannot be used.",
      });
    }

    if (ticket.status === "USED") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(409).json({
        message: "Ticket has already been used",
        ticket: {
          ticket_code: ticket.ticket_code,
          status: ticket.status,
          used_at: ticket.used_at,
        },
      });
    }

    if (ticket.status !== "ACTIVE") {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(400).json({
        message: "Ticket is not active",
        status: ticket.status,
      });
    }

    // Mark ticket as USED
    const updateResult = await client.query(
      `UPDATE tickets
       SET status = 'USED',
           used_at = NOW()
       WHERE id = $1
       RETURNING id, ticket_code, status, used_at`,
      [ticket.id]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(200).json({
      message: "Ticket verified successfully",
      ticket: updateResult.rows[0],
      event: {
        id: ticket.event_id,
        title: ticket.title,
        venue: ticket.venue,
        event_date: ticket.event_date,
      },
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Verify ticket rollback error:",
          rollbackError.message
        );
      }
    }

    console.error("Verify ticket error:", error.message);

    return res.status(500).json({
      message: "Failed to verify ticket",
    });
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  generateTicket,
  verifyTicket,
};
