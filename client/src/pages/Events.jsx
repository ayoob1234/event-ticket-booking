
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function EventSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="skeleton h-48 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-10 w-full" />
      </div>
    </div>
  );
}

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    const fetchEvents = async () => {
      try {
        setError("");
        const response = await api.get("/events");

        if (active) {
          const data = response.data?.events;
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Fetch events error:", err);

        if (active) {
          setError("We couldn't load events right now. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchEvents();

    return () => {
      active = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return events;

    return events.filter((event) =>
      [
        event.title,
        event.description,
        event.venue,
        event.city,
        event.category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [events, search]);

  const formatDate = (value) => {
    if (!value) return "Date to be announced";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Date to be announced";

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatPrice = (event) => {
    const price =
      event.starting_price ??
      event.price ??
      event.ticket_price ??
      event.base_price;

    if (price === undefined || price === null || price === "") {
      return null;
    }

    const amount = Number(price);

    if (!Number.isFinite(amount)) return null;

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  
const getPoster = (event) => {
  // Agar event ki apni image hai, toh use hi dikhayein.
  const existingPoster =
    event.poster_url ||
    event.poster ||
    event.image_url ||
    event.image ||
    event.banner_url;

  if (existingPoster) return existingPoster;

  // Event ke naam, description aur category se image choose karein.
  const details = [
    event.title,
    event.description,
    event.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/music|concert|singer|band|dj/.test(details)) {
    return "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80";
  }

  if (/sport|cricket|football|kabaddi|match|tournament/.test(details)) {
    return "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80";
  }

  if (/tech|technology|ai|coding|developer|software/.test(details)) {
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80";
  }

  if (/business|conference|meeting|startup|seminar/.test(details)) {
    return "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80";
  }

  if (/food|cooking|restaurant|dinner/.test(details)) {
    return "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80";
  }

  if (/art|painting|design|exhibition/.test(details)) {
    return "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80";
  }

  // Baaki sabhi events ke liye default event photo.
  return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80";
};


  return (
    <div className="min-h-screen bg-slate-50 text-[#14213d]">
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="mb-8 rounded-3xl bg-[#14213d] px-6 py-8 text-white sm:px-10 sm:py-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-green-300">
            Find your next experience
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Discover events near you
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            From live music to sports and entertainment, find something worth
            looking forward to.
          </p>

          <label htmlFor="event-search" className="sr-only">
            Search events by name, city or venue
          </label>

          <div className="mt-6 flex max-w-2xl items-center gap-3 rounded-2xl bg-white p-2">
            <span className="pl-3 text-xl text-slate-400" aria-hidden="true">
              ⌕
            </span>
            <input
              id="event-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, cities or venues..."
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
            />
          </div>
        </section>

        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-green-700">
                YOUR NEXT OUTING
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Explore all events
              </h2>
            </div>

            {!loading && (
              <p className="text-sm text-slate-500">
                {filteredEvents.length}{" "}
                {filteredEvents.length === 1 ? "event" : "events"} found
              </p>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <EventSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-white p-8 text-center"
            >
              <h3 className="text-lg font-bold text-slate-900">
                Something went wrong
              </h3>
              <p className="mt-2 text-sm text-slate-600">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
              >
                Try again
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
              <div className="text-4xl" aria-hidden="true">
                🎟️
              </div>
              <h3 className="mt-4 text-xl font-bold">
                {events.length === 0
                  ? "No events available yet"
                  : "No matching events"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {events.length === 0
                  ? "New experiences will appear here when events are added."
                  : "Try searching with another event name, city or venue."}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 font-semibold text-green-700 hover:text-green-800"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => {
                const poster = getPoster(event);
                const price = formatPrice(event);

                return (
                  <article
                    key={event.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
                  >
                    <Link
                      to={`/events/${event.id}`}
                      aria-label={`View details for ${event.title}`}
                      className="block"
                    >
                      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-slate-100">
                        {poster ? (
                          <img
                            src={poster}
                            alt={event.title || "Event poster"}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                            <span className="text-4xl" aria-hidden="true">
                              ✦
                            </span>
                            <span className="mt-2 text-sm font-medium">
                              Event poster
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-5">
                      <p className="text-sm font-semibold text-green-700">
                        {formatDate(
                          event.start_date ||
                            event.event_date ||
                            event.date ||
                            event.start_time
                        )}
                      </p>

                      <h3 className="mt-2 line-clamp-2 text-xl font-bold text-[#14213d]">
                        {event.title || "Untitled event"}
                      </h3>

                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                        {event.description || "Discover this upcoming event."}
                      </p>

                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                        {event.venue && (
                          <p className="flex items-start gap-2">
                            <span aria-hidden="true">⌖</span>
                            <span>{event.venue}</span>
                          </p>
                        )}

                        {event.city && (
                          <p className="flex items-start gap-2">
                            <span aria-hidden="true">📍</span>
                            <span>{event.city}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500">
                            {price ? "Starting from" : "Ticket price"}
                          </p>
                          <p className="mt-1 font-bold text-[#14213d]">
                            {price || "View details"}
                          </p>
                        </div>

                        <Link
                          to={`/events/${event.id}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Evently. Find your next experience.
        </div>
      </footer>
    </div>
  );
}

export default Events;
