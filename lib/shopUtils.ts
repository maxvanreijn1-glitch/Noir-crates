import type { Product } from "@/lib/products";
import type {
  FiltersState,
  NormalizedProduct,
  ProductBadge,
  ShopCategory,
  StockStatus,
} from "@/lib/shopTypes";

/** Products created within this many days are eligible for the "new" tag */
const NEW_PRODUCT_THRESHOLD_DAYS = 60;
/** Products with sold_this_week above this value receive the "trending" tag */
const TRENDING_THRESHOLD = 5;
/** Multiplier applied to sold_this_week when computing popularity score */
const SALES_WEIGHT = 10;
/** Bonus added to popularity score for featured products */
const FEATURED_BONUS = 50;

export function formatGBP(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function getPriceRange(price: number, category: ShopCategory): string {
  if (category === "Blind Boxes") {
    if (price < 1000) return "Under £10";
    if (price < 2500) return "£10–£25";
    return "£25+";
  }
  if (category === "TCG") {
    if (price < 1500) return "Budget (£5–£15)";
    if (price < 5000) return "£15–£50";
    return "£50+";
  }
  // Mystery Crates
  if (price < 3000) return "Under £30";
  if (price < 7500) return "£30–£75";
  return "£75+";
}

function deriveSubcategories(p: Product): string[] {
  const buckets: string[] = [];

  if (p.category === "Blind Boxes") {
    if (p.subcategory === "Anime") {
      buckets.push("Anime / Pop Culture", "Trending");
    } else if (p.subcategory === "Gaming") {
      buckets.push("Designer / Art Toys");
    } else if (p.subcategory === "Collectibles") {
      buckets.push("Cute / Kawaii", "Designer / Art Toys");
    }
    if (p.price < 1000) buckets.push("Under £10");
    if (p.badges.includes("New") || p.featured) buckets.push("New Arrivals");
  } else if (p.category === "TCG") {
    if (p.subcategory === "Pokémon") {
      buckets.push("Pokémon");
    } else if (p.subcategory === "Yu-Gi-Oh") {
      buckets.push("Yu-Gi-Oh!");
    } else if (
      p.subcategory === "One Piece" ||
      p.subcategory === "Lorcana" ||
      p.subcategory === "Magic The Gathering"
    ) {
      buckets.push("Mixed TCG Packs");
    }
    if (p.price > 5000) buckets.push("High Value / Chase Packs");
    if (p.price <= 1500) buckets.push("Budget Packs (£5–£15)");
  } else if (p.category === "Mystery Crates") {
    if (p.subcategory === "Bronze Tier") {
      buckets.push("Starter Crates");
    } else if (p.subcategory === "Silver Tier") {
      buckets.push("Starter Crates", "Premium Crates");
    } else if (p.subcategory === "Gold Tier") {
      buckets.push("Premium Crates");
    } else if (p.subcategory === "Platinum Tier") {
      buckets.push("Premium Crates", "High Roller / Luxury Crates");
    } else if (p.subcategory === "Themed Crates") {
      buckets.push("Anime Crates", "TCG Bundles");
    }
    if (p.badges.includes("Limited")) buckets.push("Limited Drops");
  }

  return [...new Set(buckets)];
}

function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

function deriveShopTags(p: Product): string[] {
  const tags: string[] = [];
  const cutoff = Date.now() - daysToMs(NEW_PRODUCT_THRESHOLD_DAYS);

  if (p.badges.includes("Best Seller") || p.badges.includes("Hot")) {
    tags.push("hot");
  }
  if (
    p.badges.includes("New") ||
    (p.featured && new Date(p.createdAt).getTime() > cutoff)
  ) {
    tags.push("new");
  }
  if (p.badges.includes("Limited")) tags.push("limited");
  if (p.subcategory === "Anime") tags.push("anime");
  if (p.subcategory === "Collectibles") tags.push("kawaii");
  if (
    p.badges.includes("Premium") ||
    p.subcategory === "Gold Tier" ||
    p.subcategory === "Platinum Tier"
  ) {
    tags.push("premium");
  }
  if (p.sold_this_week > TRENDING_THRESHOLD) tags.push("trending");

  return [...new Set(tags)];
}

function deriveShopBadge(badges: string[]): ProductBadge {
  if (badges.includes("Limited")) return "LIMITED";
  if (badges.includes("New")) return "NEW";
  if (badges.includes("Best Seller") || badges.includes("Hot")) return "HOT";
  if (badges.includes("Premium")) return "PREMIUM";
  return null;
}

export function normalizeProduct(p: Product): NormalizedProduct {
  return {
    ...p,
    subcategories: deriveSubcategories(p),
    shopTags: deriveShopTags(p),
    brandSeries: p.attributes.brand,
    stockStatus: (p.inStock ? "in_stock" : "sold_out") as StockStatus,
    popularityScore: p.sold_this_week * SALES_WEIGHT + (p.featured ? FEATURED_BONUS : 0),
    shopBadge: deriveShopBadge(p.badges),
    releaseDate: p.createdAt,
    priceRange: getPriceRange(p.price, p.category as ShopCategory),
  };
}

export function normalizeProducts(ps: Product[]): NormalizedProduct[] {
  return ps.map(normalizeProduct);
}

export function filterAndSortProducts(
  products: NormalizedProduct[],
  filters: FiltersState
): NormalizedProduct[] {
  let result = products.filter((p) => {
    if (
      filters.availability.length > 0 &&
      !filters.availability.includes(p.stockStatus)
    ) {
      return false;
    }
    if (
      filters.brands.length > 0 &&
      !filters.brands.includes(p.brandSeries)
    ) {
      return false;
    }
    if (
      filters.tags.length > 0 &&
      !filters.tags.some((t) => p.shopTags.includes(t))
    ) {
      return false;
    }
    if (
      filters.subcategories.length > 0 &&
      !filters.subcategories.some((s) => p.subcategories.includes(s))
    ) {
      return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "newest":
        return (
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );
      case "popularity":
        return b.popularityScore - a.popularityScore;
      case "featured":
      default:
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.popularityScore - a.popularityScore;
    }
  });

  return result;
}

export function getAvailableBrands(products: NormalizedProduct[]): string[] {
  return [...new Set(products.map((p) => p.brandSeries))].sort();
}

export function getAvailableTags(products: NormalizedProduct[]): string[] {
  return [...new Set(products.flatMap((p) => p.shopTags))].sort();
}

export function getActiveFilterCount(filters: FiltersState): number {
  let count = 0;
  if (filters.sort !== "featured") count++;
  count += filters.brands.length;
  count += filters.tags.length;
  count += filters.availability.length;
  count += filters.subcategories.length;
  return count;
}
