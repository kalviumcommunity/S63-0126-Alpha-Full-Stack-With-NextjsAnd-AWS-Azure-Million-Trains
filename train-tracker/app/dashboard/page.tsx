'use client';

import { useState } from "react";
import type { CSSProperties } from "react";

type TrainStatus = {
  trainName: string;
  trainNumber: string;
  delayMinutes: number | null;
  platform: string | null;
  runningStatus: string | null;
  lastUpdated: string | null;
};

type TripOption = {
  trainName: string;
  trainNumber: string;
  departureTime: string | null;
  arrivalTime: string | null;
  duration: string | null;
  delayMinutes: number | null;
  platform: string | null;
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"track" | "find">("track");
  const [trainNumber, setTrainNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrainStatus | null>(null);
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [routeError, setRouteError] = useState("");
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeOptions, setRouteOptions] = useState<TripOption[] | null>(null);
  const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleSearch = async () => {
    const trimmed = trainNumber.trim();
    if (!trimmed || trimmed.length < 3) {
      setError("Enter a valid train number");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`/api/train-status?trainNumber=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        throw new Error("Unable to fetch live data, try again");
      }
      const data = await response.json();
      if (!data?.trainNumber) {
        setError(data?.message ?? "Train not found");
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch live data, try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteSearch = async (): Promise<void> => {
    const from = fromStation.trim().toUpperCase();
    const to = toStation.trim().toUpperCase();

    if (!from || !to) {
      setRouteError("Enter both departure and destination station codes");
      setRouteOptions(null);
      return;
    }

    if (from.toLowerCase() === to.toLowerCase()) {
      setRouteError("Departure and destination cannot be the same");
      setRouteOptions(null);
      return;
    }

    setRouteError("");
    setIsRouteLoading(true);
    setRouteOptions(null);

    try {
      const response = await fetch(
        `/api/find-trains?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch route options, try again");
      }

      const data = await response.json();
      if (!Array.isArray(data?.options) || data.options.length === 0) {
        setRouteError(data?.message ?? "No direct trains found for this route");
        return;
      }

      setRouteOptions(data.options);
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : "Unable to fetch route options, try again");
    } finally {
      setIsRouteLoading(false);
    }
  };

  const swapStations = (): void => {
    setFromStation(toStation);
    setToStation(fromStation);
  };

  return (
    <main style={styles.page}>
      <section style={styles.surface}>
        <header style={styles.nav}>
          <div>
            <h1 style={styles.navTitle}>Where is my Train</h1>
            <p style={styles.navSubtitle}>Live delay intelligence for bustling metro corridors</p>
          </div>
          <div style={styles.navMeta}>
            <button style={styles.languageButton} type="button" aria-label="language">
              <span role="img" aria-hidden="true">🌐</span> EN
            </button>
            <div style={styles.timeChip}>
              <span role="img" aria-hidden="true">🕒</span>
              <span>{currentTime}</span>
            </div>
          </div>
        </header>

        <div style={styles.tabRow}>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "find" ? styles.tabActive : styles.tabMuted)
            }}
            type="button"
            onClick={() => setActiveTab("find")}
          >
            <span role="img" aria-hidden="true">🔍</span> Find Trains
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "track" ? styles.tabActive : styles.tabMuted)
            }}
            type="button"
            onClick={() => setActiveTab("track")}
          >
            <span role="img" aria-hidden="true">📍</span> Track Train
          </button>
        </div>

        {activeTab === "track" && (
          <>
            <section style={styles.formCard}>
              <header style={styles.formHead}>
                <div>
                  <p style={styles.eyebrow}>Track Train</p>
                  <h2 style={styles.formTitle}>Check live delay & platform</h2>
                </div>
                <span style={styles.formHelper}>Powered by IRCTC live feed</span>
              </header>
              <div style={styles.formRow}>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel} htmlFor="trainNumberInput">
                    Train Number
                  </label>
                  <div style={styles.inputShell}>
                    <span role="img" aria-hidden="true">🚆</span>
                    <input
                      id="trainNumberInput"
                      style={styles.input}
                      placeholder="e.g. 12951"
                      value={trainNumber}
                      onChange={(event) => setTrainNumber(event.target.value)}
                      disabled={isLoading}
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <button
                  style={{
                    ...styles.button,
                    ...(isLoading ? styles.buttonDisabled : {})
                  }}
                  type="button"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? "Searching..." : "Search"}
                </button>
              </div>
              <p style={styles.formNote}>Enter at least 3 digits to fetch live progress, delay, and platform information.</p>
              {error && <p style={styles.error}>{error}</p>}
            </section>

            {result ? (
              <article style={styles.resultCard}>
                <div style={styles.resultHeader}>
                  <div>
                    <p style={styles.resultLabel}>Train name</p>
                    <h2 style={{ margin: 0 }}>{result.trainName}</h2>
                  </div>
                  <div>
                    <p style={styles.resultLabel}>Train number</p>
                    <p style={styles.resultValue}>{result.trainNumber}</p>
                  </div>
                </div>
                <div style={styles.resultGrid}>
                  <div>
                    <p style={styles.resultLabel}>Current delay</p>
                    <p style={styles.resultValue}>{result.delayMinutes ?? "—"} min</p>
                  </div>
                  <div>
                    <p style={styles.resultLabel}>Platform</p>
                    <p style={styles.resultValue}>{result.platform ?? "—"}</p>
                  </div>
                  <div>
                    <p style={styles.resultLabel}>Running status</p>
                    <p style={styles.resultValue}>{result.runningStatus ?? "Unavailable"}</p>
                  </div>
                  <div>
                    <p style={styles.resultLabel}>Last updated</p>
                    <p style={styles.resultValue}>{
                      result.lastUpdated ? new Date(result.lastUpdated).toLocaleString() : "—"
                    }</p>
                  </div>
                </div>
              </article>
            ) : (
              <div style={styles.placeholderCard}>
                <p style={styles.placeholderTitle}>No train selected</p>
                <p style={styles.placeholderCopy}>
                  Use the search above to load delay, platform, and live running notes instantly.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "find" && (
          <>
            <section style={styles.routeCard}>
              <header style={styles.formHead}>
                <div>
                  <p style={styles.eyebrow}>Find Trains</p>
                  <h2 style={styles.formTitle}>Discover the fastest option</h2>
                </div>
                <span style={styles.formHelper}>Live availability snapshot</span>
              </header>
              <div style={styles.stationFields}>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel} htmlFor="fromStation">
                    From
                  </label>
                  <div style={styles.inputShell}>
                    <span role="img" aria-hidden="true">📍</span>
                    <input
                      id="fromStation"
                      style={styles.stationInput}
                      placeholder="e.g. NDLS"
                      value={fromStation}
                      onChange={(event) => setFromStation(event.target.value.toUpperCase())}
                      disabled={isRouteLoading}
                    />
                  </div>
                </div>
                <button type="button" onClick={swapStations} style={styles.swapButton} aria-label="Swap stations">
                  ⇅
                </button>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel} htmlFor="toStation">
                    To
                  </label>
                  <div style={styles.inputShell}>
                    <span role="img" aria-hidden="true">🎯</span>
                    <input
                      id="toStation"
                      style={styles.stationInput}
                      placeholder="e.g. BCT"
                      value={toStation}
                      onChange={(event) => setToStation(event.target.value.toUpperCase())}
                      disabled={isRouteLoading}
                    />
                  </div>
                </div>
                <button
                  style={{
                    ...styles.button,
                    ...(isRouteLoading ? styles.buttonDisabled : {})
                  }}
                  type="button"
                  onClick={handleRouteSearch}
                  disabled={isRouteLoading}
                >
                  {isRouteLoading ? "Searching..." : "Search"}
                </button>
              </div>
              <p style={styles.formNote}>
                Use official 2-4 letter station codes (example: NDLS, BCT). We highlight direct trains first.
              </p>
              {routeError && <p style={styles.error}>{routeError}</p>}
            </section>

            {routeOptions ? (
              <div style={styles.optionsList}>
                {routeOptions.map((option) => (
                  <article key={option.trainNumber} style={styles.optionCard}>
                    <div style={styles.optionHeader}>
                      <div>
                        <p style={styles.resultLabel}>Train</p>
                        <h3 style={{ margin: 0 }}>{option.trainName}</h3>
                      </div>
                      <p style={styles.optionNumber}>{option.trainNumber}</p>
                    </div>
                    <div style={styles.optionMeta}>
                      <div>
                        <p style={styles.resultLabel}>Departure</p>
                        <p style={styles.optionValue}>{option.departureTime ?? "—"}</p>
                      </div>
                      <div>
                        <p style={styles.resultLabel}>Arrival</p>
                        <p style={styles.optionValue}>{option.arrivalTime ?? "—"}</p>
                      </div>
                      <div>
                        <p style={styles.resultLabel}>Duration</p>
                        <p style={styles.optionValue}>{option.duration ?? "—"}</p>
                      </div>
                      <div>
                        <p style={styles.resultLabel}>Delay</p>
                        <p style={styles.optionValue}>{option.delayMinutes ?? "—"} min</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div style={styles.placeholderCard}>
                <p style={styles.placeholderTitle}>Plan your ride</p>
                <p style={styles.placeholderCopy}>
                  Enter departure and destination stations to surface the most reliable options right now.
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "2rem 1.5rem 3rem",
    background: "linear-gradient(140deg, #dbeafe 0%, #eff6ff 50%, #e0e7ff 100%)",
    display: "flex",
    justifyContent: "center",
    fontFamily: "'Space Grotesk', 'Segoe UI', system-ui, sans-serif"
  },
  surface: {
    width: "100%",
    maxWidth: "1200px",
    background: "#ffffff",
    borderRadius: "28px",
    border: "1px solid #e0e7ff",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.15)",
    padding: "2.5rem",
    display: "grid",
    gap: "1.75rem"
  },
  nav: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem"
  },
  navTitle: {
    margin: 0,
    fontSize: "1.9rem",
    color: "#11182f"
  },
  navSubtitle: {
    margin: "0.35rem 0 0",
    color: "#53627c"
  },
  navMeta: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center"
  },
  languageButton: {
    borderRadius: "999px",
    border: "1px solid #dbeafe",
    background: "#ffffff",
    padding: "0.55rem 1.1rem",
    fontWeight: 600,
    color: "#0f1c2e",
    cursor: "pointer",
    boxShadow: "0 12px 25px rgba(15, 23, 42, 0.08)"
  },
  timeChip: {
    borderRadius: "999px",
    background: "#f1f5ff",
    padding: "0.55rem 1rem",
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    color: "#1f2a44",
    fontWeight: 600
  },
  tabRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.75rem",
    background: "#f8fafc",
    borderRadius: "20px",
    padding: "0.35rem"
  },
  tabButton: {
    borderRadius: "16px",
    border: "none",
    padding: "0.85rem",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    gap: "0.4rem",
    alignItems: "center"
  },
  tabMuted: {
    background: "#ffffff",
    border: "1px solid #e5eaf5",
    color: "#94a3b8"
  },
  tabActive: {
    background: "linear-gradient(120deg, #2563eb, #38bdf8)",
    color: "#ffffff",
    boxShadow: "0 18px 40px rgba(37, 99, 235, 0.25)"
  },
  formCard: {
    background: "#f8fbff",
    borderRadius: "24px",
    border: "1px solid #dbeafe",
    padding: "2rem",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
    display: "grid",
    gap: "1.5rem"
  },
  formHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem"
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: "0.22em",
    color: "#2563eb",
    margin: 0,
    fontSize: "0.8rem",
    fontWeight: 600
  },
  formTitle: {
    margin: "0.25rem 0 0",
    fontSize: "1.5rem",
    color: "#0f172a"
  },
  formHelper: {
    background: "#ffffff",
    borderRadius: "999px",
    border: "1px solid #dbeafe",
    padding: "0.45rem 1rem",
    fontSize: "0.85rem",
    color: "#4c5a72"
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "1rem",
    alignItems: "end"
  },
  fieldGroup: {
    display: "grid",
    gap: "0.4rem"
  },
  fieldLabel: {
    fontWeight: 600,
    color: "#1f2937",
    margin: 0
  },
  inputShell: {
    borderRadius: "18px",
    border: "1px solid #c7d7ff",
    background: "#ffffff",
    padding: "0.2rem 0.6rem",
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)"
  },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "0.85rem 0",
    fontSize: "1rem",
    outline: "none"
  },
  stationFields: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr)) auto repeat(auto-fit, minmax(240px, 1fr)) auto",
    gap: "1rem",
    alignItems: "end"
  },
  stationInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "0.85rem 0",
    fontSize: "1rem",
    outline: "none"
  },
  swapButton: {
    alignSelf: "center",
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    border: "1px solid #dbeafe",
    background: "#ffffff",
    fontSize: "1.2rem",
    cursor: "pointer",
    boxShadow: "0 15px 35px rgba(15, 23, 42, 0.08)"
  },
  button: {
    padding: "1rem 2rem",
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(120deg, #2563eb, #38bdf8)",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 25px 55px rgba(37, 99, 235, 0.3)",
    transition: "transform 150ms ease, box-shadow 150ms ease"
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    boxShadow: "none"
  },
  formNote: {
    margin: 0,
    color: "#64748b"
  },
  error: {
    color: "#dc2626",
    margin: 0,
    fontWeight: 600
  },
  routeCard: {
    background: "#ffffff",
    borderRadius: "24px",
    border: "1px solid #e0e7ff",
    padding: "2rem",
    boxShadow: "0 25px 60px rgba(15, 23, 42, 0.12)",
    display: "grid",
    gap: "1.5rem"
  },
  resultCard: {
    background: "#0f172a",
    color: "#e2e8f0",
    borderRadius: "26px",
    padding: "2.25rem",
    boxShadow: "0 35px 80px rgba(15, 23, 42, 0.35)",
    display: "grid",
    gap: "1.25rem"
  },
  resultHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "1rem"
  },
  resultLabel: {
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    fontSize: "0.8rem",
    color: "#7dd3fc",
    margin: 0
  },
  resultValue: {
    fontSize: "1.2rem",
    margin: "0.35rem 0 0",
    fontWeight: 700
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1.35rem"
  },
  placeholderCard: {
    border: "1px dashed #c7d7ff",
    borderRadius: "22px",
    padding: "1.75rem",
    textAlign: "center",
    color: "#475569",
    background: "#f8fbff"
  },
  placeholderTitle: {
    margin: 0,
    fontWeight: 600,
    color: "#0f172a"
  },
  placeholderCopy: {
    margin: "0.5rem 0 0",
    color: "#64748b"
  },
  optionsList: {
    display: "grid",
    gap: "1rem"
  },
  optionCard: {
    borderRadius: "22px",
    border: "1px solid #dbeafe",
    background: "#ffffff",
    padding: "1.75rem",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
    display: "grid",
    gap: "1rem"
  },
  optionHeader: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "0.5rem",
    alignItems: "center"
  },
  optionNumber: {
    margin: 0,
    fontWeight: 700,
    color: "#2563eb"
  },
  optionMeta: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "1rem"
  },
  optionValue: {
    margin: "0.35rem 0 0",
    color: "#0f172a",
    fontWeight: 600
  }
};
