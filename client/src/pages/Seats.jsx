
import { io } from "socket.io-client";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function SeatSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
      {Array.from({ length: 24 }, (_, index) => (
        <div key={index} className="skeleton h-12 rounded-xl" />
      ))}
    </div>
  );
}

function Seats() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [locking, setLocking] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingId, setBookingId] = useState("");

  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchSeats = async () => {
      try {
        setError("");
        const response = await api.get(`/events/${id}/seats`);

        if (active) {
          setSeats(
            Array.isArray(response.data?.seats)
              ? response.data.seats
              : []
          );
        }
      } catch (err) {
        console.error("Fetch seats error:", err);
        if (active) setError("Failed to load seats. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSeats();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      socket.emit("join_event", id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("seat_update", async (data) => {
      if (data?.eventId && String(data.eventId) !== String(id)) {
        return;
      }

      try {
        const response = await api.get(`/events/${id}/seats`);
        setSeats(
          Array.isArray(response.data?.seats)
            ? response.data.seats
            : []
        );
      } catch (err) {
        console.error("Seat refresh failed:", err);
      }
    });

    return () => {
      socket.emit("leave_event", id);
      socket.disconnect();
    };
  }, [id]);

  const selectedIds = useMemo(
    () => new Set(selectedSeats.map((seat) => String(seat.id))),
    [selectedSeats]
  );

  const lockedIds = useMemo(
    () => new Set(lockedSeats.map((seat) => String(seat.id))),
    [lockedSeats]
  );

  const selectedTotal = selectedSeats.reduce(
    (total, seat) => total + Number(seat.price || 0),
    0
  );

  const lockedTotal = lockedSeats.reduce(
    (total, seat) => total + Number(seat.price || 0),
    0
  );

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const getStatus = (seat) => {
    if (lockedIds.has(String(seat.id))) return "YOUR LOCK";
    if (selectedIds.has(String(seat.id))) return "SELECTED";
    return String(seat.status || "AVAILABLE").toUpperCase();
  };

  const getSeatStyle = (seat) => {
    const status = getStatus(seat);
    const category = String(seat.category || "").toUpperCase();

    if (status === "SELECTED") {
      return "border-green-600 bg-green-600 text-white shadow-md shadow-green-100";
    }

    if (status === "YOUR LOCK") {
      return "border-amber-500 bg-amber-100 text-amber-900";
    }

    if (status === "BOOKED") {
      return "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400";
    }

    if (status === "LOCKED") {
      return "cursor-not-allowed border-orange-200 bg-orange-100 text-orange-700";
    }

    if (category.includes("VIP")) {
      return "border-purple-300 bg-purple-50 text-purple-800 hover:border-purple-500 hover:bg-purple-100";
    }

    return "border-slate-300 bg-white text-[#14213d] hover:border-green-500 hover:bg-green-50";
  };

  const handleSeatClick = (seat) => {
    if (seat.status !== "AVAILABLE" || lockedIds.has(String(seat.id))) {
      return;
    }

    setSelectedSeats((previousSeats) => {
      const alreadySelected = previousSeats.some(
        (item) => String(item.id) === String(seat.id)
      );

      if (alreadySelected) {
        return previousSeats.filter(
          (item) => String(item.id) !== String(seat.id)
        );
      }

      return [...previousSeats, seat];
    });
  };

  const handleLockSeats = async () => {
    if (selectedSeats.length === 0) {
      setError("Please select at least one available seat.");
      return;
    }

    try {
      setLocking(true);
      setError("");

      const seatIds = selectedSeats.map((seat) => seat.id);

      const response = await api.post(`/events/${id}/seats/lock`, {
        seat_ids: seatIds,
      });

      setLockedSeats([...selectedSeats]);
      setSelectedSeats([]);

      const seatsResponse = await api.get(`/events/${id}/seats`);
      setSeats(seatsResponse.data?.seats || []);

      // The backend remains the source of truth for seat status.
      console.log(
        response.data?.message || "Seats locked successfully"
      );
    } catch (err) {
      console.error("Lock seats error:", err);
      setError(
        err.response?.data?.message || "Unable to lock those seats. Please refresh and try again."
      );

      try {
        const response = await api.get(`/events/${id}/seats`);
        setSeats(response.data?.seats || []);
      } catch (refreshError) {
        console.error("Seat refresh failed:", refreshError);
      }
    } finally {
      setLocking(false);
    }
  };

  const handleCreateBooking = async () => {
    if (lockedSeats.length === 0) {
      setError("No locked seats found. Please select and lock seats first.");
      return;
    }

    try {
      setBooking(true);
      setError("");

      const response = await api.post("/bookings", {
        event_id: id,
        seat_ids: lockedSeats.map((seat) => seat.id),
      });

      const newBookingId = response.data?.booking?.id;

      if (!newBookingId) {
        throw new Error("Booking ID was not returned by the server.");
      }

      setBookingId(newBookingId);
    } catch (err) {
      console.error("Create booking error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create booking."
      );
    } finally {
      setBooking(false);
    }
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    if (!bookingId) {
      setError("Booking ID not found.");
      return;
    }

    try {
      setPaying(true);
      setError("");

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay. Check your internet connection.");
      }

      const orderResponse = await api.post("/payments/create-order", {
        booking_id: bookingId,
      });

      const orderData = orderResponse.data;
      const razorpayOrder = orderData?.order;

      if (!orderData?.key_id || !razorpayOrder?.id) {
        throw new Error("Razorpay order details are missing from the server.");
      }

      const options = {
        key: orderData.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "Event Ticket Booking",
        description: `Booking #${bookingId}`,
        order_id: razorpayOrder.id,

        handler: async (razorpayResponse) => {
          setPaying(true);

          try {
            const verifyResponse = await api.post("/payments/verify", {
              booking_id: bookingId,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });

            console.log("Payment verification response:", verifyResponse.data);
            setPaymentSuccess(true);
          } catch (err) {
            console.error("Payment verification error:", err);
            setError(
              err.response?.data?.message ||
                "Payment verification failed. Check your booking status before retrying."
            );
          } finally {
            setPaying(false);
          }
        },

        modal: {
          ondismiss: () => setPaying(false),
        },

        theme: {
          color: "#16a34a",
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response.error);
        setError(
          response.error?.description || "Payment failed. Please try again."
        );
        setPaying(false);
      });

      checkout.open();
      setPaying(false);
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start payment."
      );
      setPaying(false);
    }
  };

  const handleViewTicket = () => {
    navigate("/ticket", { state: { bookingId } });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="skeleton mb-6 h-8 w-48" />
          <div className="skeleton mb-8 h-20 w-full rounded-2xl" />
          <SeatSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-36 text-[#14213d] sm:pb-12">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          to={`/events/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#14213d]"
        >
          <span aria-hidden="true">←</span>
          Back to event
        </Link>

        <div className="mt-5">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-700">
            Book your experience
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Select your seats
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Choose your preferred seats below. Available seats can be selected;
            seat availability is updated from the server.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
          <div className="mx-auto max-w-xl">
            <div className="rounded-t-[50%] border-t-4 border-slate-300 pt-3 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">
                Stage / Screen
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs text-slate-600 sm:gap-x-7 sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-slate-300 bg-white" />
              Available
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-green-600 bg-green-600" />
              Selected
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-slate-300 bg-slate-200" />
              Booked
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-purple-300 bg-purple-50" />
              VIP
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-amber-500 bg-amber-100" />
              Your locked seats
            </div>
          </div>

          {seats.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-bold">No seats available</p>
              <p className="mt-2 text-sm text-slate-500">
                Seats have not been configured for this event yet.
              </p>
            </div>
          ) : (
            <div className="mt-8 overflow-x-auto pb-3">
              <div className="mx-auto grid w-max grid-cols-4 gap-2.5 sm:grid-cols-6 sm:gap-3 md:grid-cols-8">
                {seats.map((seat) => {
                  const status = getStatus(seat);
                  const isAvailable = seat.status === "AVAILABLE";
                  const isSelected = selectedIds.has(String(seat.id));

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      onClick={() => handleSeatClick(seat)}
                      disabled={!isAvailable || locking || booking || paying}
                      aria-pressed={isSelected}
                      aria-label={`Seat ${seat.seat_number}, ${status}, ${formatPrice(seat.price)}`}
                      title={`${seat.seat_number} · ${seat.category || "Standard"} · ${formatPrice(seat.price)} · ${status}`}
                      className={`flex h-14 w-[4.25rem] flex-col items-center justify-center rounded-xl border-2 text-xs font-bold transition sm:h-16 sm:w-[4.5rem] ${getSeatStyle(seat)} ${isAvailable ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      <span>{seat.seat_number}</span>
                      <span className="mt-1 text-[10px] font-medium opacity-80">
                        {formatPrice(seat.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {seats.length > 0 && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Tip: Select one or more available seats to continue.
            </p>
          )}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-extrabold">Your selection</h2>

            {selectedSeats.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No seats selected yet. Choose seats from the layout above.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat.id}
                      className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800"
                    >
                      {seat.seat_number}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm text-slate-500">
                    {selectedSeats.length} selected
                  </span>
                  <span className="text-lg font-extrabold">
                    {formatPrice(selectedTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLockSeats}
                  disabled={locking || selectedSeats.length === 0}
                  className="mt-5 min-h-12 w-full rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {locking ? "Locking seats..." : "Lock selected seats"}
                </button>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-extrabold">Booking summary</h2>

            {lockedSeats.length > 0 && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-bold">Seats locked for this booking flow</p>
                <p className="mt-1">
                  {lockedSeats.map((seat) => seat.seat_number).join(", ")}
                </p>
                <div className="mt-2 flex justify-between gap-3">
                  <span>Locked-seat total</span>
                  <span className="font-bold">{formatPrice(lockedTotal)}</span>
                </div>
              </div>
            )}

            {bookingId && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Booking ID</p>
                <p className="mt-1 break-all font-bold">{bookingId}</p>
              </div>
            )}

            {!bookingId && lockedSeats.length > 0 && (
              <button
                type="button"
                onClick={handleCreateBooking}
                disabled={booking}
                className="mt-5 min-h-12 w-full rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {booking ? "Creating booking..." : "Continue to booking"}
              </button>
            )}

            {bookingId && !paymentSuccess && (
              <button
                type="button"
                onClick={handlePayment}
                disabled={paying}
                className="mt-5 min-h-12 w-full rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {paying ? "Processing payment..." : "Pay now"}
              </button>
            )}

            {paymentSuccess && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="font-bold text-green-800">
                  Payment verified successfully
                </p>
                <p className="mt-1 text-sm text-green-700">
                  Your booking is ready to view.
                </p>
                <button
                  type="button"
                  onClick={handleViewTicket}
                  className="mt-4 min-h-11 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700"
                >
                  View my ticket
                </button>
              </div>
            )}

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Final payment amount and booking confirmation are handled by the
              backend. A successful checkout must be verified by the server.
            </p>
          </div>
        </section>
      </div>

      {selectedSeats.length > 0 && !bookingId && !paymentSuccess && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                {selectedSeats.length} seat(s) selected
              </p>
              <p className="mt-1 truncate text-lg font-extrabold">
                {formatPrice(selectedTotal)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLockSeats}
              disabled={locking}
              className="min-h-12 shrink-0 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {locking ? "Locking..." : "Continue"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Seats;
