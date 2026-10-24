
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  Navigate,
} from "react-router-dom";

import EditEvent from "./pages/EditEvent";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Seats from "./pages/Seats";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Ticket from "./pages/Ticket";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import TicketVerify from "./pages/TicketVerify";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResendVerification from "./pages/ResendVerification";
import ProtectedRoute from "./ProtectedRoute";

// ==========================================
// GLOBAL THEME MANAGEMENT
// ==========================================

const ThemeContext = createContext(null);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("evently-theme");

      return savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;

    try {
      localStorage.setItem("evently-theme", theme);
    } catch {
      // The theme still works if browser storage is unavailable.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}

// ==========================================
// LIGHT / DARK MODE BUTTON
// ==========================================

function ThemeToggle({ mobile = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border
        border-slate-300 bg-white px-3 py-2 text-sm font-semibold
        text-slate-800 transition hover:bg-slate-100
        dark-theme-toggle
        ${mobile ? "w-full" : ""}`}
    >
      <span aria-hidden="true">{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}

// ==========================================
// NAVBAR
// ==========================================

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        setUser(token && savedUser ? JSON.parse(savedUser) : null);
      } catch {
        setUser(null);
      }
    };

    loadUser();

    window.addEventListener("authChanged", loadUser);
    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("authChanged", loadUser);
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const isAdmin = user?.role === "ADMIN";

  const navLinkClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? isDark
          ? "bg-slate-700 text-white"
          : "bg-slate-100 text-slate-950"
        : isDark
          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
    }`;

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.dispatchEvent(new Event("authChanged"));

    setUser(null);
    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur ${
        isDark
          ? "border-slate-700 bg-slate-950/95"
          : "border-slate-200 bg-white/95"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" onClick={closeMenu} className="flex shrink-0 items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xl text-white">
            ✦
          </span>

          <span
            className={`text-lg font-extrabold tracking-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Event<span className="text-green-500">ly</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-2 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

          <NavLink to="/events" className={navLinkClass}>
            Explore Events
          </NavLink>

          {user && !isAdmin && (
            <NavLink to="/my-bookings" className={navLinkClass}>
              My Bookings
            </NavLink>
          )}

          {isAdmin && (
            <>
              <NavLink to="/admin" className={navLinkClass}>
                Admin Dashboard
              </NavLink>

              <NavLink to="/admin/tickets/verify" className={navLinkClass}>
                Verify Tickets
              </NavLink>
            </>
          )}
        </div>

        {/* Desktop account actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />

          {user ? (
            <>
              <Link
                to="/profile"
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isDark
                    ? "text-slate-200 hover:bg-slate-800 hover:text-green-400"
                    : "text-slate-700 hover:bg-slate-100 hover:text-green-700"
                }`}
              >
                My Profile
              </Link>

              <div className="text-right">
                <p
                  className={`max-w-40 truncate text-sm font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {user.name || user.email || "Account"}
                </p>

                <span
                  className={`text-xs font-bold ${
                    isAdmin ? "text-purple-400" : "text-green-500"
                  }`}
                >
                  {isAdmin ? "ADMIN" : "USER"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-red-400/40 px-4 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-500/10"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`px-3 py-2 text-sm font-semibold ${
                  isDark
                    ? "text-slate-200 hover:text-white"
                    : "text-slate-700 hover:text-slate-950"
                }`}
              >
                Log in
              </Link>

              <Link
                to="/register"
                className="rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-2xl md:hidden ${
            isDark
              ? "border-slate-600 text-white hover:bg-slate-800"
              : "border-slate-200 text-slate-800 hover:bg-slate-100"
          }`}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </nav>

      {/* Mobile navigation */}
      {menuOpen && (
        <div
          className={`border-t px-4 py-4 md:hidden ${
            isDark
              ? "border-slate-700 bg-slate-950"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            <ThemeToggle mobile />

            <NavLink to="/" end className={navLinkClass} onClick={closeMenu}>
              Home
            </NavLink>

            <NavLink to="/events" className={navLinkClass} onClick={closeMenu}>
              Explore Events
            </NavLink>

            {user && !isAdmin && (
              <NavLink
                to="/my-bookings"
                className={navLinkClass}
                onClick={closeMenu}
              >
                My Bookings
              </NavLink>
            )}

            {isAdmin && (
              <>
                <NavLink to="/admin" className={navLinkClass} onClick={closeMenu}>
                  Admin Dashboard
                </NavLink>

                <NavLink
                  to="/admin/tickets/verify"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  Verify Tickets
                </NavLink>
              </>
            )}

            {user ? (
              <>
                <NavLink
                  to="/profile"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  My Profile
                </NavLink>

                <div
                  className={`mt-2 rounded-xl p-4 ${
                    isDark ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`truncate font-bold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {user.name || user.email || "Account"}
                  </p>

                  <p
                    className={`mt-1 text-xs font-bold ${
                      isAdmin ? "text-purple-400" : "text-green-500"
                    }`}
                  >
                    {isAdmin ? "ADMIN ACCOUNT" : "USER ACCOUNT"}
                  </p>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-3 w-full rounded-xl border border-red-400/40 px-4 py-3 font-bold text-red-500 hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
                  Log in
                </NavLink>

                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="mt-2 rounded-xl bg-green-600 px-4 py-3 text-center font-bold text-white hover:bg-green-700"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// ==========================================
// ADMIN ROUTE PROTECTION
// ==========================================

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (String(user.role || "").toUpperCase() !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ==========================================
// HOME PAGE
// ==========================================



function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { icon: "🎵", name: "Music", query: "music" },
    { icon: "🎤", name: "Concerts", query: "concert" },
    { icon: "🎭", name: "Theatre", query: "theatre" },
    { icon: "🏏", name: "Sports", query: "sports" },
    { icon: "🎨", name: "Arts", query: "arts" },
    { icon: "✨", name: "More events", query: "" },
  ];

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchTerm.trim();

    if (query) {
      navigate(`/events?search=${encodeURIComponent(query)}`);
    } else {
      navigate("/events");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      {/* Hero and Search */}
      <section className="px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
          {/* Background decoration */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-500/10" />

          <div className="relative grid items-center gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-16 lg:py-20">
            {/* Left content */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                YOUR NEXT OUTING
              </span>

              <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
                Find your next
                <span className="block text-emerald-600 dark:text-emerald-400">
                  experience.
                </span>
              </h1>

              <h2 className="mt-5 text-xl font-bold text-slate-700 sm:text-2xl dark:text-slate-200">
                Discover events near you
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-400">
                From live music to sports and entertainment, find
                something worth looking forward to. Your next great
                memory starts here.
              </p>

              {/* Search box */}
              <form
                onSubmit={handleSearch}
                className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/5 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/20 dark:focus-within:border-emerald-500"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6 shrink-0 text-slate-400 dark:text-slate-500"
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
                      htmlFor="homepage-event-search"
                      className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      Search events
                    </label>

                    <input
                      id="homepage-event-search"
                      type="search"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                      placeholder="Name, city or venue..."
                      className="mt-1 w-full min-w-0 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
                >
                  Search events
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Search events by name, city or venue
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                  Easy booking
                </span>

                <span className="inline-flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                  Secure checkout
                </span>

                <span className="inline-flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                  Digital tickets
                </span>
              </div>
            </div>

            {/* Right visual panel */}
            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-emerald-400/20 via-blue-400/10 to-purple-400/20 blur-2xl" />

              <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 sm:p-7 dark:border-slate-700 dark:bg-slate-800/90">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                      Make it memorable
                    </p>
                    <h3 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-white">
                      Something for everyone
                    </h3>
                  </div>

                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl dark:bg-emerald-950">
                    ✨
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link
                    to="/events?category=music"
                    className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl dark:bg-purple-950">
                      🎵
                    </span>
                    <p className="mt-4 font-bold text-slate-900 dark:text-white">
                      Live music
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Feel the rhythm
                    </p>
                  </Link>

                  <Link
                    to="/events?category=sports"
                    className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl dark:bg-orange-950">
                      🏆
                    </span>
                    <p className="mt-4 font-bold text-slate-900 dark:text-white">
                      Sports
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Feel the excitement
                    </p>
                  </Link>

                  <Link
                    to="/events?category=concert"
                    className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100 text-2xl dark:bg-pink-950">
                      🎤
                    </span>
                    <p className="mt-4 font-bold text-slate-900 dark:text-white">
                      Concerts
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Sing along
                    </p>
                  </Link>

                  <Link
                    to="/events?category=theatre"
                    className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl dark:bg-blue-950">
                      🎭
                    </span>
                    <p className="mt-4 font-bold text-slate-900 dark:text-white">
                      Theatre & arts
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Discover something new
                    </p>
                  </Link>
                </div>

                <Link
                  to="/events"
                  className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  Explore all events
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore by category */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              Find your vibe
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Explore by category
            </h2>

            <p className="mt-2 text-sm text-slate-500 sm:text-base dark:text-slate-400">
              Find something exciting to do.
            </p>
          </div>

          <Link
            to="/events"
            className="text-sm font-bold text-slate-700 transition hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
          >
            All events →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={
                category.query
                  ? `/events?category=${encodeURIComponent(category.query)}`
                  : "/events"
              }
              className="group flex min-h-28 flex-col items-start justify-center rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800 sm:p-5"
            >
              <span className="text-2xl" aria-hidden="true">
                {category.icon}
              </span>

              <span className="mt-3 font-bold text-slate-800 transition group-hover:text-emerald-700 dark:text-slate-200 dark:group-hover:text-emerald-400">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Explore all events */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:p-9 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              YOUR NEXT OUTING
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Explore all events
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-400">
              Browse upcoming events, check dates and venues, and
              choose an experience worth looking forward to.
            </p>
          </div>

          <Link
            to="/events"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
          >
            Browse events <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:text-slate-400">
          <Link
            to="/"
            className="font-extrabold text-slate-900 dark:text-white"
          >
            Event<span className="text-emerald-600">ly</span>
          </Link>

          <p>Discover events. Create memories.</p>

          <Link
            to="/events"
            className="font-semibold transition hover:text-emerald-700 dark:hover:text-emerald-400"
          >
            Explore events →
          </Link>
        </div>
      </footer>
    </main>
  );
}



// ==========================================
// MAIN APPLICATION
// ==========================================

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/resend-verification" element={<ResendVerification />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />

          <Route
            path="/events/:id/seats"
            element={
              <ProtectedRoute>
                <Seats />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ticket"
            element={
              <ProtectedRoute>
                <Ticket />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Protected admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/events/:id/edit"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <EditEvent />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/tickets/verify"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <TicketVerify />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
