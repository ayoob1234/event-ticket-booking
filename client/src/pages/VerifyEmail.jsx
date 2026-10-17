
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const response = await api.get("/auth/verify-email", {
          params: { token },
        });

        if (!cancelled) {
          setStatus("success");
          setMessage(
            response.data?.message || "Email verified successfully."
          );
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            error.response?.data?.message ||
              "Verification failed. Please request a new verification email."
          );
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {status === "loading"
            ? "Verifying email"
            : status === "success"
            ? "Email verified"
            : "Verification failed"}
        </h1>

        <p className="mt-4 text-slate-600">{message}</p>

        {status !== "loading" && (
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
          >
            Continue to login
          </Link>
        )}
      </section>
    </main>
  );
}
