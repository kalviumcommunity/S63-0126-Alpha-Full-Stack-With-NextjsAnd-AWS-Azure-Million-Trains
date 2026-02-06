'use client';

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import BackgroundMedia from "../components/BackgroundMedia.client";

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
  const [currentTime, setCurrentTime] = useState("--:--");
  const [searchPressed, setSearchPressed] = useState(false);
  const [routePressed, setRoutePressed] = useState(false);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    const updateTime = () => setCurrentTime(formatter.format(new Date()));
    updateTime();
    const intervalId = window.setInterval(updateTime, 60_000);
    return () => clearInterval(intervalId);
  }, []);

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
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const fallback = data?.message ?? (response.status === 429
          ? "IRCTC live API is throttling requests. Please try again in a few seconds."
          : "Unable to fetch live data, try again");
        throw new Error(fallback);
      }

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
    const from = fromStation.trim();
    const to = toStation.trim();

    if (!from || !to) {
      setRouteError("Enter both departure and destination stations");
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
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const fallback = data?.message ?? (response.status === 429
          ? "IRCTC servers are busy, please retry in a moment."
          : "Unable to fetch route options, try again");
        throw new Error(fallback);
      }

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
    <main style={styles.page} className="dashboard-root">
      <style>{`
        html, body { overflow: hidden; margin: 0; padding: 0; }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        /* Alignment helpers */
        .dashboard-root { justify-content: center; align-items: flex-start; }
        .surface-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; align-items: start; }
        .dashboard-surface {
          background: #ffffff;
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        input, textarea { word-wrap: break-word; }
        @media (min-width: 900px) {
          .dashboard-root { justify-content: flex-start; align-items: flex-start; }
          .dashboard-surface { margin-left: 1.5rem; }
          .surface-grid { grid-template-columns: minmax(0, 1fr); gap: 1.25rem; align-items: center; }
        }
      `}</style>
      <section style={styles.hero}>
      <BackgroundMedia
        videoSrc="/dashboard.mp4"
        posterSrc="/dashboard-poster.jpg"
        fallbackImageSrc="https://res.cloudinary.com/dbj6ocwoz/image/upload/v1770020660/trn_ldauul.jpg"
      />

      <section style={styles.surface} className="dashboard-surface">
        <div className="surface-grid" style={{ position: 'relative', zIndex: 2 }}>
          <aside style={styles.leftColumn}>
            <div style={styles.headerCard}>
              <header style={styles.nav}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
            </div>

            <div style={styles.tabRow}>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "find" ? styles.tabActive : styles.tabMuted)
                }}
                type="button"
                onClick={() => setActiveTab("find")}
              >
                Train tickets
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "track" ? styles.tabActive : styles.tabMuted)
                }}
                type="button"
                onClick={() => setActiveTab("track")}
              >
                Track Train
              </button>
            </div>

        {activeTab === "track" && (
          <>
            <section style={styles.formCard}>
              <header style={styles.formHead}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <p style={styles.eyebrow}>Track Train</p>
                  <h2 style={styles.formTitle}>Check live delay & platform</h2>
                </div>
                <span style={styles.formHelper}>Powered by IRCTC live feed</span>
              </header>
                <div style={{...styles.inputShell, width: '100%', maxWidth: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.6rem', boxSizing: 'border-box'}}>
                <span role="img" aria-hidden="true">🚆</span>
                <input
                  id="trainNumberInput"
                  style={{...styles.input, flex: 1}}
                  placeholder="e.g. 12951"
                  value={trainNumber}
                  onChange={(event) => setTrainNumber(event.target.value)}
                  disabled={isLoading}
                  inputMode="numeric"
                />
                <button
                  style={{
                    ...styles.button,
                    ...(isLoading ? styles.buttonDisabled : {}),
                    ...(searchPressed ? { transform: 'scale(0.98)' } : {}),
                    padding: '0.6rem 1rem',
                    margin: 0,
                    fontSize: '0.9rem'
                  }}
                  type="button"
                  onClick={handleSearch}
                  onMouseDown={() => setSearchPressed(true)}
                  onMouseUp={() => setSearchPressed(false)}
                  onMouseLeave={() => setSearchPressed(false)}
                  disabled={isLoading}
                >
                  {isLoading ? "Searching..." : "Search"}
                </button>
              </div>
              <p style={styles.formNote}>Enter at least 3 digits to fetch live progress, delay, and platform information.</p>
              {error && <p style={styles.error}>{error}</p>}
            </section>

            {isLoading ? (
              <div style={styles.skeletonCard}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom: '1rem'}}>
                  <div style={{width:'60%'}}><div style={styles.skeleton} /></div>
                  <div style={{width:'20%'}}><div style={styles.skeleton} /></div>
                </div>
                <div style={{display:'grid', gap:'0.5rem'}}>
                  <div style={{width:'100%', height: '1rem', ...styles.skeleton}} />
                  <div style={{width:'100%', height: '1rem', ...styles.skeleton}} />
                </div>
              </div>
            ) : result ? (
              <article style={styles.resultCard}>
                <div style={styles.resultHeader}>
                  <div>
                    <p style={styles.resultLabel}>Train name</p>
                    <h2 style={{ margin: 0 }}>{result.trainName}</h2>
                  </div>
                  <div style={{display:'flex', gap:'0.75rem', alignItems:'center'}}>
                    <div>
                      <p style={styles.resultLabel}>Train number</p>
                      <p style={styles.resultValue}>{result.trainNumber}</p>
                    </div>
                    <div>
                      <span style={{
                        ...styles.statusChip,
                        ...(result.delayMinutes == null ? styles.statusOnTime :
                            result.delayMinutes > 15 ? styles.statusMajor :
                            result.delayMinutes > 5 ? styles.statusMinor : styles.statusOnTime)
                      }}>
                        {result.delayMinutes == null ? 'No data' : result.delayMinutes <= 0 ? 'On time' : `${result.delayMinutes} min`}
                      </span>
                    </div>
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
              <section style={styles.formCard}>
                <div style={styles.stationFieldsColumn}>
                  <div style={styles.fieldRow}>
                    <div style={styles.fieldGroup}>
                      <label style={styles.fieldLabel} htmlFor="fromStation">
                        From
                      </label>
                      <div style={styles.inputShell}>
                        <span role="img" aria-hidden="true">📍</span>
                        <input
                          id="fromStation"
                          style={styles.stationInput}
                          placeholder="City or station code"
                          value={fromStation}
                          onChange={(event) => setFromStation(event.target.value)}
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
                          placeholder="City or station code"
                          value={toStation}
                          onChange={(event) => setToStation(event.target.value)}
                          disabled={isRouteLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={styles.dateTimeRow}>
                    <div style={styles.fieldGroup}>
                      <label style={styles.fieldLabel} htmlFor="dateInput">
                        Date
                      </label>
                      <div style={styles.inputShell}>
                        <span role="img" aria-hidden="true">📅</span>
                        <input
                          id="dateInput"
                          type="date"
                          style={styles.stationInput}
                          defaultValue={new Date().toISOString().split('T')[0]}
                          disabled={isRouteLoading}
                        />
                      </div>
                    </div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.fieldLabel} htmlFor="timeInput">
                        Time
                      </label>
                      <div style={styles.inputShell}>
                        <span role="img" aria-hidden="true">🕐</span>
                        <input
                          id="timeInput"
                          type="time"
                          style={styles.stationInput}
                          defaultValue="12:00"
                          disabled={isRouteLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    style={{
                      ...styles.button,
                      ...(isRouteLoading ? styles.buttonDisabled : {}),
                      ...(routePressed ? { transform: 'scale(0.98)' } : {}),
                      width: '100%'
                    }}
                    type="button"
                    onClick={handleRouteSearch}
                    onMouseDown={() => setRoutePressed(true)}
                    onMouseUp={() => setRoutePressed(false)}
                    onMouseLeave={() => setRoutePressed(false)}
                    disabled={isRouteLoading}
                  >
                    {isRouteLoading ? "Searching..." : "Search"}
                  </button>
                </div>
                <p style={styles.formNote}>
                  Enter any Indian city or station name—we auto-detect the official codes and list every direct train for today.
                </p>
                {routeError && <p style={styles.error}>{routeError}</p>}
              </section>

            {isRouteLoading ? (
              <div style={styles.optionsList}>
                {Array.from({length:3}).map((_,i) => (
                  <div key={i} style={styles.optionCard}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                      <div style={{width:'40%'}}><div style={styles.skeleton} /></div>
                      <div style={{width:'20%'}}><div style={styles.skeleton} /></div>
                    </div>
                    <div style={{display:'grid', gap:'0.5rem'}}>
                      <div style={{height:'1rem', ...styles.skeleton}} />
                      <div style={{height:'1rem', ...styles.skeleton}} />
                    </div>
                  </div>
                ))}
              </div>
            ) : routeOptions ? (
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

          </aside>

          {/* <div style={styles.rightColumn}>
            <h1 style={styles.heroTitle}>Find & track trains in seconds</h1>
            <p style={styles.heroCopy}>Live delay updates, platform info, and quick search tools—everything you need to navigate metro corridors confidently.</p>
            <button style={styles.heroCTA} type="button" onClick={() => setActiveTab('find')}>Find Your Train</button>
          </div> */}

        </div>
      </section>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    height: "100vh",
    padding: "0",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    display: "flex",
    alignItems: "flex-start",
    fontFamily: "'Segoe UI', 'Helvetica Neue', system-ui, -apple-system, sans-serif",
    transition: "padding 200ms ease",
    overflow: "hidden"
  },
  hero: { 
    position: "relative",
    height: "100vh",
    width: "100%",
    overflow: "hidden"
  },
  surface: {
    position: "absolute",
    zIndex: 10,
    top: "4vh",
    left: "3vw",
    width: "42%",
  maxWidth: "42vw",
  height: "90vh",
  background: "#ffffff",
  borderRadius: "24px",
  border: "none",
  boxShadow: "none",
  padding: "0",
  overflow: "hidden",
  display: "block"
},
  surfaceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '0',
    alignItems: 'start',
    height: '100%',
    width: '100%'
  },
  leftColumn: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    boxSizing: 'border-box',
    height: '100%',
    overflow: 'hidden'
  },
  rightColumn: {    
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    color: '#0f172a'
  },
  heroTitle: {
    fontSize: 'clamp(32px, 5vw, 56px)',
    margin: 0,
    color: 'rgba(15,23,42,0.98)',
    lineHeight: 1.02,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    maxWidth: '520px',
    textShadow: '0 6px 18px rgba(0,0,0,0.12)'
  },
  heroCopy: {
    marginTop: '1rem',
    color: '#4b5563',
    fontSize: '1.05rem',
    maxWidth: '520px',
    lineHeight: 1.4
  },
  heroCTA: {
    marginTop: '1.5rem',
    padding: '0.6rem 1.25rem',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(120deg, var(--accent, #2563eb), #38bdf8)',
    color: 'var(--accent-contrast, #ffffff)',
    fontWeight: 800,
    cursor: 'pointer',
    alignSelf: 'start',
    boxShadow: '0 10px 30px rgba(37,99,235,0.12)',
    transition: 'transform 120ms ease, box-shadow 120ms ease'
  },
  nav: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "0.75rem",
    marginBottom: "0"
  },
 headerCard: {
  background: "#ffffff",
  padding: "1.25rem 1.5rem",
  borderBottom: "1px solid #f1f5f9",
  flexShrink: 0
},

  navTitle: {
    margin: 0,
    fontSize: "1.7rem",
    color: "#0f172a",
    letterSpacing: "-0.02em",
    fontWeight: 700,
    fontFamily: 'inherit'
  },
  navSubtitle: {
    margin: "0.45rem 0 0",
    color: "#64748b",
    fontSize: "0.95rem",
    lineHeight: 1.5,
    fontWeight: 400
  },
  navMeta: {
    display: "flex",
    gap: "0.6rem",
    alignItems: "center"
  },
  languageButton: {
    borderRadius: "8px",
    border: "1.5px solid #e2e8f0",
    background: "#f8fafc",
    padding: "0.5rem 0.9rem",
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
    fontSize: "0.8rem",
    transition: "all 150ms ease"
  },
  timeChip: {
    borderRadius: "8px",
    background: "#f1f5f9",
    padding: "0.5rem 0.9rem",
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    color: "#475569",
    fontWeight: 600,
    fontSize: "0.8rem",
    border: "1px solid #e2e8f0"
  },
tabRow: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  background: " #2563eb",
  padding: "0",
  margin: "0",
  flexShrink: 0
},
 tabButton: {
  border: "none",
  padding: "0.85rem",
  fontWeight: 700,
  fontSize: "1rem",
  cursor: "pointer",
  color: "#ffffff",
  background: "transparent"
},

  tabMuted: {
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.75)"
  },
tabActive: {
  background: "#ffffff",
  color: " #2563eb",
  fontWeight: 800,
  borderRadius: "0",
},
formCard: {
  background: "#ffffff",
  padding: "1rem 1.25rem 1.25rem",
  display: "grid",
  gap: "1rem",
  borderTop: "1px solid #f1f5f9",
  flex: "1",
  gridAutoRows: "max-content",
  overflowY: "auto"
},
button: {
  padding: "0.85rem 1.25rem",
  borderRadius: "12px",
  border: "none",
    background: "linear-gradient(135deg,  #0f3a7d,  #0a2453)",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(37,99,235,0.35)"
},
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    boxShadow: "none"
  },
  formNote: {
    margin: "-0.25rem 0 0",
    color: "#64748b",
    fontSize: "0.78rem",
    lineHeight: 1.5,
    fontWeight: 400
  },
  error: {
    color: "#dc2626",
    margin: 0,
    fontWeight: 600
  },
  skeleton: {
    borderRadius: "8px",
    background: "linear-gradient(90deg, #f0f4ff 25%, #e6eefc 37%, #f0f4ff 63%)",
    backgroundSize: "200% 100%",
    animation: "skeletonShimmer 1.4s linear infinite",
    height: "1rem"
  },
  skeletonCard: {
    borderRadius: "20px",
    padding: "1.25rem",
    background: "#f8fafc",
    boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
    width: "100%",
    boxSizing: "border-box"
  },
  statusChip: {
    display: "inline-block",
    padding: "0.35rem 0.6rem",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "0.85rem"
  },
  statusOnTime: { background: "#ecfeff", color: "#065f46" },
  statusMinor: { background: "#fff7ed", color: "#92400e" },
  statusMajor: { background: "#fff1f2", color: "#991b1b" },
  routeCard: {
    width: '100%',
    background: "#ffffff",
    borderRadius: "0 0 16px 16px",
    border: "none",
    padding: "1.5rem",
    boxShadow: "none",
    display: "grid",
    gap: "1.5rem"
  },
  formHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.75rem",   
    marginBottom: "0",
    flexWrap: "wrap"
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: "0.15em",
    color: "#0f3a7d",
    margin: 0,
    fontSize: "0.75rem",
    fontWeight: 600,
    marginBottom: "0.25rem"
  },
  formTitle: {
    margin: "0",
    fontSize: "1.35rem",
    color: "#0f172a",
    lineHeight: 1.3,
    fontWeight: 600,
    fontFamily: 'inherit'

  },
  formHelper: {
    background: "#f8fafc",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    padding: "0.35rem 0.75rem",
    fontSize: "0.75rem",
    color: "#64748b",
    whiteSpace: "normal",
    alignSelf: "flex-start"
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1.5rem",
    alignItems: "flex-end"
  },
  fieldGroup: {
    display: "grid",
    gap: "0.5rem",
    minWidth: 0
  },
  fieldLabel: {
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    fontSize: "0.85rem",
    letterSpacing: "0.01em"
  },
  inputShell: {
    width: '100%',
    borderRadius: "10px",
    border: "1.5px solid #e2e8f0",
    background: "#ffffff",
    padding: "0.6rem 0.85rem",
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
    boxSizing: "border-box",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
    transition: "border-color 200ms ease, box-shadow 200ms ease",
    minWidth: 0
  },
  input: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "0.4rem 0",
    fontSize: "1rem",
    outline: "none",
    color: "#0f172a",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  stationFields: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1.35rem",
    alignItems: "end",
    marginBottom: "1.25rem"
  },
  stationInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "0.4rem 0",
    fontSize: "1.05rem",
    outline: "none",
    color: "#0f172a",
    fontWeight: 500,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  stationFieldsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    width: "100%"
  },
  fieldRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "1rem",
    alignItems: "end",
    width: "100%",
    minWidth: 0
  },
  dateTimeRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: "1rem",
    width: "100%",
    minWidth: 0
  },
  swapButton: {
    alignSelf: "center",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    fontSize: "1rem",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "0.25rem",
    transition: "all 150ms ease",
    color: "#64748b"
  },

  resultCard: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#e2e8f0",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.25)",
    display: "grid",
    gap: "1rem",
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #334155"
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
    fontSize: "0.75rem",
    color: "#7dd3fc",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  resultValue: {
    fontSize: "1.3rem",
    margin: "0.25rem 0 0",
    fontWeight: 700,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "1.35rem"
  },
  placeholderCard: {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    border: "2px dashed #cbd5e1",
    borderRadius: "16px",
    padding: "2.5rem 1.75rem",
    textAlign: "center",
    color: "#64748b",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    marginTop: "0",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "200px"
  },
  placeholderTitle: {
    margin: 0,
    fontWeight: 700,
    color: "#0f172a",
    fontSize: "1.05rem",
    letterSpacing: "-0.01em"
  },
  placeholderCopy: {
    margin: "0.65rem 0 0",
    color: "#64748b",
    fontSize: "0.85rem",
    lineHeight: 1.6,
    maxWidth: "280px",
    marginLeft: "0",
    marginRight: "0"
  },
  optionsList: {
    display: "grid",
    gap: "0.9rem"
  },
  optionCard: {
    borderRadius: "16px",
    border: "1.5px solid #e2e8f0",
    background: "#ffffff",
    padding: "1.25rem",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
    display: "grid",
    gap: "0.85rem",
    transition: "transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease"
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
    color: "var(--accent, #2563eb)"
  },
  optionMeta: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "0.75rem"
  },
  optionValue: {
    margin: "0.25rem 0 0",
    color: "#0f172a",
    fontWeight: 600,
    fontSize: "0.9rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  }
};
