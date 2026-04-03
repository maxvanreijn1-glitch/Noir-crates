import { products, getProductBySlug } from "@/lib/products";
import { notFound } from "next/navigation";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link";
import styles from "./page.module.css";

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} — Noir Crates`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className={styles.page}>
      <div className="container">
        <nav className={styles.breadcrumb}>
          <Link href="/">Shop</Link>
          <span>›</span>
          <span>{product.name}</span>
        </nav>

        <div className={styles.layout}>
          {/* Image */}
          <div className={styles.imageSection}>
            <div className={styles.imageWrap}>
              <Image
                src={product.image}
                alt={product.name}
                width={400}
                height={400}
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            {product.badge && (
              <div className={styles.badge}>{product.badge}</div>
            )}
          </div>

          {/* Info */}
          <div className={styles.infoSection}>
            <p className={styles.tagline}>{product.tagline}</p>
            <h1 className={styles.name}>{product.name}</h1>
            <p className={styles.price}>{product.priceDisplay}</p>
            <p className={styles.description}>{product.description}</p>

            <div className={styles.contents}>
              <h3>What&apos;s inside</h3>
              <ul>
                {product.contents.map((item) => (
                  <li key={item}>
                    <span>—</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.actions}>
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
