import type { ReactElement } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "./logout-button";
import { AUTH_COOKIE_NAME } from "../lib/auth-constants";
import styles from "./navbar.module.css";

const navLinks = [
  { label: "Overview", href: "/" },
  { label: "Routes Console", href: "/routes" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "About", href: "/about" }
];

export default async function Navbar(): Promise<ReactElement> {
  const cookieStore = await cookies();
  const isAuthenticated = Boolean(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  return (
    <header className={styles.navWrapper}>
      <nav className={styles.navBar} aria-label="Primary">
        <Link href="/" className={styles.logo}>
          Engine<span className={styles.trademark}>™</span>
        </Link>
        <div className={styles.navLinks}>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`${styles.navLink}${link.hasCaret ? ` ${styles.navLinkCaret}` : ""}`}
            >
              {link.label}
              {link.hasCaret && <span aria-hidden>▾</span>}
            </Link>
          ))}
        </div>
        <div className={styles.navActions}>
          {isAuthenticated ? (
            <>
              <span className={styles.loginLink} aria-live="polite">
                Logged in ▾
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className={styles.loginLink}>
                Login ▾
              </Link>
              <Link href="/signup" className={styles.signupButton}>
                Sign up for free
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
