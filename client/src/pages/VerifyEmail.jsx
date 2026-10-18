
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

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing. Please request a new verification email.");
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

        // Give the user a moment to read the success message.
        window.setTimeout(() => {
          if (!cancelled) {
            navigate("/login", {
              replace: true,
              state: { message: "Email verified successfully. You can now log in." },
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
    };
  }, [searchParams, navigate]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
          {status === "loading"
            ? "…"
            : status === "success"
            ? "✓"
            : "!"}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          {status === "loading"
            ? "Verifying email"
            : status === "success"
            ? "Email verified"
            : "Verification failed"}
        </h1>

        <p className="mt-4 text-slate-600">{message}</p>

        {status === "success" && (
          <p className="mt-3 text-sm text-slate-500">
            Redirecting you to login...
          </p>
        )}

        {status === "error" && (
          <Link
            to="/resend-verification"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Request a new verification email
          </Link>
        )}

        {status !== "loading" && (
          <div>
            <Link
              to="/login"
              className="mt-4 inline-flex rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Go to Login
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
