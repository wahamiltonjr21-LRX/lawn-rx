export default function CircularGarden() {
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center gap-6 p-8">
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="180" rx="40" fill="url(#bg-d)"/>
        {/* Outer glow ring */}
        <circle cx="90" cy="90" r="68" fill="none" stroke="url(#ring-d)" strokeWidth="4" opacity="0.6"/>
        {/* Main lawn circle */}
        <circle cx="90" cy="90" r="58" fill="url(#lawn-d)"/>
        {/* Lawn mowing rings */}
        <circle cx="90" cy="90" r="46" fill="none" stroke="#16a34a" strokeWidth="2.5" opacity="0.45"/>
        <circle cx="90" cy="90" r="34" fill="none" stroke="#16a34a" strokeWidth="2" opacity="0.35"/>
        <circle cx="90" cy="90" r="22" fill="none" stroke="#15803d" strokeWidth="1.5" opacity="0.3"/>
        {/* Center dot / logo */}
        <circle cx="90" cy="90" r="12" fill="white" opacity="0.95"/>
        <text x="90" y="95" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="11" fill="#15803d" letterSpacing="0.5">RX</text>
        {/* Corner grass tufts */}
        <path d="M35 90 Q32 80 36 72 Q38 80 37 90Z" fill="#4ade80" opacity="0.7"/>
        <path d="M145 90 Q142 80 146 72 Q148 80 147 90Z" fill="#4ade80" opacity="0.7"/>
        <path d="M90 35 Q80 32 72 36 Q80 38 90 37Z" fill="#4ade80" opacity="0.7"/>
        <path d="M90 145 Q80 142 72 146 Q80 148 90 147Z" fill="#4ade80" opacity="0.7"/>
        <defs>
          <radialGradient id="lawn-d" cx="42%" cy="38%" r="60%">
            <stop offset="0%" stopColor="#4ade80"/>
            <stop offset="45%" stopColor="#22c55e"/>
            <stop offset="100%" stopColor="#15803d"/>
          </radialGradient>
          <linearGradient id="bg-d" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fafff5"/>
            <stop offset="100%" stopColor="#f0fdf4"/>
          </linearGradient>
          <linearGradient id="ring-d" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#86efac"/>
            <stop offset="100%" stopColor="#22c55e"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="font-bold text-zinc-800 text-sm">D — Circular Garden</p>
        <p className="text-zinc-500 text-xs mt-1">Fresh, premium, top-down view</p>
      </div>
    </div>
  );
}
