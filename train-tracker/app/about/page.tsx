import type { ReactElement } from "react";

export const revalidate = false;

const problemPoints = [
  "Trains run late without warning, leaving riders stranded on platforms.",
  "Announcements are muffled or inconsistent between stations and apps.",
  "Missed connections and cascading delays waste hours each week."
];

const solutionCards = [
  {
    title: "Live delay tracking",
    copy: "Follow your train in real time and know exactly how many minutes you’re facing before you leave home."
  },
  {
    title: "Smart reroutes",
    copy: "See alternate trains and transfer tips the moment a delay crosses the threshold you set."
  },
  {
    title: "Alerts & saved routes",
    copy: "Save your daily routes once and receive calm, timely alerts only when something truly changes."
  }
];

const trustPoints = [
  "Always free for commuters",
  "Information verified with live rail feeds",
  "Written in clear, human language"
];

export default function AboutPage(): ReactElement {
  return (
    <>
      <main className="about-page">
        <section className="about-container">
          <section className="hero fade-in">
            <p className="eyebrow">Millions of Local Trains</p>
            <h1>When trains stall, we keep commuters calm</h1>
            <p className="hero-copy">
              We built this platform for anyone who has ever waited on a crowded platform with no idea what comes next. Honest delays,
              practical reroutes, and kinder mornings start here.
            </p>
            <div className="hero-actions">
              <a className="primary-btn" href="/dashboard">
                Check Live Trains
              </a>
              <a className="ghost-btn" href="/signup">
                Get Delay Alerts
              </a>
            </div>
          </section>

          <section className="card-section">
            <div className="section-header">
              <h2>The commute shouldn’t feel like a guessing game</h2>
              <p>Real people miss work, pickups, and rest because the right updates arrive too late. We’re changing that.</p>
            </div>
            <div className="card-grid">
              {problemPoints.map((point) => (
                <article key={point} className="info-card">
                  <p>{point}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="card-section">
            <div className="section-header">
              <h2>How we help every rider breathe easier</h2>
              <p>Clarity, not complexity. Everything we show is built around three small promises.</p>
            </div>
            <div className="card-grid">
              {solutionCards.map((card) => (
                <article key={card.title} className="info-card">
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="gradient-panel">
            <h2>Why it matters</h2>
            <p>
              A five-minute heads-up can mean catching a different train, rescheduling a meeting, or simply knowing you have time for
              breakfast. When delays are transparent, commuters reclaim time, reduce stress, and plan with confidence.
            </p>
            <ul>
              <li>Save meaningful minutes every week</li>
              <li>Reduce the stress of not knowing what comes next</li>
              <li>Plan pickups, meetings, and evenings with reliable context</li>
            </ul>
          </section>

          <section className="trust-grid">
            {trustPoints.map((point) => (
              <article key={point} className="trust-card">
                <span>✓</span>
                <p>{point}</p>
              </article>
            ))}
          </section>

          <section className="cta-panel">
            <h2>Ready for calmer commutes?</h2>
            <p>
              Check today’s live status board or set up alerts for the routes you care about. It’s free, fast, and built for riders like you.
            </p>
            <a className="primary-btn large" href="/dashboard">
              Start Checking Train Status
            </a>
          </section>
        </section>
      </main>
      <style>{`
        :root {
          font-family: 'Space Grotesk', 'Segoe UI', system-ui, sans-serif;
        }
        .about-page {
          min-height: 100vh;
          padding: 3rem 1.5rem 4rem;
          background: linear-gradient(140deg, #dbeafe 0%, #eff6ff 50%, #e0e7ff 100%);
          display: flex;
          justify-content: center;
        }
        .about-container {
          width: 100%;
          max-width: 1160px;
          background: #ffffff;
          border-radius: 36px;
          border: 1px solid #dbeafe;
          box-shadow: 0 45px 110px rgba(15, 23, 42, 0.15);
          padding: 3.25rem;
          color: #0f1c2e;
          line-height: 1.65;
          display: grid;
          gap: 2.75rem;
        }
        .hero {
          background: radial-gradient(circle at top, rgba(219, 234, 254, 0.7), #ffffff 60%);
          border-radius: 28px;
          border: 1px solid #dbeafe;
          padding: 2.5rem;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
          text-align: center;
        }
        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.3em;
          color: #0f3a7d;
          font-weight: 600;
          margin: 0 0 0.8rem;
        }
        .hero h1 {
          font-size: clamp(2rem, 4vw, 3rem);
          margin: 0 0 1rem;
        }
        .hero-copy {
          color: #475569;
          max-width: 720px;
          margin: 0 auto 1.75rem;
        }
        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
        }
        .primary-btn,
        .ghost-btn {
          padding: 0.95rem 1.85rem;
          border-radius: 999px;
          font-weight: 600;
          text-decoration: none;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .primary-btn {
          background: linear-gradient(120deg, #0f3a7d, #1e5ba8);
          color: #ffffff;
          box-shadow: 0 18px 40px rgba(37, 99, 235, 0.25);
        }
        .ghost-btn {
          border: 1px solid #c7d7ff;
          color: #1f2937;
          background: #ffffff;
          box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
        }
        .primary-btn:hover,
        .ghost-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 25px 50px rgba(37, 99, 235, 0.25);
        }
        .card-section {
          display: grid;
          gap: 1.5rem;
        }
        .section-header h2 {
          margin: 0 0 0.4rem;
          font-size: clamp(1.8rem, 3vw, 2.3rem);
        }
        .section-header p {
          margin: 0;
          color: #475569;
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.25rem;
        }
        .info-card {
          background: #f8fbff;
          border-radius: 22px;
          border: 1px solid #dbeafe;
          padding: 1.6rem;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .info-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 28px 65px rgba(15, 23, 42, 0.15);
        }
        .gradient-panel {
          background: linear-gradient(120deg, #0f3a7d, #1e5ba8);
          border-radius: 30px;
          color: #ffffff;
          padding: 2.2rem;
          box-shadow: 0 30px 70px rgba(37, 99, 235, 0.3);
        }
        .gradient-panel ul {
          margin: 1.2rem 0 0;
          padding-left: 1.2rem;
        }
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }
        .trust-card {
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid #dbeafe;
          padding: 1.4rem;
          display: flex;
          gap: 0.75rem;
          align-items: center;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
        }
        .trust-card span {
          font-size: 1.35rem;
          color: #0f3a7d;
          font-weight: 700;
        }
        .cta-panel {
          text-align: center;
          background: #f8fbff;
          border-radius: 28px;
          border: 1px solid #dbeafe;
          padding: 2.5rem;
        }
        .cta-panel p {
          color: #475569;
          max-width: 640px;
          margin: 0.75rem auto 1.75rem;
        }
        .primary-btn.large {
          padding: 1.15rem 2.4rem;
          font-size: 1rem;
        }
        .fade-in {
          animation: fadeInUp 700ms ease both;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 768px) {
          .about-container {
            padding: 2.25rem;
          }
          .hero {
            padding: 2rem;
          }
        }
      `}</style>
    </>
  );
}
