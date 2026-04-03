# Noir Crates

A calm, minimalist mystery box ecommerce storefront built with Next.js (App Router), TypeScript, and Stripe Checkout.

## Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + Global CSS
- **Payments**: Stripe Checkout
- **Deployment**: Vercel

## Pages
| Route | Description |
|-------|-------------|
| `/` | Home — hero + full product grid |
| `/blind-boxes` | **Blind Boxes collection page** — filter, sort, paginate |
| `/products/[slug]` | Individual product detail page |
| `/about` | About page |
| `/faq` | FAQ page |

## Blind Boxes Collection Page (`/blind-boxes`)

A full collection page modelled on standard e-commerce category pages:

- **Filter sidebar** (desktop) / **slide-in drawer** (mobile) with:
  - Availability: "In stock only" toggle
  - Category: multi-select checkboxes (Mystery Box, Series, Limited Edition, Premium)
  - "Clear all filters" shortcut when filters are active
- **Sort bar**: result count + dropdown (Featured, Price: Low/High, Name A–Z/Z–A, Newest)
- **Product grid**: 3 columns desktop → 2 tablet → 1 mobile, 6 items per page
- **Pagination**: numbered pages with prev/next buttons
- **Sold-out state**: greyed-out disabled button on out-of-stock products
- **Add to Crate**: adds item to the mini-cart drawer (existing Stripe-backed cart)
- **Accessible**: keyboard navigation, `aria-modal` on drawers, focus trap, `aria-current` on pagination

## Products
| SKU | Name | Price | Category | In Stock |
|-----|------|-------|----------|----------|
| mini | Mini Crate | $14.99 | Mystery Box | ✓ |
| studio | Studio Crate | $34.99 | Mystery Box | ✓ |
| midnight | Midnight Crate | $69.99 | Premium | ✓ |
| labubu-forest | Forest Series Vol.1 | $22.99 | Series | ✓ |
| neon-pop | Neon Pop Vol.2 | $19.99 | Series | ✓ |
| dark-matter | Dark Matter Vol.1 | $44.99 | Limited Edition | ✓ |
| crystal-dream | Crystal Dream | $27.99 | Mystery Box | ✓ |
| sakura-bloom | Sakura Bloom | $24.99 | Series | ✗ (sold out) |
| stellar-night | Stellar Night | $32.99 | Premium | ✓ |
| mossy-garden | Mossy Garden | $17.99 | Mystery Box | ✓ |

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
