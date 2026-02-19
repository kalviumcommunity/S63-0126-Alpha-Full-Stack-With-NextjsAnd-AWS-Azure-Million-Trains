import type { ReactElement, ReactNode } from "react";
import type { Metadata } from "next";
import GlobalNavbar from "./components/GlobalNavbar.client";
import { ClientProviders } from "./components/ClientProviders";

export const metadata: Metadata = {
  title: "Millions of Local Trains",
  description: "Real-time delay tracker for high-volume metro networks"
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        style={{
          minHeight: "100vh",
          margin: 0,
          background: "linear-gradient(145deg, #dbeafe 0%, #f8fbff 60%, #e0e7ff 100%)",
          color: "#096cf6",
          fontFamily: "'Space Grotesk', 'Segoe UI', system-ui, sans-serif"
        }}
      >
        <ClientProviders>
          <GlobalNavbar />
          <div style={{ minHeight: "100vh" }}>{children}</div>
        </ClientProviders>
      </body>
    </html>
  );
}
