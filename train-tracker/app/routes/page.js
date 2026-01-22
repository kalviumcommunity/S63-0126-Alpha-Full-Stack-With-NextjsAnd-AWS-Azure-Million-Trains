export const revalidate = 60; 

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

async function getRouteSummaries() {
  const response = await fetch(`${API_BASE_URL}/api/routes`);

  if (!response.ok) {
    throw new Error(`Failed to load route summaries (HTTP ${response.status}).`);
  }

  return response.json();
}

export default async function RoutesPage() {
  let routes = [];
  let errorMessage = null;

  try {
    const payload = await getRouteSummaries();
    if (Array.isArray(payload)) {
      routes = payload;
    } else if (Array.isArray(payload?.data)) {
      routes = payload.data;
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "'Space Grotesk', 'Segoe UI', system-ui, sans-serif",
        lineHeight: 1.6,
        maxWidth: "960px",
        margin: "0 auto",
      }}
    >
      <h1>Route Health (ISR)</h1>
      <p>
        Route aggregates do not need second-by-second precision, so this page is
        statically cached and refreshed in the background every 60 seconds.
      </p>
      {errorMessage && (
        <p style={{ color: "#b00020" }}>
          Unable to load route data: {errorMessage}
        </p>
      )}
      {!errorMessage && routes.length === 0 && (
        <p>No route summaries are available yet.</p>
      )}
      <section
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {routes.map((route) => (
          <article
            key={route.id ?? route.name}
            style={{
              border: "1px solid #334155",
              borderRadius: "10px",
              padding: "1rem",
              background: "#e2e8f0",
              color: "#0f172a",
            }}
          >
            <h2 style={{ marginTop: 0 }}>{route.name ?? "Unnamed Route"}</h2>
            <p style={{ margin: "0.5rem 0" }}>
              Average Delay: {route.averageDelay ?? route.avgDelay ?? "-"} min
            </p>
            <p style={{ margin: "0.5rem 0" }}>
              Trains Impacted: {route.trainsImpacted ?? route.trains ?? "-"}
            </p>
            <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8 }}>
              Last Summary: {route.updated ?? route.lastUpdated ?? "recent"}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
