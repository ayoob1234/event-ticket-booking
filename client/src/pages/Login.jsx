
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestedPath = location.state?.from;

  const safeReturnPath =
    typeof requestedPath === "string" &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//") &&
    !requestedPath.startsWith("/admin")
      ? requestedPath
      : null;

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const data = response.data;
      const token = data.token;
      const user = data.user || data.data?.user;

      if (!token || !user) {
        throw new Error("Invalid login response from server.");
      }

      const role = String(user.role || "").trim().toUpperCase();

      if (role !== "ADMIN" && role !== "USER") {
        throw new Error("Your account role is invalid.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, role })
      );

      window.dispatchEvent(new Event("authChanged"));

      if (role === "ADMIN") {
        const adminPath =
          typeof requestedPath === "string" &&
          requestedPath.startsWith("/admin") &&
          !requestedPath.startsWith("//")
            ? requestedPath
            : "/admin";

        navigate(adminPath, { replace: true });
      } else {
        navigate(safeReturnPath || "/events", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("authChanged"));

      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-950";

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        {/* Welcome panel */}
        <div className="hidden flex-col justify-between bg-slate-900 p-10 text-white dark:bg-slate-950 md:flex">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
              ✦
            </div>

            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Welcome to Evently
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Your next great experience starts here.
            </h1>

            <p className="mt-4 leading-7 text-slate-300">
              Sign in to discover events, reserve your seats and manage
              your tickets in one place.
            </p>
          </div>

          <p className="text-sm text-slate-400">
            Discover. Book. Experience.
          </p>
        </div>

        {/* Login form */}
        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              YOUR EVENT JOURNEY
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Enter your account details to continue.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className={`${inputClass} mt-0 pr-20`}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  className="absolute inset-y-0 right-3 text-sm font-semibold text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/resend-verification"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Resend verification email
            </Link>
          </div>

          <p className="mt-7 text-center text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Create account
            </Link>
          </p>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
            Your account permissions determine which dashboard you can access.
          </p>
        </div>
      </div>
    </main>
  );
}

export default Login;
