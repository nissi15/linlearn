import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linux Tutor",
  description: "Mastery-based Linux concept tutor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
