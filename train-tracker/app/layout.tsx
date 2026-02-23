import type { ReactElement, ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen transition-colors duration-200">
        <ClientProviders>
          <GlobalNavbar />
          <div className="min-h-screen">{children}</div>
        </ClientProviders>
      </body>
    </html>
  );
}
