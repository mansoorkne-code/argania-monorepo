import type { Metadata } from "next";
import localFont from "next/font/local";
import { StorefrontFooter } from "./components/storefront-footer";
import { StorefrontHeader } from "./components/storefront-header";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Argania — A little ritual, a softer day",
  description:
    "Considered essentials and gentle rituals for the moments that make a day yours.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <StorefrontHeader />
        {children}
        <StorefrontFooter />
      </body>
    </html>
  );
}
