import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estate Flow ERP",
  description: "Real Estate Development Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

