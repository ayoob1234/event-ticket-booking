
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  Navigate,
  useLocation,
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

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
        ? "bg-slate-100 text-slate-950"
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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xl text-white">
            ✦
          </span>

          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Event<span className="text-green-600">ly</span>
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
          {user ? (
            <>
              <Link
                to="/profile"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-green-700"
              >
                My Profile
              </Link>

              <div className="text-right">
                <p className="max-w-40 truncate text-sm font-bold text-slate-900">
                  {user.name || user.email || "Account"}
                </p>

                <span
                  className={`text-xs font-bold ${
                    isAdmin ? "text-purple-700" : "text-green-700"
                  }`}
                >
                  {isAdmin ? "ADMIN" : "USER"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-950"
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
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-2xl text-slate-800 md:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </nav>

      {/* Mobile navigation */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            <NavLink
              to="/"
              end
              className={navLinkClass}
              onClick={closeMenu}
            >
              Home
            </NavLink>

            <NavLink
              to="/events"
              className={navLinkClass}
              onClick={closeMenu}
            >
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
                <NavLink
                  to="/admin"
                  className={navLinkClass}
                  onClick={closeMenu}
                >
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

                <div className="mt-2 rounded-xl bg-slate-50 p-4">
                  <p className="truncate font-bold text-slate-900">
                    {user.name || user.email || "Account"}
                  </p>

                  <p
                    className={`mt-1 text-xs font-bold ${
                      isAdmin ? "text-purple-700" : "text-green-700"
                    }`}
                  >
                    {isAdmin ? "ADMIN ACCOUNT" : "USER ACCOUNT"}
                  </p>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-3 w-full rounded-xl border border-red-200 px-4 py-3 font-bold text-red-600 hover:bg-red-50"
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


function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  // Login nahi hai to login page par bhejo
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Sirf ADMIN ko admin pages access karne do
  if (String(user.role || "").toUpperCase() !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}



function Home() {
  const categories = [
    { icon: "🎵", name: "Music", query: "music" },
    { icon: "🎤", name: "Concerts", query: "concert" },
    { icon: "🎭", name: "Theatre", query: "theatre" },
    { icon: "🏏", name: "Sports", query: "sports" },
    { icon: "🎨", name: "Arts", query: "arts" },
    { icon: "✨", name: "More events", query: "" },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-slate-950 px-6 py-12 shadow-xl sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full bg-green-500/20 blur-3xl" />
          <div className="absolute -bottom-24 right-1/3 -z-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-green-300">
              Your next experience starts here
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Make plans.
              <br />
              <span className="text-green-400">Make memories.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Discover exciting events, find your favourite seats, and book
              your next unforgettable experience.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/events"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-green-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-green-700"
              >
                Explore events <span className="ml-2">→</span>
              </Link>

              <Link
                to="/my-bookings"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                My bookings
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/15 pt-6 sm:max-w-lg sm:gap-8">
            <div>
              <p className="text-xl font-bold text-white sm:text-2xl">
                Easy
              </p>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Booking process
              </p>
            </div>

            <div>
              <p className="text-xl font-bold text-white sm:text-2xl">
                Secure
              </p>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Checkout
              </p>
            </div>

            <div>
              <p className="text-xl font-bold text-white sm:text-2xl">
                Digital
              </p>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                QR tickets
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-green-700">
              Find your vibe
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Explore by category
            </h2>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Find something exciting to do.
            </p>
          </div>

          <Link
            to="/events"
            className="text-sm font-bold text-slate-700 hover:text-green-700"
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
              className="group flex min-h-28 flex-col items-start justify-center rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-green-300 hover:shadow-md sm:p-5"
            >
              <span className="text-2xl" aria-hidden="true">
                {category.icon}
              </span>

              <span className="mt-3 font-bold text-slate-800 group-hover:text-green-700">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-green-700">
              Plan something memorable
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Discover upcoming events
            </h2>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Browse events and choose your next experience.
            </p>
          </div>

          <Link
            to="/events"
            className="shrink-0 text-sm font-bold text-green-700 hover:text-green-800"
          >
            View all →
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Find your next event
              </h3>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Explore available events, check dates and venues, and select
                your seats before booking.
              </p>
            </div>

            <Link
              to="/events"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
            >
              Browse events
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link to="/" className="font-extrabold text-slate-900">
            Event<span className="text-green-600">ly</span>
          </Link>

          <p>Discover events. Create memories.</p>

          <Link to="/events" className="font-semibold hover:text-green-700">
            Explore events →
          </Link>
        </div>
      </footer>
    </main>
  );
}


function App() {
  return (
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
        <Route path="/profile" element={<ProtectedRoute> <Profile /> </ProtectedRoute> } />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/events/:id/seats" element={  <ProtectedRoute> <Seats /> </ProtectedRoute> } />
        <Route path="/ticket" element={ <ProtectedRoute> <Ticket /> </ProtectedRoute>  } />
        <Route path="/my-bookings" element={ <ProtectedRoute> <MyBookings /> </ProtectedRoute> } />

        {/* Protected Admin Routes */}
        
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
  );
}

export default App;



