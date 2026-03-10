import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RelationMap",
  description: "Obsidian-style graph for Notion databases",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={{ height: "100%", overflow: "hidden" }}>
      <body style={{ height: "100%", overflow: "hidden" }}>{children}</body>
    </html>
  );
}
