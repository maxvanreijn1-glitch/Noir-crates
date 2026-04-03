import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Mystery Crates — Noir Crates",
  description:
    "Our signature mystery crates — curated collectible boxes at three rarity tiers. Discover something beautiful.",
};

const crates = [
  {
    name: "Sakura Crate",
    tier: "Starter",
    price: "$29",
    description:
      "Three to four collectible figures from popular blind box series. A perfect first unboxing — calm, curated, and full of surprises.",
    figures: "3–4 figures",
    rarity: "Standard series",
    emoji: "🌸",
  },
  {
    name: "Studio Crate",
    tier: "Mid",
    price: "$59",
    description:
      "Five to six figures including at least one limited-edition piece. For the collector who wants a little more magic in their day.",
    figures: "5–6 figures",
    rarity: "1 limited edition guaranteed",
    emoji: "🌿",
    featured: true,
  },
  {
    name: "Midnight Crate",
    tier: "Premium",
    price: "$99",
    description:
      "Seven to nine figures including at least two rare pieces and one collector's exclusive. The full ritual.",
    figures: "7–9 figures",
    rarity: "2 rares + 1 exclusive guaranteed",
    emoji: "🌙",
  },
];

export default function MysteryCratesPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Our signature boxes</p>
          <h1>Mystery Crates</h1>
          <p className={styles.lead}>
            Three tiers. One ritual. Each crate is curated with intention —
            figures sourced from premium collectible series, wrapped with care,
            and delivered as a moment of calm discovery.
          </p>
        </div>

        <div className={styles.grid}>
          {crates.map((crate) => (
            <div
              key={crate.name}
              className={`${styles.card} ${crate.featured ? styles.featured : ""}`}
            >
              {crate.featured && (
                <span className={styles.featuredBadge}>Most popular</span>
              )}
              <span className={styles.emoji}>{crate.emoji}</span>
              <p className={styles.tier}>{crate.tier}</p>
              <h2 className={styles.crateName}>{crate.name}</h2>
              <p className={styles.price}>{crate.price}</p>
              <p className={styles.description}>{crate.description}</p>
              <ul className={styles.details}>
                <li>{crate.figures}</li>
                <li>{crate.rarity}</li>
                <li>Free shipping</li>
              </ul>
              <Link href="/#shop" className={styles.cta}>
                Add to Crate
              </Link>
            </div>
          ))}
        </div>

        <div className={styles.note}>
          <p>
            All mystery crates ship within 2–3 business days. Contents are
            always a surprise —{" "}
            <Link href="/faq" className={styles.noteLink}>
              read our FAQ
            </Link>{" "}
            for more details.
          </p>
        </div>
      </div>
    </div>
  );
}
