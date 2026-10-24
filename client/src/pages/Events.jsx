
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

function EventSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
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
  const [searchParams, setSearchParams] = useSearchParams();

  const searchFromUrl = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchFromUrl);

  // Keep the search input synchronized with homepage links and browser navigation.
  useEffect(() => {
    setSearch(searchFromUrl);
  }, [searchFromUrl]);

  // Load events from the existing backend API.
  useEffect(() => {
    let active = true;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/events");

        if (active) {
          const data = response.data?.events;
          setEvents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Fetch events error:", err);

        if (active) {
          setError(
            "We couldn't load events right now. Please try again."
          );
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

  // Filter events locally without changing the backend API.
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
        event.category_name,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [events, search]);

  const handleSearchChange = (value) => {
    setSearch(value);

    const nextParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      nextParams.set("search", value);
    } else {
      nextParams.delete("search");
    }

    setSearchParams(nextParams, { replace: true });
  };

  const clearSearch = () => {
    setSearch("");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("search");
    setSearchParams(nextParams, { replace: true });
  };

  const formatDate = (value) => {
    if (!value) return "Date to be announced";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date to be announced";
    }

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
    const existingPoster =
      event.poster_url ||
      event.poster ||
      event.image_url ||
      event.image ||
      event.banner_url;

    if (existingPoster) return existingPoster;

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

    return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80";
  };

  const secondaryText = "text-[var(--color-text-secondary)]";
  const surface = "bg-[var(--color-surface)]";
  const borderColor = "border-[var(--color-border)]";

  return (
    <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-text)] transition-colors duration-300">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Modern hero and search */}
        <section className="relative mb-10 overflow-hidden rounded-3xl bg-[#14213d] px-5 py-9 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-12 lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              YOUR NEXT OUTING
            </span>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Find your next
              <span className="block text-emerald-300">
                experience.
              </span>
            </h1>

            <h2 className="mt-4 text-xl font-bold text-white sm:text-2xl">
              Discover events near you
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              From live music to sports and entertainment, find
              something worth looking forward to.
            </p>

            <div className="mt-7 rounded-2xl border border-white/15 bg-white p-2 shadow-lg shadow-black/10 transition focus-within:ring-4 focus-within:ring-emerald-400/30 sm:flex sm:items-center sm:gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6 shrink-0 text-slate-400"
                  aria-hidden="true"
                >
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path
                    strokeLinecap="round"
                    d="m16 16 4.2 4.2"
                  />
                </svg>

                <div className="min-w-0 flex-1 py-2">
                  <label
                    htmlFor="event-search"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Search events
                  </label>

                  <input
                    id="event-search"
                    type="search"
                    value={search}
                    onChange={(event) =>
                      handleSearchChange(event.target.value)
                    }
                    placeholder="Name, city or venue..."
                    autoComplete="off"
                    className="mt-1 w-full min-w-0 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                  />
                </div>

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    ×
                  </button>
                )}
              </div>

              <Link
                to={
                  search.trim()
                    ? `/events?search=${encodeURIComponent(search.trim())}`
                    : "/events"
                }
                className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 sm:mt-0"
              >
                Search events
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Search events by name, city or venue
            </p>
          </div>
        </section>

        {/* Results heading */}
        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-accent)]">
                YOUR NEXT OUTING
              </p>

              <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Explore all events
              </h2>

              {search.trim() && (
                <p className={`mt-2 text-sm ${secondaryText}`}>
                  Results for{" "}
                  <span className="font-semibold text-[var(--color-text)]">
                    “{search.trim()}”
                  </span>
                </p>
              )}
            </div>

            {!loading && !error && (
              <p className={`text-sm ${secondaryText}`}>
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
              className={`rounded-2xl border border-red-400/40 ${surface} p-8 text-center`}
            >
              <h3 className="text-lg font-bold text-[var(--color-text)]">
                Something went wrong
              </h3>

              <p className={`mt-2 text-sm ${secondaryText}`}>
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Try again
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div
              className={`rounded-2xl border ${borderColor} ${surface} px-5 py-14 text-center`}
            >
              <div className="text-4xl" aria-hidden="true">
                🎟️
              </div>

              <h3 className="mt-4 text-xl font-bold">
                {events.length === 0
                  ? "No events available yet"
                  : "No matching events"}
              </h3>

              <p className={`mt-2 text-sm ${secondaryText}`}>
                {events.length === 0
                  ? "New experiences will appear here when events are added."
                  : "Try searching with another event name, city or venue."}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-4 font-semibold text-[var(--color-accent)] transition hover:opacity-80"
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
                    className={`group overflow-hidden rounded-2xl border ${borderColor} ${surface} transition duration-200 hover:-translate-y-1 hover:shadow-xl`}
                  >
                    <Link
                      to={`/events/${event.id}`}
                      aria-label={`View details for ${event.title}`}
                      className="block"
                    >
                      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[var(--color-surface-secondary)]">
                        {poster && (
                          <img
                            src={poster}
                            alt={event.title || "Event poster"}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            onError={(eventError) => {
                              eventError.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>
                    </Link>

                    <div className="p-5">
                      <p className="text-sm font-semibold text-[var(--color-accent)]">
                        {formatDate(
                          event.start_date ||
                            event.event_date ||
                            event.date ||
                            event.start_time
                        )}
                      </p>

                      <h3 className="mt-2 line-clamp-2 text-xl font-bold text-[var(--color-text)]">
                        {event.title || "Untitled event"}
                      </h3>

                      <p
                        className={`mt-2 line-clamp-2 min-h-10 text-sm leading-5 ${secondaryText}`}
                      >
                        {event.description ||
                          "Discover this upcoming event."}
                      </p>

                      <div
                        className={`mt-4 space-y-2 border-t ${borderColor} pt-4 text-sm ${secondaryText}`}
                      >
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
                          <p className={`text-xs ${secondaryText}`}>
                            {price ? "Starting from" : "Ticket price"}
                          </p>

                          <p className="mt-1 font-bold text-[var(--color-text)]">
                            {price || "View details"}
                          </p>
                        </div>

                        <Link
                          to={`/events/${event.id}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
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

      <footer
        className={`mt-12 border-t ${borderColor} ${surface} transition-colors duration-300`}
      >
        <div
          className={`mx-auto max-w-7xl px-4 py-6 text-center text-sm ${secondaryText} sm:px-6 lg:px-8`}
        >
          © {new Date().getFullYear()} Evently. Find your next experience.
        </div>
      </footer>
    </div>
  );
}

export default Events;
