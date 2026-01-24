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
          background: "linear-gradient(145deg, #dbeafe 0%, #f8fbff 60%, #e0e7ff 100%)",
          color: "#0f1c2e",
          fontFamily: "'Space Grotesk', 'Segoe UI', system-ui, sans-serif"
        }}
      >
        {children}
      </body>
    </html>
  );
}
