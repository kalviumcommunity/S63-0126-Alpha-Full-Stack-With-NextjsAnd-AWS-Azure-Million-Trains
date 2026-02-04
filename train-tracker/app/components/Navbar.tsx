'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { CSSProperties } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
  ];

  return (
    <nav style={styles.navbar}>
      <style>{`
        @media (max-width: 768px) {
          .nav-links {
            display: ${isOpen ? 'flex' : 'none'} !important;
          }
        }
      `}</style>

      <div style={styles.container}>
        {/* Logo */}
        <Link href="/" style={styles.logo}>
          🚂 TrainTracker
        </Link>

        {/* Hamburger Menu */}
        <button
          style={styles.hamburger}
          onClick={() => setIsOpen(!isOpen)}
          className="hamburger-btn"
          aria-label="Toggle menu"
        >
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
          <span style={styles.hamburgerLine}></span>
        </button>

        {/* Navigation Links */}
        <div style={styles.navLinksContainer} className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={styles.navLink}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {/* Auth Buttons */}
          <div style={styles.authButtons}>
            <Link href="/login" style={styles.loginBtn}>
              Login
            </Link>
            <Link href="/signup" style={styles.signupBtn}>
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, CSSProperties> = {
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    padding: '0',
    width: '100%',
  },

  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },

  logo: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#ffffff',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    letterSpacing: '-0.02em',
    transition: 'opacity 200ms ease',
    cursor: 'pointer',
  },

  hamburger: {
    display: 'none',
    flexDirection: 'column',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    gap: '6px',
    padding: '0.5rem',
    '@media (max-width: 768px)': {
      display: 'flex',
    },
  },

  hamburgerLine: {
    width: '24px',
    height: '2.5px',
    background: '#ffffff',
    borderRadius: '2px',
    transition: 'all 300ms ease',
  },

  navLinksContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    marginLeft: 'auto',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '0.75rem',
      width: '100%',
      paddingTop: '1rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    },
  },

  navLink: {
    color: 'rgba(255, 255, 255, 0.8)',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: 600,
    transition: 'color 200ms ease',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    '&:hover': {
      color: '#ec4899',
    },
  },

  authButtons: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      width: '100%',
      flexDirection: 'column',
      gap: '0.75rem',
    },
  },

  loginBtn: {
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 600,
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    border: '1.5px solid rgba(255, 255, 255, 0.3)',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    textAlign: 'center',
    display: 'block',
    letterSpacing: '-0.01em',
    '@media (max-width: 768px)': {
      width: '100%',
    },
  },

  signupBtn: {
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 600,
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #0f3a7d 0%, #0a2453 100%)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    textAlign: 'center',
    display: 'block',
    boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
    letterSpacing: '-0.01em',
    '@media (max-width: 768px)': {
      width: '100%',
    },
  },
};
