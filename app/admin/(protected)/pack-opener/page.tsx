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
  session_id: string;
  customer_id: number | null;
  tcg_name: string;
  set_name: string;
  status: string;
  created_at: string;
  customer_email: string | null;
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

const ODDS_DATA: Record<string, Record<string, number>> = {
  "Pokémon": { common: 55, uncommon: 30, rare: 10, holo: 3, "ultra-rare": 2 },
  "Yu-Gi-Oh!": { common: 60, rare: 20, "super-rare": 12, "ultra-rare": 6, "secret-rare": 2 },
  "Magic: The Gathering": { common: 50, uncommon: 30, rare: 15, mythic: 5 },
  "One Piece": { common: 55, uncommon: 25, rare: 13, "super-rare": 5, "secret-rare": 2 },
  "Dragon Ball Super": { common: 55, uncommon: 25, rare: 12, "super-rare": 6, "special-rare": 2 },
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

export default function AdminPackOpenerPage() {
  const [openings, setOpenings] = useState<PackOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [shipping, setShipping] = useState<Set<number>>(new Set());

  function load(p: number) {
    setLoading(true);
    fetch(`/api/admin/pack-opener?page=${p}`)
      .then(r => r.json())
      .then((d: { data?: PackOpening[]; total?: number; pages?: number }) => {
        setOpenings(d.data ?? []);
        setTotal(d.total ?? 0);
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

  async function markShipped(openingId: number) {
    setShipping(prev => new Set(prev).add(openingId));
    try {
      await fetch("/api/admin/pack-opener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ship", openingId }),
      });
      setOpenings(prev =>
        prev.map(o => o.id === openingId ? { ...o, status: "shipped" } : o)
      );
    } finally {
      setShipping(prev => {
        const next = new Set(prev);
        next.delete(openingId);
        return next;
      });
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>🃏 Pack Opener</h1>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Total Openings</p>
          <p className={styles.statValue}>{total}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Ship Requested</p>
          <p className={styles.statValue}>{openings.filter(o => o.status === "ship_requested").length}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Shipped</p>
          <p className={styles.statValue}>{openings.filter(o => o.status === "shipped").length}</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : openings.length === 0 ? (
        <div className={styles.empty}>No pack openings yet.</div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>TCG</th>
                  <th>Set</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Cards</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {openings.map(o => (
                  <>
                    <tr key={o.id}>
                      <td className={styles.bold}>#{o.id}</td>
                      <td>
                        {o.customer_email ? (
                          <span className={styles.emailCell}>{o.customer_email}</span>
                        ) : (
                          <span className={styles.noEmail}>Guest</span>
                        )}
                      </td>
                      <td>{o.tcg_name}</td>
                      <td>{o.set_name}</td>
                      <td>{new Date(o.created_at).toLocaleDateString("en-GB")}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[STATUS_CLASS[o.status] ?? "statusDefault"]}`}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                      <td>{o.cards.length}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                          <button className={styles.expandBtn} onClick={() => toggleExpand(o.id)}>
                            {expanded.has(o.id) ? "Hide ▲" : "Cards ▼"}
                          </button>
                          {o.status === "ship_requested" && (
                            <button
                              className={styles.shipBtn}
                              onClick={() => markShipped(o.id)}
                              disabled={shipping.has(o.id)}
                            >
                              {shipping.has(o.id) ? "…" : "Mark Shipped"}
                            </button>
                          )}
                          {o.status === "shipped" && (
                            <span className={styles.shippedLabel}>✓ Shipped</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded.has(o.id) && (
                      <tr key={`${o.id}-cards`} className={styles.cardsRow}>
                        <td colSpan={8}>
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

      {/* Odds Reference */}
      <div className={styles.oddsSection}>
        <h2 className={styles.oddsSectionTitle}>Rarity Odds Reference</h2>
        <div className={styles.oddsGrid}>
          {Object.entries(ODDS_DATA).map(([tcg, odds]) => (
            <div key={tcg} className={styles.oddsCard}>
              <p className={styles.oddsCardTitle}>{tcg}</p>
              <ul className={styles.oddsList}>
                {Object.entries(odds).map(([rarity, pct]) => (
                  <li key={rarity}>
                    <span style={{ textTransform: "capitalize" }}>{rarity.replace(/-/g, " ")}</span>
                    <span>{pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className={styles.oddsNote}>Note: Odds are defined in <code>lib/tcg-data.ts</code>. DB-configurable odds editing is a future enhancement.</p>
      </div>
    </div>
  );
}
