import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag, MapPin, Leaf, Droplets, Bug, FlaskConical,
  Scissors, Sprout, Sun, ExternalLink, AlertCircle, RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GrassLoader } from "@/components/grass-loader";

type Zone = "cool" | "warm" | "transition" | "unknown";

interface ZoneInfo {
  label: string;
  description: string;
  grasses: string;
  color: string;
  bg: string;
}

const ZONE_INFO: Record<Zone, ZoneInfo> = {
  cool: {
    label: "Cool-Season Zone",
    description: "Northern US & Canada — cold winters, mild summers",
    grasses: "Kentucky Bluegrass · Tall Fescue · Perennial Ryegrass",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
  },
  warm: {
    label: "Warm-Season Zone",
    description: "Southern US — hot summers, mild winters",
    grasses: "Bermuda · Zoysia · St. Augustine · Centipede",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  },
  transition: {
    label: "Transition Zone",
    description: "Mid-Atlantic & Central US — challenging mixed climate",
    grasses: "Tall Fescue · Zoysia · Bermuda (south-facing)",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  },
  unknown: {
    label: "Your Region",
    description: "Showing general lawn care products",
    grasses: "All grass types",
    color: "text-muted-foreground",
    bg: "bg-muted/40 border-border",
  },
};

interface Product {
  name: string;
  description: string;
  icon: typeof Leaf;
  amazonQuery: string;
  homedepotQuery: string;
  zones: Zone[];
  badge?: string;
}

const PRODUCTS: Product[] = [
  {
    name: "Starter Fertilizer",
    description: "High-phosphorus blend to establish new grass or re-seed bare patches faster.",
    icon: Sprout,
    amazonQuery: "starter fertilizer lawn new seed",
    homedepotQuery: "starter fertilizer",
    zones: ["cool", "warm", "transition", "unknown"],
    badge: "Popular",
  },
  {
    name: "Slow-Release Lawn Fertilizer",
    description: "Feeds your lawn for up to 8 weeks. Ideal for cool-season grasses in spring & fall.",
    icon: FlaskConical,
    amazonQuery: "slow release lawn fertilizer 32-0-10 cool season",
    homedepotQuery: "slow release lawn fertilizer",
    zones: ["cool", "transition"],
  },
  {
    name: "Warm-Season Fertilizer",
    description: "High-nitrogen formula that fuels Bermuda, Zoysia, and St. Augustine through summer.",
    icon: Sun,
    amazonQuery: "warm season lawn fertilizer bermuda zoysia summer",
    homedepotQuery: "bermuda lawn fertilizer",
    zones: ["warm", "transition"],
  },
  {
    name: "Pre-Emergent Weed Control",
    description: "Apply before soil hits 55°F to stop crabgrass and other weeds before they sprout.",
    icon: Bug,
    amazonQuery: "pre-emergent herbicide crabgrass preventer lawn",
    homedepotQuery: "pre-emergent weed preventer",
    zones: ["cool", "warm", "transition", "unknown"],
  },
  {
    name: "Broadleaf Weed Killer",
    description: "Targets dandelions, clover, and chickweed without harming your grass.",
    icon: Bug,
    amazonQuery: "broadleaf weed killer lawn safe grass",
    homedepotQuery: "broadleaf weed killer lawn",
    zones: ["cool", "transition"],
  },
  {
    name: "Fungicide for Lawn Disease",
    description: "Controls brown patch, dollar spot, and other fungal diseases on all grass types.",
    icon: FlaskConical,
    amazonQuery: "lawn fungicide brown patch dollar spot",
    homedepotQuery: "lawn fungicide",
    zones: ["cool", "warm", "transition", "unknown"],
  },
  {
    name: "Grass Seed (Cool-Season Mix)",
    description: "Fescue & bluegrass blend for overseeding thin or bare areas in the north.",
    icon: Leaf,
    amazonQuery: "tall fescue bluegrass grass seed mix cool season",
    homedepotQuery: "fescue grass seed",
    zones: ["cool", "transition"],
  },
  {
    name: "Bermuda Grass Seed",
    description: "Fast-spreading, drought-tolerant Bermuda seed for sunny southern lawns.",
    icon: Leaf,
    amazonQuery: "bermuda grass seed hulled sun lawn",
    homedepotQuery: "bermuda grass seed",
    zones: ["warm"],
  },
  {
    name: "Soil Moisture Meter",
    description: "Know exactly when to water — prevents both overwatering and drought stress.",
    icon: Droplets,
    amazonQuery: "soil moisture meter lawn garden outdoor",
    homedepotQuery: "soil moisture meter",
    zones: ["cool", "warm", "transition", "unknown"],
    badge: "Smart tool",
  },
  {
    name: "Sprinkler Timer & Controller",
    description: "Set-and-forget watering schedules that adapt to your lawn's needs.",
    icon: Droplets,
    amazonQuery: "hose timer sprinkler controller garden wifi",
    homedepotQuery: "sprinkler timer controller",
    zones: ["cool", "warm", "transition", "unknown"],
  },
  {
    name: "Lawn Aerator Shoes / Tool",
    description: "Break up compacted soil so water, nutrients, and air reach the roots.",
    icon: Scissors,
    amazonQuery: "lawn aerator core plug aerator tool",
    homedepotQuery: "lawn aerator",
    zones: ["cool", "warm", "transition", "unknown"],
  },
  {
    name: "Dethatching Rake",
    description: "Remove the layer of dead grass and debris that chokes water absorption.",
    icon: Scissors,
    amazonQuery: "dethatching rake lawn thatch removal",
    homedepotQuery: "dethatching rake",
    zones: ["cool", "transition"],
  },
];

function productUrl(base: string, query: string) {
  return `${base}${encodeURIComponent(query)}`;
}

function getZoneFromLat(lat: number): Zone {
  if (lat >= 40) return "cool";
  if (lat >= 34) return "transition";
  if (lat >= 20) return "warm";
  return "unknown";
}

async function detectZone(): Promise<{ zone: Zone; city?: string; region?: string }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ zone: "unknown" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const zone = getZoneFromLat(pos.coords.latitude);
        resolve({ zone });
      },
      async () => {
        // Fallback: IP-based geolocation
        try {
          const res = await fetch("https://ipapi.co/json/");
          if (res.ok) {
            const data = (await res.json()) as {
              latitude?: number;
              city?: string;
              region?: string;
            };
            const zone = data.latitude ? getZoneFromLat(data.latitude) : "unknown";
            resolve({ zone, city: data.city, region: data.region });
          } else {
            resolve({ zone: "unknown" });
          }
        } catch {
          resolve({ zone: "unknown" });
        }
      },
      { timeout: 5000 },
    );
  });
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
};

export default function Shop() {
  const [zone, setZone] = useState<Zone | null>(null);
  const [location, setLocation] = useState<string>("");
  const [error, setError] = useState(false);
  const [detecting, setDetecting] = useState(true);

  const detect = () => {
    setDetecting(true);
    setError(false);
    detectZone()
      .then(({ zone: z, city, region }) => {
        setZone(z);
        if (city && region) setLocation(`${city}, ${region}`);
        else if (region) setLocation(region);
      })
      .catch(() => {
        setZone("unknown");
        setError(true);
      })
      .finally(() => setDetecting(false));
  };

  useEffect(() => { detect(); }, []);

  const visibleProducts = zone
    ? PRODUCTS.filter((p) => p.zones.includes(zone))
    : [];

  const zoneInfo = zone ? ZONE_INFO[zone] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <ShoppingBag className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-bold tracking-tight">Shop by Region</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Products matched to your local climate and grass type.
        </p>
      </motion.div>

      {/* Zone detection */}
      {detecting ? (
        <div className="flex flex-col items-center py-16">
          <GrassLoader label="Detecting your region…" />
        </div>
      ) : (
        <>
          {zoneInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl border p-4 ${zoneInfo.bg}`}
            >
              <div className="flex items-start gap-3">
                <MapPin className={`w-5 h-5 mt-0.5 shrink-0 ${zoneInfo.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold ${zoneInfo.color}`}>
                      {zoneInfo.label}
                    </span>
                    {location && (
                      <span className="text-xs text-muted-foreground">({location})</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{zoneInfo.description}</p>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    Common grasses: {zoneInfo.grasses}
                  </p>
                </div>
                <button
                  onClick={detect}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Re-detect location"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Could not detect precise location — showing general products.
                </div>
              )}
            </motion.div>
          )}

          {/* Products grid */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {visibleProducts.map((product) => {
              const Icon = product.icon;
              return (
                <motion.div key={product.name} variants={item}>
                  <Card className="h-full hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-4 flex flex-col gap-3 h-full">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
                          <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm leading-tight">
                              {product.name}
                            </span>
                            {product.badge && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                {product.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto pt-1">
                        <a
                          href={productUrl(
                            "https://www.amazon.com/s?k=",
                            product.amazonQuery,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-1.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Amazon
                          </Button>
                        </a>
                        <a
                          href={productUrl(
                            "https://www.homedepot.com/s/",
                            product.homedepotQuery,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs gap-1.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Home Depot
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          <p className="text-[11px] text-muted-foreground/60 text-center pb-2">
            Product links open retailer searches. LawnRX is not affiliated with any retailer.
          </p>
        </>
      )}
    </div>
  );
}
