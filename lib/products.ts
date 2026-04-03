export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number; // in cents
  priceDisplay: string;
  image: string;
  stripePrice?: string;
  contents: string[];
  badge?: string;
}

export const products: Product[] = [
  {
    id: "mini",
    slug: "mini",
    name: "Mini Crate",
    tagline: "A gentle introduction to the unknown.",
    description:
      "The Mini Crate holds one carefully curated mystery figure. Perfect for first-timers or those who savour small surprises. Each figure is sourced from premium collectible series — unwrapped slowly, one at a time.",
    price: 1499,
    priceDisplay: "$14.99",
    image: "/images/mini.svg",
    contents: ["1 mystery collectible figure", "Branded tissue wrap", "Collector card"],
    badge: "Starter",
  },
  {
    id: "studio",
    slug: "studio",
    name: "Studio Crate",
    tagline: "The standard bearer of mystery.",
    description:
      "Three figures, three moments of discovery. The Studio Crate is our most popular tier — a balanced unboxing ritual that feels complete. Expect variety, quality, and at least one rare.",
    price: 3499,
    priceDisplay: "$34.99",
    image: "/images/studio.svg",
    contents: [
      "3 mystery collectible figures",
      "1 guaranteed rare figure",
      "Branded tissue wrap",
      "2x collector cards",
      "Sticker set",
    ],
    badge: "Popular",
  },
  {
    id: "midnight",
    slug: "midnight",
    name: "Midnight Crate",
    tagline: "For those who embrace the premium unknown.",
    description:
      "Six figures. Two guaranteed rares. One ultra-rare possibility. The Midnight Crate is our most immersive experience — delivered in a matte black box with gold foil. Slow down. Breathe. Open.",
    price: 6999,
    priceDisplay: "$69.99",
    image: "/images/midnight.svg",
    contents: [
      "6 mystery collectible figures",
      "2 guaranteed rare figures",
      "1 chance at ultra-rare",
      "Matte black gift box with gold foil",
      "Premium tissue wrap",
      "4x collector cards",
      "Sticker set",
      "Exclusive Noir Crates bookmark",
    ],
    badge: "Premium",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
