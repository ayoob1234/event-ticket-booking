
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Profile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile_number: "",
    password: "",
  });

  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/profile");
        const user = response.data.user;

        setForm({
          name: user.name || "",
          email: user.email || "",
          mobile_number: user.mobile_number || "",
          password: "",
        });

        setRole(user.role || "USER");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Profile load nahi ho paya. Please login again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile_number: form.mobile_number.trim(),
      };

      if (form.password) {
        payload.password = form.password;
      }

      const response = await api.put("/auth/profile", payload);
      const updatedUser = response.data.user;

      setForm({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        mobile_number: updatedUser.mobile_number || "",
        password: "",
      });

      setRole(updatedUser.role || role);

      // Keep Navbar user details synchronized.
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          ...updatedUser,
          role: updatedUser.role || role,
        })
      );

      window.dispatchEvent(new Event("authChanged"));
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Profile update nahi ho paya. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-4 focus:ring-green-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-green-500 dark:focus:ring-green-950";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

  const sectionHeadingClass =
    "text-lg font-bold text-slate-900 dark:text-white";

  const mutedClass = "text-sm text-slate-500 dark:text-slate-400";

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 text-slate-600 transition-colors dark:bg-slate-950 dark:text-slate-300">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-green-600 dark:border-slate-700 dark:border-t-green-400" />
          <p className="font-semibold">Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          to={role === "ADMIN" ? "/admin" : "/events"}
          className="text-sm font-semibold text-green-700 transition hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
        >
          ← Back to {role === "ADMIN" ? "Dashboard" : "Events"}
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
          {/* Profile header */}
          <div className="bg-slate-950 px-6 py-8 text-white sm:px-10">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-500 text-2xl font-extrabold text-white">
                {form.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  My Profile
                </h1>

                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Manage your personal information and account security.
                </p>

                <span className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-green-300">
                  {role}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-10">
            {message && (
              <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300"
              >
                {message}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
              >
                {error}
              </div>
            )}

            {/* Personal information */}
            <div>
              <h2 className={sectionHeadingClass}>
                Personal information
              </h2>
              <p className={`mt-1 ${mutedClass}`}>
                Update the details associated with your account.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  maxLength={254}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="mobile_number" className={labelClass}>
                  Mobile number
                </label>
                <input
                  id="mobile_number"
                  name="mobile_number"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={form.mobile_number}
                  onChange={handleChange}
                  placeholder="Enter your mobile number"
                  maxLength={20}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Change password */}
            <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
              <h2 className={sectionHeadingClass}>
                Change password
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Leave this field blank if you do not want to change your
                current password.
              </p>

              <div className="mt-4">
                <label htmlFor="password" className={labelClass}>
                  New password
                </label>

                <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-green-600 focus-within:ring-4 focus-within:ring-green-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-green-500 dark:focus-within:ring-green-950">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="shrink-0 px-4 text-sm font-semibold text-slate-600 transition hover:text-green-700 dark:text-slate-300 dark:hover:text-green-400"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Profile;
