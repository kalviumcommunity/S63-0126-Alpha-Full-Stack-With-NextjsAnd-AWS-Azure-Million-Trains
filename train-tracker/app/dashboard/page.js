export const dynamic = "force-dynamic";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

async function getLiveStatus() {
  const response = await fetch(`${API_BASE_URL}/api/status`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load live status (HTTP ${response.status}).`);
  }

  return response.json();
}

export default async function DashboardPage() {
  let trains = [];
  let errorMessage = null;

  try {
    const payload = await getLiveStatus();
    if (Array.isArray(payload)) {
      trains = payload;
    } else if (Array.isArray(payload?.data)) {
      trains = payload.data;
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
      <h1>Live Delay Dashboard</h1>
      <p>
        This page uses server-side rendering with caching disabled so every
        request reflects the current network state.
      </p>
      {errorMessage && (
        <p style={{ color: "#b00020" }}>
          Unable to load live data: {errorMessage}
        </p>
      )}
      {!errorMessage && trains.length === 0 && (
        <p>No trains are reporting delays right now.</p>
      )}
      <section style={{ display: "grid", gap: "1rem" }}>
        {trains.map((train) => {
          const delay = train.delayMinutes ?? train.delay ?? 0;
          const updated = train.lastUpdated
            ? new Date(train.lastUpdated).toLocaleTimeString()
            : "just now";

          return (
            <article
              key={`${train.id ?? train.train ?? updated}`}
              style={{
                border: "1px solid #1f2933",
                borderRadius: "8px",
                padding: "1rem",
                background: "#0f172a",
                color: "#f8fafc",
              }}
            >
              <h2 style={{ marginTop: 0 }}>{train.train ?? "Unnamed Train"}</h2>
              <p style={{ margin: "0.5rem 0" }}>
                Status: {train.status ?? "Delayed"}
              </p>
              <p style={{ margin: "0.5rem 0" }}>
                Delay: {delay} min
              </p>
              <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8 }}>
                Updated: {updated}
              </p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
