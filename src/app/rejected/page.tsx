import Link from "next/link";

export const metadata = { title: "Access not approved | Orchid One" };

export default function RejectedPage() {
  return (
    <main className="auth-page">
      <section className="auth-card status-card">
        <p className="auth-eyebrow">ORCHID ONE</p>
        <h1>Access not approved</h1>
        <p className="auth-subtitle">Your registration was not approved. Please contact Orchid Flowers if you believe this is an error.</p>
        <Link className="auth-submit auth-link-button" href="/login">Return to sign in</Link>
      </section>
    </main>
  );
}
