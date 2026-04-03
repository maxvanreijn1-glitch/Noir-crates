import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "data", "noir_admin.db");

export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ---------------------------------------------------------------------------
// Table creation
// ---------------------------------------------------------------------------

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_roles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL UNIQUE,
      permissions TEXT    NOT NULL DEFAULT '[]',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      name          TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'admin',
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id      INTEGER,
      action        TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id   TEXT,
      details       TEXT NOT NULL DEFAULT '{}',
      ip_address    TEXT NOT NULL DEFAULT '',
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT    NOT NULL UNIQUE,
      name        TEXT    NOT NULL,
      description TEXT,
      parent_id   INTEGER,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id                       INTEGER PRIMARY KEY AUTOINCREMENT,
      slug                     TEXT    NOT NULL UNIQUE,
      name                     TEXT    NOT NULL,
      tagline                  TEXT,
      description              TEXT,
      price_cents              INTEGER NOT NULL DEFAULT 0,
      compare_at_price_cents   INTEGER,
      image                    TEXT,
      category                 TEXT,
      in_stock                 INTEGER NOT NULL DEFAULT 1,
      stock_qty                INTEGER NOT NULL DEFAULT 0,
      created_at               TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at               TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id             INTEGER NOT NULL,
      name                   TEXT    NOT NULL,
      option_type            TEXT    NOT NULL,
      option_value           TEXT    NOT NULL,
      price_adjustment_cents INTEGER NOT NULL DEFAULT 0,
      stock_qty              INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collections (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT    NOT NULL UNIQUE,
      name        TEXT    NOT NULL,
      description TEXT,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS collection_products (
      collection_id INTEGER NOT NULL,
      product_id    INTEGER NOT NULL,
      PRIMARY KEY (collection_id, product_id),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id)    REFERENCES products(id)    ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customers (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      email              TEXT    NOT NULL UNIQUE,
      name               TEXT,
      phone              TEXT,
      is_banned          INTEGER NOT NULL DEFAULT 0,
      ban_reason         TEXT,
      stripe_customer_id TEXT,
      created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customer_addresses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      type        TEXT    NOT NULL DEFAULT 'shipping',
      name        TEXT,
      line1       TEXT    NOT NULL,
      line2       TEXT,
      city        TEXT    NOT NULL,
      state       TEXT,
      postal_code TEXT    NOT NULL,
      country     TEXT    NOT NULL DEFAULT 'US',
      is_default  INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customer_notes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      admin_id    INTEGER,
      note        TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (admin_id)    REFERENCES admin_users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at             TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id         INTEGER NOT NULL,
      product_id       INTEGER,
      product_name     TEXT    NOT NULL,
      quantity         INTEGER NOT NULL DEFAULT 1,
      unit_price_cents INTEGER NOT NULL DEFAULT 0,
      variant_id       INTEGER,
      FOREIGN KEY (order_id)   REFERENCES orders(id)           ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)         ON DELETE SET NULL,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id   INTEGER NOT NULL,
      status     TEXT    NOT NULL,
      note       TEXT,
      admin_id   INTEGER,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id)     ON DELETE CASCADE,
      FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id               INTEGER,
      stripe_payment_intent  TEXT,
      stripe_charge_id       TEXT,
      paypal_order_id        TEXT,
      amount_cents           INTEGER NOT NULL DEFAULT 0,
      currency               TEXT    NOT NULL DEFAULT 'usd',
      status                 TEXT    NOT NULL DEFAULT 'pending',
      provider               TEXT    NOT NULL DEFAULT 'stripe',
      fraud_flag             INTEGER NOT NULL DEFAULT 0,
      fraud_reason           TEXT,
      created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at             TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS shipping_zones (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      countries  TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shipping_rates (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      zone_id             INTEGER NOT NULL,
      name                TEXT    NOT NULL,
      min_weight_g        INTEGER NOT NULL DEFAULT 0,
      max_weight_g        INTEGER,
      price_cents         INTEGER NOT NULL DEFAULT 0,
      estimated_days_min  INTEGER NOT NULL DEFAULT 1,
      estimated_days_max  INTEGER NOT NULL DEFAULT 7,
      FOREIGN KEY (zone_id) REFERENCES shipping_zones(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shipments (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id            INTEGER NOT NULL,
      carrier             TEXT,
      tracking_number     TEXT,
      status              TEXT    NOT NULL DEFAULT 'pending',
      shipped_at          TEXT,
      delivered_at        TEXT,
      estimated_delivery  TEXT,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS discounts (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      code             TEXT    NOT NULL UNIQUE,
      type             TEXT    NOT NULL DEFAULT 'percentage',
      value            REAL    NOT NULL DEFAULT 0,
      min_order_cents  INTEGER NOT NULL DEFAULT 0,
      max_uses         INTEGER,
      current_uses     INTEGER NOT NULL DEFAULT 0,
      is_active        INTEGER NOT NULL DEFAULT 1,
      starts_at        TEXT,
      expires_at       TEXT,
      description      TEXT,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS discount_usage (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      discount_id  INTEGER NOT NULL,
      order_id     INTEGER,
      customer_id  INTEGER,
      used_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id)    REFERENCES orders(id)    ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS cms_banners (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      subtitle   TEXT,
      image_url  TEXT,
      link_url   TEXT,
      is_active  INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cms_pages (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      slug             TEXT    NOT NULL UNIQUE,
      title            TEXT    NOT NULL,
      content          TEXT,
      is_published     INTEGER NOT NULL DEFAULT 0,
      meta_description TEXT,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cms_blog_posts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      slug         TEXT    NOT NULL UNIQUE,
      title        TEXT    NOT NULL,
      content      TEXT,
      excerpt      TEXT,
      image_url    TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      author_id    INTEGER,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (author_id) REFERENCES admin_users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      key        TEXT NOT NULL UNIQUE,
      value      TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Default settings
  const insertSetting = db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
  );
  const defaultSettings: [string, string][] = [
    ["store_name", "Noir Crates"],
    ["store_email", "hello@noir-crates.com"],
    ["currency", "usd"],
    ["tax_rate", "0.08"],
    ["free_shipping_threshold_cents", "5000"],
    ["maintenance_mode", "false"],
  ];
  for (const [key, value] of defaultSettings) {
    insertSetting.run(key, value);
  }

  // Default super-admin role
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

  db.prepare(
    `INSERT OR IGNORE INTO admin_roles (name, permissions) VALUES (?, ?)`
  ).run("super_admin", allPermissions);

  db.prepare(
    `INSERT OR IGNORE INTO admin_roles (name, permissions) VALUES (?, ?)`
  ).run("admin", JSON.stringify([
    "products:read", "products:write",
    "orders:read", "orders:write",
    "customers:read",
    "discounts:read",
    "cms:read", "cms:write",
    "reports:read",
    "shipping:read",
  ]));

  // Seeded super-admin account
  const seedEmail =
    process.env.ADMIN_SEED_EMAIL ?? "admin@example.com";
  const seedPassword =
    process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";

  if (!process.env.ADMIN_SEED_PASSWORD && process.env.NODE_ENV === "production") {
    console.warn(
      "[noir-admin] WARNING: ADMIN_SEED_PASSWORD is not set. " +
      "The default password 'ChangeMe123!' is being used — change it immediately."
    );
  }

  const existing = db
    .prepare(`SELECT id FROM admin_users WHERE email = ?`)
    .get(seedEmail);

  if (!existing) {
    // hashSync is intentional here — initDb runs once at startup (not in a request handler)
    const hash = bcrypt.hashSync(seedPassword, 12);
    db.prepare(
      `INSERT INTO admin_users (email, password_hash, name, role, is_active)
       VALUES (?, ?, ?, ?, 1)`
    ).run(seedEmail, hash, "Super Admin", "super_admin");
  }

  // Add columns to customers table if they don't exist
  const addColumnIfMissing = (table: string, col: string, def: string) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
    } catch {
      // column already exists
    }
  };
  addColumnIfMissing('customers', 'password_hash', 'TEXT');
  addColumnIfMissing('customers', 'email_verified', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('customers', 'email_verify_token', 'TEXT');
  addColumnIfMissing('customers', 'reset_token', 'TEXT');
  addColumnIfMissing('customers', 'reset_token_expires', 'TEXT');
  addColumnIfMissing('customers', 'admin_notes', 'TEXT');

  db.exec(`
    CREATE TABLE IF NOT EXISTS carts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL UNIQUE,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id      INTEGER NOT NULL,
      product_id   TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price_cents  INTEGER NOT NULL DEFAULT 0,
      quantity     INTEGER NOT NULL DEFAULT 1,
      image        TEXT,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      UNIQUE(cart_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS wishlists (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL UNIQUE,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      wishlist_id  INTEGER NOT NULL,
      product_id   TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price_cents  INTEGER NOT NULL DEFAULT 0,
      image        TEXT,
      added_at     TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
      UNIQUE(wishlist_id, product_id)
    );
  `);
}

// Run at module load time
initDb();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface AdminRole {
  id: number;
  name: string;
  permissions: string;
  created_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  pages: number;
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getAdminByEmail(email: string): AdminUser | undefined {
  return db
    .prepare(`SELECT * FROM admin_users WHERE email = ? LIMIT 1`)
    .get(email) as AdminUser | undefined;
}

export function getAdminById(id: number): AdminUser | undefined {
  return db
    .prepare(`SELECT * FROM admin_users WHERE id = ? LIMIT 1`)
    .get(id) as AdminUser | undefined;
}

export function createAuditLog(
  adminId: number,
  action: string,
  resourceType: string,
  resourceId: string | number | null,
  details: object,
  ip: string
): void {
  db.prepare(
    `INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    adminId,
    action,
    resourceType,
    resourceId !== null ? String(resourceId) : null,
    JSON.stringify(details),
    ip
  );
}

const ALLOWED_TABLES = new Set([
  "admin_users", "admin_roles", "audit_logs",
  "products", "product_variants", "categories", "collections", "collection_products",
  "orders", "order_items", "order_status_history",
  "customers", "customer_addresses", "customer_notes",
  "payments", "shipping_zones", "shipping_rates", "shipments",
  "discounts", "discount_usage",
  "cms_banners", "cms_pages", "cms_blog_posts",
  "settings",
]);

export function paginatedQuery<T>(
  table: string,
  where: string,
  params: unknown[],
  page: number,
  limit: number
): PaginatedResult<T> {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`paginatedQuery: disallowed table name "${table}"`);
  }

  const offset = (page - 1) * limit;
  const whereClause = where ? `WHERE ${where}` : "";

  const countRow = db
    .prepare(`SELECT COUNT(*) as count FROM ${table} ${whereClause}`)
    .get(...params) as { count: number };

  const total = countRow.count;
  const pages = Math.ceil(total / limit);

  const data = db
    .prepare(
      `SELECT * FROM ${table} ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as T[];

  return { data, total, pages };
}

export interface Customer {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  password_hash: string | null;
  email_verified: number;
  email_verify_token: string | null;
  reset_token: string | null;
  reset_token_expires: string | null;
  is_banned: number;
  ban_reason: string | null;
  stripe_customer_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function getCustomerByEmail(email: string): Customer | undefined {
  return db.prepare('SELECT * FROM customers WHERE email = ? LIMIT 1').get(email) as Customer | undefined;
}

export function getCustomerById(id: number): Customer | undefined {
  return db.prepare('SELECT * FROM customers WHERE id = ? LIMIT 1').get(id) as Customer | undefined;
}
