"use client";

import Image from "next/image";
import Link from "next/link";
import type { NormalizedProduct, ProductBadge } from "@/lib/shopTypes";
import styles from "./HorizontalProductRow.module.css";

interface HorizontalProductRowProps {
  title: string;
  products: NormalizedProduct[];
  onAddToCart?: (p: NormalizedProduct) => void;
}

function getBadgeClass(badge: ProductBadge): string {
  if (badge === "NEW") return styles.badgeNew;
  if (badge === "HOT") return styles.badgeHot;
  if (badge === "LIMITED") return styles.badgeLimited;
  if (badge === "PREMIUM") return styles.badgePremium;
  return "";
}

export default function HorizontalProductRow({
  title,
  products,
  onAddToCart,
}: HorizontalProductRowProps) {
  if (products.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      <div className={styles.track}>
        {products.map((p) => (
          <article key={p.id} className={styles.card}>
            <Link href={`/products/${p.slug}`} className={styles.imageLink}>
              <div className={styles.imageWrap}>
                <Image
                  src={p.image}
                  alt={p.name}
                  width={180}
                  height={180}
                  style={{ objectFit: "contain" }}
                />
                {p.shopBadge && (
                  <span
                    className={`${styles.badge} ${getBadgeClass(p.shopBadge)}`}
                  >
                    {p.shopBadge}
                  </span>
                )}
                {p.stockStatus === "sold_out" && (
                  <div className={styles.soldOutOverlay}>
                    <span>Sold Out</span>
                  </div>
                )}
              </div>
            </Link>
            <div className={styles.body}>
              <Link href={`/products/${p.slug}`} className={styles.nameLink}>
                <p className={styles.name}>{p.name}</p>
              </Link>
              <p className={styles.price}>{p.priceDisplay}</p>
              {onAddToCart && (
                <button
                  className={styles.addBtn}
                  onClick={() => onAddToCart(p)}
                  disabled={p.stockStatus === "sold_out"}
                  aria-label={`Add ${p.name} to cart`}
                >
                  {p.stockStatus === "sold_out" ? "Sold Out" : "+ Add"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
