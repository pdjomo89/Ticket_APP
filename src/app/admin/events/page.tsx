"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

type Tier = { id: string; name: string; price: number; description?: string };

export default function EventsPage() {
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [eventId, setEventId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [ticketsAvailable, setTicketsAvailable] = useState(100);
  const [imageUrl, setImageUrl] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([
    { id: "standard", name: "Standard", price: 3000 },
  ]);

  const events = useQuery(api.events.list);

  useEffect(() => {
    fetch("/api/admin/me").then(async (res) => {
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
      setLoading(false);
    });
  }, []);

  const updateTier = (i: number, patch: Partial<Tier>) => {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        name,
        description,
        date,
        time: time || undefined,
        venue,
        ticketsAvailable: Number(ticketsAvailable),
        imageUrl: imageUrl || undefined,
        tiers,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "Failed to create event");
      return;
    }
    setEventId("");
    setName("");
    setDescription("");
    setDate("");
    setTime("");
    setVenue("");
    setTicketsAvailable(100);
    setImageUrl("");
    setTiers([{ id: "standard", name: "Standard", price: 3000 }]);
    setShowForm(false);
  };

  if (loading || !me) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Events</h1>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/admin" className="text-orange-600 hover:underline">Dashboard</Link>
              <Link href="/admin/users" className="text-orange-600 hover:underline">Users</Link>
            </nav>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-400"
          >
            {showForm ? "Cancel" : "+ New event"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 space-y-3"
          >
            <h2 className="font-bold text-lg">New event</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="Event ID (e.g. evt_006)" required className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" required className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
              <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
              <input value={time} onChange={(e) => setTime(e.target.value)} placeholder='Display time (e.g. "7:00 PM – 1:00 AM")' className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
              <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue" required className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent sm:col-span-2" />
              <input type="number" value={ticketsAvailable} onChange={(e) => setTicketsAvailable(Number(e.target.value))} placeholder="Tickets available" required min={1} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Ticket tiers</p>
                <button
                  type="button"
                  onClick={() => setTiers([...tiers, { id: `tier_${tiers.length + 1}`, name: "", price: 0 }])}
                  className="text-xs text-orange-600 hover:underline"
                >
                  + Add tier
                </button>
              </div>
              <div className="space-y-2">
                {tiers.map((t, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input value={t.id} onChange={(e) => updateTier(i, { id: e.target.value })} placeholder="ID" className="col-span-2 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-transparent" />
                    <input value={t.name} onChange={(e) => updateTier(i, { name: e.target.value })} placeholder="Name" className="col-span-3 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-transparent" />
                    <input type="number" value={t.price} onChange={(e) => updateTier(i, { price: Number(e.target.value) })} placeholder="Price (cents)" className="col-span-2 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-transparent" />
                    <input value={t.description ?? ""} onChange={(e) => updateTier(i, { description: e.target.value })} placeholder="Description (optional)" className="col-span-4 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-transparent" />
                    <button
                      type="button"
                      onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))}
                      className="col-span-1 text-red-500 text-sm"
                      disabled={tiers.length === 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-400 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create event"}
            </button>
          </form>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
          {(!events || events.length === 0) && (
            <div className="p-8 text-center text-gray-500">No events yet.</div>
          )}
          {events?.map((ev) => (
            <div key={ev.eventId} className="p-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{ev.name}</p>
                <p className="text-sm text-gray-500">{ev.date} · {ev.venue}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {ev.eventId} · {ev.ticketsSold}/{ev.ticketsAvailable} sold · {ev.tiers.length} tier{ev.tiers.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
