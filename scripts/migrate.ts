#!/usr/bin/env node
/**
 * Database migration script for Noir Crates.
 * Creates all required tables in Supabase Postgres and seeds the super-admin user.
 *
 * Usage:
 *   DATABASE_URL=<your-supabase-connection-string> npx tsx scripts/migrate.ts
 *
 * Or with package.json script:
 *   npm run db:migrate
 */

import postgres from "postgres";
import bcrypt from "bcryptjs";
import { config as dotenvConfig } from "dotenv";

// Load .env.local first (Next.js convention), then .env as a fallback.
// Variables already in process.env (e.g. from Vercel) are never overwritten.
dotenvConfig({ path: ".env.local" });
dotenvConfig({ path: ".env" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌  DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const sql = postgres(url, {
  ssl: url.includes("localhost") ? false : "require",
  max: 1, // intentionally limited to 1 for the migration script (short-lived process)
});

async function migrate() {
  console.log("🚀 Running Noir Crates database migration...\n");

  await sql`
    CREATE TABLE IF NOT EXISTS admin_roles (
      id          SERIAL PRIMARY KEY,
      name        TEXT    NOT NULL UNIQUE,
      permissions TEXT    NOT NULL DEFAULT '[]',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id            SERIAL PRIMARY KEY,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      name          TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'admin',
      is_active     BOOLEAN NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id            SERIAL PRIMARY KEY,
      admin_id      INTEGER,
      action        TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id   TEXT,
      details       TEXT NOT NULL DEFAULT '{}',
      ip_address    TEXT NOT NULL DEFAULT '',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id          SERIAL PRIMARY KEY,
      slug        TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      description TEXT,
      parent_id   INTEGER,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id                       SERIAL PRIMARY KEY,
      slug                     TEXT    NOT NULL UNIQUE,
      name                     TEXT    NOT NULL,
      tagline                  TEXT,
      description              TEXT,
      price_cents              INTEGER NOT NULL DEFAULT 0,
      compare_at_price_cents   INTEGER,
      image                    TEXT,
      category                 TEXT,
      in_stock                 BOOLEAN NOT NULL DEFAULT TRUE,
      stock_qty                INTEGER NOT NULL DEFAULT 0,
      created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS product_variants (
      id                     SERIAL PRIMARY KEY,
      product_id             INTEGER NOT NULL,
      name                   TEXT    NOT NULL,
      option_type            TEXT    NOT NULL,
      option_value           TEXT    NOT NULL,
      price_adjustment_cents INTEGER NOT NULL DEFAULT 0,
      stock_qty              INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS collections (
      id          SERIAL PRIMARY KEY,
      slug        TEXT    NOT NULL UNIQUE,
      name        TEXT    NOT NULL,
      description TEXT,
      is_active   BOOLEAN NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS collection_products (
      collection_id INTEGER NOT NULL,
      product_id    INTEGER NOT NULL,
      PRIMARY KEY (collection_id, product_id),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id)    REFERENCES products(id)    ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id                  SERIAL PRIMARY KEY,
      email               TEXT    NOT NULL UNIQUE,
      name                TEXT,
      phone               TEXT,
      password_hash       TEXT,
      email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
      email_verify_token  TEXT,
      reset_token         TEXT,
      reset_token_expires TIMESTAMPTZ,
      is_banned           BOOLEAN NOT NULL DEFAULT FALSE,
      ban_reason          TEXT,
      stripe_customer_id  TEXT,
      admin_notes         TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS customer_addresses (
      id          SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      type        TEXT    NOT NULL DEFAULT 'shipping',
      name        TEXT,
      line1       TEXT    NOT NULL,
      line2       TEXT,
      city        TEXT    NOT NULL,
      state       TEXT,
      postal_code TEXT    NOT NULL,
      country     TEXT    NOT NULL DEFAULT 'US',
      is_default  BOOLEAN NOT NULL DEFAULT FALSE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS customer_notes (
      id          SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      admin_id    INTEGER,
      note        TEXT    NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (admin_id)    REFERENCES admin_users(id) ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id                     SERIAL PRIMARY KEY,
      order_number           TEXT    NOT NULL UNIQUE,
      customer_id            INTEGER,
      status                 TEXT    NOT NULL DEFAULT 'pending',
      total_cents            INTEGER NOT NULL DEFAULT 0,
      subtotal_cents         INTEGER NOT NULL DEFAULT 0,
      tax_cents              INTEGER NOT NULL DEFAULT 0,
      shipping_cents         INTEGER NOT NULL DEFAULT 0,
      discount_cents         INTEGER NOT NULL DEFAULT 0,
      currency               TEXT    NOT NULL DEFAULT 'usd',
      notes                  TEXT,
      stripe_session_id      TEXT,
      stripe_payment_intent  TEXT,
      created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id               SERIAL PRIMARY KEY,
      order_id         INTEGER NOT NULL,
      product_id       INTEGER,
      product_name     TEXT    NOT NULL,
      quantity         INTEGER NOT NULL DEFAULT 1,
      unit_price_cents INTEGER NOT NULL DEFAULT 0,
      variant_id       INTEGER,
      FOREIGN KEY (order_id)   REFERENCES orders(id)           ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)         ON DELETE SET NULL,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id         SERIAL PRIMARY KEY,
      order_id   INTEGER NOT NULL,
      status     TEXT    NOT NULL,
      note       TEXT,
      admin_id   INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (order_id) REFERENCES orders(id)      ON DELETE CASCADE,
      FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id                     SERIAL PRIMARY KEY,
      order_id               INTEGER,
      stripe_payment_intent  TEXT,
      stripe_charge_id       TEXT,
      paypal_order_id        TEXT,
      amount_cents           INTEGER NOT NULL DEFAULT 0,
      currency               TEXT    NOT NULL DEFAULT 'usd',
      status                 TEXT    NOT NULL DEFAULT 'pending',
      provider               TEXT    NOT NULL DEFAULT 'stripe',
      fraud_flag             BOOLEAN NOT NULL DEFAULT FALSE,
      fraud_reason           TEXT,
      created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shipping_zones (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      countries  TEXT NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shipping_rates (
      id                  SERIAL PRIMARY KEY,
      zone_id             INTEGER NOT NULL,
      name                TEXT    NOT NULL,
      min_weight_g        INTEGER NOT NULL DEFAULT 0,
      max_weight_g        INTEGER,
      price_cents         INTEGER NOT NULL DEFAULT 0,
      estimated_days_min  INTEGER NOT NULL DEFAULT 1,
      estimated_days_max  INTEGER NOT NULL DEFAULT 7,
      FOREIGN KEY (zone_id) REFERENCES shipping_zones(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shipments (
      id                  SERIAL PRIMARY KEY,
      order_id            INTEGER NOT NULL,
      carrier             TEXT,
      tracking_number     TEXT,
      status              TEXT    NOT NULL DEFAULT 'pending',
      shipped_at          TIMESTAMPTZ,
      delivered_at        TIMESTAMPTZ,
      estimated_delivery  TIMESTAMPTZ,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS discounts (
      id               SERIAL PRIMARY KEY,
      code             TEXT    NOT NULL UNIQUE,
      type             TEXT    NOT NULL DEFAULT 'percentage',
      value            REAL    NOT NULL DEFAULT 0,
      min_order_cents  INTEGER NOT NULL DEFAULT 0,
      max_uses         INTEGER,
      current_uses     INTEGER NOT NULL DEFAULT 0,
      is_active        BOOLEAN NOT NULL DEFAULT TRUE,
      starts_at        TIMESTAMPTZ,
      expires_at       TIMESTAMPTZ,
      description      TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS discount_usage (
      id           SERIAL PRIMARY KEY,
      discount_id  INTEGER NOT NULL,
      order_id     INTEGER,
      customer_id  INTEGER,
      used_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id)    REFERENCES orders(id)    ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cms_banners (
      id         SERIAL PRIMARY KEY,
      title      TEXT    NOT NULL,
      subtitle   TEXT,
      image_url  TEXT,
      link_url   TEXT,
      is_active  BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id               SERIAL PRIMARY KEY,
      slug             TEXT    NOT NULL UNIQUE,
      title            TEXT    NOT NULL,
      content          TEXT,
      is_published     BOOLEAN NOT NULL DEFAULT FALSE,
      meta_description TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cms_blog_posts (
      id           SERIAL PRIMARY KEY,
      slug         TEXT    NOT NULL UNIQUE,
      title        TEXT    NOT NULL,
      content      TEXT,
      excerpt      TEXT,
      image_url    TEXT,
      is_published BOOLEAN NOT NULL DEFAULT FALSE,
      author_id    INTEGER,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (author_id) REFERENCES admin_users(id) ON DELETE SET NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id         SERIAL PRIMARY KEY,
      key        TEXT NOT NULL UNIQUE,
      value      TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS carts (
      id          SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL UNIQUE,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cart_items (
      id           SERIAL PRIMARY KEY,
      cart_id      INTEGER NOT NULL,
      product_id   TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price_cents  INTEGER NOT NULL DEFAULT 0,
      quantity     INTEGER NOT NULL DEFAULT 1,
      image        TEXT,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      UNIQUE(cart_id, product_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS wishlists (
      id          SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL UNIQUE,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id           SERIAL PRIMARY KEY,
      wishlist_id  INTEGER NOT NULL,
      product_id   TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price_cents  INTEGER NOT NULL DEFAULT 0,
      image        TEXT,
      added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
      UNIQUE(wishlist_id, product_id)
    )
  `;

  console.log("✅ Tables created.\n");

  // Default settings
  const defaultSettings: [string, string][] = [
    ["store_name", "Noir Crates"],
    ["store_email", "hello@noir-crates.com"],
    ["currency", "usd"],
    ["tax_rate", "0.08"],
    ["free_shipping_threshold_cents", "5000"],
    ["maintenance_mode", "false"],
  ];

  for (const [key, value] of defaultSettings) {
    await sql`INSERT INTO settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO NOTHING`;
  }
  console.log("✅ Default settings seeded.\n");

  // Roles
  const allPermissions = JSON.stringify([
    "products:read", "products:write", "products:delete",
    "orders:read", "orders:write",
    "customers:read", "customers:write",
    "discounts:read", "discounts:write",
    "cms:read", "cms:write",
    "settings:read", "settings:write",
    "admins:read", "admins:write",
    "reports:read",
    "shipping:read", "shipping:write",
    "payments:read",
  ]);

  await sql`INSERT INTO admin_roles (name, permissions) VALUES ('super_admin', ${allPermissions}) ON CONFLICT (name) DO NOTHING`;
  await sql`INSERT INTO admin_roles (name, permissions) VALUES ('admin', ${JSON.stringify([
    "products:read", "products:write",
    "orders:read", "orders:write",
    "customers:read",
    "discounts:read",
    "cms:read", "cms:write",
    "reports:read",
    "shipping:read",
  ])}) ON CONFLICT (name) DO NOTHING`;
  console.log("✅ Default roles seeded.\n");

  // Seed super-admin user
  const seedEmail = process.env.ADMIN_SEED_EMAIL ?? "admin@example.com";
  const seedPassword = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";

  if (!process.env.ADMIN_SEED_PASSWORD && process.env.NODE_ENV === "production") {
    console.warn(
      "⚠️  WARNING: ADMIN_SEED_PASSWORD is not set. " +
      "The default password 'ChangeMe123!' is being used — change it immediately."
    );
  }

  const existing = await sql`SELECT id FROM admin_users WHERE email = ${seedEmail}`;
  if (existing.length === 0) {
    const hash = bcrypt.hashSync(seedPassword, 12);
    await sql`
      INSERT INTO admin_users (email, password_hash, name, role, is_active)
      VALUES (${seedEmail}, ${hash}, 'Super Admin', 'super_admin', TRUE)
    `;
    console.log(`✅ Super-admin seeded: ${seedEmail}\n`);
  } else {
    console.log(`ℹ️  Super-admin already exists: ${seedEmail}\n`);
  }

  console.log("🎉 Migration complete!\n");
  await sql.end();
}

migrate().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
