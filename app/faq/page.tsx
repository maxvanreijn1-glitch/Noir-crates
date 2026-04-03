import styles from "./page.module.css";

export const metadata = {
  title: "FAQ — Noir Crates",
};

const faqs = [
  {
    q: "What's inside a mystery crate?",
    a: "Each crate contains carefully curated collectible figures from premium toy and art series. The specific contents are always a surprise — that's the magic! Check each crate's page for a general breakdown of what to expect.",
  },
  {
    q: "Do I get to choose which figures I receive?",
    a: "No — that's intentional. Noir Crates is designed as a discovery experience. However, we guarantee quality and rarity tiers as listed for each crate.",
  },
  {
    q: "How long does shipping take?",
    a: "Most orders ship within 2–3 business days. Delivery typically takes 5–8 business days within the US. International shipping may take 10–20 business days.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes, we ship to most countries worldwide. International shipping rates will be calculated at checkout.",
  },
  {
    q: "What if I receive a damaged item?",
    a: "We take great care in packaging, but if anything arrives damaged, please contact us within 7 days of delivery with photos and we will make it right.",
  },
  {
    q: "Can I return or exchange my crate?",
    a: "Because our products are mystery boxes, we are unable to accept returns based on specific figure contents. However, if there's a quality issue, please reach out and we'll help.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards through our secure Stripe payment processing. We do not store any card details.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order ships, you'll receive a confirmation email with tracking information.",
  },
];

export default function FAQPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Questions & answers</p>
          <h1>Frequently asked</h1>
        </div>
        <div className={styles.list}>
          {faqs.map((faq, i) => (
            <div key={i} className={styles.item}>
              <h2 className={styles.question}>{faq.q}</h2>
              <p className={styles.answer}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
