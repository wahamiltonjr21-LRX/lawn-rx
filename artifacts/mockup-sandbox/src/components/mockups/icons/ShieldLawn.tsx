export default function ShieldLawn() {
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center gap-6 p-8">
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="180" rx="40" fill="url(#bg-c)"/>
        {/* Shield outline */}
        <path d="M90 22 L148 46 L148 96 C148 128 120 152 90 162 C60 152 32 128 32 96 L32 46 Z" fill="url(#shield-c)" stroke="white" strokeWidth="2.5" strokeOpacity="0.25"/>
        {/* Grass inside shield */}
        <clipPath id="shield-clip">
          <path d="M90 22 L148 46 L148 96 C148 128 120 152 90 162 C60 152 32 128 32 96 L32 46 Z"/>
        </clipPath>
        <g clipPath="url(#shield-clip)">
          {/* Sky gradient */}
          <rect x="32" y="22" width="116" height="140" fill="url(#sky-c)"/>
          {/* Ground */}
          <rect x="32" y="118" width="116" height="44" fill="#15803d"/>
          {/* Grass blades */}
          <path d="M55 120 Q52 100 58 84 Q61 98 59 120Z" fill="#4ade80"/>
          <path d="M68 120 Q64 95 73 72 Q77 90 73 120Z" fill="#22c55e"/>
          <path d="M82 120 Q79 88 90 65 Q94 84 88 120Z" fill="#4ade80"/>
          <path d="M96 120 Q95 85 106 68 Q110 85 104 120Z" fill="#22c55e"/>
          <path d="M110 120 Q110 92 118 76 Q121 90 117 120Z" fill="#4ade80"/>
          <path d="M122 120 Q123 98 128 86 Q130 98 127 120Z" fill="#22c55e"/>
        </g>
        <defs>
          <linearGradient id="bg-c" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e3a5f"/>
            <stop offset="100%" stopColor="#0f172a"/>
          </linearGradient>
          <linearGradient id="shield-c" x1="90" y1="22" x2="90" y2="162" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0.6"/>
          </linearGradient>
          <linearGradient id="sky-c" x1="90" y1="22" x2="90" y2="118" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#bfdbfe"/>
            <stop offset="100%" stopColor="#dbeafe"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="font-bold text-zinc-800 text-sm">C — Shield Lawn</p>
        <p className="text-zinc-500 text-xs mt-1">Protective, authoritative, bold</p>
      </div>
    </div>
  );
}
