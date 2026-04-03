# Noir Crates

A calm, minimalist mystery box ecommerce storefront built with Next.js (App Router), TypeScript, and Stripe Checkout.

## Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + Global CSS
- **Payments**: Stripe Checkout
- **Deployment**: Vercel

## Products
| SKU | Name | Price |
|-----|------|-------|
| mini | Mini Crate | $14.99 |
| studio | Studio Crate | $34.99 |
| midnight | Midnight Crate | $69.99 |

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Fill in your Stripe API keys from https://dashboard.stripe.com/apikeys:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Run dev server
```bash
npm run dev
```

Open http://localhost:3000.

## Stripe Configuration
- Use **test mode** keys during development (prefix `pk_test_` and `sk_test_`)
- In test mode, use Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC)
- For production, switch to live keys and update `NEXT_PUBLIC_BASE_URL` to your domain

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the repo in https://vercel.com
3. Add environment variables in the Vercel project settings:
   - `STRIPE_SECRET_KEY` = `sk_live_...`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
   - `NEXT_PUBLIC_BASE_URL` = `https://your-domain.vercel.app`
4. Deploy

## Project Structure
```
app/
  layout.tsx          # Root layout with CartProvider, Navbar, Footer
  page.tsx            # Home page with hero + product grid
  page.module.css
  globals.css         # Design tokens + base styles
  products/[slug]/    # Dynamic product detail pages
  api/checkout/       # Stripe Checkout session API route
  success/            # Order success page
  cancel/             # Checkout cancelled page
  about/              # About page
  faq/                # FAQ page
components/
  Navbar.tsx          # Sticky navbar with cart icon
  CartDrawer.tsx      # Slide-in cart drawer
  ProductCard.tsx     # Product grid card
  AddToCartButton.tsx # Add to cart button (client component)
  Logo.tsx            # Brand logo SVG component
context/
  CartContext.tsx     # Client-side cart state
lib/
  products.ts         # Product data and types
  env.ts              # Environment variable helpers
public/
  images/             # Product placeholder SVG images
```
