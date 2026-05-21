export default function LeafRx() {
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center gap-6 p-8">
      <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="180" height="180" rx="40" fill="url(#bg-b)"/>
        {/* Leaf shape */}
        <path d="M90 30 C90 30 130 50 130 90 C130 120 110 145 90 150 C70 145 50 120 50 90 C50 50 90 30 90 30Z" fill="url(#leaf-b)" opacity="0.95"/>
        {/* Leaf vein */}
        <path d="M90 42 Q88 90 86 148" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
        <path d="M90 70 Q100 78 118 75" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/>
        <path d="M90 90 Q100 98 115 97" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/>
        <path d="M90 108 Q98 115 110 115" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
        {/* Rx lettering inside leaf */}
        <text x="90" y="100" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontStyle="italic" fontSize="36" fill="white" opacity="0.92">Rx</text>
        <defs>
          <linearGradient id="bg-b" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f0fdf4"/>
            <stop offset="100%" stopColor="#dcfce7"/>
          </linearGradient>
          <linearGradient id="leaf-b" x1="90" y1="30" x2="90" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#16a34a"/>
            <stop offset="100%" stopColor="#052e16"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="font-bold text-zinc-800 text-sm">B — Leaf Rx</p>
        <p className="text-zinc-500 text-xs mt-1">Clean, medical, trustworthy</p>
      </div>
    </div>
  );
}
