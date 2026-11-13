# Employee document lifecycle

- Employees upload PDF, JPEG, or PNG files (maximum 15 MB) with a category and document name.
- Uploads enter `pending` and are visible to organization admins/supervisors in Admin → Documents.
- Only one pending submission is allowed for the same employee, category, and document name.
- A replacement links to the currently verified document. The current verified document remains active while the replacement is pending.
- Rejection requires a reason and leaves the previous verified document unchanged.
- Approval marks the new document verified. If it replaces an older verified document, the old storage object is deleted and its database row is retained with status `replaced` for audit history.
- Employees cannot delete documents directly. Replaced file content cannot be opened; its audit metadata remains.
- Every upload and review writes an audit log. Access to employee files is checked against the authenticated employee or admin organization.
