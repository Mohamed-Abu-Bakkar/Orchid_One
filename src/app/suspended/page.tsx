import Link from "next/link";

export const metadata = { title: "Account suspended | Orchid One" };

export default function SuspendedPage() {
  return (
    <main className="auth-page">
      <section className="auth-card status-card">
        <p className="auth-eyebrow">ORCHID ONE</p>
        <h1>Account suspended</h1>
        <p className="auth-subtitle">Access to this account is currently suspended. Please contact an Orchid Flowers administrator.</p>
        <Link className="auth-submit auth-link-button" href="/login">Return to sign in</Link>
      </section>
    </main>
  );
}
