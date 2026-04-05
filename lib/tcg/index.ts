/**
 * Normalized card type used across all providers and UI.
 * All external card data is mapped into this shape before use.
 */
export interface Card {
  id: string;
  name: string;
  /** Full URL to the card art image */
  image: string;
  /** Normalized rarity key, e.g. "common", "ultra-rare" */
  rarity: string;
  setName: string;
}

/**
 * Interface for TCG card data providers.
 * Implement this to add new card databases (e.g. YGOPRODeck).
 */
export interface TcgProvider {
  /**
   * Fetch all cards for a specific set.
   * @param tcgdexSetId - The provider-specific set identifier
   * @param setName     - Human-readable set name for display
   */
  fetchCards(tcgdexSetId: string, setName: string): Promise<Card[]>;
}
