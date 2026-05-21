import { motion } from "framer-motion";

const blades = [
  { x: 12, height: 28, delay: 0,    skew: -6,  width: 5 },
  { x: 22, height: 36, delay: 0.08, skew:  4,  width: 4 },
  { x: 32, height: 44, delay: 0.16, skew: -3,  width: 6 },
  { x: 43, height: 38, delay: 0.05, skew:  5,  width: 4 },
  { x: 53, height: 46, delay: 0.22, skew: -5,  width: 5 },
  { x: 63, height: 32, delay: 0.12, skew:  3,  width: 4 },
  { x: 72, height: 40, delay: 0.18, skew: -4,  width: 5 },
];

export function GrassLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <svg viewBox="0 0 88 60" className="w-24 h-16" aria-hidden>
        {blades.map((b, i) => (
          <motion.rect
            key={i}
            x={b.x}
            y={50 - b.height}
            width={b.width}
            height={b.height}
            rx={b.width / 2}
            fill="#22c55e"
            style={{ originY: "100%", skewX: b.skew }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: [0, 1.08, 1],
              opacity: 1,
              skewX: [0, b.skew * 1.4, b.skew],
            }}
            transition={{
              duration: 0.55,
              delay: b.delay,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />
        ))}

        {/* sway after grow */}
        {blades.map((b, i) => (
          <motion.rect
            key={`sway-${i}`}
            x={b.x}
            y={50 - b.height}
            width={b.width}
            height={b.height}
            rx={b.width / 2}
            fill="transparent"
            style={{ originY: "100%" }}
            animate={{ skewX: [b.skew, b.skew + 4, b.skew - 4, b.skew] }}
            transition={{
              duration: 2.4,
              delay: 0.6 + i * 0.06,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* ground strip */}
        <motion.rect
          x={0} y={50} width={88} height={6} rx={2}
          fill="#16a34a"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ originX: "50%" }}
        />
      </svg>

      <motion.span
        className="text-sm text-muted-foreground font-medium tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {label}
      </motion.span>
    </div>
  );
}
