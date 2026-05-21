export default function GrassBlades() {
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center gap-6 p-8">
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="180" rx="40" fill="url(#bg-a)"/>
        {/* Ground */}
        <ellipse cx="90" cy="138" rx="58" ry="10" fill="#15803d" opacity="0.6"/>
        {/* Grass blades */}
        <path d="M55 135 Q50 105 58 80 Q62 95 60 135Z" fill="#22c55e"/>
        <path d="M68 135 Q60 95 72 60 Q78 85 74 135Z" fill="#16a34a"/>
        <path d="M80 135 Q75 90 90 55 Q95 82 88 135Z" fill="#22c55e"/>
        <path d="M95 135 Q93 88 108 58 Q112 82 103 135Z" fill="#4ade80"/>
        <path d="M108 135 Q108 92 118 70 Q122 90 116 135Z" fill="#16a34a"/>
        <path d="M120 135 Q122 100 128 82 Q131 98 126 135Z" fill="#22c55e"/>
        {/* RX text */}
        <text x="90" y="165" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="22" letterSpacing="3" fill="white" opacity="0.95">RX</text>
        <defs>
          <linearGradient id="bg-a" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#052e16"/>
            <stop offset="60%" stopColor="#14532d"/>
            <stop offset="100%" stopColor="#166534"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="font-bold text-zinc-800 text-sm">A — Grass Blades</p>
        <p className="text-zinc-500 text-xs mt-1">Dark green, bold, outdoorsy</p>
      </div>
    </div>
  );
}
