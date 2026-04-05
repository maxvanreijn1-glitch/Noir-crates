"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

interface PackCard {
  card_name: string;
  card_image: string;
  card_rarity: string;
  card_set: string;
  position: number;
}

interface PackOpening {
  id: number;
  tcg_name: string;
  set_name: string;
  status: string;
  created_at: string;
  cards: PackCard[];
}

const STATUS_CLASS: Record<string, string> = {
  opened: "statusOpened",
  ship_requested: "statusShipRequested",
  shipped: "statusShipped",
};

const STATUS_LABEL: Record<string, string> = {
  opened: "Opened",
  ship_requested: "Ship Requested",
  shipped: "Shipped",
};

function rarityChipClass(rarity: string): string {
  switch (rarity) {
    case "uncommon": return styles.rarityUncommon;
    case "rare": return styles.rarityRare;
    case "holo": return styles.rarityHolo;
    case "ultra-rare": return styles.rarityUltra;
    case "secret-rare": return styles.raritySecret;
    case "mythic": return styles.rarityMythic;
    case "super-rare": return styles.raritySuper;
    case "special-rare": return styles.raritySpecial;
    default: return styles.rarityCommon;
  }
}

export default function PackHistoryPage() {
  const [openings, setOpenings] = useState<PackOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function load(p: number) {
    setLoading(true);
    fetch(`/api/pack-opener/history?page=${p}`)
      .then(r => r.json())
      .then((d: { data?: PackOpening[]; pages?: number }) => {
        setOpenings(d.data ?? []);
        setPages(d.pages ?? 1);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(page); }, [page]);

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) return <div className={styles.loading}>Loading pack history…</div>;

  return (
    <div>
      <h1 className={styles.title}>Pack History</h1>
      {openings.length === 0 ? (
        <div className={styles.empty}>
          <p>No pack openings yet.</p>
          <a href="/pack-opener" className={styles.shopLink}>Open your first pack →</a>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>TCG</th>
                  <th>Set</th>
                  <th>Status</th>
                  <th>Cards</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {openings.map(o => (
                  <>
                    <tr key={o.id}>
                      <td className={styles.bold}>#{o.id}</td>
                      <td>{new Date(o.created_at).toLocaleDateString("en-GB")}</td>
                      <td>{o.tcg_name}</td>
                      <td>{o.set_name}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[STATUS_CLASS[o.status] ?? "statusDefault"]}`}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                      <td>{o.cards.length} cards</td>
                      <td>
                        <button
                          className={styles.expandBtn}
                          onClick={() => toggleExpand(o.id)}
                        >
                          {expanded.has(o.id) ? "Hide ▲" : "View ▼"}
                        </button>
                      </td>
                    </tr>
                    {expanded.has(o.id) && (
                      <tr key={`${o.id}-cards`} className={styles.cardsRow}>
                        <td colSpan={7}>
                          <div className={styles.cardChips}>
                            {o.cards.map((c, i) => (
                              <div key={i} className={styles.cardChip}>
                                <span className={`${styles.chipRarity} ${rarityChipClass(c.card_rarity)}`}>
                                  {c.card_rarity.replace(/-/g, " ")}
                                </span>
                                <span>{c.card_name}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className={styles.pagination}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>← Prev</button>
              <span>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
