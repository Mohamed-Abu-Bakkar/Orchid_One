type Props = {
  employeeLatitude: number;
  employeeLongitude: number;
  workplaceLatitude: number | null;
  workplaceLongitude: number | null;
  geofenceRadiusM: number | null;
  employeeName: string;
  workplaceName: string;
};

function isCoordinatePair(latitude: number | null, longitude: number | null): boolean {
  return latitude !== null && longitude !== null
    && Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

export function GeofenceExceptionMap(props: Props) {
  const punchValid = isCoordinatePair(props.employeeLatitude, props.employeeLongitude);
  const workplaceValid = isCoordinatePair(props.workplaceLatitude, props.workplaceLongitude);

  if (!punchValid) {
    return <div className="geofence-map-unavailable">
      The employee punch location cannot be mapped because the recorded GPS coordinates are missing or invalid.
    </div>;
  }

  // Keep both the punch and workplace in view, while placing the map marker on the actual punch.
  const latitudes = [props.employeeLatitude, ...(workplaceValid ? [props.workplaceLatitude as number] : [])];
  const longitudes = [props.employeeLongitude, ...(workplaceValid ? [props.workplaceLongitude as number] : [])];
  const latPadding = Math.max((Math.max(...latitudes) - Math.min(...latitudes)) * 0.2, 0.002);
  const lngPadding = Math.max((Math.max(...longitudes) - Math.min(...longitudes)) * 0.2, 0.002);
  const west = Math.max(-180, Math.min(...longitudes) - lngPadding);
  const south = Math.max(-90, Math.min(...latitudes) - latPadding);
  const east = Math.min(180, Math.max(...longitudes) + lngPadding);
  const north = Math.min(90, Math.max(...latitudes) + latPadding);
  const marker = `${props.employeeLatitude},${props.employeeLongitude}`;
  const bbox = `${west},${south},${east},${north}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
  const mapUrl = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(String(props.employeeLatitude))}&mlon=${encodeURIComponent(String(props.employeeLongitude))}#map=17/${encodeURIComponent(String(props.employeeLatitude))}/${encodeURIComponent(String(props.employeeLongitude))}`;

  return <div className="geofence-map-frame">
    <div className="geofence-punch-location">
      <strong>Recorded punch location</strong>
      <span>{props.employeeLatitude.toFixed(6)}, {props.employeeLongitude.toFixed(6)}</span>
      <a href={mapUrl} target="_blank" rel="noopener noreferrer">Open punched location in OpenStreetMap ↗</a>
    </div>
    <iframe
      className="geofence-map"
      title={`Map showing the recorded punch location for ${props.employeeName}`}
      src={embedUrl}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
    <div className="geofence-map-legend">
      <span><i className="geofence-legend-dot employee"/> Employee's recorded punch (map marker)</span>
      {workplaceValid && <span><i className="geofence-legend-dot workplace"/> Workplace coordinates shown in the review details</span>}
    </div>
    <p className="location-attribution">
      Map data © OpenStreetMap contributors. The marker represents device-reported GPS and is not proof of physical presence.
    </p>
  </div>;
}
