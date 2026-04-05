"use client";

import { useState } from "react";
import NextImage from "next/image";
import { POKEMON_SETS, type TcgdexCard } from "@/lib/tcgdex";
import styles from "./styles.module.css";

type Step = "selectingSet" | "loading" | "revealed" | "error";

function glowClass(rarity: string): string {
  switch (rarity) {
    case "uncommon":
      return styles.glowBlue;
    case "rare":
      return styles.glowPurple;
    case "ultra":
      return styles.glowGold;
    default:
      return styles.glowNone;
  }
}

function rarityBadgeClass(rarity: string): string {
  switch (rarity) {
    case "uncommon":
      return styles.rarityUncommon;
    case "rare":
      return styles.rarityRare;
    case "ultra":
      return styles.rarityUltra;
    default:
      return styles.rarityCommon;
  }
}

function rarityLabel(rarity: string): string {
  switch (rarity) {
    case "uncommon":
      return "Uncommon";
    case "rare":
      return "Rare";
    case "ultra":
      return "Ultra Rare";
    default:
      return "Common";
  }
}

export default function PokemonPackOpenerClient() {
  const [step, setStep] = useState<Step>("selectingSet");
  const [selectedTcgdexId, setSelectedTcgdexId] = useState<string>(
    POKEMON_SETS[0].tcgdexId
  );
  const [cards, setCards] = useState<TcgdexCard[]>([]);
  const [setName, setSetName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [visibleCards, setVisibleCards] = useState(0);

  async function openPack() {
    setStep("loading");
    setError(null);
    setVisibleCards(0);

    try {
      const res = await fetch("/api/pack-opener/tcgdex-open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tcgdexId: selectedTcgdexId }),
      });

      const data = (await res.json()) as {
        cards?: TcgdexCard[];
        setName?: string;
        error?: string;
      };

      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to open pack. Please try again.");
        setStep("error");
        return;
      }

      setCards(data.cards ?? []);
      setSetName(data.setName ?? "");
      setStep("revealed");

      // Stagger card reveals
      let i = 0;
      const interval = setInterval(() => {
        i += 1;
        setVisibleCards(i);
        if (i >= (data.cards?.length ?? 0)) clearInterval(interval);
      }, 180);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStep("error");
    }
  }

  function reset() {
    setStep("selectingSet");
    setCards([]);
    setSetName("");
    setError(null);
    setVisibleCards(0);
  }

  const selectedSet = POKEMON_SETS.find((s) => s.tcgdexId === selectedTcgdexId);

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Pokémon Pack Opener</h1>
        <p className={styles.heroSub}>
          Real cards • Live TCGdex data • Free to open
        </p>
      </div>

      <div className={styles.container}>

        {/* ── Set selector + Open button ── */}
        {(step === "selectingSet" || step === "error") && (
          <div className={styles.pickerSection}>
            <label className={styles.pickerLabel} htmlFor="set-select">
              Choose a Set
            </label>
            <select
              id="set-select"
              className={styles.setSelect}
              value={selectedTcgdexId}
              onChange={(e) => setSelectedTcgdexId(e.target.value)}
            >
              {POKEMON_SETS.map((s) => (
                <option key={s.tcgdexId} value={s.tcgdexId}>
                  {s.name} ({s.releaseYear})
                </option>
              ))}
            </select>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button className={styles.openBtn} onClick={openPack}>
              ⚡ Open Pack
            </button>

            <p className={styles.oddsNote}>
              Pack odds — Common: ~78% · Uncommon: ~17% · Rare: ~4% · Ultra Rare: ~1%
            </p>
          </div>
        )}

        {/* ── Loading spinner ── */}
        {step === "loading" && (
          <div className={styles.loadingCenter}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>
              Fetching cards from TCGdex…
            </p>
          </div>
        )}

        {/* ── Card reveal row ── */}
        {step === "revealed" && (
          <div className={styles.revealSection}>
            <div className={styles.revealHeader}>
              <h2 className={styles.revealTitle}>Pack Opened!</h2>
              <p className={styles.revealSub}>{setName}</p>
            </div>

            <div className={styles.cardRow}>
              {cards.slice(0, visibleCards).map((card, idx) => (
                <div
                  key={`${card.id}-${idx}`}
                  className={styles.cardItem}
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  <div className={`${styles.cardInner} ${glowClass(card.rarity)}`}>
                  <div className={styles.cardImgWrapper}>
                    <NextImage
                      src={card.image}
                      alt={card.name}
                      fill
                      sizes="160px"
                      className={styles.cardImg}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
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
              ))}
            </div>

            {visibleCards >= cards.length && (
              <div className={styles.actions}>
                <button className={styles.openAnotherBtn} onClick={openPack}>
                  ⚡ Open Another Pack
                </button>
                <button className={styles.changeSetBtn} onClick={reset}>
                  Change Set
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Set info footer ── */}
      {step === "selectingSet" && selectedSet && (
        <div className={styles.setInfoBar}>
          <span className={styles.setInfoLabel}>Selected:</span>
          <span className={styles.setInfoName}>{selectedSet.name}</span>
          <span className={styles.setInfoId}>TCGdex ID: {selectedSet.tcgdexId}</span>
        </div>
      )}
    </div>
  );
}
