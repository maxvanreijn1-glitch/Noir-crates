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
  category: string;
  inStock: boolean;
  createdAt: string; // ISO date string for "newest" sort
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
    category: "Mystery Box",
    inStock: true,
    createdAt: "2025-01-20",
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
    category: "Mystery Box",
    inStock: true,
    createdAt: "2025-01-20",
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
    category: "Premium",
    inStock: true,
    createdAt: "2025-01-20",
  },
  {
    id: "labubu-forest",
    slug: "labubu-forest",
    name: "Forest Series Vol.1",
    tagline: "Tiny woodland creatures, infinite charm.",
    description:
      "Each blind box in the Forest Series contains one of twelve woodland-themed collectible figures. Soft palettes, intricate detail, and one hidden chase variant make every unboxing a delight.",
    price: 2299,
    priceDisplay: "$22.99",
    image: "/images/studio.svg",
    contents: [
      "1 mystery forest figure (1 of 12 designs)",
      "1 secret chase variant possible",
      "Collector card",
    ],
    badge: "New",
    category: "Series",
    inStock: true,
    createdAt: "2025-01-15",
  },
  {
    id: "neon-pop",
    slug: "neon-pop",
    name: "Neon Pop Vol.2",
    tagline: "Bold colour, bold surprises.",
    description:
      "The second volume of our Neon Pop series brings ten vibrant characters inspired by midnight city lights. Glow-in-the-dark variants are hidden throughout the run.",
    price: 1999,
    priceDisplay: "$19.99",
    image: "/images/mini.svg",
    contents: [
      "1 mystery neon figure (1 of 10 designs)",
      "Glow-in-the-dark variant possible",
      "Collector card",
    ],
    category: "Series",
    inStock: true,
    createdAt: "2025-01-10",
  },
  {
    id: "dark-matter",
    slug: "dark-matter",
    name: "Dark Matter Vol.1",
    tagline: "Limited. Cosmic. Unmissable.",
    description:
      "A limited-edition run of nine deep-space themed figures with metallic finishes. Once this batch sells out, it won't return. Includes one exclusive ultra-rare holographic variant.",
    price: 4499,
    priceDisplay: "$44.99",
    image: "/images/midnight.svg",
    contents: [
      "1 mystery cosmic figure (1 of 9 designs)",
      "Metallic finish on all variants",
      "1 holographic ultra-rare possible",
      "Premium collector card",
    ],
    badge: "Limited",
    category: "Limited Edition",
    inStock: true,
    createdAt: "2024-12-20",
  },
  {
    id: "crystal-dream",
    slug: "crystal-dream",
    name: "Crystal Dream",
    tagline: "Translucent wonder in every box.",
    description:
      "Eight delicate crystal-clear figures, each hand-cast in tinted resin. A meditative unboxing experience — slow, tactile, and deeply satisfying.",
    price: 2799,
    priceDisplay: "$27.99",
    image: "/images/mini.svg",
    contents: [
      "1 mystery crystal figure (1 of 8 designs)",
      "Hand-cast tinted resin",
      "Collector card",
      "Branded tissue wrap",
    ],
    category: "Mystery Box",
    inStock: true,
    createdAt: "2024-12-15",
  },
  {
    id: "sakura-bloom",
    slug: "sakura-bloom",
    name: "Sakura Bloom",
    tagline: "Spring in every box — while supplies last.",
    description:
      "Inspired by cherry-blossom season, the Sakura Bloom series features soft pinks, whites, and blush figures with petal-shaped bases. This run has sold out — join the waitlist for the next drop.",
    price: 2499,
    priceDisplay: "$24.99",
    image: "/images/studio.svg",
    contents: [
      "1 mystery sakura figure (1 of 8 designs)",
      "Petal-shaped base included",
      "Collector card",
    ],
    category: "Series",
    inStock: false,
    createdAt: "2024-12-01",
  },
  {
    id: "stellar-night",
    slug: "stellar-night",
    name: "Stellar Night",
    tagline: "Premium figures for the dedicated collector.",
    description:
      "Our premium Stellar Night collection features larger, more detailed figures with hand-painted accents. Six designs, each in a gift-grade matte box. A collector's showcase piece.",
    price: 3299,
    priceDisplay: "$32.99",
    image: "/images/midnight.svg",
    contents: [
      "1 premium stellar figure (1 of 6 designs)",
      "Hand-painted accents",
      "Matte gift box",
      "Certificate of design",
    ],
    badge: "Premium",
    category: "Premium",
    inStock: true,
    createdAt: "2024-11-20",
  },
  {
    id: "mossy-garden",
    slug: "mossy-garden",
    name: "Mossy Garden",
    tagline: "Quiet, earthy, and full of life.",
    description:
      "Ten peaceful garden-themed figures in muted greens and terracottas. Perfect as desk companions or shelf art. The Mossy Garden series pairs beautifully with our Mini Crate.",
    price: 1799,
    priceDisplay: "$17.99",
    image: "/images/mini.svg",
    contents: [
      "1 mystery garden figure (1 of 10 designs)",
      "Collector card",
      "Branded tissue wrap",
    ],
    category: "Mystery Box",
    inStock: true,
    createdAt: "2024-11-10",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
