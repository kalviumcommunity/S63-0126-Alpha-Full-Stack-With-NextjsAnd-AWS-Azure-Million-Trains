'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import HeroVideo from './components/HeroVideo.client';

export default function HomePage() {
  return (
    <div style={styles.page}>
      {/* Hero Section with Video Background */}
      <HeroVideo />
      
      {/* Hero Content Overlay */}
      <section style={styles.heroOverlay}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Real-Time Train Tracking Made Simple
          </h1>
          <p style={styles.heroSubtitle}>
            Get live delay updates, platform information, and track any train across India instantly.
          </p>
          <div style={styles.heroButtons}>
            <Link href="/dashboard" style={styles.heroPrimaryBtn}>
              Start Tracking
            </Link>
            <Link href="/about" style={styles.heroSecondaryBtn}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

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
              <div key={index} style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={styles.howItWorks}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
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
              <div key={index} style={styles.stepCard}>
                <div style={styles.stepNumber}>{item.step}</div>
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
                <Link href="/dashboard" style={styles.footerLink}>Dashboard</Link>
                <Link href="/about" style={styles.footerLink}>About</Link>
                <Link href="/contact" style={styles.footerLink}>Contact</Link>
                <Link href="/faq" style={styles.footerLink}>FAQ</Link>
              </div>
            </div>
            <div style={styles.footerSection}>
              <h4 style={styles.footerHeading}>Account</h4>
              <div style={styles.footerLinks}>
                <Link href="/login" style={styles.footerLink}>Login</Link>
                <Link href="/signup" style={styles.footerLink}>Sign Up</Link>
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
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
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
    fontWeight: 800,
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
    background: '#0f172a',
    color: '#ffffff',
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
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.01em',
  },

  footerHeading: {
    fontSize: '1rem',
    fontWeight: 700,
    margin: 0,
    color: '#0f3a7d',
  },

  footerText: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: 0,
    lineHeight: 1.6,
  },

  footerLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  footerLink: {
    color: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'color 200ms ease',
    cursor: 'pointer',
  },

  footerBottom: {
    textAlign: 'center',
    paddingTop: '1rem',
  },

  footerCopy: {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: 0,
  },
};
