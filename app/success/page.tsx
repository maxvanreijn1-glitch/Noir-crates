import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Order Confirmed — Noir Crates",
};

export default function SuccessPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>✦</div>
        <h1>Your crate is on its way.</h1>
        <p>
          Thank you for your order. We&apos;re carefully preparing your mystery
          box. You&apos;ll receive a confirmation email shortly.
        </p>
        <Link href="/" className={styles.btn}>
          Explore more crates
        </Link>
      </div>
    </div>
  );
}
