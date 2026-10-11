
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import api from "../services/api";

function Ticket() {
  const location = useLocation();
  const bookingId = location.state?.bookingId;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const generateTicket = async () => {
      if (!bookingId) {
        setError("Booking ID not found. Please open your ticket from My Bookings.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.post("/tickets/generate", {
          booking_id: bookingId,
        });

        if (active) {
          setTicket(response.data?.ticket || null);

          if (!response.data?.ticket) {
            setError("Ticket details were not returned. Please try again.");
          }
        }
      } catch (err) {
        console.error("Generate ticket error:", err);

        if (active) {
          setError(
            err.response?.data?.message ||
              "Failed to generate your ticket. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    generateTicket();

    return () => {
      active = false;
    };
  }, [bookingId]);

  const status = String(ticket?.status || "UNKNOWN").toUpperCase();
  const isConfirmed = status === "CONFIRMED" || status === "VALID";

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="skeleton mx-auto mb-4 h-12 w-12 rounded-full" />
          <div className="skeleton mx-auto mb-3 h-7 w-52 max-w-full" />
          <div className="skeleton mx-auto mb-8 h-4 w-64 max-w-full" />
          <div className="skeleton mx-auto h-56 w-56 max-w-full rounded-2xl" />
          <p className="mt-6 text-center text-sm text-slate-500">
            Preparing your ticket...
          </p>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">
            !
          </div>

          <h1 className="text-2xl font-bold text-[#14213d]">
            Ticket unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error || "We couldn't find your ticket details."}
          </p>

          {!bookingId && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Open My Bookings and select View Ticket for your confirmed booking.
            </p>
          )}

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {bookingId && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-[#14213d] px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Try again
              </button>
            )}

            <Link
              to="/my-bookings"
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-[#14213d] hover:bg-slate-50"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Success message */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
            ✓
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
            You're all set
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#14213d] sm:text-4xl">
            Your Event Ticket
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Keep this ticket ready and show your QR code at the event entrance.
          </p>
        </div>

        {/* Ticket card */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
          {/* Navy header */}
          <div className="relative overflow-hidden bg-[#14213d] px-6 py-7 text-white sm:px-10 sm:py-9">
            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[24px] border-white/5" />
            <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full border-[20px] border-white/5" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">
                  EVENTLY · DIGITAL PASS
                </p>

                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                  Booking confirmed
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  Your ticket is ready.
                </p>
              </div>

              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl sm:flex">
                🎟️
              </div>
            </div>
          </div>

          {/* Ticket code */}
          <div className="px-6 py-7 sm:px-10">
            <div className="flex flex-col gap-4 border-b border-dashed border-slate-300 pb-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ticket code
                </p>

                <p className="mt-2 break-all font-mono text-xl font-bold tracking-wide text-[#14213d] sm:text-2xl">
                  {ticket.ticket_code || "—"}
                </p>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${
                  isConfirmed
                    ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                    : status === "CANCELLED" || status === "INVALID"
                      ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {status.replaceAll("_", " ")}
              </span>
            </div>

            {/* QR code */}
            <div className="py-8 text-center">
              <h3 className="text-lg font-bold text-[#14213d]">
                Your entry QR code
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Present this code to the event staff for scanning.
              </p>

              {ticket.qr_code ? (
                <div className="mx-auto mt-6 flex w-fit max-w-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                  <img
                    src={ticket.qr_code}
                    alt={`QR code for ticket ${ticket.ticket_code || ""}`}
                    className="h-auto w-56 max-w-full object-contain sm:w-64"
                  />
                </div>
              ) : (
                <div className="mx-auto mt-6 flex min-h-48 max-w-xs items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  QR code is not available for this ticket.
                </div>
              )}

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Keep your QR code private. Each ticket should be checked by the event's authorised scanner.
              </p>
            </div>

            {/* Bottom ticket information */}
            <div className="grid gap-4 border-t border-dashed border-slate-300 pt-6 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ticket status
                </p>
                <p className="mt-2 font-semibold text-[#14213d]">
                  {status.replaceAll("_", " ")}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ticket reference
                </p>
                <p className="mt-2 break-all font-mono text-sm font-semibold text-[#14213d]">
                  {ticket.ticket_code || "Not available"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
              >
                <span aria-hidden="true">⎙</span>
                Print / Save as PDF
              </button>

              <Link
                to="/my-bookings"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#14213d] transition hover:bg-slate-50"
              >
                My Bookings
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-6 text-center">
          <Link
            to="/events"
            className="text-sm font-semibold text-slate-600 transition hover:text-green-700"
          >
            ← Browse more events
          </Link>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
          }

          nav,
          header,
          footer,
          button,
          main > div > div:last-child {
            display: none !important;
          }

          main {
            min-height: auto !important;
            padding: 0 !important;
            background: white !important;
          }

          main > div {
            max-width: none !important;
          }

          main section {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            break-inside: avoid;
          }

          main section > div:first-child {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          img {
            max-width: 100% !important;
          }
        }
      `}</style>
    </main>
  );
}

export default Ticket;
