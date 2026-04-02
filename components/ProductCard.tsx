import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className={styles.card}>
      {product.badge && (
        <span className={styles.badge}>{product.badge}</span>
      )}
      <Link href={`/products/${product.slug}`} className={styles.imageLink}>
        <div className={styles.imageWrap}>
          <Image
            src={product.image}
            alt={product.name}
            width={260}
            height={260}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
      </Link>
      <div className={styles.body}>
        <Link href={`/products/${product.slug}`}>
          <h2 className={styles.name}>{product.name}</h2>
        </Link>
        <p className={styles.tagline}>{product.tagline}</p>
        <div className={styles.footer}>
          <span className={styles.price}>{product.priceDisplay}</span>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
