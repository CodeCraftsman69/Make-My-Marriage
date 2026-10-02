import type { Metadata } from "next";
import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import "./studio.css";

const newsreader = Newsreader({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-editorial",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Make My Marriage",
    template: "%s | Make My Marriage",
  },
  description: "A shared wedding-planning workspace for Indian families.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${newsreader.variable} ${plusJakartaSans.variable}`} lang="en">
      <body>
        <div className="site-shell">{children}</div>
      </body>
    </html>
  );
}
