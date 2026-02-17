'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import HeroVideo from './components/HeroVideo.client';

export default function HomePage() {
  return (
    <div style={styles.page}>
      <style jsx>{`
        /* From Uiverse.io by ashwin_5681 */
        .card {
          width: 100%;
          height: 100%;
          padding: 15px;
          border: 1px solid #ccc;
          border-radius: 18px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          background: linear-gradient(135deg, #2563eb 0%, #93c5fd 100%);
          color: #ffffff;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
        }

        .card p {
          font-size: 15px;
          color: #ffffff;
          margin: 0;
          line-height: 1.35;
        }

        .card-title {
          font-size: 16px;
          font-weight: 700;
        }

        .slider {
          width: 100%;
          height: var(--height);
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent, #000 10% 90%, transparent);
        }

        .slider .list {
          display: flex;
          width: 100%;
          min-width: calc((var(--width) + var(--gap)) * var(--quantity));
          position: relative;
        }

        .slider .list .item {
          width: var(--width);
          height: var(--height);
          position: absolute;
          left: calc(100% + var(--gap));
          animation: autoRun 10s linear infinite;
          transition: filter 0.5s;
          animation-delay: calc(
            (10s / var(--quantity)) * (var(--position) - 1) - 10s
          ) !important;
        }

        .slider .list .item img {
          width: 100%;
        }

        @keyframes autoRun {
          from {
            left: calc(100% + var(--gap));
          }
          to {
            left: calc((var(--width) + var(--gap)) * -1);
          }
        }

        .slider:hover .item {
          animation-play-state: paused !important;
          filter: grayscale(1);
        }

        .slider .item:hover {
          filter: grayscale(0);
        }

        .slider[reverse="true"] .item {
          animation: reversePlay 10s linear infinite;
        }

        @keyframes reversePlay {
          from {
            left: calc((var(--width) + var(--gap)) * -1);
          }
          to {
            left: calc(100% + var(--gap));
          }
        }

        .feature-card {
          transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
          will-change: transform;
        }

        .feature-card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: rgba(15, 58, 125, 0.35);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
        }

        .feature-card:hover .feature-icon {
          transform: translateY(-2px) scale(1.05);
        }

        .feature-icon {
          transition: transform 200ms ease;
        }

        .step-card {
          transition: transform 220ms ease, box-shadow 220ms ease, background 220ms ease;
          will-change: transform;
        }

        .step-card:hover {
          transform: translateY(-4px) rotateZ(-0.6deg);
          background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
        }

        .step-card:hover .step-number {
          transform: scale(1.06);
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.35);
        }

        .step-number {
          transition: transform 200ms ease, box-shadow 200ms ease;
        }

        .footer-link:hover {
          text-decoration: underline;
          text-underline-offset: 4px;
        }
      `}</style>
      {/* Hero Section with Video Background */}
      <HeroVideo />

      {/* Features Section */}
      <section style={styles.features}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Why Choose TrainTracker?</h2>
          <div style={styles.featureGrid}>
            {[
              {
                icon: '⚡',
                title: 'Live Updates',
                description: 'Get real-time delay and platform information powered by IRCTC live feed',
              },
              {
                icon: '🔍',
                title: 'Easy Search',
                description: 'Search trains by number or find routes between any two stations instantly',
              },
              {
                icon: '📊',
                title: 'Accurate Data',
                description: 'Access accurate and up-to-date information for all Indian railways',
              },
              {
                icon: '📱',
                title: 'Mobile Friendly',
                description: 'Use TrainTracker on any device - desktop, tablet, or smartphone',
              },
            ].map((feature, index) => (
              <div key={index} style={styles.featureCard} className="feature-card">
                <div style={styles.featureIcon} className="feature-icon">
                  {feature.icon}
                </div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.carouselSection}>
        <div
          className="slider"
          style={{
            ['--width' as keyof CSSProperties]: '200px',
            ['--height' as keyof CSSProperties]: '200px',
            ['--gap' as keyof CSSProperties]: '16px',
            ['--quantity' as keyof CSSProperties]: 9,
          }}
        >
          <div className="list">
            <div className="item" style={{ ['--position' as keyof CSSProperties]: 1 }}>
              <div className="card">
                <p className="card-title">Real-time Seat Availability</p>
                <p className="card-text">Instantly check current berth or seat counts across different travel classes.</p>
              </div>
            </div>
            <div className="item" style={{ ['--position' as keyof CSSProperties]: 2 }}>
              <div className="card">
                <p className="card-title">Live Train Tracking</p>
                <p className="card-text">
                  Monitor the exact geographic location and delay status of any active train in the network.
                </p>
              </div>
            </div>
            <div className="item" style={{ ['--position' as keyof CSSProperties]: 3 }}>
              <div className="card">
                <p className="card-title">PNR Status Inquiries</p>
                <p className="card-text">
                  Provide passengers with instant updates on their booking confirmation and coach assignments.
                </p>
              </div>
            </div>
            <div className="item" style={{ ['--position' as keyof CSSProperties]: 4 }}>
              <div className="card">
                <p className="card-title">Dynamic Route Planning</p>
                <p className="card-text">
                  A smart search engine that suggests the best train connections between any two stations.
                </p>
              </div>
            </div>
            <div className="item" style={{ ['--position' as keyof CSSProperties]: 5 }}>
              <div className="card">
                <p className="card-title">Integrated Payment Gateway</p>
                <p className="card-text">
                  Secure processing of transactions via credit cards, digital wallets, and UPI.
                </p>
              </div>
            </div>
            <div className="item" style={{ ['--position' as keyof CSSProperties]: 6 }}>
              <div className="card">
                <p className="card-title">Automated Refund Processing</p>
                <p className="card-text">
                  A streamlined system for calculating and issuing refunds upon ticket cancellation.
                </p>
              </div>
            </div>
            <div className="item" style={{ ['--position' as keyof CSSProperties]: 7 }}>
              <div className="card">
                <p className="card-title">User Profile Dashboard</p>
                <p className="card-text">
                  A centralized hub for managing booking history, saved passengers, and loyalty points.
                </p>
              </div>
            </div>
            <div className="item" style={{ ['--position' as keyof CSSProperties]: 8 }}>
              <div className="card">
                <p className="card-title">Station Information & Maps</p>
                <p className="card-text">
                  Detailed guides for station facilities, platform layouts, and local transit links.
                </p>
              </div>
            </div>
            <div className="item" style={{ ['--position' as keyof CSSProperties]: 9 }}>
              <div className="card">
                <p className="card-title">Alerts and Notifications</p>
                <p className="card-text">
                  Automated SMS or push notifications for schedule changes, platform numbers, or booking updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={styles.howItWorks}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>How It Works?</h2>
          <div style={styles.stepsGrid}>
            {[
              {
                step: '1',
                title: 'Enter Train Details',
                description: 'Search by train number or find routes between stations',
              },
              {
                step: '2',
                title: 'Get Live Info',
                description: 'View real-time delay, platform, and running status instantly',
              },
              {
                step: '3',
                title: 'Plan Your Journey',
                description: 'Make informed decisions about your train travel',
              },
            ].map((item, index) => (
              <div key={index} style={styles.stepCard} className="step-card">
                <div style={styles.stepNumber} className="step-number">
                  {item.step}
                </div>
                <h3 style={styles.stepTitle}>{item.title}</h3>
                <p style={styles.stepDescription}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Track Your Train?</h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of commuters who trust TrainTracker for accurate, real-time train information.
          </p>
          <Link href="/dashboard" style={styles.ctaButton}>
            Start Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.container}>
          <div style={styles.footerContent}>
            <div style={styles.footerSection}>
              <h3 style={styles.footerTitle}>TrainTracker</h3>
              <p style={styles.footerText}>
                Your trusted companion for real-time train information across India.
              </p>
            </div>
            <div style={styles.footerSection}>
              <h4 style={styles.footerHeading}>Quick Links</h4>
              <div style={styles.footerLinks}>
                <Link href="/dashboard" style={styles.footerLink} className="footer-link">Dashboard</Link>
                <Link href="/about" style={styles.footerLink} className="footer-link">About</Link>
                <Link href="/contact" style={styles.footerLink} className="footer-link">Contact</Link>
                <Link href="/faq" style={styles.footerLink} className="footer-link">FAQ</Link>
              </div>
            </div>
            <div style={styles.footerSection}>
              <h4 style={styles.footerHeading}>Account</h4>
              <div style={styles.footerLinks}>
                <Link href="/login" style={styles.footerLink} className="footer-link">Login</Link>
                <Link href="/signup" style={styles.footerLink} className="footer-link">Sign Up</Link>
              </div>
            </div>
          </div>
          <div style={styles.footerBottom}>
            <p style={styles.footerCopy}>
              © 2026 TrainTracker. All rights reserved. Powered by IRCTC live feed.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: '100%',
    background: '#ffffff',
  },

  hero: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '6rem 1.5rem',
    textAlign: 'center',
    color: '#ffffff',
    minHeight: '500px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroContent: {
    maxWidth: '700px',
    margin: '0 auto',
  },

  heroTitle: {
    fontSize: 'clamp(2rem, 8vw, 3.5rem)',
    fontWeight: 800,
    margin: '0 0 1rem',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },

  heroSubtitle: {
    fontSize: '1.1rem',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '0 0 2rem',
    lineHeight: 1.6,
  },

  heroButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },

  heroPrimaryBtn: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    color: '#ffffff',
    padding: '0.9rem 2rem',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    boxShadow: '0 8px 20px rgba(236, 72, 153, 0.3)',
    transition: 'all 200ms ease',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  },

  heroSecondaryBtn: {
    background: 'transparent',
    color: '#ffffff',
    padding: '0.9rem 2rem',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 200ms ease',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  },

  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  features: {
    padding: '5rem 1.5rem',
    background: '#f8fafc',
  },

  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },

  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: 800,
    textAlign: 'center',
    margin: '0 0 3rem',
    color: '#0f172a',
    fontFamily: "calibri",
    letterSpacing: '-0.02em',
  },

  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
  },

  featureCard: {
    background: '#ffffff',
    padding: '2rem',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    transition: 'all 200ms ease',
  },

  featureIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },

  featureTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 0.5rem',
  },

  featureDescription: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.6,
  },

  howItWorks: {
    padding: '5rem 1.5rem',
    background: '#ffffff',
  },

  carouselSection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '5rem 1.5rem',
    background: '#ffffff',
  },

  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
  },

  stepCard: {
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    padding: '2rem',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
  },

  stepNumber: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    color: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    fontWeight: 800,
    margin: '0 auto 1rem',
  },

  stepTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 0.5rem',
  },

  stepDescription: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.6,
  },

  cta: {
    background: 'linear-gradient(135deg, #093db7 0%, #264e8f 50%, #334155 100%)',
    padding: '4rem 1.5rem',
    textAlign: 'center',
    color: '#ffffff',
  },

  ctaContent: {
    maxWidth: '600px',
    margin: '0 auto',
  },

  ctaTitle: {
    fontSize: '2rem',
    fontWeight: 500,
    margin: '0 0 1rem',
    letterSpacing: '-0.02em',
  },

  ctaSubtitle: {
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '0 0 2rem',
    lineHeight: 1.6,
  },

  ctaButton: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    color: '#ffffff',
    padding: '1rem 2.5rem',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    boxShadow: '0 8px 20px rgba(236, 72, 153, 0.3)',
    transition: 'all 200ms ease',
    cursor: 'pointer',
    display: 'inline-block',
    letterSpacing: '-0.01em',
  },

  footer: {
    background: ' #fcfdfe',
    color: '#060505',
    padding: '3rem 1.5rem 1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    
  },

  footerContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginBottom: '2rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },

  footerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  footerTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.01em',
    marginLeft: '70px',
  
  },

  footerHeading: {
    fontSize: '1rem',
    fontWeight: 700,
    margin: 0,
    color: '#035ab1',
    marginLeft: '200px',
  },

  footerText: {
    fontSize: '1rem',
    color: 'rgba(7, 7, 7, 0.7)',
    marginLeft: '70px',
    lineHeight: 1.6,
  },

  footerLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  footerLink: {
    color: 'rgba(3, 3, 3, 0.7)',
    textDecoration: 'none',
    fontSize: '1rem',
    transition: 'color 200ms ease',
    cursor: 'pointer',
    marginLeft: '200px',
  },

  footerBottom: {
    textAlign: 'center',
    paddingTop: '1rem',
  },

  footerCopy: {
    fontSize: '0.85rem',
    color: 'rgba(12, 12, 12, 0.5)',
    margin: 0,
  },
  
};
