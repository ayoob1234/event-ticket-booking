
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setRegisteredEmail("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const response = await api.post("/auth/register", {
        name: name.trim(),
        email: normalizedEmail,
        password,
      });

      setRegisteredEmail(normalizedEmail);
      setSuccess(
        response.data?.message ||
          "Registration successful. Please check your email to verify your account."
      );

      setName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-950";

  const labelClass =
    "block text-sm font-semibold text-slate-700 dark:text-slate-300";

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
              Join Evently
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Make room for unforgettable experiences.
            </h1>

            <p className="mt-4 leading-7 text-slate-300">
              Create your account to explore events, book seats and
              keep your tickets organised in one place.
            </p>
          </div>

          <div className="space-y-3 text-sm text-slate-300">
            <p>✓ Discover events that interest you</p>
            <p>✓ Manage your bookings in one place</p>
            <p>✓ Access your tickets when you need them</p>
          </div>
        </div>

        {/* Registration form */}
        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              GET STARTED
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              Create your account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Verify your email address before signing in to Evently.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300"
            >
              <p className="font-semibold">✓ Check your email</p>

              <p className="mt-1">{success}</p>

              {registeredEmail && (
                <p className="mt-2 break-all font-semibold">
                  {registeredEmail}
                </p>
              )}

              <p className="mt-2">
                Open the verification link in your email. The link expires
                after 30 minutes. After verifying, return to the login page.
              </p>

              <Link
                to="/login"
                className="mt-3 inline-block font-semibold text-blue-700 underline dark:text-blue-400"
              >
                Go to Login
              </Link>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="name" className={labelClass}>
                Full name
              </label>

              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                className={inputClass}
                minLength={2}
                maxLength={100}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
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
                maxLength={254}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>

              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  className={`${inputClass} mt-0 pr-20`}
                  minLength={8}
                  maxLength={128}
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

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Use at least 8 characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
            New accounts receive the USER role. Administrator access
            must be granted securely.
          </p>
        </div>
      </div>
    </main>
  );
}

export default Register;
