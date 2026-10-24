
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const initialForm = {
  title: "",
  description: "",
  venue: "",
  city: "",
  event_date: "",
  category_id: "",
  status: "PUBLISHED",
};

const initialSeat = {
  seat_number: "",
  category: "SILVER",
  price: "",
};

const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";

const mutedClass = "text-slate-500 dark:text-slate-400";
const labelClass = "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-green-500 dark:focus:ring-green-900/40";

const secondaryButtonClass =
  "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

function AdminDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);
  const [seatEventId, setSeatEventId] = useState("");
  const [seatRows, setSeatRows] = useState([{ ...initialSeat }]);
  const [creatingSeats, setCreatingSeats] = useState(false);
  const [seatMessage, setSeatMessage] = useState("");
  const [seatSuccess, setSeatSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({ ...initialForm });

  const fetchDashboard = useCallback(async () => {
    try {
      setError("");

      const eventsResponse = await api.get("/events");
      const eventList = eventsResponse.data?.events || [];
      setEvents(eventList);

      const categoriesResponse = await api.get("/events/categories");
      setCategories(categoriesResponse.data?.categories || []);

      if (eventList.length > 0) {
        try {
          const statsResponse = await api.get(
            `/events/${eventList[0].id}/stats`
          );
          setStats(statsResponse.data);
        } catch (statsError) {
          console.error("Fetch statistics error:", statsError);
          setStats(null);
        }
      } else {
        setStats(null);
      }
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(
        err.response?.data?.message || "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setCreating(true);
    setCreateMessage("");
    setCreateSuccess(false);
    setError("");

    try {
      const response = await api.post("/events", formData);

      setCreateMessage(
        response.data?.message || "Event created successfully."
      );
      setCreateSuccess(true);
      setFormData({ ...initialForm });

      await fetchDashboard();
      setActiveSection("events");
    } catch (err) {
      console.error("Create event error:", err);
      setCreateMessage(
        err.response?.data?.message || "Failed to create event."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSeatChange = (index, field, value) => {
    setSeatRows((previous) =>
      previous.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  };

  const addSeatRow = () => {
    setSeatRows((previous) => [...previous, { ...initialSeat }]);
  };

  const removeSeatRow = (index) => {
    setSeatRows((previous) =>
      previous.filter((_, rowIndex) => rowIndex !== index)
    );
  };

  const handleCreateSeats = async (event) => {
    event.preventDefault();

    if (!seatEventId) {
      setSeatMessage("Please select an event.");
      setSeatSuccess(false);
      return;
    }

    if (
      seatRows.some(
        (seat) =>
          !seat.seat_number.trim() ||
          !seat.category ||
          seat.price === "" ||
          !Number.isFinite(Number(seat.price)) ||
          Number(seat.price) < 0
      )
    ) {
      setSeatMessage("Please enter valid details for every seat.");
      setSeatSuccess(false);
      return;
    }

    try {
      setCreatingSeats(true);
      setSeatMessage("");
      setSeatSuccess(false);

      const payload = {
        seats: seatRows.map((seat) => ({
          seat_number: seat.seat_number.trim(),
          category: seat.category,
          price: Number(seat.price),
        })),
      };

      const response = await api.post(
        `/events/${seatEventId}/seats`,
        payload
      );

      const count = response.data?.seats?.length ?? seatRows.length;

      setSeatMessage(
        response.data?.message ||
          `${count} seat(s) created successfully.`
      );
      setSeatSuccess(true);
      setSeatRows([{ ...initialSeat }]);

      await fetchDashboard();
    } catch (err) {
      console.error("Create seats error:", err);
      setSeatMessage(
        err.response?.data?.message || "Failed to create seats."
      );
    } finally {
      setCreatingSeats(false);
    }
  };

  const handleCancelEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to cancel this event?")) {
      return;
    }

    try {
      setError("");
      const response = await api.put(`/events/${eventId}/cancel`);

      window.alert(
        response.data?.message || "Event cancelled successfully."
      );

      await fetchDashboard();
    } catch (err) {
      console.error("Cancel event error:", err);
      window.alert(
        err.response?.data?.message || "Failed to cancel event."
      );
    }
  };

  const publishedCount = events.filter(
    (event) => event.status === "PUBLISHED"
  ).length;

  const draftCount = events.filter(
    (event) => event.status === "DRAFT"
  ).length;

  const cancelledCount = events.filter(
    (event) => event.status === "CANCELLED"
  ).length;

  const seatStats = stats?.seats || {};
  const bookingStats = stats?.bookings || {};
  const revenue = stats?.revenue?.total_revenue;

  const sections = [
    { id: "overview", label: "Overview", icon: "▦" },
    { id: "events", label: "Manage Events", icon: "▤" },
    { id: "create", label: "Create Event", icon: "＋" },
    { id: "seats", label: "Seat Layout", icon: "▦" },
  ];

  const goToSection = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);

    if (section === "verify") {
      navigate("/admin/tickets/verify");
      return;
    }

    if (section === "overview") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const StatCard = ({ label, value, hint, icon, accent = false }) => (
    <div className={`${panelClass} p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${mutedClass}`}>{label}</p>
          <p className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          <p className={`mt-2 text-xs ${mutedClass}`}>{hint}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
            accent
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="skeleton mb-3 h-9 w-64 rounded-lg" />
          <div className="skeleton mb-8 h-5 w-80 max-w-full rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="skeleton h-36 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton mt-8 h-72 rounded-2xl" />
          <p className={`mt-5 text-sm ${mutedClass}`}>
            Loading your admin dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error && events.length === 0) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-slate-50 px-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className={`${panelClass} w-full max-w-lg p-8 text-center`}>
          <h1 className="text-2xl font-bold">Dashboard unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-red-600 dark:text-red-400">
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchDashboard();
            }}
            className="mt-6 rounded-xl bg-[#14213d] px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#14213d] text-white transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div>
            <p className="text-2xl font-extrabold tracking-tight">
              evently<span className="text-green-400">.</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-400">ADMIN CONSOLE</p>
          </div>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            ✕
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>

          <nav className="mt-3 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => goToSection(section.id)}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  activeSection === section.id
                    ? "bg-white text-[#14213d]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="w-6 text-center text-lg">{section.icon}</span>
                {section.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goToSection("verify")}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <span className="w-6 text-center text-lg">✓</span>
              Ticket Verification
            </button>
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold">Event management</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Manage events, organize seats and review available statistics.
            </p>
            <button
              type="button"
              onClick={() => goToSection("create")}
              className="mt-4 w-full rounded-xl bg-green-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              + Create an event
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/95 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-lg hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 lg:hidden"
            >
              ☰
            </button>
            <div>
              <p className="text-sm font-semibold">Admin workspace</p>
              <p className={`hidden text-xs ${mutedClass} sm:block`}>
                Manage your event booking platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchDashboard();
            }}
            className={secondaryButtonClass}
          >
            <span aria-hidden="true">↻</span>{" "}
            <span className="hidden sm:inline">Refresh data</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-8 px-4 py-7 sm:px-7 sm:py-9">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
            >
              {error}
            </div>
          )}

          <section id="overview" className="scroll-mt-24">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  YOUR EVENTLY WORKSPACE
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Dashboard Overview
                </h1>
                <p className={`mt-2 max-w-2xl text-sm leading-6 sm:text-base ${mutedClass}`}>
                  Monitor events, manage seats and review booking activity.
                </p>
              </div>

              <button
                type="button"
                onClick={() => goToSection("create")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
              >
                <span aria-hidden="true">＋</span>
                Create new event
              </button>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total events" value={events.length} hint="Events returned by the API" icon="▤" />
              <StatCard label="Published" value={publishedCount} hint="Currently published events" icon="✓" accent />
              <StatCard label="Draft events" value={draftCount} hint="Not yet published" icon="✎" />
              <StatCard label="Cancelled events" value={cancelledCount} hint="Events marked as cancelled" icon="×" />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total seats" value={seatStats.total_seats ?? "—"} hint="For the first listed event" icon="▦" />
              <StatCard label="Confirmed bookings" value={bookingStats.confirmed_bookings ?? "—"} hint="For the first listed event" icon="✓" accent />
              <StatCard label="Available seats" value={seatStats.available_seats ?? "—"} hint="For the first listed event" icon="◷" />
              <StatCard
                label="Reported revenue"
                value={revenue == null ? "—" : `₹${Number(revenue).toLocaleString("en-IN")}`}
                hint="For the first listed event"
                icon="₹"
                accent
              />
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200 sm:text-sm">
              <strong>Statistics note:</strong> Your current backend returns
              event statistics for the first listed event. The seat, booking
              and revenue cards reflect that event, not platform-wide totals.
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <button type="button" onClick={() => goToSection("events")} className={`${panelClass} flex items-center gap-4 p-5 text-left transition hover:border-green-300 hover:shadow-md`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl dark:bg-blue-950">▤</span>
                <span>
                  <span className="block font-bold">Manage events</span>
                  <span className={`mt-1 block text-sm ${mutedClass}`}>Edit or cancel existing events</span>
                </span>
              </button>

              <button type="button" onClick={() => goToSection("seats")} className={`${panelClass} flex items-center gap-4 p-5 text-left transition hover:border-green-300 hover:shadow-md`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl dark:bg-green-950">▦</span>
                <span>
                  <span className="block font-bold">Manage seats</span>
                  <span className={`mt-1 block text-sm ${mutedClass}`}>Configure categories and prices</span>
                </span>
              </button>

              <button type="button" onClick={() => goToSection("verify")} className={`${panelClass} flex items-center gap-4 p-5 text-left transition hover:border-green-300 hover:shadow-md`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-2xl dark:bg-amber-950">✓</span>
                <span>
                  <span className="block font-bold">Verify tickets</span>
                  <span className={`mt-1 block text-sm ${mutedClass}`}>Open the ticket check-in page</span>
                </span>
              </button>
            </div>
          </section>

          <section id="create" className={`${panelClass} scroll-mt-24`}>
            <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">EVENT SETUP</p>
              <h2 className="mt-2 text-xl font-bold sm:text-2xl">Create a new event</h2>
              <p className={`mt-2 text-sm ${mutedClass}`}>Enter the event details and choose its publication status.</p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-5 p-5 sm:p-7">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="title" className={labelClass}>Event title</label>
                  <input id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Live Music Night" required className={inputClass} />
                </div>

                <div>
                  <label htmlFor="category_id" className={labelClass}>Category</label>
                  <select id="category_id" name="category_id" value={formData.category_id} onChange={handleInputChange} required className={inputClass}>
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className={labelClass}>Description</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={4} placeholder="Describe the event, its highlights and what guests can expect..." required className={`${inputClass} resize-y`} />
                </div>

                <div>
                  <label htmlFor="venue" className={labelClass}>Venue</label>
                  <input id="venue" name="venue" value={formData.venue} onChange={handleInputChange} placeholder="Venue name" required className={inputClass} />
                </div>

                <div>
                  <label htmlFor="city" className={labelClass}>City</label>
                  <input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" required className={inputClass} />
                </div>

                <div>
                  <label htmlFor="event_date" className={labelClass}>Event date and time</label>
                  <input id="event_date" type="datetime-local" name="event_date" value={formData.event_date} onChange={handleInputChange} required className={inputClass} />
                </div>

                <div>
                  <label htmlFor="status" className={labelClass}>Publication status</label>
                  <select id="status" name="status" value={formData.status} onChange={handleInputChange} className={inputClass}>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              {createMessage && (
                <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${
                  createSuccess
                    ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                }`}>
                  {createMessage}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => { setFormData({ ...initialForm }); setCreateMessage(""); }} className={secondaryButtonClass}>Clear form</button>
                <button type="submit" disabled={creating} className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {creating ? "Creating event..." : "+ Create event"}
                </button>
              </div>
            </form>
          </section>

          <section id="seats" className={`${panelClass} scroll-mt-24`}>
            <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">SEATING CONFIGURATION</p>
              <h2 className="mt-2 text-xl font-bold sm:text-2xl">Manage seat layout</h2>
              <p className={`mt-2 text-sm ${mutedClass}`}>Assign seat numbers, ticket categories and prices to an event.</p>
            </div>

            <form onSubmit={handleCreateSeats} className="space-y-5 p-5 sm:p-7">
              <div>
                <label htmlFor="seat-event" className={labelClass}>Select event</label>
                <select id="seat-event" value={seatEventId} onChange={(event) => setSeatEventId(event.target.value)} required className={inputClass}>
                  <option value="">Choose an event</option>
                  {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                {seatRows.map((seat, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-bold">Seat {index + 1}</h3>
                      {seatRows.length > 1 && (
                        <button type="button" onClick={() => removeSeatRow(index)} className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50">Remove</button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor={`seat-number-${index}`} className={labelClass}>Seat number</label>
                        <input id={`seat-number-${index}`} value={seat.seat_number} onChange={(event) => handleSeatChange(index, "seat_number", event.target.value)} placeholder="A1" required className={inputClass} />
                      </div>

                      <div>
                        <label htmlFor={`seat-category-${index}`} className={labelClass}>Category</label>
                        <select id={`seat-category-${index}`} value={seat.category} onChange={(event) => handleSeatChange(index, "category", event.target.value)} className={inputClass}>
                          <option value="SILVER">Silver</option>
                          <option value="GOLD">Gold</option>
                          <option value="VIP">VIP</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor={`seat-price-${index}`} className={labelClass}>Price (₹)</label>
                        <input id={`seat-price-${index}`} type="number" min="0" step="0.01" value={seat.price} onChange={(event) => handleSeatChange(index, "price", event.target.value)} placeholder="500" required className={inputClass} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={addSeatRow} className={secondaryButtonClass}>+ Add another seat</button>
                <button type="submit" disabled={creatingSeats} className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {creatingSeats ? "Creating seats..." : "Create seats"}
                </button>
              </div>

              {seatMessage && (
                <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${
                  seatSuccess
                    ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                }`}>
                  {seatMessage}
                </div>
              )}
            </form>
          </section>

          <section id="events" className={`${panelClass} scroll-mt-24`}>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">YOUR EVENT CATALOG</p>
                <h2 className="mt-2 text-xl font-bold sm:text-2xl">Manage events</h2>
                <p className={`mt-2 text-sm ${mutedClass}`}>Update event details or cancel an event.</p>
              </div>
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {events.length} {events.length === 1 ? "event" : "events"}
              </span>
            </div>

            {events.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl">▤</div>
                <h3 className="mt-4 font-bold">No events yet</h3>
                <p className={`mt-2 text-sm ${mutedClass}`}>Create your first event to start building your catalog.</p>
                <button type="button" onClick={() => goToSection("create")} className="mt-5 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700">Create your first event</button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {events.map((event) => (
                  <article key={event.id} className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#14213d] text-xl text-white">♫</div>
                      <div className="min-w-0">
                        <h3 className="break-words text-base font-bold sm:text-lg">{event.title}</h3>
                        <p className={`mt-1 break-words text-sm ${mutedClass}`}>
                          {[event.venue, event.city].filter(Boolean).join(" · ") || "Venue details unavailable"}
                        </p>
                        <p className={`mt-2 text-xs ${mutedClass}`}>Event ID: {event.id}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
                        event.status === "PUBLISHED"
                          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : event.status === "CANCELLED"
                            ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}>
                        {event.status || "UNKNOWN"}
                      </span>

                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => navigate(`/admin/events/${event.id}/edit`)} className={secondaryButtonClass}>Edit event</button>
                        <button type="button" onClick={() => handleCancelEvent(event.id)} disabled={event.status === "CANCELLED"} className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/50">
                          {event.status === "CANCELLED" ? "Cancelled" : "Cancel event"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={`${panelClass} p-5 sm:p-7`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">EVENT INSIGHTS</p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">Seat &amp; booking statistics</h2>
            <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>
              {events.length > 0
                ? `Statistics for ${events[0].title}, the first event returned by the API.`
                : "Create an event to view statistics."}
            </p>

            {!stats ? (
              <p className={`mt-6 rounded-xl bg-slate-50 p-5 text-sm dark:bg-slate-800 ${mutedClass}`}>No statistics available.</p>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
                  <h3 className="font-bold">Seat availability</h3>
                  <div className="mt-5 space-y-4">
                    {[
                      ["Total seats", seatStats.total_seats],
                      ["Available seats", seatStats.available_seats],
                      ["Locked seats", seatStats.locked_seats],
                      ["Booked seats", seatStats.booked_seats],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 text-sm">
                        <span className={mutedClass}>{label}</span>
                        <span className="font-bold">{value ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
                  <h3 className="font-bold">Booking activity</h3>
                  <div className="mt-5 space-y-4">
                    {[
                      ["Total bookings", bookingStats.total_bookings],
                      ["Pending", bookingStats.pending_bookings],
                      ["Confirmed", bookingStats.confirmed_bookings],
                      ["Cancelled", bookingStats.cancelled_bookings],
                      ["Expired", bookingStats.expired_bookings],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 text-sm">
                        <span className={mutedClass}>{label}</span>
                        <span className="font-bold">{value ?? "—"}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl bg-[#14213d] p-4 text-white">
                    <p className="text-xs text-slate-300">Reported revenue</p>
                    <p className="mt-1 text-2xl font-bold">
                      {revenue == null ? "—" : `₹${Number(revenue).toLocaleString("en-IN")}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <footer className="pb-5 text-center text-xs text-slate-400">
            Evently Admin Console · Manage your events with confidence
          </footer>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
