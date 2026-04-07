import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">TicketFlow</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Buy tickets to amazing events. Get instant QR code entry passes.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/events"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Browse Events
          </Link>
          <Link
            href="/scanner"
            className="px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Scan Tickets
          </Link>
        </div>
      </div>
    </div>
  );
}
