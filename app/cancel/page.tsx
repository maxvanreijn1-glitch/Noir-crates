import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Checkout Cancelled — Noir Crates",
};

export default function CancelPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>○</div>
        <h1>No worries.</h1>
        <p>
          Your checkout was cancelled. Your crate is still waiting for you
          whenever you&apos;re ready.
        </p>
        <Link href="/" className={styles.btn}>
          Return to shop
        </Link>
      </div>
    </div>
  );
}
