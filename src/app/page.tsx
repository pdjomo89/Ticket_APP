import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background image grid with blend */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 opacity-40">
        <div
          className="bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800')",
          }}
        />
        <div
          className="bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800')",
          }}
        />
        <div
          className="bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800')",
          }}
        />
        <div
          className="bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800')",
          }}
        />
        <div
          className="bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800')",
          }}
        />
        <div
          className="bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800')",
          }}
        />
        <div
          className="bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1529543544282-ea57407bc2e3?w=800')",
          }}
        />
        <div
          className="bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800')",
          }}
        />
      </div>

      {/* Gradient overlays for blending */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-orange-900/30 via-purple-900/20 to-pink-900/30" />

      {/* Animated glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />

      {/* Top-left logo */}
      <Link
        href="/"
        aria-label="TicketFlow home"
        className="absolute top-4 left-4 md:top-6 md:left-6 z-20"
      >
        <Image
          src="/logo.png"
          alt="TicketFlow"
          width={512}
          height={512}
          priority
          className="w-32 h-32 md:w-44 md:h-44 drop-shadow-[0_0_30px_rgba(249,115,22,0.35)]"
        />
      </Link>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm text-gray-300 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live events available now
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight">
            Ticket
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Flow
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed max-w-2xl mx-auto">
            Your gateway to unforgettable experiences.
          </p>
          <p className="text-gray-400 mb-12 max-w-lg mx-auto">
            Browse events, grab your tickets, and get instant QR code passes.
            Concerts, galas, festivals, and more — all in one place.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/events"
              className="group relative px-10 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-bold text-lg hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] transition-all duration-500 hover:scale-105"
            >
              <span className="relative z-10">Browse Events</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-2xl mx-auto">
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-1">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-sm">Instant Tickets</p>
              <p className="text-gray-400 text-xs">QR codes delivered instantly</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mb-1">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-sm">Secure Payment</p>
              <p className="text-gray-400 text-xs">Powered by Stripe</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-1">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-sm">Easy Check-in</p>
              <p className="text-gray-400 text-xs">Scan QR at the door</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
