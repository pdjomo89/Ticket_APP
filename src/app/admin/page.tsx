"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Real-time Convex queries — only run when authenticated
  const stats = useQuery(api.tickets.stats, authenticated ? {} : "skip");
  const tickets = useQuery(
    api.tickets.listAll,
    authenticated
      ? { search: search || undefined, status: statusFilter || undefined }
      : "skip"
  );

  // Check if already authenticated
  useEffect(() => {
    fetch("/api/admin/stats").then((res) => {
      if (res.ok) setAuthenticated(true);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setAuthenticated(true);
    } else {
      setLoginError("Invalid password");
    }
    setLoading(false);
  };

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <form onSubmit={handleLogin} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔒</div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Enter password to continue</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
            autoFocus
          />
          {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-400 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">← Back to site</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Tickets Sold" value={stats.totals.sold} color="blue" />
            <StatCard label="Checked In" value={stats.totals.checkedIn} color="green" />
            <StatCard label="Not Yet Scanned" value={stats.totals.valid} color="orange" />
            <StatCard label="Cancelled" value={stats.totals.cancelled} color="red" />
          </div>
        )}

        {/* Attendance bar */}
        {stats && stats.totals.sold > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Check-in Progress</h2>
              <span className="text-sm text-gray-500">
                {stats.totals.checkedIn} / {stats.totals.sold} ({stats.totals.sold > 0 ? Math.round((stats.totals.checkedIn / stats.totals.sold) * 100) : 0}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${stats.totals.sold > 0 ? (stats.totals.checkedIn / stats.totals.sold) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Event breakdown */}
        {stats && stats.events.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-800">
            <h2 className="font-bold text-lg mb-4">Events</h2>
            <div className="space-y-3">
              {stats.events.map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <span className="font-medium">{event.name}</span>
                  <span className="text-sm text-gray-500">
                    {event.tickets_sold} / {event.tickets_available} sold
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tickets table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-bold text-lg mb-4">All Tickets</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by name, email, or ticket ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All statuses</option>
                <option value="valid">Valid</option>
                <option value="used">Scanned</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {!tickets || tickets.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              {search || statusFilter ? "No tickets match your filters" : "No tickets sold yet"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">Ticket ID</th>
                    <th className="px-6 py-3 font-medium">Buyer</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Event</th>
                    <th className="px-6 py-3 font-medium">Tier</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Purchased</th>
                    <th className="px-6 py-3 font-medium">Scanned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-mono text-xs">{ticket.id.slice(0, 16)}...</td>
                      <td className="px-6 py-4">{ticket.buyer_name}</td>
                      <td className="px-6 py-4">{ticket.buyer_email}</td>
                      <td className="px-6 py-4">{ticket.event_name}</td>
                      <td className="px-6 py-4">{ticket.tier_name}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(ticket.purchased_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {ticket.scanned_at ? new Date(ticket.scanned_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    green: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
    orange: "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    red: "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  return (
    <div className={`rounded-xl p-5 border ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    valid: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    used: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    cancelled: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  };

  const labels: Record<string, string> = {
    valid: "Valid",
    used: "Scanned",
    cancelled: "Cancelled",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {labels[status] || status}
    </span>
  );
}
