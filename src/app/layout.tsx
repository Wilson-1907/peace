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
  title: "Peace & Wilson · Daily Tracking System",
  description:
    "Day-by-day habit tracking for Peace and Wilson — mark today, build history, compare together.",
  openGraph: {
    title: "Peace & Wilson · Daily Tracking System",
    description: "Track one day at a time. Own your checkmarks.",
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
