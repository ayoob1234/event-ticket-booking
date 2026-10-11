
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/bookings/me");
      setBookings(response.data?.bookings || []);
    } catch (err) {
      console.error("Fetch bookings error:", err);

      setError(
        err.response?.data?.message ||
          "We couldn't load your bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleViewTicket = (bookingId) => {
    navigate("/ticket", {
      state: { bookingId },
    });
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    try {
      setCancellingId(bookingId);
      setError("");

      const response = await api.post(
        `/bookings/${bookingId}/cancel`
      );

      window.alert(
        response.data?.message ||
          "Booking cancelled successfully."
      );

      await fetchBookings();
    } catch (err) {
      console.error("Cancel booking error:", err);

      window.alert(
        err.response?.data?.message ||
          "Unable to cancel this booking. Please try again."
      );
    } finally {
      setCancellingId("");
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date not available";
    }

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) return "—";

    return value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-50 text-green-700 ring-green-200";

      case "CANCELLED":
        return "bg-red-50 text-red-700 ring-red-200";

      case "PENDING":
        return "bg-amber-50 text-amber-700 ring-amber-200";

      default:
        return "bg-slate-100 text-slate-700 ring-slate-200";
    }
  };

  const confirmedCount = bookings.filter(
    (booking) => booking.status === "CONFIRMED"
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.status === "CANCELLED"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="skeleton mb-3 h-9 w-56" />
          <div className="skeleton mb-8 h-5 w-72 max-w-full" />

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="skeleton h-24 rounded-2xl"
              />
            ))}
          </div>

          <div className="space-y-5">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="skeleton h-64 rounded-2xl"
              />
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Loading your bookings...
          </p>
        </div>
      </main>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <main className="min-h-[65vh] bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
            !
          </div>

          <h1 className="text-2xl font-bold text-[#14213d]">
            Couldn't load bookings
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchBookings();
            }}
            className="mt-6 rounded-xl bg-[#14213d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Try again
          </button>

          <div className="mt-5">
            <Link
              to="/events"
              className="text-sm font-semibold text-green-700 hover:text-green-800"
            >
              Browse events
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
              Your Evently account
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-[#14213d] sm:text-4xl">
              My Bookings
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Keep track of your events, seats, and tickets in one place.
            </p>
          </div>

          <Link
            to="/events"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">＋</span>
            Explore events
          </Link>
        </div>

        {/* Summary cards */}
        <section
          aria-label="Booking summary"
          className="mb-8 grid gap-4 sm:grid-cols-3"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">
                Total bookings
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl">
                ▤
              </span>
            </div>

            <p className="mt-3 text-3xl font-bold text-[#14213d]">
              {bookings.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Booking records
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">
                Confirmed
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-xl">
                ✓
              </span>
            </div>

            <p className="mt-3 text-3xl font-bold text-green-700">
              {confirmedCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Confirmed booking records
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">
                Cancelled
              </p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-xl">
                ×
              </span>
            </div>

            <p className="mt-3 text-3xl font-bold text-red-600">
              {cancelledCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Cancelled booking records
            </p>
          </div>
        </section>

        {/* Fetch or cancellation error */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Bookings list */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#14213d] sm:text-2xl">
              Your tickets
            </h2>

            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              {bookings.length}{" "}
              {bookings.length === 1 ? "record" : "records"}
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                🎟️
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#14213d]">
                Your next experience starts here
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                You haven't made any bookings yet. Explore upcoming events
                and find something you'll love.
              </p>

              <Link
                to="/events"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Find an event
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {bookings.map((booking, index) => (
                <article
                  key={`${booking.booking_id}-${booking.seat_number ?? index}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Card header */}
                  <div className="border-b border-slate-100 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#14213d] text-2xl text-white sm:flex">
                          ♫
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words text-xl font-bold text-[#14213d] sm:text-2xl">
                            {booking.event_title || "Event"}
                          </h3>

                          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            <span aria-hidden="true">▦</span>
                            {formatDate(booking.event_date)}
                          </p>

                          <p className="mt-1 break-words text-sm text-slate-600">
                            <span aria-hidden="true">⌖</span>{" "}
                            {[booking.venue, booking.city]
                              .filter(Boolean)
                              .join(", ") || "Venue details unavailable"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${getStatusStyle(
                          booking.status
                        )}`}
                      >
                        <span
                          className="mr-2 h-1.5 w-1.5 rounded-full bg-current"
                          aria-hidden="true"
                        />
                        {booking.status || "UNKNOWN"}
                      </span>
                    </div>
                  </div>

                  {/* Booking details */}
                  <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Booking ID
                      </p>

                      <p className="mt-2 break-all font-semibold text-[#14213d]">
                        {booking.booking_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Seat number
                      </p>

                      <p className="mt-2 font-semibold text-[#14213d]">
                        {booking.seat_number || "—"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Category: {booking.category || "Standard"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Seat price
                      </p>

                      <p className="mt-2 font-semibold text-[#14213d]">
                        ₹{formatAmount(booking.price)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Booking amount
                      </p>

                      <p className="mt-2 text-xl font-bold text-[#14213d]">
                        ₹{formatAmount(booking.total_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Card actions */}
                  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs leading-5 text-slate-500">
                      {booking.status === "CONFIRMED"
                        ? "Your booking is confirmed. Keep your ticket ready for entry."
                        : booking.status === "CANCELLED"
                          ? "This booking has been cancelled."
                          : "Check your booking status before attending the event."}
                    </p>

                    {booking.status === "CONFIRMED" ? (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() =>
                            handleViewTicket(booking.booking_id)
                          }
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#14213d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14213d] focus-visible:ring-offset-2"
                        >
                          <span aria-hidden="true">▣</span>
                          View Ticket
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleCancelBooking(booking.booking_id)
                          }
                          disabled={cancellingId === booking.booking_id}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cancellingId === booking.booking_id
                            ? "Cancelling..."
                            : "Cancel Booking"}
                        </button>
                      </div>
                    ) : booking.status === "CANCELLED" ? (
                      <span className="text-sm font-semibold text-red-600">
                        Booking cancelled
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Back link */}
        <div className="mt-8">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-green-700"
          >
            <span aria-hidden="true">←</span>
            Back to events
          </Link>
        </div>
      </div>
    </main>
  );
}

export default MyBookings;
