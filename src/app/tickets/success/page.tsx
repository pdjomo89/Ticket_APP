"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Ticket {
  id: string;
  buyerName: string;
  buyerEmail: string;
  tierName: string;
  qrCode: string;
  status: string;
}

interface TicketData {
  tickets: Ticket[];
  event: {
    name: string;
    date: string;
    venue: string;
  };
}

async function downloadPDF(data: TicketData) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let i = 0; i < data.tickets.length; i++) {
    const ticket = data.tickets[i];
    if (i > 0) doc.addPage();

    // Header
    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(data.event.name, pageWidth / 2, 18, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`${ticket.tierName} — Ticket ${i + 1} of ${data.tickets.length}`, pageWidth / 2, 30, { align: "center" });

    // Event details
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    let y = 55;

    doc.setFont("helvetica", "bold");
    doc.text("Date:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(
      new Date(data.event.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      50,
      y
    );

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Venue:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.event.venue, 50, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Type:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(ticket.tierName, 50, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Name:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(ticket.buyerName, 50, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Email:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(ticket.buyerEmail, 50, y);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Ticket ID:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(ticket.id, 55, y);
    doc.setFontSize(12);

    // QR Code
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Show this QR code at the entrance:", pageWidth / 2, y, { align: "center" });

    y += 8;
    const qrSize = 80;
    doc.addImage(ticket.qrCode, "PNG", (pageWidth - qrSize) / 2, y, qrSize, qrSize);

    // Footer
    y += qrSize + 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("This ticket is valid for one-time entry only. Do not share this QR code.", pageWidth / 2, y, { align: "center" });
  }

  doc.save(`${data.event.name.replace(/\s+/g, "_")}_tickets.pdf`);
}

function TicketSuccessContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<TicketData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setError("No session ID found");
      setLoading(false);
      return;
    }

    fetch(`/api/tickets/by-session?session_id=${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load ticket");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load ticket. Please check your email for details.");
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <Link href="/events" className="text-blue-600 hover:underline">
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-green-500 text-6xl mb-4">&#10003;</div>
        <h1 className="text-3xl font-bold mb-2">
          {data.tickets.length === 1 ? "Ticket Confirmed!" : `${data.tickets.length} Tickets Confirmed!`}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your {data.tickets.length === 1 ? "ticket has" : "tickets have"} been purchased successfully.
        </p>
      </div>

      {/* Download PDF Button */}
      <div className="text-center mb-8">
        <button
          onClick={() => downloadPDF(data)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download {data.tickets.length === 1 ? "Ticket" : "All Tickets"} as PDF
        </button>
      </div>

      {/* Ticket cards */}
      <div className="space-y-6">
        {data.tickets.map((ticket, index) => (
          <div key={ticket.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{data.event.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full font-medium">
                  {ticket.tierName}
                </span>
                {data.tickets.length > 1 && (
                  <span className="text-sm bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full font-medium">
                    {index + 1} of {data.tickets.length}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <p>
                <span className="font-medium">Date:</span>{" "}
                {new Date(data.event.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <span className="font-medium">Venue:</span> {data.event.venue}
              </p>
              <p>
                <span className="font-medium">Type:</span> {ticket.tierName}
              </p>
              <p>
                <span className="font-medium">Name:</span> {ticket.buyerName}
              </p>
              <p>
                <span className="font-medium">Email:</span> {ticket.buyerEmail}
              </p>
              <p>
                <span className="font-medium">Ticket ID:</span>{" "}
                <span className="font-mono text-xs">{ticket.id}</span>
              </p>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-sm font-medium mb-3">
                Show this QR code at the entrance:
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ticket.qrCode}
                alt="Ticket QR Code"
                className="w-64 h-64 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href="/events"
          className="text-blue-600 hover:underline"
        >
          Browse More Events
        </Link>
      </div>
    </div>
  );
}

export default function TicketSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      }
    >
      <TicketSuccessContent />
    </Suspense>
  );
}
