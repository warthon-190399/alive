"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

type Marker = { id: number; title: string; lat: number; lng: number; sub?: string };

/** Mapa oscuro (OpenStreetMap + CARTO). Necesita internet para las teselas. */
export function MapView({ markers, height = 380, zoom = 12 }: { markers: Marker[]; height?: number; zoom?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const key = markers.map((m) => `${m.id}:${m.lat},${m.lng}`).join("|");

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
      // Con clave de CARTO: mapa oscuro "Dark Matter". Sin clave: OpenStreetMap oscurecido con CSS.
      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
      if (cartoKey) {
        L.tileLayer(`https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${encodeURIComponent(cartoKey)}`, {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        }).addTo(map);
      } else {
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          className: "alive-osm-dark",
        }).addTo(map);
      }
      const icon = L.divIcon({
        className: "",
        html: '<span style="display:block;width:16px;height:16px;border-radius:50%;background:#FF572E;border:3px solid #141414;box-shadow:0 0 0 2px rgba(255,87,46,0.5),0 0 18px rgba(255,87,46,0.7)"></span>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const pts: [number, number][] = [];
      for (const m of markers) {
        const mk = L.marker([m.lat, m.lng], { icon, title: m.title }).addTo(map);
        const wrap = document.createElement("div");
        const a = document.createElement("a");
        a.href = `/experiences/${m.id}`;
        a.textContent = m.title;
        a.style.fontWeight = "700";
        wrap.appendChild(a);
        if (m.sub) {
          const s = document.createElement("div");
          s.textContent = m.sub;
          s.style.fontSize = "11px";
          s.style.opacity = "0.7";
          wrap.appendChild(s);
        }
        mk.bindPopup(wrap);
        pts.push([m.lat, m.lng]);
      }
      if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
      else if (pts.length === 1) map.setView(pts[0], zoom);
      else map.setView([-12.0464, -77.0428], 5);
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, zoom]);

  return <div ref={el} role="region" aria-label="Mapa de experiencias" className="alive-map w-full overflow-hidden rounded-[20px] border border-white/10" style={{ height, background: "#1b1b1b" }} />;
}
