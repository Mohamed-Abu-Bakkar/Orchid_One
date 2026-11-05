export const metadata = {
  title: "Orchid One | Employee Preview",
  description: "Employee mobile interface preview"
};

export default function EmployeePreviewPage() {
  return (
    <main style={{ position: "fixed", inset: 0, width: "100%", height: "100dvh", background: "#fcf9f8" }}>
      <iframe
        title="Orchid One employee mobile preview"
        src="/employee-preview.html"
        style={{ display: "block", width: "100%", height: "100%", border: 0 }}
      />
    </main>
  );
}
