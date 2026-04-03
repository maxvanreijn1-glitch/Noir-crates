import styles from "./page.module.css";

export const metadata = {
  title: "About — Noir Crates",
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Our story</p>
          <h1>The art of the reveal.</h1>
          <p className={styles.lead}>
            Noir Crates was born from a simple belief: that the act of opening
            a package should feel like a moment of peace, not noise.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.textBlock}>
            <h2>Why mystery boxes?</h2>
            <p>
              We fell in love with collectible figures — the tiny worlds they
              represent, the craftsmanship, the community. But we found that
              most mystery box experiences felt rushed or overwhelming.
            </p>
            <p>
              Noir Crates is different. We slow things down. Each crate is
              curated with intention. Every figure inside has been sourced from
              premium series, and every box is wrapped with care.
            </p>
          </div>

          <div className={styles.textBlock}>
            <h2>Our philosophy</h2>
            <p>
              Calm. Curious. Collected. We believe unboxing should be a small
              ritual — a pause in the day. Light a candle. Put on some ambient
              music. Open slowly.
            </p>
            <p>
              We&apos;re inspired by the Japanese concept of <em>ma</em> — the beauty
              of empty space, of quiet anticipation. Our brand, our packaging,
              and our curation all reflect this principle.
            </p>
          </div>

          <div className={styles.values}>
            <div className={styles.value}>
              <h3>Curation</h3>
              <p>Every figure is sourced thoughtfully from premium collectible lines.</p>
            </div>
            <div className={styles.value}>
              <h3>Calm</h3>
              <p>No hype. No noise. Just beautiful things, carefully wrapped.</p>
            </div>
            <div className={styles.value}>
              <h3>Community</h3>
              <p>We&apos;re building a collector community that values quality over quantity.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
