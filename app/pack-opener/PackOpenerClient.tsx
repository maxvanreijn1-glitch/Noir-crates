"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TCG_GAMES, type TcgGame, type TcgSet } from "@/lib/tcg-data";
import type { PackType } from "@/lib/packs/types";
import {
  PACK_TYPE_LABELS,
  PACK_TYPE_DESCRIPTIONS,
  PACK_TYPE_PRICE_MULTIPLIERS,
} from "@/lib/packs/types";
import styles from "./pack-opener.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step =
  | "selectingTcg"
  | "selectingSet"
  | "selectingPackType"
  | "checkout"
  | "opening"
  | "revealed"
  | "error";

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
  boostMeterAfter?: number;
}

// ── Rarity helpers ────────────────────────────────────────────────────────────

const RARITY_TIER: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  holo: 3,
  "ultra-rare": 4,
  "secret-rare": 5,
  mythic: 4,
  "super-rare": 4,
  "special-rare": 5,
};

function glowClass(rarity: string): string {
  const tier = RARITY_TIER[rarity] ?? 0;
  if (tier >= 5) return styles.glowRainbow;
  if (tier >= 4) return styles.glowGold;
  if (tier >= 3) return styles.glowCyan;
  if (tier >= 2) return styles.glowPurple;
  if (tier >= 1) return styles.glowBlue;
  return styles.glowNone;
}

function rarityBadgeClass(rarity: string): string {
  switch (rarity) {
    case "uncommon":     return styles.rarityUncommon;
    case "rare":         return styles.rarityRare;
    case "holo":         return styles.rarityHolo;
    case "ultra-rare":   return styles.rarityUltra;
    case "secret-rare":  return styles.raritySecret;
    case "mythic":       return styles.rarityMythic;
    case "super-rare":   return styles.raritySuper;
    case "special-rare": return styles.raritySpecial;
    default:             return styles.rarityCommon;
  }
}

function rarityLabel(rarity: string): string {
  return rarity.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/** Reveal delay in ms — rarer cards take longer to reveal for drama */
function revealDelay(rarity: string): number {
  const tier = RARITY_TIER[rarity] ?? 0;
  if (tier >= 5) return 900;
  if (tier >= 4) return 650;
  if (tier >= 3) return 400;
  return 180;
}

// ── Boost meter localStorage helpers ─────────────────────────────────────────

const BOOST_KEY = "noir_boost_meter";

function readBoostMeter(): number {
  try {
    const raw = localStorage.getItem(BOOST_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { value?: number };
    return Math.min(100, Math.max(0, parsed.value ?? 0));
  } catch {
    return 0;
  }
}

function writeBoostMeter(value: number): void {
  try {
    localStorage.setItem(
      BOOST_KEY,
      JSON.stringify({ value, lastUpdated: Date.now() }),
    );
  } catch {
    // localStorage unavailable — ignore
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PackOpenerClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [step, setStep] = useState<Step>("selectingTcg");
  const [selectedGame, setSelectedGame] = useState<TcgGame | null>(null);
  const [selectedSet, setSelectedSet] = useState<TcgSet | null>(null);
  const [selectedPackType, setSelectedPackType] = useState<PackType>("basic");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openResult, setOpenResult] = useState<OpenResult | null>(null);
  const [packClicked, setPackClicked] = useState(false);
  const [visibleCards, setVisibleCards] = useState(0);
  const [revealedIdx, setRevealedIdx] = useState(-1);
  const [shipStatus, setShipStatus] = useState<"idle" | "loading" | "done">("idle");
  const [shipError, setShipError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [boostMeter, setBoostMeter] = useState(0);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load boost meter from localStorage on mount
  useEffect(() => {
    setBoostMeter(readBoostMeter());
  }, []);

  // Detect whether the current session belongs to an admin
  useEffect(() => {
    fetch("/api/admin/auth/me", { credentials: "include" })
      .then(r => { if (r.ok) setIsAdmin(true); })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.debug("[PackOpener] Admin check failed:", err);
        }
      });
  }, []);

  // When session_id is present, open the pack
  const openPack = useCallback(async (sid: string) => {
    setStep("opening");
    try {
      const res = await fetch(
        `/api/pack-opener/open?session_id=${encodeURIComponent(sid)}`,
      );
      const data = await res.json() as {
        openingId?: number;
        cards?: TcgCard[];
        tcg?: string;
        setName?: string;
        boostMeterAfter?: number;
        error?: string;
      };
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
        boostMeterAfter: data.boostMeterAfter,
      });
      // Remains in "opening" — user must click the pack to reveal
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

  // Sequential card reveal with per-card delays based on rarity
  useEffect(() => {
    if (!packClicked || !openResult) return;
    setStep("revealed");
    setVisibleCards(0);
    setRevealedIdx(-1);

    let i = 0;
    const cards = openResult.cards;

    function revealNext() {
      setVisibleCards(prev => prev + 1);
      setRevealedIdx(i);
      i += 1;
      if (i < cards.length) {
        const delay = revealDelay(cards[i]?.rarity ?? "common");
        revealTimerRef.current = setTimeout(revealNext, delay);
      }
    }

    revealTimerRef.current = setTimeout(revealNext, 300);
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [packClicked, openResult]);

  // Persist boost meter once all cards are revealed
  useEffect(() => {
    if (
      openResult?.boostMeterAfter !== undefined &&
      visibleCards >= (openResult.cards.length ?? 0) &&
      visibleCards > 0
    ) {
      const newBoost = openResult.boostMeterAfter;
      setBoostMeter(newBoost);
      writeBoostMeter(newBoost);
    }
  }, [visibleCards, openResult]);

  // ── Action handlers ──────────────────────────────────────────────────────

  async function handleCheckout() {
    if (!selectedGame || !selectedSet) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pack-opener/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tcgId: selectedGame.id,
          setId: selectedSet.id,
          packType: selectedPackType,
          boostMeter,
        }),
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

  /** Admin-only: open a pack without payment */
  async function handleAdminOpen() {
    if (!selectedGame || !selectedSet) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pack-opener/admin-open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tcgId: selectedGame.id,
          setId: selectedSet.id,
          packType: selectedPackType,
          boostMeter,
        }),
      });
      const data = await res.json() as {
        openingId?: number;
        cards?: TcgCard[];
        tcg?: string;
        setName?: string;
        boostMeterAfter?: number;
        error?: string;
      };
      if (!res.ok || data.error) {
        setError(data.error ?? "Admin open failed");
        setCheckoutLoading(false);
        return;
      }
      setOpenResult({
        openingId: data.openingId!,
        cards: data.cards!,
        tcg: data.tcg!,
        setName: data.setName!,
        boostMeterAfter: data.boostMeterAfter,
      });
      setStep("opening");
      setCheckoutLoading(false);
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
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    setStep("selectingTcg");
    setSelectedGame(null);
    setSelectedSet(null);
    setSelectedPackType("basic");
    setError(null);
    setOpenResult(null);
    setPackClicked(false);
    setVisibleCards(0);
    setRevealedIdx(-1);
    setShipStatus("idle");
    setShipError(null);
    router.push("/pack-opener");
  }

  // Derived display values
  const packPrice = selectedSet
    ? (selectedSet.priceGBP * PACK_TYPE_PRICE_MULTIPLIERS[selectedPackType]).toFixed(2)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Pack Opener</h1>
        <p className={styles.heroSub}>
          Select your TCG, choose a set, pick a pack tier, and crack open a virtual booster
        </p>
      </div>

      {/* Admin test mode banner */}
      {isAdmin && (
        <div className={styles.adminBanner}>
          <span className={styles.adminBannerIcon}>⚡</span>
          <span>Admin test mode — packs open for free</span>
        </div>
      )}

      {/* Boost meter bar */}
      <div className={styles.boostBarWrap}>
        <div className={styles.boostBarLabel}>
          <span>⚡ Boost Meter</span>
          <span className={styles.boostBarValue}>{boostMeter}/100</span>
        </div>
        <div className={styles.boostBarTrack}>
          <div
            className={styles.boostBarFill}
            style={{ width: `${boostMeter}%` }}
          />
        </div>
        <p className={styles.boostBarHint}>
          {boostMeter === 0
            ? "Open packs to charge the meter and improve your rarity odds"
            : boostMeter >= 75
            ? "Boost is high — great odds for rare pulls!"
            : "Meter charges with each pack opened. Resets on high-rarity pulls."}
        </p>
      </div>

      <div className={styles.container}>

        {/* Error state */}
        {step === "error" && (
          <div className={styles.errorBox}>
            <p>{error}</p>
            <button className={styles.backLink} onClick={resetAll}>← Start Over</button>
          </div>
        )}

        {/* Step 1: Select TCG */}
        {step === "selectingTcg" && (
          <div>
            <p className={styles.stepLabel}>Step 1 of 4</p>
            <h2 className={styles.stepTitle}>Choose Your TCG</h2>
            <div className={styles.gameGrid}>
              {TCG_GAMES.map(game => (
                <div
                  key={game.id}
                  className={`${styles.gameCard} ${selectedGame?.id === game.id ? styles.selected : ""}`}
                >
                  <span className={styles.gameIcon}>{game.icon}</span>
                  <span className={styles.gameName}>{game.name}</span>
                  {game.id === "pokemon" && (
                    <span className={styles.apiTag}>Real cards via TCGdex ✨</span>
                  )}
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
              <p className={styles.stepLabel} style={{ margin: 0 }}>Step 2 of 4</p>
              <div className={styles.selectionBadge}>
                <span>{selectedGame.icon}</span>
                <span>{selectedGame.name}</span>
              </div>
              <button
                className={styles.changeBtn}
                onClick={() => { setStep("selectingTcg"); setSelectedGame(null); }}
              >
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
                      Released:{" "}
                      {new Date(set.releaseDate).toLocaleDateString("en-GB", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className={styles.setMeta}>From £{set.priceGBP.toFixed(2)}</p>
                    <button
                      className={styles.openPackBtn}
                      onClick={() => { setSelectedSet(set); setStep("selectingPackType"); }}
                    >
                      Choose Pack Type
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Pack Type */}
        {step === "selectingPackType" && selectedGame && selectedSet && (
          <div>
            <div className={styles.selectionHeader}>
              <p className={styles.stepLabel} style={{ margin: 0 }}>Step 3 of 4</p>
              <div className={styles.selectionBadge}>
                <span>{selectedGame.icon}</span>
                <span>{selectedGame.name}</span>
              </div>
              <span style={{ color: "#666688" }}>→</span>
              <div className={styles.selectionBadge}>
                <span>{selectedSet.name}</span>
              </div>
              <button
                className={styles.changeBtn}
                onClick={() => setStep("selectingSet")}
              >
                Change
              </button>
            </div>

            <h2 className={styles.stepTitle}>Choose Pack Type</h2>
            <div className={styles.packTypeGrid}>
              {(["basic", "premium", "elite"] as PackType[]).map(pt => {
                const price = (
                  selectedSet.priceGBP * PACK_TYPE_PRICE_MULTIPLIERS[pt]
                ).toFixed(2);
                return (
                  <button
                    key={pt}
                    className={[
                      styles.packTypeCard,
                      styles[`packType_${pt}` as keyof typeof styles],
                      selectedPackType === pt ? styles.packTypeSelected : "",
                    ].join(" ")}
                    onClick={() => setSelectedPackType(pt)}
                  >
                    <span className={styles.packTypeName}>{PACK_TYPE_LABELS[pt]}</span>
                    <span className={styles.packTypePrice}>£{price}</span>
                    <span className={styles.packTypeDesc}>{PACK_TYPE_DESCRIPTIONS[pt]}</span>
                    {pt === "premium" && (
                      <span className={styles.packTypeTag}>Popular</span>
                    )}
                    {pt === "elite" && (
                      <span className={styles.packTypeTag}>Best Odds</span>
                    )}
                  </button>
                );
              })}
            </div>

            {boostMeter > 0 && (
              <p className={styles.packTypeOddsNote}>
                ⚡ Your boost meter ({boostMeter}/100) is active — rarity odds are improved!
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
              <button
                className={styles.payBtn}
                style={{ maxWidth: 360, width: "100%" }}
                onClick={() => setStep("checkout")}
              >
                Continue → {PACK_TYPE_LABELS[selectedPackType]} Pack (£{packPrice})
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Checkout */}
        {step === "checkout" && selectedGame && selectedSet && (
          <div>
            <div className={styles.selectionHeader}>
              <p className={styles.stepLabel} style={{ margin: 0 }}>Step 4 of 4</p>
              <div className={styles.selectionBadge}>
                <span>{selectedGame.icon}</span>
                <span>{selectedGame.name}</span>
              </div>
              <span style={{ color: "#666688" }}>→</span>
              <div className={styles.selectionBadge}>
                <span>{selectedSet.name}</span>
              </div>
              <span style={{ color: "#666688" }}>→</span>
              <div
                className={[
                  styles.selectionBadge,
                  styles[`packTypeBadge_${selectedPackType}` as keyof typeof styles],
                ].join(" ")}
              >
                <span>{PACK_TYPE_LABELS[selectedPackType]}</span>
              </div>
              <button
                className={styles.changeBtn}
                onClick={() => setStep("selectingPackType")}
              >
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
                  <span>Pack Type</span>
                  <span>{PACK_TYPE_LABELS[selectedPackType]}</span>
                </div>
                {boostMeter > 0 && (
                  <div className={styles.checkoutRow}>
                    <span>⚡ Boost</span>
                    <span style={{ color: "#ffd700" }}>{boostMeter}/100 active</span>
                  </div>
                )}
                <div className={styles.checkoutRow}>
                  <span>Total</span>
                  <span>
                    {isAdmin
                      ? <span className={styles.freeLabel}>FREE (admin)</span>
                      : `£${packPrice}`}
                  </span>
                </div>
              </div>

              {error && (
                <p style={{ color: "#ff8888", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  {error}
                </p>
              )}

              <button
                className={styles.payBtn}
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? "Redirecting…" : "Proceed to Payment"}
              </button>
              <br />
              <button
                className={styles.backLink}
                onClick={() => setStep("selectingPackType")}
              >
                ← Back to Pack Type
              </button>
            </div>
          </div>
        )}

        {/* Loading pack from API */}
        {step === "opening" && !openResult && (
          <div className={styles.loadingCenter}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Verifying payment…</p>
          </div>
        )}

        {/* Pack click-to-open animation */}
        {step === "opening" && !packClicked && openResult && (
          <div className={styles.packOpeningArea}>
            <p className={styles.packMeta}>
              <span className={styles.packMetaBold}>{openResult.tcg}</span>{" "}
              — {openResult.setName}{" "}
              <span
                className={[
                  styles.packTypePill,
                  styles[`packTypePill_${selectedPackType}` as keyof typeof styles],
                ].join(" ")}
              >
                {PACK_TYPE_LABELS[selectedPackType]}
              </span>
            </p>
            <div
              className={styles.packWrapper}
              onClick={() => setPackClicked(true)}
            >
              <div
                className={[
                  styles.packImage,
                  styles[`packImage_${selectedPackType}` as keyof typeof styles],
                ].join(" ")}
              >
                {TCG_GAMES.find(g => g.name === openResult.tcg)?.icon ?? "🎴"}
              </div>
            </div>
            <p className={styles.packHint}>Click to Open!</p>
          </div>
        )}

        {/* Card Reveal */}
        {step === "revealed" && openResult && (
          <div className={styles.revealSection}>
            <div className={styles.revealHeader}>
              <h2 className={styles.revealTitle}>Cards Revealed!</h2>
              <p className={styles.revealSub}>
                {openResult.tcg} — {openResult.setName}{" "}
                <span
                  className={[
                    styles.packTypePill,
                    styles[`packTypePill_${selectedPackType}` as keyof typeof styles],
                  ].join(" ")}
                >
                  {PACK_TYPE_LABELS[selectedPackType]}
                </span>
              </p>
            </div>

            <div className={styles.cardGrid}>
              {openResult.cards.slice(0, visibleCards).map((card, idx) => {
                const isJustRevealed = idx === revealedIdx;
                const tier = RARITY_TIER[card.rarity] ?? 0;
                return (
                  <div
                    key={`${card.id}-${idx}`}
                    className={[
                      styles.cardItem,
                      tier >= 3 ? styles.cardItemHighRarity : "",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        styles.cardInner,
                        glowClass(card.rarity),
                        isJustRevealed && tier >= 4 ? styles.cardRevealFlash : "",
                      ].join(" ")}
                    >
                      {card.image ? (
                        <img
                          src={card.image}
                          alt={card.name}
                          className={styles.cardImg}
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : null}
                      <div className={styles.cardLabel}>
                        <p className={styles.cardName} title={card.name}>
                          {card.name}
                        </p>
                        <span
                          className={`${styles.rarityBadge} ${rarityBadgeClass(card.rarity)}`}
                        >
                          {rarityLabel(card.rarity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleCards >= openResult.cards.length && (
              <div className={styles.revealActions}>
                {/* Show updated boost meter feedback */}
                {openResult.boostMeterAfter !== undefined && (
                  <div className={styles.boostUpdate}>
                    {openResult.boostMeterAfter < boostMeter - 5
                      ? `⚡ High-rarity pull! Boost meter adjusted to ${openResult.boostMeterAfter}/100`
                      : `⚡ Boost meter charged to ${openResult.boostMeterAfter}/100`}
                  </div>
                )}

                {shipStatus === "done" ? (
                  <p className={styles.shipSuccess}>
                    ✅ Shipping requested! We&apos;ll be in touch soon.
                  </p>
                ) : (
                  <>
                    <button
                      className={styles.shipBtn}
                      onClick={handleShip}
                      disabled={shipStatus === "loading"}
                    >
                      {shipStatus === "loading" ? "Requesting…" : "🚚 Ship My Cards"}
                    </button>
                    {shipError && (
                      <p style={{ color: "#ff8888", fontSize: "0.85rem" }}>{shipError}</p>
                    )}
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


