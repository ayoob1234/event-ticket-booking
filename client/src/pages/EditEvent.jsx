
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue: "",
    city: "",
    event_date: "",
    category_id: "",
    status: "PUBLISHED",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchEventData = async () => {
      try {
        setLoading(true);
        setError("");

        const [eventResponse, categoriesResponse] =
          await Promise.all([
            api.get(`/events/${id}`),
            api.get("/events/categories"),
          ]);

        if (cancelled) return;

        const event = eventResponse.data.event;

        setCategories(categoriesResponse.data.categories || []);

        const localDate = event.event_date
          ? (() => {
              const date = new Date(event.event_date);
              const offset = date.getTimezoneOffset();

              return new Date(date.getTime() - offset * 60000)
                .toISOString()
                .slice(0, 16);
            })()
          : "";

        setFormData({
          title: event.title || "",
          description: event.description || "",
          venue: event.venue || "",
          city: event.city || "",
          event_date: localDate,
          category_id: event.category_id
            ? String(event.category_id)
            : "",
          status: event.status || "PUBLISHED",
        });
      } catch (err) {
        if (cancelled) return;

        console.error("Fetch event error:", err);
        setError(
          err.response?.data?.message || "Failed to load event."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEventData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.put(`/events/${id}`, {
        ...formData,
        category_id: formData.category_id,
      });

      setMessage("Event updated successfully.");
    } catch (err) {
      console.error("Update event error:", err);
      setError(
        err.response?.data?.message || "Failed to update event."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-900/40";

  const labelClass =
    "block text-sm font-semibold text-slate-700 dark:text-slate-300";

  const sectionHeadingClass =
    "text-lg font-bold text-slate-900 dark:text-white";

  const sectionDescriptionClass =
    "mt-1 text-sm text-slate-500 dark:text-slate-400";

  const sectionBorderClass =
    "mb-5 border-b border-slate-100 pb-3 dark:border-slate-800";

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
          <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading event details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm dark:border-red-900/50 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600 dark:bg-red-950/50 dark:text-red-400">
            !
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Unable to load event
          </h2>

          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400"
        >
          <span aria-hidden="true">←</span>
          Back to Admin Dashboard
        </button>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="bg-[#14213d] px-6 py-8 text-white sm:px-9">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Event Management
                </p>

                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Edit Event
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                  Update event information, schedule, category and
                  publication status.
                </p>
              </div>

              <span className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold">
                Event ID: {id}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-9">
            {message && (
              <div
                role="status"
                className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300"
              >
                <span className="font-bold">✓</span>
                <p>{message}</p>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              >
                {error}
              </div>
            )}

            <section>
              <div className={sectionBorderClass}>
                <h2 className={sectionHeadingClass}>
                  Basic Information
                </h2>
                <p className={sectionDescriptionClass}>
                  Enter the event name and description.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="title">
                    Event Title <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Indore Music Festival"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the event and what attendees can expect..."
                    rows={5}
                    className={`${inputClass} resize-y`}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="mt-9">
              <div className={sectionBorderClass}>
                <h2 className={sectionHeadingClass}>
                  Location & Schedule
                </h2>
                <p className={sectionDescriptionClass}>
                  Specify where and when the event takes place.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="venue">
                    Venue <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="venue"
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange}
                    placeholder="Venue name"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Indore"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="event_date">
                    Event Date & Time{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="event_date"
                    type="datetime-local"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="category_id">
                    Category <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Select a category</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="mt-9">
              <div className={sectionBorderClass}>
                <h2 className={sectionHeadingClass}>
                  Publication Settings
                </h2>
                <p className={sectionDescriptionClass}>
                  Choose the current status of this event.
                </p>
              </div>

              <div className="max-w-md">
                <label className={labelClass} htmlFor="status">
                  Event Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Make sure the selected status matches the event's
                  current state.
                </p>
              </div>
            </section>

            <div className="mt-9 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    Save Changes <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          Changes are submitted to your event management API.
        </p>
      </div>
    </div>
  );
}

export default EditEvent;
