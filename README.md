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
| `/pack-opener` | Multi-TCG virtual pack opener (Stripe payment) |
| `/pokemon-pack-opener` | **Pokémon TCGdex Pack Opener** — free demo, live API data |
| `/about` | About page |
| `/faq` | FAQ page |

---

## Pokémon TCGdex Pack Opener (`/pokemon-pack-opener`)

A free virtual Pokémon TCG pack-opening simulator powered entirely by the
[TCGdex public API](https://api.tcgdex.net). No payment required — real card
images and data are fetched live from TCGdex.

> **Note**: The main **Pack Opener** page (`/pack-opener`) also uses TCGdex for Pokémon sets.
> Canonical set IDs are resolved via `GET /api/tcgdex/sets` (backed by the live TCGdex API
> with automatic fallback to local data if TCGdex is unreachable).

### How it works

1. **Select a set** from the list (10 supported sets, see table below).
2. Click **Open Pack** — the browser POSTs to `/api/pack-opener/tcgdex-open`.
3. The server fetches the full card list for that set from
   `https://api.tcgdex.net/v2/en/sets/{setId}`.
4. Pack cards are generated using the weighted rarity system (see Odds below).
5. Five cards are returned and revealed one by one in the browser.
6. Card images are loaded directly from `https://assets.tcgdex.net`.

### Set ID resolution

Pokémon set IDs are resolved dynamically at runtime by querying
`https://api.tcgdex.net/v2/en/sets` and matching against the canonical list in
`lib/tcgdex.ts` (`POKEMON_SETS`). This ensures the IDs used in API calls are
always what TCGdex expects.  If TCGdex is unreachable, the hardcoded fallback
IDs in `POKEMON_SETS` are used instead.

### Caching

| Layer | Strategy |
|-------|----------|
| **Server-side in-memory** | `Map<setId, cards>` with a 1-hour TTL. Subsequent pack opens for the same set never hit the API again until the cache expires. |
| **Next.js fetch cache** | `fetch` calls use `{ next: { revalidate: 3600 } }` so the built-in data cache also holds responses for up to 1 hour. |

### Pack odds

| Rarity | Weight | Approximate chance per slot |
|--------|--------|------------------------------|
| Common | 78 | ~78% |
| Uncommon | 17 | ~17% |
| Rare | 4 | ~4% |
| Ultra Rare | 1 | ~1% |

Each pack contains **5 cards** and is guaranteed to have **at least 1 Uncommon or higher**.

### Rarity normalisation

Raw rarity strings from the TCGdex API (e.g. `"Illustration Rare"`,
`"Special Illustration Rare"`, `"Hyper Rare"`) are normalised into four tiers:

| TCGdex raw rarity (examples) | Normalised |
|-------------------------------|------------|
| `"Common"` | `common` |
| `"Uncommon"` | `uncommon` |
| `"Rare"`, `"Rare Holo"`, `"Double Rare"`, `"Illustration Rare"`, `"Radiant Rare"`, `"Promo"` | `rare` |
| `"Ultra Rare"`, `"Special Illustration Rare"`, `"Hyper Rare"`, `"Secret"`, `"Rainbow"`, `"Full Art"`, `"Gold"`, `"Trainer Gallery"` | `ultra` |

Normalisation is case-insensitive and trims whitespace. Unknown / missing
values default to `common`.

### Supported sets

| Display Name | TCGdex Set ID | Release Year |
|--------------|---------------|--------------|
| Prismatic Evolutions | `sv8pt5` | 2025 |
| Surging Sparks | `sv8` | 2024 |
| Stellar Crown | `sv7` | 2024 |
| Twilight Masquerade | `sv6` | 2024 |
| Temporal Forces | `sv5` | 2024 |
| Paldean Fates | `sv4pt5` | 2024 |
| Paradox Rift | `sv4` | 2023 |
| Obsidian Flames | `sv3` | 2023 |
| Scarlet & Violet Base | `sv1` | 2023 |
| Crown Zenith | `swsh12pt5` | 2023 |

The canonical mapping lives in `lib/tcgdex.ts` (`POKEMON_SETS` array).

### Environment variables for TCGdex

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TCGDEX_BASE_URL` | No | `https://api.tcgdex.net` | Base URL of the TCGdex API. Override for local mocks or staging. |

The `GET /api/tcgdex/sets` endpoint resolves canonical set IDs at runtime by
querying TCGdex.  Set IDs used in all Pokémon pack-opening API calls come from
this resolved list, eliminating 404s caused by mismatched hardcoded IDs.

---

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

## Admin Panel

A full-featured admin area is available at `/admin`. It includes:

- **Dashboard** — sales overview, revenue, orders by status, top products
- **Products** — add/edit/delete products with categories, subcategories, images, attributes, featured toggle, and status
- **Categories** — manage product categories and subcategories dynamically (no hardcoding)
- **Orders** — view all orders, update status, issue refunds/cancellations
- **Customers** — view accounts, order history, addresses, ban/flag users, support notes, admin notes, total spend
- **Payments** — transaction history, payment status, fraud detection flags
- **Shipping** — shipping zones & rates configuration
- **Discounts** — coupon codes, percentage/fixed discounts
- **Content** — homepage banners, blog posts, static pages
- **Roles & Admins** — multiple admin accounts with role-based access
- **Audit Logs** — activity log (who did what)
- **Settings** — store info, payment config, email templates

### Product Categories

Three top-level categories are seeded by the migration: **TCG**, **Blind Boxes**, and **Mystery Crates**. Admins can add more categories and subcategories without code changes via `/admin/categories`.

### Product API — Creating a Product

**`POST /api/admin/products`** — requires `admin_token` cookie with `products:write` permission.

#### Required fields

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` | Product display name |
| `slug` | `string` | URL-safe unique identifier |
| `price_cents` | `number` | Price in cents, must be > 0 |

#### Optional fields

| Field | Type | Notes |
|-------|------|-------|
| `tagline` | `string` | Short marketing line |
| `description` | `string` | Full product description |
| `category_id` | `number` | FK to `product_categories.id` |
| `subcategory_id` | `number` | FK to `product_subcategories.id`; must belong to `category_id` |
| `category` | `string` | Legacy category slug (optional, for backwards compat) |
| `images` | `string[]` | Array of image URLs |
| `attributes` | `object` | Key/value pairs stored as JSONB, e.g. `{ "brand": "Pokémon", "type": "Booster Box" }` |
| `featured` | `boolean` | Show on featured section (default: `false`) |
| `status` | `"active" \| "draft" \| "inactive"` | (default: `"active"`) |
| `in_stock` | `boolean` | (default: `true`) |
| `stock_qty` | `number` | Must be >= 0 (default: `0`) |
| `compare_at_price_cents` | `number` | Original/crossed-out price in cents |

#### Example request payload

```json
{
  "name": "Pokémon Scarlet & Violet Booster Box",
  "slug": "pokemon-sv-booster-box",
  "tagline": "36 booster packs from the latest set",
  "description": "Full booster box containing 36 packs from the Scarlet & Violet base set.",
  "price_cents": 14999,
  "compare_at_price_cents": 17999,
  "category_id": 1,
  "subcategory_id": 2,
  "images": [
    "https://example.com/images/sv-booster-box-front.jpg",
    "https://example.com/images/sv-booster-box-back.jpg"
  ],
  "attributes": {
    "brand": "Pokémon",
    "type": "Booster Box",
    "set": "Scarlet & Violet",
    "packs_per_box": "36"
  },
  "featured": true,
  "status": "active",
  "in_stock": true,
  "stock_qty": 12
}
```

#### Example cURL

```bash
curl -X POST https://your-domain.vercel.app/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=<your-admin-jwt>" \
  -d '{
    "name": "Pokémon Scarlet & Violet Booster Box",
    "slug": "pokemon-sv-booster-box",
    "price_cents": 14999,
    "category_id": 1,
    "images": ["https://example.com/sv-box.jpg"],
    "attributes": { "brand": "Pokémon", "type": "Booster Box" },
    "featured": true,
    "status": "active",
    "stock_qty": 12
  }'
```

### Category & Subcategory API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/product-categories` | GET | List all categories |
| `/api/admin/product-categories` | POST | Create a category (`name`, `slug`, `description?`) |
| `/api/admin/product-categories/[id]/subcategories` | GET | List subcategories for a category |
| `/api/admin/product-categories/[id]/subcategories` | POST | Create a subcategory (`name`, `slug`, `description?`) |

### Default Admin Credentials

```
Email:    admin@example.com   (set via ADMIN_SEED_EMAIL env var)
Password: ChangeMe123!        (set via ADMIN_SEED_PASSWORD env var)
```

**⚠️ Change these credentials immediately after your first login.**

## Customer Authentication

Customers can create accounts, log in, and manage their data via the account portal at `/account`.

### Flows

| Route | Description |
|-------|-------------|
| `/account/signup` | Create a new customer account |
| `/account/login` | Sign in with email + password |
| `/account/forgot-password` | Request a password reset email |
| `/account/reset-password?token=...` | Set a new password using a reset token |

- Passwords are hashed with **bcrypt (cost 12)**
- Sessions use **JWT** stored in a `customer_token` httpOnly cookie (30-day expiry)
- Email verification token is generated on signup and confirmed via `/api/auth/verify-email?token=...`
- Password reset tokens expire after **1 hour**
- Banned customers cannot log in

## Customer Account Features

Once logged in, customers can access their account at `/account`:

| Route | Description |
|-------|-------------|
| `/account` | Dashboard with links to all sections |
| `/account/profile` | Edit name, phone; change password |
| `/account/addresses` | Manage shipping/billing addresses (CRUD) |
| `/account/orders` | Order history with pagination |
| `/account/orders/[id]` | Order detail: items, status history, shipments |
| `/account/orders/[id]/invoice` | Inline HTML invoice download |
| `/account/wishlist` | Saved items; add to cart from wishlist |
| `/account/cart` | Server-side cart: update quantity, remove, checkout |

### REST API

All account API routes are under `/api/account/` and require the `customer_token` cookie.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/signup` | POST | Register |
| `/api/auth/login` | POST | Login |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/me` | GET | Current user info |
| `/api/auth/verify-email` | GET | Confirm email via token |
| `/api/auth/request-reset` | POST | Send password reset email |
| `/api/auth/reset-password` | POST | Set new password from token |
| `/api/account/profile` | GET, PUT | View/edit profile & password |
| `/api/account/addresses` | GET, POST | List/create addresses |
| `/api/account/addresses/[id]` | PUT, DELETE | Update/delete address |
| `/api/account/orders` | GET | Paginated order list |
| `/api/account/orders/[id]` | GET | Order detail |
| `/api/account/orders/[id]/invoice` | GET | HTML invoice |
| `/api/account/orders/[id]/reorder` | POST | Copy order items to cart |
| `/api/account/wishlist` | GET, POST | List/add wishlist items |
| `/api/account/wishlist/[productId]` | DELETE | Remove from wishlist |
| `/api/account/cart` | GET, POST | View/add cart items |
| `/api/account/cart/[itemId]` | PUT, DELETE | Update qty / remove item |
| `/api/account/payment-methods` | GET, POST | List/attach Stripe payment methods |
| `/api/account/payment-methods/[id]` | DELETE | Detach payment method |

## Email Configuration

Email is stubbed in development (logged to console only). To enable real delivery in production, integrate a provider in `lib/email.ts`.

### Using Resend (recommended)

```bash
npm install resend
```

In `lib/email.ts`, replace the production `sendEmail` stub:

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({ from: process.env.EMAIL_FROM!, to: opts.to, subject: opts.subject, html: opts.html });
```

### Using SMTP (Nodemailer)

```bash
npm install nodemailer @types/nodemailer
```

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` in `.env.local`.

## OAuth Extension Points

To add Google or Apple OAuth, implement `/api/auth/google` (or `/api/auth/apple`) using [Auth.js (next-auth v5)](https://authjs.dev/):

```bash
npm install next-auth
```

Configure a provider in `auth.ts` and call `signCustomerToken` after a successful OAuth callback to issue the same `customer_token` cookie used by the rest of the account system.

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your values (see `.env.example` for all options):
```
# Database (Supabase Postgres)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# TCGdex (optional — see below)
# TCGDEX_BASE_URL=https://api.tcgdex.net

# Admin auth (change in production!)
ADMIN_JWT_SECRET=change-me-to-a-long-random-string-at-least-32-chars
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=ChangeMe123!

# Customer auth
CUSTOMER_JWT_SECRET=change-me-customer-jwt-secret-at-least-32-chars

# Email (optional — needed for password reset / verification emails)
EMAIL_FROM=noreply@noir-crates.com
```

### 3. Run the database migration
This creates all tables and seeds the initial super-admin account:
```bash
npm run db:migrate
```
Default credentials (override with env vars):
- Email: `admin@example.com` (`ADMIN_SEED_EMAIL`)
- Password: `ChangeMe123!` (`ADMIN_SEED_PASSWORD`)

> **⚠️ Change the default password immediately after first login.**

### 4. Run dev server
```bash
npm run dev
```

Open http://localhost:3000. The admin panel is at http://localhost:3000/admin.

### 5. Database
The app uses **PostgreSQL** via [Supabase](https://supabase.com). All tables are created by the
migration script (`npm run db:migrate`). The script is idempotent — safe to re-run.

To reset: delete all rows from `admin_users` in your Supabase dashboard, then re-run
`npm run db:migrate`.

## Stripe Configuration
- Use **test mode** keys during development (prefix `pk_test_` and `sk_test_`)
- In test mode, use Stripe test card `4242 4242 4242 4242` (any future expiry, any CVC)
- For production, switch to live keys and update `NEXT_PUBLIC_BASE_URL` to your domain

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the repo in https://vercel.com
3. Add the following environment variables in **Vercel Project Settings → Environment Variables**.
   Set the **Build** scope on `DATABASE_URL`, `ADMIN_SEED_EMAIL`, and `ADMIN_SEED_PASSWORD` so the
   migration can run at build time. Set the **Production** scope on the remaining runtime secrets.

   | Variable | Scope | Example value |
   |---|---|---|
   | `DATABASE_URL` | Build + Production | `postgresql://postgres:...@db....supabase.co:5432/postgres` |
   | `ADMIN_SEED_EMAIL` | Build | `admin@yourdomain.com` |
   | `ADMIN_SEED_PASSWORD` | Build | `YourSecurePassword123!` |
   | `ADMIN_JWT_SECRET` | Production | _(32+ random chars)_ |
   | `CUSTOMER_JWT_SECRET` | Production | _(32+ random chars)_ |
   | `STRIPE_SECRET_KEY` | Production | `sk_live_...` |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production | `pk_live_...` |
   | `NEXT_PUBLIC_BASE_URL` | Production | `https://your-domain.vercel.app` |

4. Deploy. The `vercel.json` build command (`npm run db:migrate && next build`) automatically
   runs the migration before building. The migration is idempotent — safe on every deploy.

## Project Structure
```
app/
  layout.tsx              # Root layout with CartProvider, Navbar, Footer
  page.tsx                # Home page with hero + product grid
  page.module.css
  globals.css             # Design tokens + base styles
  products/[slug]/        # Dynamic product detail pages
  account/                # Customer account portal (login, signup, dashboard, etc.)
  api/checkout/           # Stripe Checkout session API route
  api/webhooks/stripe/    # Stripe webhook handler (order/payment creation)
  api/auth/               # Customer auth API (signup, login, logout, verify, reset)
  api/account/            # Customer account API (profile, addresses, orders, cart, wishlist)
  api/admin/              # Admin REST API (auth, products, orders, customers, etc.)
  admin/                  # Admin UI pages (login, dashboard, products, orders, etc.)
  success/                # Order success page
  cancel/                 # Checkout cancelled page
  about/                  # About page
  faq/                    # FAQ page
components/
  Navbar.tsx              # Sticky navbar with cart icon + account link
  CartDrawer.tsx          # Slide-in cart drawer
  ProductCard.tsx         # Product grid card
  AddToCartButton.tsx     # Add to cart button (client component)
  Logo.tsx                # Brand logo SVG component
context/
  CartContext.tsx         # Client-side cart state
lib/
  products.ts             # Product data and types
  env.ts                  # Environment variable helpers
  db.ts                   # PostgreSQL client (postgres.js) + query helpers
  auth.ts                 # Admin JWT utilities (jose)
  admin-guard.ts          # Admin route protection middleware
  customer-auth.ts        # Customer JWT utilities
  customer-guard.ts       # Customer route protection middleware
  email.ts                # Email notification stubs
public/
  images/                 # Product placeholder SVG images
```
