import Link from "next/link";
import styles from "./ShopHeroBanner.module.css";

interface ShopHeroBannerProps {
  title: string;
  subtitle: string;
  /** Optional accent override — maps to --hero-accent CSS variable */
  accentColor?: string;
  /** Link for the primary CTA (defaults to current page) */
  newArrivalsHref?: string;
}

export default function ShopHeroBanner({
  title,
  subtitle,
  accentColor,
  newArrivalsHref = "#products",
}: ShopHeroBannerProps) {
  const style = accentColor
    ? ({ "--hero-accent": accentColor } as React.CSSProperties)
    : undefined;

  return (
    <section className={styles.banner} style={style}>
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.actions}>
          <Link href={newArrivalsHref} className={styles.btnPrimary}>
            Shop Now
          </Link>
          <Link href="/about" className={styles.btnSecondary}>
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}
