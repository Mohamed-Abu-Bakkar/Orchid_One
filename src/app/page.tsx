export default function Home() {
  return (
    <main className="employee-reference-shell">
      <iframe
        className="employee-reference-frame"
        src="/employee-preview.html"
        title="Orchid One employee dashboard reference replica"
      />
      <style>{`
        html, body { margin: 0; min-height: 100%; }
        .employee-reference-shell { width: 100%; min-height: 100dvh; margin: 0; padding: 0; }
        .employee-reference-frame { display: block; width: 100%; height: 100dvh; min-height: 100dvh; border: 0; background: #fcf9f8; }
      `}</style>
    </main>
  );
}
