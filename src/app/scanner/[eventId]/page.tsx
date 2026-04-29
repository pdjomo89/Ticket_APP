"use client";

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

interface ValidationResult {
  valid: boolean;
  message: string;
  ticket?: {
    id: string;
    buyerName: string;
    buyerEmail?: string;
    eventName: string;
    eventDate?: string;
    eventVenue?: string;
    status: string;
  } | null;
}

type Me = { role: "super" | "admin"; eventIds: string[] };

export default function ScannerEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  const [me, setMe] = useState<Me | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const event = useQuery(api.events.getByEventId, { eventId });

  useEffect(() => {
    fetch("/api/admin/me").then(async (res) => {
      if (!res.ok) {
        window.location.href = `/admin?next=/scanner/${eventId}`;
        return;
      }
      const data: Me = await res.json();
      setMe(data);
      setAllowed(data.role === "super" || data.eventIds.includes(eventId));
    });
  }, [eventId]);

  const startScanning = async () => {
    setResult(null);
    setError("");
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          await validateTicket(decodedText);
        },
        () => {}
      );
    } catch {
      setError("Camera access denied or not available. Use manual entry below.");
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await (html5QrCodeRef.current as { stop: () => Promise<void> }).stop();
      } catch {
        // already stopped
      }
    }
    setScanning(false);
  };

  const validateTicket = async (rawData: string) => {
    setResult(null);
    setError("");

    let ticketId: string;
    try {
      const parsed = JSON.parse(rawData);
      ticketId = parsed.ticketId;
    } catch {
      ticketId = rawData;
    }

    if (!ticketId) {
      setError("Invalid QR code - no ticket ID found");
      return;
    }

    try {
      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, eventId }),
      });
      if (res.status === 401) {
        window.location.href = `/admin?next=/scanner/${eventId}`;
        return;
      }
      const data: ValidationResult = await res.json();
      setResult(data);
    } catch {
      setError("Network error. Please check connection and try again.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) validateTicket(manualCode.trim());
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (allowed === null) return null;
  if (allowed === false) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-3">Not authorized</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You don&apos;t have access to scan tickets for this event.
        </p>
        <Link href="/scanner" className="text-blue-600 hover:underline">
          ← Back to event picker
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-2">
        <Link href="/scanner" className="text-blue-600 hover:underline text-sm">
          ← Switch event
        </Link>
        <Link href="/admin" className="text-blue-600 hover:underline text-sm">
          Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-1">Ticket Scanner</h1>
      <p className="text-gray-500 text-sm mb-6">
        {event?.name ?? eventId}
      </p>

      <div className="mb-6">
        <div
          id="qr-reader"
          ref={scannerRef}
          className="w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800"
          style={{ minHeight: scanning ? 300 : 0 }}
        />

        <div className="mt-4 flex gap-3">
          {!scanning ? (
            <button
              onClick={startScanning}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Start Camera Scan
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Stop Scanning
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Manual Ticket Entry</h2>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter ticket ID or paste QR data"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Validate
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div
          className={`rounded-xl p-6 border ${
            result.valid
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-4xl ${result.valid ? "text-green-500" : "text-red-500"}`}>
              {result.valid ? "✓" : "✗"}
            </span>
            <div>
              <h3 className={`text-xl font-bold ${result.valid ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                {result.valid ? "VALID" : "INVALID"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.message}</p>
            </div>
          </div>

          {result.ticket && (
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Event:</span> {result.ticket.eventName}</p>
              <p><span className="font-medium">Name:</span> {result.ticket.buyerName}</p>
              {result.ticket.buyerEmail && <p><span className="font-medium">Email:</span> {result.ticket.buyerEmail}</p>}
              {result.ticket.eventDate && <p><span className="font-medium">Date:</span> {new Date(result.ticket.eventDate).toLocaleDateString()}</p>}
              {result.ticket.eventVenue && <p><span className="font-medium">Venue:</span> {result.ticket.eventVenue}</p>}
              <p><span className="font-medium">Ticket ID:</span> <span className="font-mono text-xs">{result.ticket.id}</span></p>
            </div>
          )}

          <button
            onClick={() => {
              setResult(null);
              setManualCode("");
            }}
            className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Scan Next Ticket
          </button>
        </div>
      )}
    </div>
  );
}
