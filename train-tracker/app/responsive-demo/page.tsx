"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Card } from "@/components/ui";

/**
 * Responsive & Themed Design Demo Page
 * 
 * Demonstrates:
 * - Responsive layouts at all breakpoints (xs, sm, md, lg, xl, 2xl)
 * - Light/dark theme support
 * - Custom Tailwind configuration
 * - Accessible color contrast
 * - Responsive typography, spacing, and grids
 */
export default function ResponsiveDemoPage() {
  const { theme } = useTheme();
  const [activeBreakpoint, setActiveBreakpoint] = useState("unknown");

  // Detect current breakpoint (for demo purposes)
  if (typeof window !== "undefined") {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 475) setActiveBreakpoint("xs");
      else if (width < 640) setActiveBreakpoint("sm");
      else if (width < 768) setActiveBreakpoint("md");
      else if (width < 1024) setActiveBreakpoint("lg");
      else if (width < 1280) setActiveBreakpoint("xl");
      else setActiveBreakpoint("2xl");
    };

    window.addEventListener("resize", updateBreakpoint);
    updateBreakpoint();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-gray-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      <div className="container-custom py-8 md:py-12 lg:py-16">
        
        {/* Header Section */}
        <header className="text-center mb-12 md:mb-16 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 gradient-text">
            Responsive & Themed Design
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-4">
            Experience adaptive layouts and seamless theme switching across all devices
          </p>
          
          {/* Current Theme and Breakpoint Indicator */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-sm font-medium">
              Theme: {theme}
            </span>
            <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
              Breakpoint: {activeBreakpoint}
            </span>
          </div>
        </header>

        {/* Responsive Typography */}
        <section className="mb-12 md:mb-16">
          <Card>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              📱 Responsive Typography
            </h2>
            <div className="space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white">
                  Adaptive Heading (H1)
                </h1>
                <code className="text-xs text-gray-500 dark:text-gray-400">
                  text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl
                </code>
              </div>
              <div>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300">
                  This paragraph adjusts its size based on the viewport width, ensuring readability on all devices.
                </p>
                <code className="text-xs text-gray-500 dark:text-gray-400">
                  text-sm sm:text-base md:text-lg
                </code>
              </div>
            </div>
          </Card>
        </section>

        {/* Responsive Grid Layout */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            🎨 Responsive Grid System
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="card card-hover p-6 text-center animate-slide-up"
                style={{ animationDelay: `${item * 50}ms` }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold">
                  {item}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Item {item}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Responsive card component
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
            <code>grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4</code>
          </p>
        </section>

        {/* Responsive Spacing */}
        <section className="mb-12 md:mb-16">
          <Card>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              📏 Adaptive Spacing
            </h2>
            <div className="space-y-4">
              <div className="p-2 sm:p-4 md:p-6 lg:p-8 bg-brand-50 dark:bg-brand-900/20 rounded-lg border-2 border-brand-200 dark:border-brand-800">
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  This box has responsive padding that increases with viewport size
                </p>
                <code className="text-xs text-gray-500 dark:text-gray-400">
                  p-2 sm:p-4 md:p-6 lg:p-8
                </code>
              </div>
              <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-10 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  This box has responsive margin-top
                </p>
                <code className="text-xs text-gray-500 dark:text-gray-400">
                  mt-4 sm:mt-6 md:mt-8 lg:mt-10
                </code>
              </div>
            </div>
          </Card>
        </section>

        {/* Theme Color Palette */}
        <section className="mb-12 md:mb-16">
          <Card>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              🎨 Custom Brand Colors
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                <div key={shade} className="text-center">
                  <div
                    className={`h-16 md:h-20 rounded-lg shadow-md mb-2 transition-transform hover:scale-105`}
                    style={{ backgroundColor: `var(--brand-${shade})` }}
                  />
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    brand-{shade}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Semantic Colors */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            ✅ Semantic Colors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-success-light dark:bg-success-dark text-white p-6">
              <h3 className="font-bold mb-2">Success</h3>
              <p className="text-sm opacity-90">Positive actions and confirmations</p>
            </div>
            <div className="card bg-warning-light dark:bg-warning-dark text-white p-6">
              <h3 className="font-bold mb-2">Warning</h3>
              <p className="text-sm opacity-90">Caution and attention needed</p>
            </div>
            <div className="card bg-danger-light dark:bg-danger-dark text-white p-6">
              <h3 className="font-bold mb-2">Danger</h3>
              <p className="text-sm opacity-90">Errors and destructive actions</p>
            </div>
            <div className="card bg-info-light dark:bg-info-dark text-white p-6">
              <h3 className="font-bold mb-2">Info</h3>
              <p className="text-sm opacity-90">Informational messages</p>
            </div>
          </div>
        </section>

        {/* Responsive Buttons */}
        <section className="mb-12 md:mb-16">
          <Card>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              🔘 Responsive Buttons
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 flex-wrap">
              <button className="btn btn-primary px-4 py-2 sm:px-6 sm:py-3">
                Primary Button
              </button>
              <button className="btn btn-secondary px-4 py-2 sm:px-6 sm:py-3">
                Secondary Button
              </button>
              <button className="btn bg-success-500 text-white hover:bg-success-600 px-4 py-2 sm:px-6 sm:py-3">
                Success Button
              </button>
              <button className="btn bg-danger-500 text-white hover:bg-danger-600 px-4 py-2 sm:px-6 sm:py-3">
                Danger Button
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Buttons adjust padding and layout on mobile vs desktop
            </p>
          </Card>
        </section>

        {/* Accessibility Info */}
        <section className="mb-12 md:mb-16">
          <Card>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              ♿ Accessibility Features
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-success-500 text-xl">✓</span>
                <div>
                  <strong>WCAG AA Compliant:</strong> All color combinations meet contrast ratio requirements
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success-500 text-xl">✓</span>
                <div>
                  <strong>Focus Indicators:</strong> Clear focus rings for keyboard navigation
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success-500 text-xl">✓</span>
                <div>
                  <strong>Responsive Text:</strong> Scales appropriately preventing readability issues
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success-500 text-xl">✓</span>
                <div>
                  <strong>Theme Persistence:</strong> User preference saved to localStorage
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success-500 text-xl">✓</span>
                <div>
                  <strong>System Preference:</strong> Respects prefers-color-scheme media query
                </div>
              </li>
            </ul>
          </Card>
        </section>

        {/* Breakpoint Reference */}
        <section>
          <Card>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              📐 Breakpoint Reference
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b-2 border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Breakpoint</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Min Width</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {[
                    { name: "xs", width: "475px", device: "Small phones" },
                    { name: "sm", width: "640px", device: "Large phones" },
                    { name: "md", width: "768px", device: "Tablets" },
                    { name: "lg", width: "1024px", device: "Small laptops" },
                    { name: "xl", width: "1280px", device: "Desktops" },
                    { name: "2xl", width: "1536px", device: "Large screens" },
                  ].map((bp) => (
                    <tr key={bp.name} className={activeBreakpoint === bp.name ? "bg-brand-50 dark:bg-brand-900/20" : ""}>
                      <td className="py-3 px-4 font-mono font-semibold text-brand-600 dark:text-brand-400">{bp.name}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{bp.width}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{bp.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

      </div>
    </main>
  );
}
