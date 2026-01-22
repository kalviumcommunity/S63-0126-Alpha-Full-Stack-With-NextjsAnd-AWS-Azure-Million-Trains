export const revalidate = false; // Static project context page.

export default function AboutPage() {
  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "'Space Grotesk', 'Segoe UI', system-ui, sans-serif",
        lineHeight: 1.6,
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      <h1>About the Project</h1>
      <p>
        Millions of Local Trains is a lightweight experiment focused on showing
        how different rendering strategies solve real rail problems. Every
        design choice keeps the deploy surface tiny: a PostgreSQL/Supabase data
        store, a Node.js API, and the Next.js App Router.
      </p>
      <section>
        <h2>Core goals</h2>
        <ul>
          <li>Give commuters and operations the same numbers.</li>
          <li>Prefer minimalist server components to avoid bundle bloat.</li>
          <li>Document rendering trade-offs with clear code samples.</li>
        </ul>
      </section>
      <section>
        <h2>Rendering tour</h2>
        <p>
          This page (and the home page) are pre-rendered once at build time. The
          dashboard forces a new render on every request to deliver the freshest
          status feed. Route summaries revalidate every 60 seconds, which keeps
          frequently changing but not real-time data up to date without extra
          load on the backend.
        </p>
      </section>
      <p>
        The goal is clarity, not chrome. Back-end APIs own the data. The App
        Router chooses how fresh each slice should be.
      </p>
    </main>
  );
}
