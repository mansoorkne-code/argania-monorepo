import type { Metadata } from "next";
import { StorefrontFooter } from "./components/storefront-footer";
import { StorefrontHeader } from "./components/storefront-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Argania Professional — Nourish. Rejuvenate. Pamper.",
  description: "Thoughtful skincare, haircare and daily beauty essentials from Argania Professional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <StorefrontHeader />
        {children}
        <StorefrontFooter />
      </body>
    </html>
  );
}
