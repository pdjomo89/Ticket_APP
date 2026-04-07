"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export default function EventsPage() {
  const events = useQuery(api.events.list);

  if (!events) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          Home
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => {
          const soldOut = event.ticketsSold >= event.ticketsAvailable;

          return (
            <div
              key={event.eventId}
              className="group relative rounded-2xl overflow-hidden flex flex-col min-h-[520px] shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
              style={
                event.imageUrl
                  ? { backgroundImage: `url(${event.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : undefined
              }
            >
              {/* Gradient overlay */}
              {event.imageUrl && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              )}

              {/* Price badge */}
              <div className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-md text-white font-bold text-lg px-4 py-2 rounded-full border border-white/30 shadow-lg">
                {event.tiers.length === 1
                  ? `$${(event.tiers[0].price / 100).toFixed(2)} CAD`
                  : `From $${(Math.min(...event.tiers.map((t) => t.price)) / 100).toFixed(2)} CAD`}
              </div>

              {/* Content pinned to bottom */}
              <div className="relative z-10 mt-auto">
                <div className="mx-4 mb-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-5">
                  <h2 className="text-2xl font-extrabold text-white mb-2 drop-shadow-lg">
                    {event.name}
                  </h2>
                  <p className="text-gray-200 text-sm mb-4 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="space-y-2 text-sm text-gray-100 mb-5">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(event.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{event.time || "TBA"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{event.venue}</span>
                    </div>
                  </div>

                  {soldOut ? (
                    <button
                      disabled
                      className="w-full py-3 bg-gray-500/50 backdrop-blur rounded-full text-gray-300 cursor-not-allowed font-semibold"
                    >
                      Sold Out
                    </button>
                  ) : (
                    <Link
                      href={`/events/${event.eventId}/checkout`}
                      className="block w-full py-3 bg-orange-500 text-white rounded-full font-bold text-center hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all duration-300"
                    >
                      Get Your Ticket
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
