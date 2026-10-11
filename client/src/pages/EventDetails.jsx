
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function EventDetails() {
  const { id } = useParams(); 
  const navigate = useNavigate();
const token = localStorage.getItem("token");
const isLoggedIn = Boolean(token);

const handleSeatClick = () => {
  if (!isLoggedIn) {
    navigate("/login", {
      state: { from: `/events/${id}/seats` }
    });
    return;
  }

  navigate(`/events/${id}/seats`);
};

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchEvent = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/events/${id}`);

        if (active) {
          setEvent(response.data?.event || null);
        }
      } catch (err) {
        console.error("Fetch event error:", err);

        if (active) {
          setError("We couldn't load this event. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchEvent();

    return () => {
      active = false;
    };
  }, [id]);

  const formatDate = (value) => {
    if (!value) return "Date to be announced";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date to be announced";
    }

    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getPoster = (item) =>
    item?.poster_url ||
    item?.poster ||
    item?.image_url ||
    item?.image ||
    item?.banner_url ||
    "";

  const getPrice = (item) => {
    const value =
      item?.starting_price ??
      item?.price ??
      item?.ticket_price ??
      item?.base_price;

    if (value === undefined || value === null || value === "") {
      return null;
    }

    const amount = Number(value);

    if (!Number.isFinite(amount)) return null;

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="skeleton mb-6 h-5 w-32" />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="skeleton h-72 w-full rounded-3xl sm:h-96" />
            <div className="space-y-5 py-2">
              <div className="skeleton h-5 w-28" />
              <div className="skeleton h-10 w-4/5" />
              <div className="skeleton h-5 w-full" />
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton h-32 w-full" />
              <div className="skeleton h-12 w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <div className="text-4xl" aria-hidden="true">
            🎟️
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-[#14213d]">
            {error ? "Unable to load event" : "Event not found"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "This event may no longer be available."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {error && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
              >
                Try again
              </button>
            )}
            <Link
              to="/events"
              className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-[#14213d] hover:bg-slate-50"
            >
              Browse events
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const poster = getPoster(event);
  const price = getPrice(event);
  const eventDate =
    event.event_date ||
    event.start_date ||
    event.start_time ||
    event.date;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-[#14213d] sm:pb-10">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-600 transition hover:text-[#14213d]"
        >
          <span aria-hidden="true">←</span>
          All events
        </Link>

        <div className="mt-5 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <section>
            <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-3xl bg-slate-200 sm:min-h-96">
              {poster ? (
                <img
                  src={poster}
                  alt={event.title || "Event poster"}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex min-h-64 w-full flex-col items-center justify-center bg-gradient-to-br from-[#14213d] to-slate-700 text-white sm:min-h-96">
                  <span className="text-6xl" aria-hidden="true">
                    ✦
                  </span>
                  <p className="mt-3 text-sm font-medium text-slate-200">
                    Event poster coming soon
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 hidden rounded-2xl border border-slate-200 bg-white p-6 sm:block">
              <h2 className="text-lg font-bold">About this event</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                {event.description || "More event information will be available soon."}
              </p>
            </div>
          </section>

          <section className="min-w-0">
            <p className="inline-flex rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-green-700">
              Event details
            </p>

            <h1 className="mt-4 break-words text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {event.title || "Untitled event"}
            </h1>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              {event.description || "Discover this upcoming experience."}
            </p>

            <div className="mt-7 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                  <span aria-hidden="true">▦</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Date and time
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold">
                    {formatDate(eventDate)}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                  <span aria-hidden="true">⌖</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Venue
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold">
                    {event.venue || "Venue to be announced"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {event.city || "Location to be announced"}
                  </p>
                </div>
              </div>

              {event.status && (
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                    <span aria-hidden="true">✓</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Event status
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {event.status}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 hidden rounded-2xl border border-slate-200 bg-white p-5 sm:block">
              <p className="text-sm text-slate-500">Ticket price</p>
              <p className="mt-1 text-2xl font-extrabold">
                {price || "See available seats"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Final price may depend on the seats you select.
              </p>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:static sm:mt-6 sm:rounded-2xl sm:border sm:bg-white sm:p-5">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                <div className="min-w-0 sm:hidden">
                  <p className="text-xs text-slate-500">Ticket price</p>
                  <p className="mt-1 truncate font-extrabold">
                    {price || "View seats"}
                  </p>
                </div>

                {isLoggedIn ? (
  <button
    type="button"
    onClick={handleSeatClick}
    className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-green-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-green-700 sm:w-full"
  >
    Select Seats →
  </button>
) : (
  <div className="flex flex-1 flex-col gap-2 sm:flex-row">
    <button
      type="button"
      onClick={() => navigate("/login", {
        state: { from: `/events/${id}/seats` }
      })}
      className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700"
    >
      Login to Book
    </button>

    <button
      type="button"
      onClick={() => navigate("/register", {
        state: { from: `/events/${id}/seats` }
      })}
      className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-[#14213d] hover:bg-slate-50"
    >
      Register
    </button>
  </div>
)}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:hidden">
          <h2 className="text-lg font-bold">About this event</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
            {event.description || "More event information will be available soon."}
          </p>
        </section>
      </main>
    </div>
  );
}

export default EventDetails;
