"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

type Me = { email: string; role: "super" | "admin"; eventIds: string[] };

export default function ScannerHomePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);
  const events = useQuery(api.events.list);

  useEffect(() => {
    fetch("/api/admin/me")
      .then(async (res) => {
        if (!res.ok) {
          window.location.href = "/admin?next=/scanner";
          return;
        }
        setMe(await res.json());
      })
      .finally(() => setChecked(true));
  }, []);

  if (!checked || !me) return null;

  const allowed =
    me.role === "super"
      ? events ?? []
      : (events ?? []).filter((e) => me.eventIds.includes(e.eventId));

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Pick an event to scan</h1>
        <Link href="/admin" className="text-blue-600 hover:underline text-sm">
          Dashboard
        </Link>
      </div>

      {!events && <p className="text-gray-500">Loading events...</p>}

      {events && allowed.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-yellow-700 dark:text-yellow-300">
          You don&apos;t have any events assigned yet. Ask the super-admin to grant you access.
        </div>
      )}

      <div className="space-y-3">
        {allowed.map((e) => (
          <Link
            key={e.eventId}
            href={`/scanner/${e.eventId}`}
            className="block p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500 transition"
          >
            <p className="font-semibold">{e.name}</p>
            <p className="text-sm text-gray-500">
              {e.date} · {e.venue}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {e.ticketsSold}/{e.ticketsAvailable} sold
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
