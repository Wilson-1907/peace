import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Peace & Wilson · Habit Tracker",
  description:
    "A dual-pane habit tracker for Peace and Wilson — shared visibility, strict ownership.",
  openGraph: {
    title: "Peace & Wilson · Habit Tracker",
    description: "Track habits together. Own your checkmarks.",
    images: ["/couple.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen font-sans antialiased text-slate-900">
        {children}
      </body>
    </html>
  );
}
