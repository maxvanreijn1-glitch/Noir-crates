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
            background: var(--bg-dark);
            border-top: 1px solid var(--border-dark);
            padding: 40px 0;
            margin-top: 0;
            position: relative;
          }
          .site-footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--gold-mid), transparent);
          }
          .site-footer .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
          }
          .site-footer p {
            color: rgba(245,242,237,0.35);
            font-size: 0.78rem;
            letter-spacing: 0.06em;
          }
          .site-footer nav {
            display: flex;
            gap: 28px;
          }
          .site-footer nav a {
            color: rgba(245,242,237,0.45);
            font-size: 0.75rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            transition: color 0.2s;
          }
          .site-footer nav a:hover {
            color: var(--gold-mid);
          }
        `}</style>
      </body>
    </html>
  );
}

