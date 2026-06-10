import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wayco Sourcing — Candidate Review Board",
  description: "Internal AI candidate review tool for Wayco recruiting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
