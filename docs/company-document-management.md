# Company Document Management

## Scope
Administrators and supervisors can upload company-wide documents. Published documents are visible to all active employees in the same organization who have a linked, active employee profile. Employee-submitted personal documents remain in the existing `employeeDocuments` workflow, and policy acknowledgements remain in `policies`.

## Data and storage
- File bytes are stored in Convex File Storage.
- The `companyDocuments` table stores organization, title, category, optional description, storage ID, original file name, MIME type, byte size, uploader, upload timestamp, and status.
- Status is `published` or `archived`. Upload publishes immediately; archiving hides the document from employee listings without deleting its metadata.
- Indexes support organization/status employee queries and organization/upload-time admin listings.

## Authorization
- Upload URL generation, creation, admin listing, and archive mutations require `superadmin` or `supervisor`.
- Employee listing requires an authenticated `employee` (or linked `superadmin` employee view), matching organization, and active employee profile.
- Employee queries return published records only. Archived records are not listed.

## Upload validation
- Supported formats: PDF, JPEG, PNG.
- Maximum file size: 15 MiB.
- The backend validates title/category/file name lengths, MIME type, byte size, and uploaded storage metadata before creating the database record.

## UI
- Admin: People → Documents. Upload and publish, review records, and archive a document.
- Employee: Documents. Personal uploads remain available; company-wide published documents are shown in a separate section.

## Security note
Convex storage download URLs are bearer URLs. The employee query gates URL discovery by authentication and organization membership, but a URL copied by an employee can be shared and may remain usable independently of the employee session. Do not upload confidential or employee-specific material into this company-wide module. If strict revocable per-user download authorization is required, add an authenticated download proxy before using it for sensitive records.

## Verification
After deploying to a dedicated development Convex deployment, run typecheck, lint, and tests; then verify:
1. Admin/supervisor can upload a supported file and see it in the admin list.
2. A linked active employee in the same organization can view and open the published file.
3. A user from another organization cannot list the file.
4. An employee without an active linked profile cannot list company documents.
5. Archiving removes the document from employee results while preserving the admin record.
6. Unsupported MIME types, empty files, oversized files, mismatched metadata, and unauthorized mutations are rejected.

No production deployment or production data changes are included in this implementation.
