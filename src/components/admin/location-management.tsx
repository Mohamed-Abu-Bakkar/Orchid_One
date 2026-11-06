"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Crosshair, MapPin, Save, Search, ShieldCheck } from "lucide-react";

type PlaceResult = { place_id: number; display_name: string; lat: string; lon: string };

export function LocationManagement() {
  const locations = useQuery(api.locations.listForAdmin, {});
  const saveConfiguration = useMutation(api.locations.saveConfiguration);
  const [selectedId, setSelectedId] = useState<string>("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("100");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = locations?.find(item => item._id === selectedId);
  const lat = Number(latitude);
  const lon = Number(longitude);
  const hasCoordinates = latitude.trim() !== "" && longitude.trim() !== "" &&
    Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  const mapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.005}%2C${lat - 0.005}%2C${lon + 0.005}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lon}`
    : "";

  function chooseLocation(id: string) {
    const item = locations?.find(location => location._id === id);
    setSelectedId(id);
    setAddress(item?.address ?? "");
    setLatitude(item && item.latitude !== 0 ? String(item.latitude) : "");
    setLongitude(item && item.longitude !== 0 ? String(item.longitude) : "");
    setRadius(item && item.geofenceRadiusM > 0 ? String(item.geofenceRadiusM) : "100");
    setResults([]);
    setMessage("");
    setError("");
  }

  async function searchAddress() {
    const term = address.trim();
    if (!term) { setError("Enter an address or place name first."); return; }
    setSearching(true); setError(""); setMessage("");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(term)}`);
      if (!response.ok) throw new Error("Address search is temporarily unavailable.");
      const data = await response.json() as PlaceResult[];
      setResults(data);
      if (!data.length) setMessage("No matching places found. Try a more complete address.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to search this address.");
    } finally { setSearching(false); }
  }

  function useCurrentPosition() {
    setError(""); setMessage("");
    if (!navigator.geolocation) { setError("This browser does not support device location."); return; }
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude: currentLat, longitude: currentLon } = position.coords;
        setLatitude(String(Number(currentLat.toFixed(7))));
        setLongitude(String(Number(currentLon.toFixed(7))));
        setMessage("Device coordinates captured. Search the address separately to populate the postal address.");
      },
      geoError => setError(geoError.code === geoError.PERMISSION_DENIED
        ? "Location permission was denied. Allow location access in your browser and try again."
        : "Unable to read device location. Check GPS availability and try again."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  function selectResult(place: PlaceResult) {
    setAddress(place.display_name);
    setLatitude(String(Number(Number(place.lat).toFixed(7))));
    setLongitude(String(Number(Number(place.lon).toFixed(7))));
    setResults([]);
    setMessage("Map search result selected. Review the pin and address before saving.");
  }

  async function save(activate: boolean) {
    if (!selectedId) { setError("Select a location first."); return; }
    if (!address.trim() || !hasCoordinates || !Number.isInteger(Number(radius)) ||
      Number(radius) < 10 || Number(radius) > 1000) {
      setError("Provide an address, valid GPS coordinates, and a whole-number radius between 10 and 1,000 metres.");
      return;
    }
    setSaving(true); setError(""); setMessage("");
    try {
      await saveConfiguration({
        locationId: selectedId as any,
        address: address.trim(),
        latitude: lat,
        longitude: lon,
        geofenceRadiusM: Number(radius),
        activate,
      });
      setMessage(activate ? "Location configured and activated. It is now available in employee onboarding." : "Location configuration saved as a draft.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save location configuration.");
    } finally { setSaving(false); }
  }

  if (locations === undefined) return <section className="sec"><p className="sub">Loading locations…</p></section>;

  return <section className="sec location-management">
    <div className="page-head"><div><h2 className="t-h1" style={{fontSize:22}}>Location management</h2><p className="sub">Configure workplace addresses and GPS geofences before activating locations for employee assignment.</p></div><span className="badge badge-neutral">{locations.length} locations</span></div>
    <div className="location-layout">
      <div className="panel">
        <div className="panel-head"><span className="t-h3">Organization locations</span></div>
        <div className="location-list">
          {locations.map(item => <button type="button" key={item._id} className={`location-list-item ${selectedId === item._id ? "active" : ""}`} onClick={() => chooseLocation(item._id)}>
            <span className="location-list-icon"><MapPin size={17}/></span><span className="location-list-copy"><strong>{item.name}</strong><small>{item.address || "Address and geofence not configured"}</small></span><span className={`badge ${item.isActive ? "badge-success" : "badge-neutral"}`}>{item.isActive ? "Active" : "Draft"}</span>
          </button>)}
          {locations.length === 0 && <div className="empty-state"><MapPin size={24}/><p>No locations have been created yet. Create a location from Employee Onboarding first.</p></div>}
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><span className="t-h3">{selected ? `Configure ${selected.name}` : "Location configuration"}</span></div>
        {!selected ? <div className="empty-state"><MapPin size={26}/><p>Select a location from the list to configure its address and GPS geofence.</p></div> : <div className="panel-body location-config-form">
          <label className="policy-field">Workplace address
            <textarea className="input location-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Search for the workplace or enter its full address" rows={3}/>
          </label>
          <div className="location-action-row">
            <button type="button" className="btn btn-outline" onClick={searchAddress} disabled={searching}><Search size={15}/>{searching ? "Searching…" : "Search address / map"}</button>
            <button type="button" className="btn btn-outline" onClick={useCurrentPosition}><Crosshair size={15}/>Use current GPS</button>
          </div>
          {results.length > 0 && <div className="location-search-results" role="list" aria-label="Address search results">{results.map(place => <button type="button" key={place.place_id} onClick={() => selectResult(place)}><MapPin size={15}/><span>{place.display_name}</span></button>)}</div>}
          <div className="location-coordinate-grid">
            <label className="policy-field">Latitude<input className="input" inputMode="decimal" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="e.g. 10.7905"/></label>
            <label className="policy-field">Longitude<input className="input" inputMode="decimal" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="e.g. 78.7047"/></label>
          </div>
          <label className="policy-field">Geofence radius (metres)<input className="input" type="number" min="10" max="1000" step="1" value={radius} onChange={e => setRadius(e.target.value)}/><small className="text-tertiary">Allowed range: 10–1,000 metres. Choose a radius that covers the actual workplace, not the surrounding neighbourhood.</small></label>
          {hasCoordinates && <div className="location-map-wrap"><iframe title="Selected workplace map" src={mapUrl} loading="lazy" referrerPolicy="no-referrer" /><a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`} target="_blank" rel="noreferrer">Open map to verify pin</a></div>}
          <div className="location-geofence-note"><ShieldCheck size={17}/><span>Activation is explicit. Saving as draft will not make this location selectable for employees.</span></div>
          {message && <p className="onboarding-success" role="status">{message}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="location-save-actions"><button type="button" className="btn btn-outline" disabled={saving} onClick={() => save(false)}><Save size={15}/>Save as draft</button><button type="button" className="btn btn-primary" disabled={saving} onClick={() => save(true)}><ShieldCheck size={15}/>{saving ? "Saving…" : "Save & activate"}</button></div>
        </div>}
      </div>
    </div>
    <p className="location-attribution">Address search and map tiles are provided by OpenStreetMap contributors. Device GPS requires browser permission and a secure (HTTPS) context.</p>
  </section>;
}
