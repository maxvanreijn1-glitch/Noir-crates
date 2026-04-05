"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TCG_GAMES, type TcgGame, type TcgSet } from "@/lib/tcg-data";
import styles from "./pack-opener.module.css";

type Step = "selectingTcg" | "selectingSet" | "checkout" | "opening" | "revealed" | "error";

interface TcgCard {
  id: string;
  name: string;
  image: string;
  rarity: string;
  setName: string;
}

interface OpenResult {
  openingId: number;
  cards: TcgCard[];
  tcg: string;
  setName: string;
}

function glowClass(rarity: string): string {
  switch (rarity) {
    case "uncommon": return styles.glowBlue;
    case "rare": return styles.glowPurple;
    case "holo": return styles.glowCyan;
    case "ultra-rare":
    case "secret-rare":
    case "mythic":
    case "super-rare":
    case "special-rare":
      return styles.glowGold;
    default: return styles.glowNone;
  }
}

function rarityBadgeClass(rarity: string): string {
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

function rarityLabel(rarity: string): string {
  return rarity.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function PackOpenerClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [step, setStep] = useState<Step>("selectingTcg");
  const [selectedGame, setSelectedGame] = useState<TcgGame | null>(null);
  const [selectedSet, setSelectedSet] = useState<TcgSet | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openResult, setOpenResult] = useState<OpenResult | null>(null);
  const [packClicked, setPackClicked] = useState(false);
  const [visibleCards, setVisibleCards] = useState(0);
  const [shipStatus, setShipStatus] = useState<"idle" | "loading" | "done">("idle");
  const [shipError, setShipError] = useState<string | null>(null);

  // When session_id is present, open the pack
  const openPack = useCallback(async (sid: string) => {
    setStep("opening");
    try {
      const res = await fetch(`/api/pack-opener/open?session_id=${encodeURIComponent(sid)}`);
      const data = await res.json() as { openingId?: number; cards?: TcgCard[]; tcg?: string; setName?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to open pack");
        setStep("error");
        return;
      }
      setOpenResult({
        openingId: data.openingId!,
        cards: data.cards!,
        tcg: data.tcg!,
        setName: data.setName!,
      });
      setStep("opening");
      // Wait for pack click animation
    } catch {
      setError("Network error. Please try again.");
      setStep("error");
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      openPack(sessionId);
    }
  }, [sessionId, openPack]);

  // Stagger card reveals
  useEffect(() => {
    if (!packClicked || !openResult) return;
    setStep("revealed");
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setVisibleCards(i);
      if (i >= openResult.cards.length) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, [packClicked, openResult]);

  async function handleCheckout() {
    if (!selectedGame || !selectedSet) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pack-opener/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tcgId: selectedGame.id, setId: selectedSet.id }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Checkout failed");
        setCheckoutLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please try again.");
      setCheckoutLoading(false);
    }
  }

  async function handleShip() {
    if (!openResult) return;
    setShipStatus("loading");
    setShipError(null);
    try {
      const res = await fetch("/api/pack-opener/ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingId: openResult.openingId }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || data.error) {
        setShipError(data.error ?? "Failed to request shipping");
        setShipStatus("idle");
        return;
      }
      setShipStatus("done");
    } catch {
      setShipError("Network error");
      setShipStatus("idle");
    }
  }

  function resetAll() {
    setStep("selectingTcg");
    setSelectedGame(null);
    setSelectedSet(null);
    setError(null);
    setOpenResult(null);
    setPackClicked(false);
    setVisibleCards(0);
    setShipStatus("idle");
    setShipError(null);
    // Remove session_id from URL
    router.push("/pack-opener");
  }

  // ── Render ─────────────────────────────────────────────────────────── //

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Pack Opener</h1>
        <p className={styles.heroSub}>Select your TCG, choose a set, and crack open a virtual booster pack</p>
      </div>

      <div className={styles.container}>

        {/* Error */}
        {step === "error" && (
          <div className={styles.errorBox}>
            <p>{error}</p>
            <button className={styles.backLink} onClick={resetAll}>← Start Over</button>
          </div>
        )}

        {/* Step 1: Select TCG */}
        {step === "selectingTcg" && (
          <div>
            <p className={styles.stepLabel}>Step 1 of 3</p>
            <h2 className={styles.stepTitle}>Choose Your TCG</h2>
            <div className={styles.gameGrid}>
              {TCG_GAMES.map(game => (
                <div
                  key={game.id}
                  className={`${styles.gameCard} ${selectedGame?.id === game.id ? styles.selected : ""}`}
                >
                  <span className={styles.gameIcon}>{game.icon}</span>
                  <span className={styles.gameName}>{game.name}</span>
                  <button
                    className={styles.selectBtn}
                    onClick={() => {
                      setSelectedGame(game);
                      setStep("selectingSet");
                    }}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Set */}
        {step === "selectingSet" && selectedGame && (
          <div>
            <div className={styles.selectionHeader}>
              <p className={styles.stepLabel} style={{ margin: 0 }}>Step 2 of 3</p>
              <div className={styles.selectionBadge}>
                <span>{selectedGame.icon}</span>
                <span>{selectedGame.name}</span>
              </div>
              <button className={styles.changeBtn} onClick={() => { setStep("selectingTcg"); setSelectedGame(null); }}>
                Change
              </button>
            </div>
            <h2 className={styles.stepTitle}>Choose a Set</h2>
            <div className={styles.setGrid}>
              {selectedGame.sets.map(set => (
                <div key={set.id} className={styles.setCard}>
                  <div className={styles.setPackImage}>
                    {selectedGame.icon}
                  </div>
                  <div className={styles.setInfo}>
                    <p className={styles.setName}>{set.name}</p>
                    <p className={styles.setMeta}>
                      Released: {new Date(set.releaseDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </p>
                    <button
                      className={styles.openPackBtn}
                      onClick={() => { setSelectedSet(set); setStep("checkout"); }}
                    >
                      Open Pack — £{set.priceGBP.toFixed(2)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Checkout */}
        {step === "checkout" && selectedGame && selectedSet && (
          <div>
            <div className={styles.selectionHeader}>
              <p className={styles.stepLabel} style={{ margin: 0 }}>Step 3 of 3</p>
              <div className={styles.selectionBadge}>
                <span>{selectedGame.icon}</span>
                <span>{selectedGame.name}</span>
              </div>
              <span style={{ color: "#666688" }}>→</span>
              <div className={styles.selectionBadge}>
                <span>{selectedSet.name}</span>
              </div>
              <button className={styles.changeBtn} onClick={() => setStep("selectingSet")}>
                Change
              </button>
            </div>

            <div className={styles.checkoutBox}>
              <h2 className={styles.checkoutTitle}>Confirm Pack</h2>
              <div className={styles.checkoutSummary}>
                <div className={styles.checkoutRow}>
                  <span>TCG</span>
                  <span>{selectedGame.name}</span>
                </div>
                <div className={styles.checkoutRow}>
                  <span>Set</span>
                  <span>{selectedSet.name}</span>
                </div>
                <div className={styles.checkoutRow}>
                  <span>Total</span>
                  <span>£{selectedSet.priceGBP.toFixed(2)}</span>
                </div>
              </div>

              {error && <p style={{ color: "#ff8888", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>}

              <button
                className={styles.payBtn}
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? "Redirecting…" : "Proceed to Payment"}
              </button>
              <br />
              <button className={styles.backLink} onClick={() => setStep("selectingSet")}>
                ← Back to Set Selection
              </button>
            </div>
          </div>
        )}

        {/* Loading / Opening state (before pack clicked) */}
        {step === "opening" && !packClicked && openResult && (
          <div className={styles.packOpeningArea}>
            <p className={styles.packMeta}>
              <span className={styles.packMetaBold}>{openResult.tcg}</span> — {openResult.setName}
            </p>
            <div className={styles.packWrapper} onClick={() => setPackClicked(true)}>
              <div className={styles.packImage}>
                {TCG_GAMES.find(g => g.name === openResult.tcg)?.icon ?? "🎴"}
              </div>
            </div>
            <p className={styles.packHint}>Click to Open!</p>
          </div>
        )}

        {/* Loading pack from API */}
        {step === "opening" && !openResult && (
          <div className={styles.loadingCenter}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Verifying payment…</p>
          </div>
        )}

        {/* Card Reveal */}
        {step === "revealed" && openResult && (
          <div className={styles.revealSection}>
            <div className={styles.revealHeader}>
              <h2 className={styles.revealTitle}>Cards Revealed!</h2>
              <p className={styles.revealSub}>{openResult.tcg} — {openResult.setName}</p>
            </div>

            <div className={styles.cardGrid}>
              {openResult.cards.slice(0, visibleCards).map((card, idx) => (
                <div
                  key={`${card.id}-${idx}`}
                  className={styles.cardItem}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className={`${styles.cardInner} ${glowClass(card.rarity)}`}>
                    <img
                      src={card.image}
                      alt={card.name}
                      className={styles.cardImg}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className={styles.cardLabel}>
                      <p className={styles.cardName} title={card.name}>{card.name}</p>
                      <span className={`${styles.rarityBadge} ${rarityBadgeClass(card.rarity)}`}>
                        {rarityLabel(card.rarity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {visibleCards >= openResult.cards.length && (
              <div className={styles.revealActions}>
                {shipStatus === "done" ? (
                  <p className={styles.shipSuccess}>✅ Shipping requested! We&apos;ll be in touch soon.</p>
                ) : (
                  <>
                    <button
                      className={styles.shipBtn}
                      onClick={handleShip}
                      disabled={shipStatus === "loading"}
                    >
                      {shipStatus === "loading" ? "Requesting…" : "🚚 Ship My Cards"}
                    </button>
                    {shipError && <p style={{ color: "#ff8888", fontSize: "0.85rem" }}>{shipError}</p>}
                  </>
                )}
                <Link href="/account/pack-history" className={styles.historyLink}>
                  View Pack History →
                </Link>
                <button className={styles.openAnotherBtn} onClick={resetAll}>
                  Open Another Pack
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
