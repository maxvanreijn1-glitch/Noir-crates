import Link from "next/link";
import styles from "./ShopHeroBanner.module.css";

interface ShopHeroBannerProps {
  title: string;
  subtitle: string;
  accentColor?: string;
}

export default function ShopHeroBanner({
  title,
  subtitle,
  accentColor,
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
          <Link href="?filter=new" className={styles.btnPrimary}>
            Shop New Arrivals
          </Link>
          <Link href="?filter=sale" className={styles.btnSecondary}>
            View Sale
          </Link>
        </div>
      </div>
    </section>
  );
}
