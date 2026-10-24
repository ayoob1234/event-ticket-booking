
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");
    let cancelled = false;
    let redirectTimer;

    if (!token) {
      setStatus("error");
      setMessage(
        "Verification token is missing. Please request a new verification email."
      );
      return;
    }

    const verify = async () => {
      try {
        const response = await api.get("/auth/verify-email", {
          params: { token },
        });

        if (cancelled) return;

        setStatus("success");
        setMessage(
          response.data?.message ||
            "Your email has been verified successfully."
        );

        redirectTimer = window.setTimeout(() => {
          if (!cancelled) {
            navigate("/login", {
              replace: true,
              state: {
                message: "Email verified successfully. You can now log in.",
              },
            });
          }
        }, 2000);
      } catch (error) {
        if (cancelled) return;

        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Verification failed. Your link may have expired or already been used."
        );
      }
    };

    verify();

    return () => {
      cancelled = true;

      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [searchParams, navigate]);

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
            isLoading
              ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
              : isSuccess
                ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
                : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
          }`}
        >
          {isLoading ? (
            <span
              className="h-7 w-7 animate-spin rounded-full border-2 border-current/30 border-t-current"
              aria-label="Loading"
            />
          ) : isSuccess ? (
            "✓"
          ) : (
            "!"
          )}
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
          Evently · Account Security
        </p>

        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
          {isLoading
            ? "Verifying email"
            : isSuccess
              ? "Email verified"
              : "Verification failed"}
        </h1>

        <p
          role={isLoading ? "status" : "alert"}
          aria-live="polite"
          className={`mt-4 break-words text-sm leading-6 ${
            isSuccess
              ? "text-green-700 dark:text-green-300"
              : status === "error"
                ? "text-red-700 dark:text-red-300"
                : "text-slate-600 dark:text-slate-400"
          }`}
        >
          {message}
        </p>

        {isLoading && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Please wait while we check your verification link.
          </p>
        )}

        {isSuccess && (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Redirecting you to login...
          </p>
        )}

        {status === "error" && (
          <Link
            to="/resend-verification"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            Request a new verification email
          </Link>
        )}

        {!isLoading && (
          <div>
            <Link
              to="/login"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Go to Login
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
