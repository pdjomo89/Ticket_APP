"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export default function CheckoutPage() {
  const params = useParams();
  const event = useQuery(api.events.getByEventId, {
    eventId: params.id as string,
  });

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (event === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <Link href="/events" className="text-blue-600 hover:underline">Back to Events</Link>
      </div>
    );
  }

  const tier = event.tiers.find((t) => t.id === selectedTier) || event.tiers[0];
  const tierPrice = tier?.price || 0;
  const remaining = event.ticketsAvailable - event.ticketsSold;
  const maxQty = Math.min(remaining, 10);

  // Auto-select first tier if not selected
  if (!selectedTier && event.tiers.length > 0) {
    setSelectedTier(event.tiers[0].id);
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: params.id,
          buyerName,
          buyerEmail,
          quantity,
          tierId: tier.id,
          tierName: tier.name,
          tierPrice: tier.price,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Checkout failed");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Link href="/events" className="text-blue-600 hover:underline mb-6 block">
        &larr; Back to Events
      </Link>

      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{event.description}</p>
        <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
          <p>
            {new Date(event.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {event.venue !== "TBA" && <p>{event.venue}</p>}
          {event.venue === "TBA" && <p className="italic">Venue to be announced</p>}
        </div>
      </div>

      <form onSubmit={handleCheckout} className="space-y-4">
        {/* Tier selection */}
        {event.tiers.length > 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Select Ticket Type</h2>
            <div className="space-y-3">
              {event.tiers.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                    selectedTier === t.id
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="tier"
                      value={t.id}
                      checked={selectedTier === t.id}
                      onChange={() => setSelectedTier(t.id)}
                      className="accent-orange-500"
                    />
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      {t.description && (
                        <p className="text-sm text-gray-500">{t.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-lg">${(t.price / 100).toFixed(2)} CAD</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold">Your Details</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            required
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Number of Tickets</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              −
            </button>
            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
              className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              +
            </button>
            <span className="text-sm text-gray-500">({remaining} available)</span>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>{tier?.name} — ${(tierPrice / 100).toFixed(2)} × {quantity}</span>
            <span>${((tierPrice * quantity) / 100).toFixed(2)} CAD</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${((tierPrice * quantity) / 100).toFixed(2)} CAD</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : `Pay $${((tierPrice * quantity) / 100).toFixed(2)} CAD`}
        </button>
      </form>
    </div>
  );
}
