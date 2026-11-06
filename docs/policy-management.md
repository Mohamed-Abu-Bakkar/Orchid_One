# Orchid One — Policy Management

## Confirmed business rules
- Admins upload policy PDFs for Orchid Flowers.
- A published policy is visible to all active employees in the organization.
- Employees can open/read the PDF and explicitly acknowledge it.
- Acknowledgements are recorded against a specific immutable policy version.
- Publishing a revised policy creates a new version; previous versions and acknowledgements remain available.
- Admins can view acknowledgement status for each published version.

## Implementation
- Files are stored using Convex file storage.
- Upload is restricted to PDF files up to 15 MiB.
- Draft creation and publishing are separate actions.
- All read/write operations are organization-scoped and authenticated.
- Only active employee profiles are included in the employee policy feed and acknowledgement report.
- Audit events are recorded for publish, archive and acknowledgement actions.

## Data model
- `policies`: one record per version, including storage ID, version, lifecycle status, publisher and effective date.
- `policyAcknowledgements`: one record per employee and policy-version record, with acknowledgement timestamp.
- Existing `policies` table records should be reviewed before applying the schema change because the new file metadata and creator fields are required for newly created records.

## Security note
The employee feed only returns published policies and the file URL is issued only after an authenticated, organization-scoped query. Convex storage URLs are bearer URLs; do not upload confidential employee-specific documents into this all-employee policy module. Use the employee document module for restricted documents.

## Verification still required
- Install dependencies and run Convex code generation.
- Run TypeScript, lint and production build.
- Test PDF upload, wrong MIME type, oversized file, draft/publish, organization isolation, employee eligibility, duplicate acknowledgement, version re-acknowledgement and acknowledgement report.
- Confirm no legacy policy records exist before deploying the schema.
