
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Page heading */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
            Evently · Event operations
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#14213d] sm:text-4xl">
            Ticket Verification
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Verify a ticket code before admitting a guest to the event.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Verification form */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#14213d] text-2xl text-white">
                ✓
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#14213d]">
                  Check a ticket
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the ticket code below.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label
                  htmlFor="ticket-code"
                  className="mb-2 block text-sm font-semibold text-slate-700"
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
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#14213d] outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Enter the code printed on the guest's digital ticket.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !ticketCode.trim()}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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

            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-[#14213d]">
                Before admitting a guest
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-600">
                <li>• Check the verification result carefully.</li>
                <li>• Confirm the ticket status shown by the system.</li>
                <li>• Follow your event's entry and re-entry rules.</li>
              </ul>
            </div>
          </section>

          {/* Initial state / instructions */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-3xl">
                🎟️
              </div>

              <h2 className="mt-5 text-xl font-bold text-[#14213d]">
                Entry desk
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                Ticket verification helps your team check ticket information
                before guests enter.
              </p>

              <div className="mt-6 w-full rounded-xl border border-slate-200 p-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Verification process
                </p>

                <ol className="mt-3 space-y-3 text-sm text-slate-700">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                      1
                    </span>
                    Enter the ticket code.
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                      2
                    </span>
                    Select Verify Ticket.
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
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
            className={`mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm ${
              success
                ? "border-green-200"
                : "border-red-200"
            }`}
          >
            <div
              className={`flex items-start gap-4 p-5 sm:p-6 ${
                success ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-bold ${
                  success
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {success ? "✓" : "!"}
              </div>

              <div className="min-w-0">
                <h2
                  className={`text-lg font-bold ${
                    success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {success ? "Verification successful" : "Verification failed"}
                </h2>

                <p
                  className={`mt-1 break-words text-sm leading-6 ${
                    success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {message}
                </p>
              </div>
            </div>

            {ticket && (
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ticket code
                  </p>
                  <p className="mt-2 break-all font-mono font-semibold text-[#14213d]">
                    {ticket.ticket_code || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ticket status
                  </p>
                  <p className="mt-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                        status === "VALID" || status === "CONFIRMED"
                          ? "bg-green-50 text-green-700"
                          : status === "CANCELLED" || status === "INVALID"
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-700"
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

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          Verification is processed by the Evently server. Follow the returned
          result and your event's entry policy.
        </p>
      </div>
    </main>
  );
}

export default TicketVerify;
