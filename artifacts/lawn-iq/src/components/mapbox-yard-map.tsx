import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { polygon } from "@turf/helpers";
import { area } from "@turf/area";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { Search, Trash2, PenLine, CheckCircle2, Loader2 } from "lucide-react";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface MapboxYardMapProps {
  onAreaCalculated: (sqFt: number) => void;
  initialCenter?: [number, number];
}

function sqMetersToSqFeet(sqM: number): number {
  return Math.round(sqM * 10.7639);
}

export default function MapboxYardMap({ onAreaCalculated, initialCenter }: MapboxYardMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; place_name: string; center: [number, number] }>>([]);
  const [drawnSqFt, setDrawnSqFt] = useState<number | null>(null);
  const [mode, setMode] = useState<"idle" | "drawing">("idle");
  const [mapLoaded, setMapLoaded] = useState(false);

  // Init map
  useEffect(() => {
    if (!TOKEN || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: initialCenter ?? [-98.5795, 39.8283], // US center
      zoom: initialCenter ? 18 : 4,
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: false, trash: false },
      defaultMode: "simple_select",
      styles: [
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: { "fill-color": "#22c55e", "fill-opacity": 0.25 },
        },
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: { "line-color": "#22c55e", "line-width": 2.5 },
        },
        {
          id: "gl-draw-polygon-midpoint",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
          paint: { "circle-radius": 4, "circle-color": "#22c55e" },
        },
        {
          id: "gl-draw-polygon-and-line-vertex-active",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"]],
          paint: { "circle-radius": 6, "circle-color": "#fff", "circle-stroke-width": 2, "circle-stroke-color": "#22c55e" },
        },
      ],
    });

    map.addControl(draw);
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: "imperial" }), "bottom-left");

    map.on("load", () => setMapLoaded(true));

    map.on("draw.create", updateArea);
    map.on("draw.update", updateArea);
    map.on("draw.delete", () => { setDrawnSqFt(null); setMode("idle"); });
    map.on("draw.modechange", (e: any) => {
      if (e.mode === "draw_polygon") setMode("drawing");
      else if (e.mode === "simple_select") setMode("idle");
    });

    function updateArea() {
      const data = draw.getAll();
      if (!data.features.length) { setDrawnSqFt(null); return; }
      const feat = data.features[data.features.length - 1];
      if (feat.geometry.type === "Polygon") {
        const sqM = area(polygon(feat.geometry.coordinates as number[][][]));
        const sqFt = sqMetersToSqFeet(sqM);
        setDrawnSqFt(sqFt);
        onAreaCalculated(sqFt);
        setMode("idle");
      }
    }

    mapRef.current = map;
    drawRef.current = draw;

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
  }, []);

  const searchAddress = useCallback(async () => {
    if (!searchInput.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const q = encodeURIComponent(searchInput.trim());
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${TOKEN}&types=address,place,neighborhood,postcode&limit=4`
      );
      const data = await res.json();
      setSearchResults(data.features ?? []);
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  }, [searchInput]);

  const flyTo = (center: [number, number]) => {
    mapRef.current?.flyTo({ center, zoom: 18, duration: 1500 });
    setSearchResults([]);
    setSearchInput("");
  };

  const startDraw = () => {
    drawRef.current?.deleteAll();
    setDrawnSqFt(null);
    drawRef.current?.changeMode("draw_polygon");
    setMode("drawing");
  };

  const clearDraw = () => {
    drawRef.current?.deleteAll();
    setDrawnSqFt(null);
    setMode("idle");
  };

  if (!TOKEN) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted/30 rounded-2xl border border-dashed border-border/50">
        <p className="text-sm text-muted-foreground">Mapbox token not configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Address search */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchAddress()}
              placeholder="Search your address…"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <button
            onClick={searchAddress}
            disabled={searching || !searchInput.trim()}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden">
            {searchResults.map((r) => (
              <button
                key={r.id}
                onClick={() => flyTo(r.center)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors border-b border-border/30 last:border-0"
              >
                {r.place_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map container */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-sm">
        <div ref={mapContainerRef} className="w-full h-72 sm:h-80" />

        {/* Map overlay controls */}
        {mapLoaded && (
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {mode !== "drawing" && (
              <button
                onClick={startDraw}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-border/60 rounded-xl text-sm font-semibold shadow hover:bg-muted/60 transition-colors"
              >
                <PenLine className="w-4 h-4 text-emerald-600" />
                Draw yard
              </button>
            )}
            {(drawnSqFt !== null || mode === "drawing") && (
              <button
                onClick={clearDraw}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-border/60 rounded-xl text-sm font-semibold shadow hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        )}

        {/* Drawing instruction banner */}
        {mode === "drawing" && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-gray-900/90 text-white text-xs font-medium px-4 py-2 rounded-full whitespace-nowrap shadow-lg">
            Click to trace your yard boundary · Double-click to finish
          </div>
        )}

        {/* Result badge */}
        {drawnSqFt !== null && mode !== "drawing" && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-emerald-700 text-white px-3 py-2 rounded-xl text-sm font-bold shadow">
            <CheckCircle2 className="w-4 h-4" />
            {drawnSqFt.toLocaleString()} sq ft
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Search your address → zoom in with satellite view → click <strong>Draw yard</strong> → trace the boundary → double-click to finish.
      </p>
    </div>
  );
}
