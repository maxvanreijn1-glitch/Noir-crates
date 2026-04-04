import seedData from "@/data/products.seed.json";

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: "TCG" | "Blind Boxes" | "Mystery Crates";
  subcategory: string;
  price: number; // pence
  priceDisplay: string;
  image: string;
  images: string[];
  stock: number;
  inStock: boolean;
  contents: string[];
  attributes: {
    brand: string;
    type: string;
    rarity: string;
  };
  badge?: string;
  badges: string[];
  featured: boolean;
  sold_this_week: number;
  createdAt: string;
  stripePrice?: string;
}

export const products: Product[] = seedData as Product[];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getProductsBySubcategory(
  category: string,
  subcategory: string
): Product[] {
  return products.filter(
    (p) => p.category === category && p.subcategory === subcategory
  );
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.subcategory === product.subcategory ||
          p.category === product.category)
    )
    .slice(0, limit);
}
