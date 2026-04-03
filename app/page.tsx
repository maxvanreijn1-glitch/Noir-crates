import { products } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.heroSub}>Mystery · Collectibles · Calm</p>
          <h1 className={styles.heroTitle}>
            Open something<br />
            <em>beautiful</em>
          </h1>
          <p className={styles.heroBody}>
            Curated mystery boxes filled with premium collectible figures.
            <br />
            Slow down. Breathe. Discover.
          </p>
          <a href="#shop" className={styles.heroCta}>Explore the crates</a>
        </div>
      </section>

      {/* Product grid */}
      <section id="shop" className={styles.shopSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Choose your crate</h2>
          <div className={styles.grid}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className={styles.trustSection}>
        <div className="container">
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🎁</span>
              <h3>Curated Selection</h3>
              <p>Every figure is handpicked from premium collectible series worldwide.</p>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>✨</span>
              <h3>Guaranteed Rarity</h3>
              <p>Studio and Midnight crates include at least one guaranteed rare figure.</p>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🚚</span>
              <h3>Free Shipping</h3>
              <p>All orders ship free with careful, minimal packaging.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
