import type { Metadata } from "next";
import { StorefrontFooter } from "./components/storefront-footer";
import { StorefrontHeader } from "./components/storefront-header";
import "./globals.css";
import { StorefrontWidgets } from "./components/storefront-widgets";
import { CartProvider } from "./cart/cart-provider";
import { getCartSnapshot } from "../lib/cart-snapshot";

export const metadata: Metadata = {
  title: "Argania Professional — Nourish. Rejuvenate. Pamper.",
  description:
    "Thoughtful skincare, haircare and daily beauty essentials from Argania Professional.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cart = await getCartSnapshot();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider initialCart={cart}>
          <StorefrontHeader />
          {children}
          <StorefrontFooter />
          <StorefrontWidgets />
        </CartProvider>
      </body>
    </html>
  );
}
