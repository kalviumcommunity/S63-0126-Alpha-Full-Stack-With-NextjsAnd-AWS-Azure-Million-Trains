'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import Cookies from 'js-cookie';

export default function GlobalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = Cookies.get('token');
    setIsAuthenticated(!!token);
  }, [pathname]);

  const handleLogout = () => {
    Cookies.remove('token');
    setIsAuthenticated(false);
    router.push('/');
  };

  // Public navigation items
  const publicNavItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Routes', href: '/routes' },
    { label: 'Contact', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
  ];

  // Protected navigation items (shown when authenticated)
  const protectedNavItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Users', href: '/users' },
  ];

  const navItems = isAuthenticated 
    ? [...publicNavItems, ...protectedNavItems]
    : publicNavItems;

  return (
    <nav style={styles.navbar}>
      <style>{`
        .nav-link {
          position: relative;
          display: inline-block;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: #2563eb;
        }

        .nav-link-active {
          color: #2563eb;
          font-weight: 600;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: -4px;
          height: 2px;
          background: #2563eb;
          border-radius: 999px;
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 200ms ease;
        }

        .nav-link:hover::after,
        .nav-link-active::after {
          transform: scaleX(1);
        }

        .hamburger-btn {
          display: none;
        }

        @media (max-width: 968px) {
          .hamburger-btn {
            display: flex !important;
          }

          .nav-links {
            display: ${isOpen ? 'flex' : 'none'} !important;
            flex-direction: column;
            gap: 0.75rem;
            width: 100%;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
          }

          .auth-buttons {
            width: 100%;
            flex-direction: column;
            gap: 0.75rem;
          }

          .login-btn,
          .signup-btn,
          .logout-btn {
            width: 100%;
          }
        }

        .auth-login:hover {
          color: #2563eb !important;
          background: #dbeafe !important;
        }

        .auth-signup:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35);
        }

        .auth-logout:hover {
          background: #dc2626 !important;
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
              className={`nav-link ${pathname === item.href ? 'nav-link-active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {/* Auth Buttons */}
          <div style={styles.authButtons} className="auth-buttons">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                style={styles.logoutBtn}
                className="auth-logout logout-btn"
              >
                Logout
              </button>
            ) : (
              <>
                <Link 
                  href="/login" 
                  style={styles.loginBtn} 
                  className="auth-login login-btn"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  style={styles.signupBtn} 
                  className="auth-signup signup-btn"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
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
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '0',
    width: '100%',
  },

  container: {
    maxWidth: '1400px',
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
    fontWeight: 700,
    color: '#2563eb',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    letterSpacing: '-0.02em',
    transition: 'opacity 200ms ease',
    cursor: 'pointer',
  },

  hamburger: {
    display: 'flex',
    flexDirection: 'column',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    gap: '6px',
    padding: '0.5rem',
  },

  hamburgerLine: {
    width: '24px',
    height: '2.5px',
    background: '#2563eb',
    borderRadius: '2px',
    transition: 'all 300ms ease',
  },

  navLinksContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    marginLeft: 'auto',
  },

  navLink: {
    color: '#374151',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: 500,
    padding: '0.5rem 1rem',
    cursor: 'pointer',
  },

  authButtons: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },

  loginBtn: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#2563eb',
    textDecoration: 'none',
    background: 'transparent',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    textAlign: 'center',
  },

  signupBtn: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'white',
    textDecoration: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    textAlign: 'center',
  },

  logoutBtn: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'white',
    background: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    textAlign: 'center',
  },
};
