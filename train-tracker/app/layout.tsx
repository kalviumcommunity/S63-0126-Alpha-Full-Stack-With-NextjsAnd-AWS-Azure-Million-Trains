import type { ReactElement, ReactNode } from "react";
import type { Metadata } from "next";

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
        style={{
          minHeight: "100vh",
          margin: 0,
          backgroundColor: "#020617",
          color: "#e2e8f0"
        }}
      >
        {children}
      </body>
    </html>
  );
}
