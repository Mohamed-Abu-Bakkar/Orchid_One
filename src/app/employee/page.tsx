export const metadata = {
  title: "Orchid One | Employee Preview",
  description: "Employee mobile interface preview"
};

export default function EmployeePreviewPage() {
  return (
    <main className="employee-preview">
      <iframe
        title="Orchid One employee mobile preview"
        src="/employee-preview.html"
        className="employee-preview__frame"
        allow="geolocation"
      />
    </main>
  );
}
