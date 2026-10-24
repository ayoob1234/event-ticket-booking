
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Reset token is missing. Please request a new reset link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password,
      });

      setMessage(response.data.message);
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login", {
          state: { message: response.data.message },
        });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Password reset failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-950";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          🔒
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
          Account Security
        </p>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reset Password
        </h1>

        <p className="mt-3 mb-6 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Choose a new password for your Evently account.
        </p>

        {message && (
          <div
            role="status"
            className="mb-5 break-words rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300"
          >
            {message}
            <p className="mt-2 text-xs">
              Redirecting you to the login page...
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className={labelClass}>
              New Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
              placeholder="At least 8 characters"
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Use at least 8 characters.
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm New Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
              placeholder="Enter password again"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-5 text-center dark:border-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
