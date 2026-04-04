"use client";

import Image from "next/image";
import Link from "next/link";
import type { NormalizedProduct, ProductBadge } from "@/lib/shopTypes";
import AddToCartButton from "@/components/AddToCartButton";
import styles from "./ShopProductCard.module.css";

interface ShopProductCardProps {
  product: NormalizedProduct;
  onAddToCart?: (p: NormalizedProduct) => void;
}

function getBadgeClass(badge: ProductBadge): string {
  if (badge === "NEW") return styles.badgeNew;
  if (badge === "HOT") return styles.badgeHot;
  if (badge === "LIMITED") return styles.badgeLimited;
  if (badge === "PREMIUM") return styles.badgePremium;
  return "";
}

export default function ShopProductCard({
  product,
}: ShopProductCardProps) {
  const isSoldOut = product.stockStatus === "sold_out";

  return (
    <article className={`${styles.card} ${isSoldOut ? styles.cardSoldOut : ""}`}>
      {product.shopBadge && (
        <span
          className={`${styles.badge} ${getBadgeClass(product.shopBadge)}`}
          aria-label={`Badge: ${product.shopBadge}`}
        >
          {product.shopBadge}
        </span>
      )}

      <Link href={`/products/${product.slug}`} className={styles.imageLink}>
        <div className={styles.imageWrap}>
          <Image
            src={product.image}
            alt={product.name}
            width={260}
            height={260}
            style={{ objectFit: "contain" }}
          />
          {isSoldOut && (
            <div className={styles.soldOutOverlay} aria-hidden="true">
              <span>Sold Out</span>
            </div>
          )}
          <div className={styles.quickViewOverlay} aria-hidden="true">
            <span className={styles.quickViewBtn}>Quick View</span>
          </div>
        </div>
      </Link>

      <div className={styles.body}>
        <Link href={`/products/${product.slug}`} className={styles.nameLink}>
          <h2 className={styles.name}>{product.name}</h2>
        </Link>
        {product.tagline && (
          <p className={styles.tagline}>{product.tagline}</p>
        )}
        <div className={styles.footer}>
          <span className={styles.price}>{product.priceDisplay}</span>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
