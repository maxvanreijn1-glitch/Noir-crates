import type { Product } from "@/lib/products";

export type ShopCategory = "Blind Boxes" | "TCG" | "Mystery Crates";

export type StockStatus = "in_stock" | "sold_out" | "preorder";

export type ProductBadge = "NEW" | "HOT" | "LIMITED" | "PREMIUM" | null;

export type SortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "newest"
  | "popularity";

export interface FiltersState {
  sort: SortOption;
  brands: string[];
  tags: string[];
  availability: StockStatus[];
  subcategories: string[];
}

export interface NormalizedProduct extends Product {
  subcategories: string[];
  shopTags: string[];
  brandSeries: string;
  stockStatus: StockStatus;
  popularityScore: number;
  shopBadge: ProductBadge;
  releaseDate: string;
  priceRange: string;
}

export const BLIND_BOX_SUBCATEGORIES: string[] = [
  "New Arrivals",
  "Trending",
  "Anime / Pop Culture",
  "Cute / Kawaii",
  "Designer / Art Toys",
  "Limited Editions",
  "Under £10",
];

export const TCG_SUBCATEGORIES: string[] = [
  "Pokémon",
  "Yu-Gi-Oh!",
  "Sports Cards",
  "Mixed TCG Packs",
  "High Value / Chase Packs",
  "Budget Packs (£5–£15)",
];

export const MYSTERY_SUBCATEGORIES: string[] = [
  "Starter Crates",
  "Premium Crates",
  "Anime Crates",
  "TCG Bundles",
  "High Roller / Luxury Crates",
  "Limited Drops",
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
  { value: "name-desc", label: "Name: Z–A" },
  { value: "newest", label: "Newest" },
  { value: "popularity", label: "Most Popular" },
];
