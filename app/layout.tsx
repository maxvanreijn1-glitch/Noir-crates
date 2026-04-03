import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Noir Crates — Mystery Collectible Boxes",
  description:
    "Calm, curated mystery boxes filled with premium collectible figures. Slow down, breathe, and discover.",
  openGraph: {
    title: "Noir Crates",
    description: "Premium mystery collectible boxes.",
    siteName: "Noir Crates",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Navbar />
          <CartDrawer />
          <main>{children}</main>
          <footer className="site-footer">
            <div className="container">
              <p>© {new Date().getFullYear()} Noir Crates. All rights reserved.</p>
              <nav>
                <a href="/about">About</a>
                <a href="/faq">FAQ</a>
              </nav>
            </div>
          </footer>
        </CartProvider>
        <Analytics />
        <style>{`
          .site-footer {
            background: var(--bg-card);
            border-top: 1px solid var(--border);
            padding: 32px 0;
            margin-top: 80px;
          }
          .site-footer .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
          }
          .site-footer p {
            color: var(--text-light);
            font-size: 0.875rem;
          }
          .site-footer nav {
            display: flex;
            gap: 24px;
          }
          .site-footer nav a {
            color: var(--text-light);
            font-size: 0.875rem;
            transition: color 0.2s;
          }
          .site-footer nav a:hover {
            color: var(--primary);
          }
        `}</style>
      </body>
    </html>
  );
}

