# Remote workplace attendance

## Location model
- Locations support `physical` and `remote` modes. Missing `locationType` is interpreted as `physical` for backward compatibility.
- Physical locations require a postal address, valid coordinates and a geofence radius between 10 and 1,000 metres before activation.
- Remote locations can be activated without an address, coordinates or geofence. Their stored physical coordinate/radius placeholders are zero and must never be used for attendance validation.
- Only a superadmin can configure or activate a location. Configuration changes are audit logged.

## Attendance behavior
- The employee's assigned location determines the attendance mode on the server. Clients cannot select or override the mode.
- Physical punches require valid GPS coordinates and accuracy, and are evaluated against the configured geofence. Outside punches remain pending review.
- Remote punches do not require GPS and are never evaluated against a geofence. If a complete GPS reading is available, it is recorded as optional supporting context. If permission is denied, the browser has no geolocation API, or acquisition times out, the punch is still submitted without GPS.
- Partial GPS payloads are rejected. Supplied coordinates and accuracy are validated.
- Employee status, organization ownership, idempotency, check-in/check-out sequencing, and audit logging remain enforced.
- The event stores a location-type snapshot so later location configuration changes do not rewrite the historical interpretation of a punch.

## Timezone
- Attendance day boundaries use the organization's configured timezone. Remote employees may punch from any country; this does not change the organization's attendance calendar or shift timezone.

## Reporting
- Remote punches count as accepted attendance even when GPS is unavailable.
- Remote events are shown separately from geofence-verified physical punches.
- Remote events do not count as outside-geofence exceptions.

## QA checklist
- Activate a remote location without address, coordinates or radius.
- Assign an active employee to that location and ensure the location appears in employee onboarding/edit options as Remote.
- Check in and out with GPS permission granted; confirm GPS is stored and no geofence review is created.
- Check in and out with GPS permission denied and with geolocation unavailable; confirm punches are accepted without GPS.
- Confirm remote events contribute to employee working-hours and attendance summaries.
- Confirm physical locations still require GPS and enforce the geofence.
- Confirm remote users cannot bypass check-in/check-out sequence rules.
- Confirm location and attendance access remains organization-scoped.
- Confirm historical events retain their original location mode after a location configuration change.
