import Link from "next/link";

export const metadata = { title: "Awaiting approval | Orchid One" };

export default function PendingApprovalPage() {
  return (
    <main className="auth-page">
      <section className="auth-card status-card">
        <span className="status-icon">⌛</span>
        <p className="auth-eyebrow">ORCHID ONE</p>
        <h1>Approval pending</h1>
        <p className="auth-subtitle">Your account has been registered. An authorized Orchid Flowers administrator must approve access before you can use the employee portal.</p>
        <Link className="auth-submit auth-link-button" href="/login">Return to sign in</Link>
      </section>
    </main>
  );
}
