import Link from "next/link";

// Branded 404 (audit fix: default Next.js 404 had no CC identity, no way back).
export default function NotFound() {
  return (
    <main className="cc-page">
      <div className="cc-page-card">
        <p className="cc-page-code">404</p>
        <h1 className="cc-page-title">OFF THE CHART</h1>
        <p className="cc-page-sub">
          You climbed past the edge of the terrain — this route does not exist.
        </p>
        <Link href="/" className="cc-page-btn">BACK TO TODAY&apos;S CLIMB</Link>
      </div>
    </main>
  );
}
