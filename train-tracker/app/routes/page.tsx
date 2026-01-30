"use client";

import { useMemo, useState, type FormEvent, type ReactElement } from "react";
import { Chivo } from "next/font/google";

const chivo = Chivo({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type FieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
};

type ToolConfig = {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  fields: FieldConfig[];
  buttonLabel?: string;
  renderResult?: (payload: any) => ReactElement;
  sectionId: SectionID;
};

type SectionID = "plan" | "status" | "passenger" | "station";

const sections: Array<{ id: SectionID; title: string; description: string }> = [
  {
    id: "plan",
    title: "Plan & Explore",
    description: "Discover trains, schedules, and fare insights before you travel."
  },
  {
    id: "status",
    title: "Live Train Health",
    description: "Monitor running status, classes, and seat availability in real time."
  },
  {
    id: "passenger",
    title: "Passenger Services",
    description: "Track PNR allocations and fare components with confidence."
  },
  {
    id: "station",
    title: "Station Intelligence",
    description: "Inspect train boards, arrivals, and departures around any junction."
  }
];

const renderSearchMatches = (payload: any): ReactElement => {
  const matches = Array.isArray(payload?.matches) ? payload.matches.slice(0, 6) : [];
  if (matches.length === 0) {
    return <p className="muted">Run a search to view candidate trains.</p>;
  }

  return (
    <ul className="resultList">
      {matches.map((match: any) => (
        <li key={`${match.trainNumber}-${match.trainName}`} className="resultItem">
          <strong>
            {match.trainName} · {match.trainNumber}
          </strong>
          <div className="meta">
            <span>
              {match.from?.code ?? "???"} → {match.to?.code ?? "???"}
            </span>
            {match.travelTime && <span className="badge">{match.travelTime}</span>}
            {match.trainType && <span>{match.trainType}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
};

const renderBetweenStations = (payload: any): ReactElement => {
  const options = Array.isArray(payload?.options) ? payload.options.slice(0, 6) : [];
  if (options.length === 0) {
    return <p className="muted">No direct services surfaced yet.</p>;
  }

  return (
    <ul className="resultList">
      {options.map((option: any, index: number) => (
        <li key={`${option.trainNumber}-${index}`} className="resultItem">
          <strong>
            {option.trainName} · {option.trainNumber}
          </strong>
          <div className="meta">
            <span>
              {option.departureTime ?? "--:--"} → {option.arrivalTime ?? "--:--"}
            </span>
            {option.duration && <span className="badge">{option.duration}</span>}
            {option.delayMinutes != null && <span>Delay {option.delayMinutes}m</span>}
          </div>
        </li>
      ))}
    </ul>
  );
};

const renderLiveStatus = (payload: any): ReactElement => (
  <div className="statusBlock">
    <div>
      <strong>
        {payload?.trainName ?? "Unknown"} · {payload?.trainNumber ?? "--"}
      </strong>
      <p className="muted">{payload?.runningStatus ?? "No message"}</p>
    </div>
    <dl>
      <div>
        <dt>Delay</dt>
        <dd>{payload?.delayMinutes != null ? `${payload.delayMinutes} min` : "On time"}</dd>
      </div>
      <div>
        <dt>Platform</dt>
        <dd>{payload?.platform ?? "--"}</dd>
      </div>
      <div>
        <dt>Updated</dt>
        <dd>{payload?.lastUpdated ?? "--"}</dd>
      </div>
    </dl>
  </div>
);

const renderSchedule = (payload: any): ReactElement => {
  const route = Array.isArray(payload?.route) ? payload.route.slice(0, 6) : [];
  if (route.length === 0) {
    return <p className="muted">Hit fetch to inspect the detailed timetable.</p>;
  }
  return (
    <div>
      <p className="muted">
        {payload?.trainName ?? ""} ({payload?.trainNumber ?? "--"}) · {payload?.runDays ?? "--"}
      </p>
      <ul className="resultList">
        {route.map((stop: any) => (
          <li key={`${stop.sequence}-${stop.stationCode}`} className="resultItem">
            <strong>
              {stop.stationName} · {stop.stationCode}
            </strong>
            <div className="meta">
              <span>
                Arr {stop.arrival ?? "--:--"} · Dep {stop.departure ?? "--:--"}
              </span>
              {stop.haltMinutes != null && <span className="badge">Halt {stop.haltMinutes}m</span>}
              {stop.distanceKm != null && <span>{stop.distanceKm} km</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const renderPnrStatus = (payload: any): ReactElement => {
  const passengers = Array.isArray(payload?.passengers) ? payload.passengers : [];
  return (
    <div>
      <p className="muted">
        {payload?.trainName ?? ""} · Boarding {payload?.boardingPoint ?? payload?.from ?? "--"}
      </p>
      <ul className="resultList">
        {passengers.map((trav: any) => (
          <li key={trav.passenger ?? trav.bookingStatus} className="resultItem">
            <strong>Passenger {trav.passenger}</strong>
            <div className="meta">
              <span>Booked: {trav.bookingStatus ?? "--"}</span>
              <span className="badge">Current: {trav.currentStatus ?? "--"}</span>
              {trav.coachPosition && <span>Coach {trav.coachPosition}</span>}
            </div>
          </li>
        ))}
      </ul>
      {passengers.length === 0 && <p className="muted">PNR status will appear here.</p>}
    </div>
  );
};

const renderSeatAvailability = (payload: any): ReactElement => {
  const availability = Array.isArray(payload?.availability) ? payload.availability : [];
  if (availability.length === 0) {
    return <p className="muted">No availability rows yet.</p>;
  }
  return (
    <ul className="resultList">
      {availability.slice(0, 6).map((slot: any) => (
        <li key={`${slot.date}-${slot.status}`} className="resultItem">
          <strong>{slot.date ?? "--"}</strong>
          <div className="meta">
            <span>{slot.status ?? "--"}</span>
            {slot.confirmProbability && <span>Chance {slot.confirmProbability}</span>}
            {slot.probability && <span>Chance {slot.probability}</span>}
            {slot.statusCode && <span className="badge">{slot.statusCode}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
};

const renderFare = (payload: any): ReactElement => {
  const segments = Array.isArray(payload?.segments) ? payload.segments : [];
  const totalFare = payload?.totalFare ?? payload?.total_fare ?? null;
  const currency = payload?.currency ?? (totalFare ? "INR" : null);

  return (
    <div>
      {totalFare != null ? (
        <strong>
          {currency ? `${currency} ${totalFare}` : totalFare}
        </strong>
      ) : (
        <p className="muted">Enter a valid combination to calculate fare.</p>
      )}
      <ul className="resultList">
        {segments.map((segment: any, index: number) => (
          <li key={`${segment.head}-${index}`} className="resultItem">
            <div className="meta">
              <span>{segment.head ?? "Component"}</span>
              <span className="badge">{segment.amount}</span>
            </div>
          </li>
        ))}
      </ul>
      {segments.length === 0 && <p className="muted">Fare components will display here.</p>}
    </div>
  );
};

const renderTrainClasses = (payload: any): ReactElement => {
  const classes = Array.isArray(payload?.classes) ? payload.classes : [];
  if (classes.length === 0) {
    return <p className="muted">Fetch classes to view available accommodations.</p>;
  }
  return (
    <div className="chipRow">
      {classes.map((item: any) => (
        <span key={item.code} className="chip">
          {item.code} · {item.name ?? ""}
        </span>
      ))}
    </div>
  );
};

const renderStationBoard = (payload: any): ReactElement => {
  const trains = Array.isArray(payload?.trains) ? payload.trains.slice(0, 6) : [];
  if (trains.length === 0) {
    return (
      <div>
        <p className="muted">{payload?.message ?? "Upcoming movements will show here."}</p>
      </div>
    );
  }
  return (
    <ul className="resultList">
      {trains.map((entry: any, index: number) => (
        <li key={`${entry.trainNumber ?? index}`} className="resultItem">
          <strong>
            {entry.trainName ?? "Unknown"} · {entry.trainNumber ?? "--"}
          </strong>
          <div className="meta">
            <span>
              Arr {entry.scheduledArrival ?? entry.actualArrival ?? "--"} · Dep {entry.scheduledDeparture ?? entry.actualDeparture ?? "--"}
            </span>
            {entry.delayMinutes != null && <span className="badge">Delay {entry.delayMinutes}m</span>}
            {entry.platform && <span>Platform {entry.platform}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
};

const renderJsonFallback = (payload: any): ReactElement => (
  <pre className="codeBlock">{JSON.stringify(payload, null, 2)}</pre>
);

const toolConfigs: ToolConfig[] = [
  {
    id: "searchTrain",
    title: "Search Train",
    description: "Find trains by number, name, or partial routes.",
    endpoint: "/api/trains/search",
    fields: [{ name: "query", label: "Keyword", placeholder: "e.g. Rajdhani", autoComplete: "off" }],
    renderResult: renderSearchMatches,
    sectionId: "plan"
  },
  {
    id: "trainsBetween",
    title: "Trains Between Stations",
    description: "Discover direct services for a specific day.",
    endpoint: "/api/find-trains",
    fields: [
      { name: "from", label: "From", placeholder: "NDLS", autoComplete: "off" },
      { name: "to", label: "To", placeholder: "MMCT", autoComplete: "off" },
      {
        name: "date",
        label: "Date",
        placeholder: "2026-02-01",
        defaultValue: new Date().toISOString().slice(0, 10),
        type: "date"
      }
    ],
    renderResult: renderBetweenStations,
    sectionId: "plan"
  },
  {
    id: "liveStatus",
    title: "Live Train Status",
    description: "Track the latest running update with delay and platform info.",
    endpoint: "/api/train-status",
    fields: [
      { name: "trainNumber", label: "Train Number", placeholder: "12002", autoComplete: "off" },
      { name: "startDay", label: "Start Day (0 today)", placeholder: "0", defaultValue: "0" }
    ],
    renderResult: renderLiveStatus,
    sectionId: "status"
  },
  {
    id: "trainSchedule",
    title: "Train Schedule",
    description: "Full timetable with halt and distance data.",
    endpoint: "/api/trains/schedule",
    fields: [{ name: "trainNumber", label: "Train Number", placeholder: "22951", autoComplete: "off" }],
    renderResult: renderSchedule,
    sectionId: "plan"
  },
  {
    id: "pnrStatus",
    title: "PNR Status V3",
    description: "Passenger-level booking vs current allocation.",
    endpoint: "/api/pnr-status",
    fields: [{ name: "pnr", label: "PNR Number", placeholder: "10-digit PNR", autoComplete: "off" }],
    renderResult: renderPnrStatus,
    sectionId: "passenger"
  },
  {
    id: "seatAvailability",
    title: "Seat Availability",
    description: "Classic availability lookup with probability.",
    endpoint: "/api/seat-availability",
    fields: [
      { name: "trainNumber", label: "Train Number", placeholder: "12345", autoComplete: "off" },
      { name: "from", label: "From", placeholder: "NDLS", autoComplete: "off" },
      { name: "to", label: "To", placeholder: "BCT", autoComplete: "off" },
      { name: "class", label: "Class", placeholder: "3A", autoComplete: "off" },
      { name: "quota", label: "Quota", placeholder: "GN", defaultValue: "GN", autoComplete: "off" },
      { name: "date", label: "Date (YYYYMMDD)", placeholder: "20260201", autoComplete: "off" }
    ],
    renderResult: renderSeatAvailability,
    sectionId: "status"
  },
  {
    id: "seatAvailabilityV2",
    title: "Seat Availability V2",
    description: "Enhanced logic with flexi quota inputs.",
    endpoint: "/api/seat-availability/v2",
    fields: [
      { name: "trainNumber", label: "Train Number", placeholder: "12345", autoComplete: "off" },
      { name: "from", label: "From", placeholder: "NDLS", autoComplete: "off" },
      { name: "to", label: "To", placeholder: "BCT", autoComplete: "off" },
      { name: "class", label: "Class", placeholder: "2A", autoComplete: "off" },
      { name: "quota", label: "Quota", placeholder: "GN", defaultValue: "GN", autoComplete: "off" },
      { name: "date", label: "Date (YYYYMMDD)", placeholder: "20260201", autoComplete: "off" },
      { name: "flexiQuota", label: "Flexi Quota", placeholder: "TQ", autoComplete: "off" },
      { name: "currentStatus", label: "Current Status", placeholder: "WL12", autoComplete: "off" }
    ],
    renderResult: renderSeatAvailability,
    sectionId: "status"
  },
  {
    id: "trainClasses",
    title: "Train Classes",
    description: "List the booked classes for any service.",
    endpoint: "/api/trains/classes",
    fields: [{ name: "trainNumber", label: "Train Number", placeholder: "12951", autoComplete: "off" }],
    renderResult: renderTrainClasses,
    sectionId: "status"
  },
  {
    id: "fare",
    title: "Fare Calculator",
    description: "Split of total fare, taxes, and surcharges.",
    endpoint: "/api/fare",
    fields: [
      { name: "trainNumber", label: "Train Number", placeholder: "12951", autoComplete: "off" },
      { name: "from", label: "From", placeholder: "MMCT", autoComplete: "off" },
      { name: "to", label: "To", placeholder: "NDLS", autoComplete: "off" },
      { name: "class", label: "Class", placeholder: "1A", autoComplete: "off" },
      { name: "quota", label: "Quota", placeholder: "GN", defaultValue: "GN", autoComplete: "off" },
      { name: "age", label: "Passenger Age", placeholder: "30", autoComplete: "off" },
      { name: "date", label: "Date (YYYYMMDD)", placeholder: "20260201", autoComplete: "off" }
    ],
    renderResult: renderFare,
    sectionId: "passenger"
  },
  {
    id: "trainsByStation",
    title: "Trains By Station",
    description: "Snapshot of arrivals/departures within a window.",
    endpoint: "/api/trains/by-station",
    fields: [
      { name: "stationCode", label: "Station Code", placeholder: "PNBE", autoComplete: "off" },
      { name: "hours", label: "Hours Ahead", placeholder: "2", defaultValue: "2" }
    ],
    renderResult: renderStationBoard,
    sectionId: "station"
  },
  {
    id: "liveStation",
    title: "Live Station",
    description: "Active board with actual arrival/departure times.",
    endpoint: "/api/trains/live-station",
    fields: [
      { name: "stationCode", label: "Station Code", placeholder: "MAS", autoComplete: "off" },
      { name: "hours", label: "Hours Ahead", placeholder: "2", defaultValue: "2" }
    ],
    renderResult: renderStationBoard,
    sectionId: "station"
  }
];

export default function RoutesPage(): ReactElement {
  return (
    <main className={`${chivo.className} page`}>
      <section className="hero">
        <div className="heroBadge">Rapid API · Operations</div>
        <h1>Interactive Rail Intelligence Console</h1>
        <p>
          Every lookup runs through secure Next.js routes so RapidAPI keys stay on the server.
          Explore live status, availability, fares, and station boards with a layout that mirrors the
          project&apos;s bright control-room aesthetic.
        </p>
      </section>
      {sections.map((section) => (
        <section key={section.id} className="section">
          <div className="sectionHeader">
            <div>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>
          </div>
          <div className="grid" aria-live="polite">
            {toolConfigs
              .filter((tool) => tool.sectionId === section.id)
              .map((config) => (
                <ToolCard key={config.id} config={config} />
              ))}
          </div>
        </section>
      ))}
      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: clamp(3rem, 5vw, 5rem) clamp(1rem, 4vw, 3rem) 4rem;
          background: linear-gradient(145deg, #dbeafe 0%, #f8fbff 55%, #e0e7ff 100%);
          color: #0f1c2e;
        }

        .hero {
          max-width: 960px;
          margin: 0 auto clamp(2rem, 4vw, 3rem);
          text-align: center;
        }

        .hero h1 {
          font-size: clamp(2.2rem, 4vw, 3.6rem);
          margin: 1rem 0 0.75rem;
          letter-spacing: -0.03em;
        }

        .hero p {
          color: #475569;
          font-size: 1.05rem;
          line-height: 1.7;
          margin: 0 auto;
        }

        .heroBadge {
          display: inline-flex;
          padding: 0.35rem 1rem;
          border-radius: 999px;
          background: rgba(15, 28, 46, 0.08);
          font-size: 0.78rem;
          letter-spacing: 0.25em;
        }

        .section {
          margin-bottom: clamp(2rem, 4vw, 3.5rem);
        }

        .sectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0.5rem 0;
        }

        .sectionHeader h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .sectionHeader p {
          margin: 0.3rem 0 0;
          color: #475569;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 1.5rem;
          align-items: stretch;
        }

        .card {
          border-radius: 20px;
          padding: 1.75rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 18px 35px rgba(15, 28, 46, 0.08);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: 100%;
        }

        .card:hover {
          border-color: #c7d2fe;
          box-shadow: 0 25px 55px rgba(15, 28, 46, 0.12);
        }

        .card h3 {
          margin: 0;
          font-size: 1.25rem;
        }

        .card p {
          margin: 0;
          color: #475569;
          line-height: 1.5;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .formFields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.9rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .field label {
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #475569;
        }

        .field input {
          border-radius: 12px;
          border: 1px solid #cbd5f5;
          background: #f8fbff;
          padding: 0.65rem 0.95rem;
          color: #0f1c2e;
          font-size: 0.95rem;
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }

        .field input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
          background: #fff;
        }

        .form button {
          border: none;
          border-radius: 30px;
          padding: 0.85rem 1.35rem;
          font-size: 0.85rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #36c3f8);
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 180ms ease;
          align-self: flex-start;
        }

        .form button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .form button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(59, 130, 246, 0.35);
        }

        .status {
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          min-height: 1.15rem;
          color: #94a3b8;
        }

        .status.error {
          color: #b91c1c;
        }

        .status.success {
          color: #047857;
        }

        .result {
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          background: linear-gradient(180deg, #f8fafc, #fff);
          padding: 1rem;
          max-height: 320px;
          overflow: auto;
        }

        .resultList {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .resultItem {
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 0.75rem 0.9rem;
          background: #fff;
        }

        .resultItem strong {
          display: block;
          margin-bottom: 0.35rem;
          color: #0f1c2e;
        }

        .meta {
          font-size: 0.85rem;
          color: #475569;
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem 0.75rem;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.12rem 0.55rem;
          border-radius: 999px;
          border: 1px solid #cbd5f5;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #1e3a8a;
        }

        .muted {
          color: #64748b;
          margin: 0;
        }

        .statusBlock {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .statusBlock dl {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.65rem;
        }

        .statusBlock dt {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #94a3b8;
        }

        .statusBlock dd {
          margin: 0;
          font-weight: 600;
          color: #0f1c2e;
        }

        .chipRow {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        .chip {
          border-radius: 999px;
          border: 1px solid #c7d2fe;
          padding: 0.4rem 0.85rem;
          font-size: 0.85rem;
          background: rgba(99, 102, 241, 0.08);
          color: #312e81;
        }

        .codeBlock {
          font-size: 0.85rem;
          line-height: 1.5;
          white-space: pre-wrap;
          color: #0f172a;
        }

        @media (max-width: 720px) {
          .hero {
            text-align: left;
          }

          .sectionHeader {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function ToolCard({ config }: { config: ToolConfig }): ReactElement {
  const [formState, setFormState] = useState<Record<string, string>>(() =>
    config.fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue ?? "";
      return acc;
    }, {} as Record<string, string>)
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const buttonLabel = useMemo(() => {
    if (status === "loading") {
      return "Fetching";
    }
    if (status === "success") {
      return "Refresh";
    }
    if (status === "error") {
      return "Retry";
    }
    return config.buttonLabel ?? "Run";
  }, [status, config.buttonLabel]);

  const statusMessage = useMemo(() => {
    if (status === "loading") {
      return "Contacting API";
    }
    if (status === "success") {
      return "Live data ready";
    }
    if (status === "error") {
      return error ?? "Request failed";
    }
    return "Results will appear below";
  }, [status, error]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setResult(null);

    const params = new URLSearchParams();
    config.fields.forEach((field) => {
      const value = formState[field.name];
      if (value && value.trim().length > 0) {
        params.set(field.name, value.trim());
      }
    });

    const url = `${config.endpoint}${params.toString() ? `?${params.toString()}` : ""}`;

    try {
      const response = await fetch(url, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Request failed");
      }
      setResult(payload);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setStatus("error");
    }
  };

  return (
    <article className="card" id={config.id}>
      <div className="cardContent">
        <div>
          <h3>{config.title}</h3>
          <p>{config.description}</p>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <div className="formFields">
            {config.fields.map((field) => {
              const fieldId = `${config.id}-${field.name}`;
              return (
                <div key={field.name} className="field">
                  <label htmlFor={fieldId}>{field.label}</label>
                  <input
                    id={fieldId}
                    type={field.type ?? "text"}
                    autoComplete={field.autoComplete ?? "off"}
                    placeholder={field.placeholder}
                    value={formState[field.name] ?? ""}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        [field.name]: event.target.value
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
          <button type="submit" disabled={status === "loading"}>
            {buttonLabel}
          </button>
        </form>
        <p
          className={`status ${status === "error" ? "error" : status === "success" ? "success" : ""}`}
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
        <div className="result" aria-busy={status === "loading"}>
          {result
            ? config.renderResult?.(result) ?? renderJsonFallback(result)
            : !error && <p className="muted">Results land here after a request.</p>}
          {error && <p className="muted">{error}</p>}
        </div>
      </div>
    </article>
  );
}
