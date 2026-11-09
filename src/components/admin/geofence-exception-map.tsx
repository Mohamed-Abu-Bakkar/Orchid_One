"use client";

import { useEffect, useId, useRef } from "react";

type Props = {
  employeeLatitude: number;
  employeeLongitude: number;
  workplaceLatitude: number;
  workplaceLongitude: number;
  geofenceRadiusM: number;
  employeeName: string;
  workplaceName: string;
};

declare global {
  interface Window {
    L?: any;
    __orchidLeafletPromise?: Promise<void>;
  }
}

function loadLeaflet(): Promise<void> {
  if (window.L) return Promise.resolve();
  if (!window.__orchidLeafletPromise) {
    window.__orchidLeafletPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-orchid-leaflet="style"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.dataset.orchidLeaflet = "style";
        document.head.appendChild(link);
      }
      const existing = document.querySelector<HTMLScriptElement>('script[data-orchid-leaflet="script"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Map library could not be loaded.")), { once: true });
        if (window.L) resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.dataset.orchidLeaflet = "script";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Map library could not be loaded."));
      document.head.appendChild(script);
    });
  }
  return window.__orchidLeafletPromise;
}

export function GeofenceExceptionMap(props: Props) {
  const mapId = useId().replace(/:/g, "");
  const mapRef = useRef<any>(null);
  const valid = [props.employeeLatitude, props.employeeLongitude, props.workplaceLatitude, props.workplaceLongitude, props.geofenceRadiusM].every(Number.isFinite)
    && Math.abs(props.employeeLatitude) <= 90 && Math.abs(props.workplaceLatitude) <= 90
    && Math.abs(props.employeeLongitude) <= 180 && Math.abs(props.workplaceLongitude) <= 180
    && props.geofenceRadiusM > 0;

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    let instance: any;
    loadLeaflet().then(() => {
      if (cancelled || !window.L) return;
      const L = window.L;
      const employee = [props.employeeLatitude, props.employeeLongitude];
      const workplace = [props.workplaceLatitude, props.workplaceLongitude];
      instance = L.map(mapId, { scrollWheelZoom: false, preferCanvas: true });
      mapRef.current = instance;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(instance);
      L.marker(workplace).addTo(instance).bindPopup(L.tooltip ? "" : props.workplaceName);
      L.circle(workplace, { radius: props.geofenceRadiusM, color: "#26834a", fillColor: "#35a765", fillOpacity: 0.12, weight: 2 }).addTo(instance);
      L.marker(employee).addTo(instance).bindPopup(props.employeeName + " — recorded punch");
      instance.fitBounds(L.featureGroup([
        L.marker(employee),
        L.marker(workplace),
        L.circle(workplace, { radius: props.geofenceRadiusM }),
      ]).getBounds().pad(0.18), { maxZoom: 16 });
    }).catch(() => {
      if (!cancelled) {
        const node = document.getElementById(mapId);
        if (node) node.dataset.mapError = "true";
      }
    });
    return () => {
      cancelled = true;
      if (instance) instance.remove();
      mapRef.current = null;
    };
  }, [mapId, props.employeeLatitude, props.employeeLongitude, props.workplaceLatitude, props.workplaceLongitude, props.geofenceRadiusM, props.employeeName, props.workplaceName, valid]);

  if (!valid) return <div className="geofence-map-unavailable">Workplace map is unavailable because its geofence coordinates or radius are not configured.</div>;
  return <div className="geofence-map-frame">
    <div id={mapId} className="geofence-map" role="img" aria-label={`Map showing the recorded punch for ${props.employeeName}, workplace ${props.workplaceName}, and the geofence boundary`} />
    <div className="geofence-map-legend">
      <span><i className="geofence-legend-dot employee"/> Employee punch</span>
      <span><i className="geofence-legend-dot workplace"/> Workplace</span>
      <span><i className="geofence-legend-circle"/> Geofence boundary</span>
    </div>
    <p className="location-attribution">Map data &copy; OpenStreetMap contributors. Map markers reflect device-reported GPS and are not proof of physical presence.</p>
  </div>;
}
