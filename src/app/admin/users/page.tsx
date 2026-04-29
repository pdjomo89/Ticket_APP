"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

type User = {
  _id: string;
  email: string;
  name: string;
  role: "super" | "admin";
  eventIds: string[];
  createdAt: string;
};

export default function UsersPage() {
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formEventIds, setFormEventIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const events = useQuery(api.events.list);

  const refresh = async () => {
    const res = await fetch("/api/admin/users");
    if (!res.ok) {
      setError("Failed to load users");
      return;
    }
    const data = await res.json();
    setUsers(data.users);
  };

  useEffect(() => {
    fetch("/api/admin/me")
      .then(async (res) => {
        if (!res.ok) {
          window.location.href = "/admin";
          return;
        }
        const data = await res.json();
        if (data.role !== "super") {
          window.location.href = "/admin";
          return;
        }
        setMe(data);
        await refresh();
        setLoading(false);
      });
  }, []);

  const toggleFormEvent = (id: string) => {
    setFormEventIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formEmail,
        name: formName,
        password: formPassword,
        role: "admin",
        eventIds: formEventIds,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "Failed to create user");
      return;
    }
    setFormEmail("");
    setFormName("");
    setFormPassword("");
    setFormEventIds([]);
    setShowForm(false);
    await refresh();
  };

  const grantEvent = async (userId: string, eventId: string) => {
    await fetch(`/api/admin/users/${userId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    await refresh();
  };

  const revokeEvent = async (userId: string, eventId: string) => {
    await fetch(
      `/api/admin/users/${userId}/events?eventId=${encodeURIComponent(eventId)}`,
      { method: "DELETE" }
    );
    await refresh();
  };

  const resetPassword = async (userId: string) => {
    const newPassword = window.prompt("New password (min 8 chars):");
    if (!newPassword || newPassword.length < 8) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    if (res.ok) alert("Password updated.");
    else alert("Failed to update password.");
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Delete user ${email}?`)) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete user");
      return;
    }
    await refresh();
  };

  if (loading || !me) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Users</h1>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/admin" className="text-orange-600 hover:underline">Dashboard</Link>
              <Link href="/admin/events" className="text-orange-600 hover:underline">Events</Link>
            </nav>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-400"
          >
            {showForm ? "Cancel" : "+ New event admin"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 space-y-3"
          >
            <h2 className="font-bold text-lg">New event admin</h2>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
            />
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
            />
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Initial password (min 8 chars)"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
            />
            <div>
              <p className="text-sm font-medium mb-2">Events this admin can manage:</p>
              <div className="space-y-1 max-h-40 overflow-auto">
                {events?.map((ev) => (
                  <label key={ev.eventId} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formEventIds.includes(ev.eventId)}
                      onChange={() => toggleFormEvent(ev.eventId)}
                    />
                    <span>{ev.name}</span>
                  </label>
                ))}
              </div>
            </div>
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-400 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create admin"}
            </button>
          </form>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">No users yet.</div>
          )}
          {users.map((u) => (
            <div key={u._id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{u.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === "super"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <div className="flex gap-2 text-sm">
                  <button onClick={() => resetPassword(u._id)} className="text-orange-600 hover:underline">
                    Reset password
                  </button>
                  {u.role !== "super" && (
                    <button onClick={() => deleteUser(u._id, u.email)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {u.role !== "super" && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">EVENTS</p>
                  <div className="flex flex-wrap gap-2">
                    {events?.map((ev) => {
                      const granted = u.eventIds.includes(ev.eventId);
                      return (
                        <button
                          key={ev.eventId}
                          onClick={() =>
                            granted
                              ? revokeEvent(u._id, ev.eventId)
                              : grantEvent(u._id, ev.eventId)
                          }
                          className={`text-xs px-3 py-1 rounded-full border ${
                            granted
                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                              : "bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          {granted ? "✓ " : "+ "}
                          {ev.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
