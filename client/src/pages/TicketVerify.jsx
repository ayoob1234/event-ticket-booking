
import { useState } from "react";
import api from "../services/api";

function TicketVerify() {
  const [ticketCode, setTicketCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();

    const code = ticketCode.trim();

    if (!code) {
      setMessage("Please enter a ticket code.");
      setResult(null);
      setAttempted(true);
      setSuccess(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setResult(null);
      setAttempted(false);
      setSuccess(false);

      const response = await api.post("/tickets/verify", {
        ticket_code: code,
      });

      const data = response.data || {};

      setResult(data);
      setMessage(data.message || "Ticket verified successfully.");
      setSuccess(true);
      setAttempted(true);
      setTicketCode("");
    } catch (err) {
      console.error("Verify ticket error:", err);

      const data = err.response?.data || null;

      setResult(data);
      setMessage(
        data?.message || "Ticket verification failed. Please try again."
      );
      setSuccess(false);
      setAttempted(true);
    } finally {
      setLoading(false);
    }
  };

  const ticket = result?.ticket;
  const status = String(ticket?.status || "").toUpperCase();

  const inputClass =
    "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-green-400 dark:focus:ring-green-950 dark:disabled:bg-slate-800";

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 sm:p-8";

  const headingClass = "font-bold text-slate-900 dark:text-white";

  const mutedClass = "text-slate-600 dark:text-slate-400";

  const labelClass =
    "text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400";

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-8 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Page heading */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">
            Evently · Event operations
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Ticket Verification
          </h1>

          <p className={`mt-3 max-w-2xl text-sm leading-6 sm:text-base ${mutedClass}`}>
            Verify a ticket code before admitting a guest to the event.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Verification form */}
          <section className={cardClass}>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-2xl text-white dark:bg-blue-600">
                ✓
              </div>

              <div>
                <h2 className={`text-xl ${headingClass}`}>
                  Check a ticket
                </h2>
                <p className={`mt-1 text-sm ${mutedClass}`}>
                  Enter the ticket code below.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label
                  htmlFor="ticket-code"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Ticket code
                </label>

                <input
                  id="ticket-code"
                  type="text"
                  value={ticketCode}
                  onChange={(event) => setTicketCode(event.target.value)}
                  placeholder="e.g. EVT-ABC123"
                  autoComplete="off"
                  required
                  disabled={loading}
                  className={inputClass}
                />

                <p className={`mt-2 text-xs leading-5 ${mutedClass}`}>
                  Enter the code printed on the guest's digital ticket.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !ticketCode.trim()}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Verifying ticket...
                  </>
                ) : (
                  "Verify Ticket"
                )}
              </button>
            </form>

            <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <p className={`text-sm font-semibold ${headingClass}`}>
                Before admitting a guest
              </p>

              <ul className={`mt-3 space-y-2 text-sm leading-5 ${mutedClass}`}>
                <li>• Check the verification result carefully.</li>
                <li>• Confirm the ticket status shown by the system.</li>
                <li>• Follow your event's entry and re-entry rules.</li>
              </ul>
            </div>
          </section>

          {/* Entry desk instructions */}
          <aside className={cardClass}>
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-3xl dark:bg-green-950/50">
                🎟️
              </div>

              <h2 className={`mt-5 text-xl ${headingClass}`}>
                Entry desk
              </h2>

              <p className={`mt-2 max-w-sm text-sm leading-6 ${mutedClass}`}>
                Ticket verification helps your team check ticket information
                before guests enter.
              </p>

              <div className="mt-6 w-full rounded-xl border border-slate-200 p-4 text-left dark:border-slate-700">
                <p className={labelClass}>
                  Verification process
                </p>

                <ol className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      1
                    </span>
                    Enter the ticket code.
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      2
                    </span>
                    Select Verify Ticket.
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      3
                    </span>
                    Review the result returned by the server.
                  </li>
                </ol>
              </div>
            </div>
          </aside>
        </div>

        {/* Verification result */}
        {attempted && (
          <section
            aria-live="polite"
            className={`mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors duration-300 dark:bg-slate-900 ${
              success
                ? "border-green-200 dark:border-green-900"
                : "border-red-200 dark:border-red-900"
            }`}
          >
            <div
              className={`flex items-start gap-4 p-5 sm:p-6 ${
                success
                  ? "bg-green-50 dark:bg-green-950/40"
                  : "bg-red-50 dark:bg-red-950/40"
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-bold ${
                  success
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }`}
              >
                {success ? "✓" : "!"}
              </div>

              <div className="min-w-0">
                <h2
                  className={`text-lg font-bold ${
                    success
                      ? "text-green-800 dark:text-green-300"
                      : "text-red-800 dark:text-red-300"
                  }`}
                >
                  {success ? "Verification successful" : "Verification failed"}
                </h2>

                <p
                  className={`mt-1 break-words text-sm leading-6 ${
                    success
                      ? "text-green-800 dark:text-green-300"
                      : "text-red-800 dark:text-red-300"
                  }`}
                >
                  {message}
                </p>
              </div>
            </div>

            {ticket && (
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <div>
                  <p className={labelClass}>Ticket code</p>
                  <p className="mt-2 break-all font-mono font-semibold text-slate-900 dark:text-white">
                    {ticket.ticket_code || "—"}
                  </p>
                </div>

                <div>
                  <p className={labelClass}>Ticket status</p>
                  <p className="mt-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                        status === "VALID" || status === "CONFIRMED"
                          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : status === "CANCELLED" || status === "INVALID"
                            ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {status || "Not provided"}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        <p className={`mt-6 text-center text-xs leading-5 ${mutedClass}`}>
          Verification is processed by the Evently server. Follow the returned
          result and your event's entry policy.
        </p>
      </div>
    </main>
  );
}

export default TicketVerify;
