"use client";
import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/products";
import { useState } from "react";
import styles from "./AddToCartButton.module.css";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (!product.inStock) {
    return (
      <button className={`${styles.btn} ${styles.soldOut}`} disabled aria-disabled="true">
        Sold Out
      </button>
    );
  }

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      className={`${styles.btn} ${added ? styles.added : ""}`}
      onClick={handleAdd}
      aria-label={`Add ${product.name} to cart`}
    >
      {added ? "Added ✓" : "Add to Crate"}
    </button>
  );
}
