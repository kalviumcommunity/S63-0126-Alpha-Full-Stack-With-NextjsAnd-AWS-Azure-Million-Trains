import type { ReactElement } from "react";

export const revalidate = false;

export default function HomePage(): ReactElement {
  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "'Space Grotesk', 'Segoe UI', system-ui, sans-serif",
        lineHeight: 1.6,
        maxWidth: "720px",
        margin: "0 auto"
      }}
    >
      <h1>Millions of Local Trains - Real-Time Delay Tracker</h1>
      <p>
        Busy metros depend on thousands of local trains every day. When a single
        service stalls, ripple delays affect millions of commuters. This project
        keeps the essentials simple: collect live delay data, surface clear
        alerts, and share trustworthy summaries fast.
      </p>
      <section>
        <h2>Why this matters</h2>
        <ul>
          <li>Commuters lose hours guessing if their train will arrive.</li>
          <li>Dispatch teams need a single source of truth for cascading delays.</li>
          <li>City planners track chronic bottlenecks to decide where to invest.</li>
        </ul>
      </section>
      <section>
        <h2>How the tracker helps</h2>
        <ul>
          <li>Ingests raw telemetry from the operator network.</li>
          <li>Normalizes routes, trains, alerts, and live status via APIs.</li>
          <li>
            Serves static, dynamic, and incremental pages so the right data loads
            with the right freshness.
          </li>
        </ul>
      </section>
      <p>
        Explore the dashboard for second-by-second delays, review route patterns
        that refresh every minute, or read more about the initiative. Everything
        in this interface is rendered statically at build time so it is
        lightning fast and easy to cache globally.
      </p>
    </main>
  );
}
