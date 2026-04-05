// TCG Data - cards, sets, rarities, pack contents

export interface TcgCard {
  id: string;
  name: string;
  image: string;
  rarity: string;
  setName: string;
}

export interface TcgSet {
  id: string;
  name: string;
  releaseDate: string;
  packImage: string;
  priceGBP: number;
  cards: TcgCard[];
}

export interface TcgGame {
  id: string;
  name: string;
  icon: string;
  sets: TcgSet[];
}

export type RarityOdds = Record<string, number>;

// Rarity color map for placehold.co images
const RARITY_COLORS: Record<string, string> = {
  common: "636363",
  uncommon: "1d4ed8",
  rare: "7c3aed",
  holo: "7c3aed",
  "ultra-rare": "b45309",
  "secret-rare": "b45309",
  "special-rare": "b45309",
  mythic: "b45309",
  "super-rare": "b45309",
};

function cardImg(name: string, rarity: string): string {
  const color = RARITY_COLORS[rarity] ?? "636363";
  return `https://placehold.co/200x280/${color}/white?text=${encodeURIComponent(name)}`;
}

function makeCards(setName: string, groups: { rarity: string; names: string[] }[]): TcgCard[] {
  const cards: TcgCard[] = [];
  for (const g of groups) {
    for (const name of g.names) {
      cards.push({
        id: `${setName.toLowerCase().replace(/\s+/g, "-")}-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name,
        image: cardImg(name, g.rarity),
        rarity: g.rarity,
        setName,
      });
    }
  }
  return cards;
}

// ─── POKEMON SETS ──────────────────────────────────────────────────────────
const pokemonSets: TcgSet[] = [
  {
    id: "prismatic-evolutions",
    name: "Prismatic Evolutions",
    releaseDate: "2025-01-17",
    packImage: "/pack-opener/packs/pokemon-prismatic-evolutions.png",
    priceGBP: 4.99,
    cards: makeCards("Prismatic Evolutions", [
      { rarity: "common", names: ["Eevee", "Flareon Token", "Vaporeon Token", "Jolteon Token", "Sylveon Token", "Espeon Token", "Umbreon Token", "Leafeon Token"] },
      { rarity: "uncommon", names: ["Eevee EX", "Espeon", "Jolteon", "Flareon", "Vaporeon", "Leafeon"] },
      { rarity: "rare", names: ["Sylveon ex", "Umbreon ex", "Glaceon ex", "Espeon ex"] },
      { rarity: "holo", names: ["Flareon Holo", "Vaporeon Holo", "Jolteon Holo", "Eevee Holo"] },
      { rarity: "ultra-rare", names: ["Eevee Illustration Rare", "Umbreon Special IR", "Sylveon Full Art", "Espeon Full Art"] },
    ]),
  },
  {
    id: "stellar-crown",
    name: "Stellar Crown",
    releaseDate: "2024-09-13",
    packImage: "/pack-opener/packs/pokemon-stellar-crown.png",
    priceGBP: 4.99,
    cards: makeCards("Stellar Crown", [
      { rarity: "common", names: ["Pikachu", "Charmander", "Squirtle", "Bulbasaur", "Caterpie", "Weedle", "Pidgey", "Rattata"] },
      { rarity: "uncommon", names: ["Raichu", "Charmeleon", "Wartortle", "Ivysaur", "Butterfree", "Pidgeotto"] },
      { rarity: "rare", names: ["Charizard ex", "Blastoise ex", "Venusaur ex", "Pikachu ex"] },
      { rarity: "holo", names: ["Pikachu Holo", "Charizard Holo", "Raichu Holo"] },
      { rarity: "ultra-rare", names: ["Charizard Special IR", "Pikachu Full Art", "Mewtwo Hyper Rare"] },
    ]),
  },
  {
    id: "surging-sparks",
    name: "Surging Sparks",
    releaseDate: "2024-11-08",
    packImage: "/pack-opener/packs/pokemon-surging-sparks.png",
    priceGBP: 4.99,
    cards: makeCards("Surging Sparks", [
      { rarity: "common", names: ["Electabuzz", "Mareep", "Flaaffy", "Voltorb", "Electrode", "Magnemite", "Magneton", "Joltik"] },
      { rarity: "uncommon", names: ["Ampharos", "Raichu", "Magnezone", "Galvantula", "Zebstrika"] },
      { rarity: "rare", names: ["Pikachu ex", "Raichu ex", "Miraidon ex", "Regieleki ex"] },
      { rarity: "holo", names: ["Ampharos Holo", "Magnezone Holo", "Electivire Holo"] },
      { rarity: "ultra-rare", names: ["Miraidon Special IR", "Raichu Full Art", "Pikachu Hyper Rare"] },
    ]),
  },
  {
    id: "twilight-masquerade",
    name: "Twilight Masquerade",
    releaseDate: "2024-05-24",
    packImage: "/pack-opener/packs/pokemon-twilight-masquerade.png",
    priceGBP: 4.99,
    cards: makeCards("Twilight Masquerade", [
      { rarity: "common", names: ["Ogerpon", "Terapagos", "Munkidori", "Okidogi", "Fezandipiti", "Applin", "Appletun", "Flapple"] },
      { rarity: "uncommon", names: ["Ogerpon ex", "Terapagos ex", "Munkidori ex", "Pecharunt"] },
      { rarity: "rare", names: ["Ogerpon Cornerstone ex", "Ogerpon Hearthflame ex", "Ogerpon Wellspring ex"] },
      { rarity: "holo", names: ["Ogerpon Holo", "Terapagos Holo", "Pecharunt Holo"] },
      { rarity: "ultra-rare", names: ["Terapagos Special IR", "Ogerpon Full Art", "Kieran Full Art"] },
    ]),
  },
  {
    id: "temporal-forces",
    name: "Temporal Forces",
    releaseDate: "2024-03-22",
    packImage: "/pack-opener/packs/pokemon-temporal-forces.png",
    priceGBP: 4.99,
    cards: makeCards("Temporal Forces", [
      { rarity: "common", names: ["Iron Leaves", "Walking Wake", "Sandy Shocks", "Flutter Mane", "Brute Bonnet", "Scream Tail", "Iron Bundle", "Iron Hands"] },
      { rarity: "uncommon", names: ["Iron Crown ex", "Walking Wake ex", "Iron Boulder ex", "Gouging Fire ex"] },
      { rarity: "rare", names: ["Dialga ex", "Palkia ex", "Arceus ex", "Giratina ex"] },
      { rarity: "holo", names: ["Iron Leaves Holo", "Walking Wake Holo", "Dialga Holo"] },
      { rarity: "ultra-rare", names: ["Dialga Special IR", "Palkia Full Art", "Arceus Hyper Rare"] },
    ]),
  },
  {
    id: "paldean-fates",
    name: "Paldean Fates",
    releaseDate: "2024-01-26",
    packImage: "/pack-opener/packs/pokemon-paldean-fates.png",
    priceGBP: 5.49,
    cards: makeCards("Paldean Fates", [
      { rarity: "common", names: ["Sprigatito", "Fuecoco", "Quaxly", "Lechonk", "Tarountula", "Flittle", "Pawmi", "Smoliv"] },
      { rarity: "uncommon", names: ["Meowscarada ex", "Skeledirge ex", "Quaquaval ex", "Ceruledge ex"] },
      { rarity: "rare", names: ["Charizard ex Shiny", "Rayquaza ex Shiny", "Pikachu ex Shiny"] },
      { rarity: "holo", names: ["Sprigatito Shiny", "Fuecoco Shiny", "Quaxly Shiny", "Lechonk Shiny"] },
      { rarity: "ultra-rare", names: ["Shiny Charizard ex Full Art", "Shiny Miraidon ex Full Art", "Shiny Koraidon Full Art"] },
    ]),
  },
  {
    id: "paradox-rift",
    name: "Paradox Rift",
    releaseDate: "2023-11-03",
    packImage: "/pack-opener/packs/pokemon-paradox-rift.png",
    priceGBP: 4.99,
    cards: makeCards("Paradox Rift", [
      { rarity: "common", names: ["Roaring Moon", "Iron Valiant", "Sandy Shocks", "Iron Treads", "Slither Wing", "Iron Jugulis", "Iron Moth", "Flutter Mane"] },
      { rarity: "uncommon", names: ["Roaring Moon ex", "Iron Valiant ex", "Garchomp ex", "Dragapult ex"] },
      { rarity: "rare", names: ["Dialga ex Ancient", "Palkia ex Ancient", "Groudon ex", "Kyogre ex"] },
      { rarity: "holo", names: ["Roaring Moon Holo", "Iron Valiant Holo", "Garchomp Holo"] },
      { rarity: "ultra-rare", names: ["Roaring Moon Special IR", "Iron Valiant Full Art", "Garchomp Hyper Rare"] },
    ]),
  },
  {
    id: "obsidian-flames",
    name: "Obsidian Flames",
    releaseDate: "2023-08-11",
    packImage: "/pack-opener/packs/pokemon-obsidian-flames.png",
    priceGBP: 4.99,
    cards: makeCards("Obsidian Flames", [
      { rarity: "common", names: ["Charmander", "Charmeleon", "Larvitar", "Pupitar", "Darumaka", "Litwick", "Lampent", "Fuecoco"] },
      { rarity: "uncommon", names: ["Tyranitar ex", "Charizard ex", "Revavroom ex", "Cinderace ex"] },
      { rarity: "rare", names: ["Tera Charizard ex", "Tera Tyranitar ex", "Dragonite ex"] },
      { rarity: "holo", names: ["Charizard Holo", "Tyranitar Holo", "Dragonite Holo"] },
      { rarity: "ultra-rare", names: ["Tera Charizard Special IR", "Tyranitar Full Art", "Mela Full Art"] },
    ]),
  },
  {
    id: "scarlet-violet-base",
    name: "Scarlet & Violet Base",
    releaseDate: "2023-03-31",
    packImage: "/pack-opener/packs/pokemon-sv-base.png",
    priceGBP: 4.49,
    cards: makeCards("Scarlet & Violet Base", [
      { rarity: "common", names: ["Sprigatito", "Fuecoco", "Quaxly", "Pikachu", "Pawmi", "Lechonk", "Smoliv", "Tarountula"] },
      { rarity: "uncommon", names: ["Arcanine ex", "Gyarados ex", "Lucario ex", "Miraidon ex"] },
      { rarity: "rare", names: ["Koraidon ex", "Miraidon ex Ultra", "Pikachu ex", "Magnezone ex"] },
      { rarity: "holo", names: ["Sprigatito Holo", "Fuecoco Holo", "Quaxly Holo"] },
      { rarity: "ultra-rare", names: ["Miraidon Special IR", "Koraidon Full Art", "Pikachu Hyper Rare"] },
    ]),
  },
  {
    id: "crown-zenith",
    name: "Crown Zenith",
    releaseDate: "2023-01-20",
    packImage: "/pack-opener/packs/pokemon-crown-zenith.png",
    priceGBP: 4.99,
    cards: makeCards("Crown Zenith", [
      { rarity: "common", names: ["Zacian", "Zamazenta", "Eternatus", "Kubfu", "Urshifu", "Calyrex", "Glastrier", "Spectrier"] },
      { rarity: "uncommon", names: ["Zacian V", "Zamazenta V", "Eternatus V", "Calyrex Ice Rider V"] },
      { rarity: "rare", names: ["Zacian VSTAR", "Zamazenta VSTAR", "Calyrex Shadow Rider VSTAR"] },
      { rarity: "holo", names: ["Zacian Holo", "Zamazenta Holo", "Eternatus Holo"] },
      { rarity: "ultra-rare", names: ["Zacian Alt Art", "Zamazenta Alt Art", "Calyrex Galarian Gallery"] },
    ]),
  },
];

// ─── YUGIOH SETS ───────────────────────────────────────────────────────────
const yugiohSets: TcgSet[] = [
  {
    id: "legacy-of-destruction",
    name: "Legacy of Destruction",
    releaseDate: "2024-04-26",
    packImage: "/pack-opener/packs/yugioh-legacy-of-destruction.png",
    priceGBP: 3.99,
    cards: makeCards("Legacy of Destruction", [
      { rarity: "common", names: ["Sky Striker Ace - Raye", "Marincess Sea Horse", "Floowandereeze & Empen", "Labrynth Cooclock", "Nurse Reficule", "Cardcar D", "Fire Hand", "Ice Hand"] },
      { rarity: "rare", names: ["Sky Striker Mecha - Shark Cannon", "Marincess Coral Anemone", "Floowandereeze & Toccan", "Labrynth Chandraglier"] },
      { rarity: "super-rare", names: ["Sky Striker Ace - Kagari", "Marincess Blue Tang", "Floowandereeze & Eglen", "Labrynth Stovie Torbie"] },
      { rarity: "ultra-rare", names: ["Sky Striker Ace - Zeke", "Marincess Great Bubble Reef", "Floowandereeze & Snowl"] },
      { rarity: "secret-rare", names: ["Sky Striker Ace - Shizuku", "Marincess Lonesome Dive", "Floowandereeze & Robina"] },
    ]),
  },
  {
    id: "age-of-overlord",
    name: "Age of Overlord",
    releaseDate: "2023-10-19",
    packImage: "/pack-opener/packs/yugioh-age-of-overlord.png",
    priceGBP: 3.99,
    cards: makeCards("Age of Overlord", [
      { rarity: "common", names: ["Diabellstar the Black Witch", "Sinful Spoils of Subversion", "Snake-Eyes Diabell", "Snake-Eyes Flamberge Dragon", "Original Sinful Spoils", "Poplar the Witch's Sacred Tree", "Sunvine Healer", "Sylvan Sagequoia"] },
      { rarity: "rare", names: ["Diabellze the Original Sinful Spoils", "Snake-Eye Ash", "Snake-Eye Oak", "Promethean Princess"] },
      { rarity: "super-rare", names: ["Snake-Eyes Poplar", "Fiendsmith Engraver", "Fiendsmith's Tract", "Silvera, Wolf Tamer of the White Forest"] },
      { rarity: "ultra-rare", names: ["Snake-Eyes Diabell", "Fiendsmith in Paradise", "The Iris Swordsoul"] },
      { rarity: "secret-rare", names: ["Diabellstar the Black Witch SR", "Snake-Eye Ash Secret", "Fiendsmith's Sanctum"] },
    ]),
  },
  {
    id: "battles-of-legend-terminal-revenge",
    name: "Battles of Legend: Terminal Revenge",
    releaseDate: "2024-08-09",
    packImage: "/pack-opener/packs/yugioh-terminal-revenge.png",
    priceGBP: 5.49,
    cards: makeCards("Terminal Revenge", [
      { rarity: "common", names: ["A-Assault Core", "B-Buster Drake", "C-Crush Wyvern", "XYZ-Dragon Cannon", "Xyz Dragon Cannon", "Perfect Machine King", "Machina Force", "Machina Fortress"] },
      { rarity: "rare", names: ["VWXYZ-Dragon Catapult Cannon", "Ultimate Great Moth", "Perfectly Ultimate Great Moth", "Insect Queen"] },
      { rarity: "super-rare", names: ["Jinzo Lord", "Elemental HERO Terra Firma", "Chimeratech Overdragon", "Naturia Beast"] },
      { rarity: "ultra-rare", names: ["Elemental HERO Flame Wingman", "Destiny HERO - Dystopia", "Vision HERO Adoration"] },
      { rarity: "secret-rare", names: ["Elemental HERO Shining Flare Wingman", "Destiny HERO Trinity", "HERO Spirit"] },
    ]),
  },
  {
    id: "phantom-nightmare",
    name: "Phantom Nightmare",
    releaseDate: "2024-02-22",
    packImage: "/pack-opener/packs/yugioh-phantom-nightmare.png",
    priceGBP: 3.99,
    cards: makeCards("Phantom Nightmare", [
      { rarity: "common", names: ["Yubel", "The Morning Star", "Terrorking Salmon", "Evil HERO Malicious Fiend", "Lunalight Leo Dancer", "Epoch Eradicator", "Infernoid Devyaty", "Infernoid Decatron"] },
      { rarity: "rare", names: ["Yubel - Terror Incarnate", "Yubel - Ultimate Nightmare", "Evil HERO Adjusted Gold", "Bystial Druiswurm"] },
      { rarity: "super-rare", names: ["Malice Ascendant", "Malice's Marunouchi", "Eternal Favorites", "Evil HERO Adusted Gold"] },
      { rarity: "ultra-rare", names: ["Yubel Ultra", "Malice Ascendant Ultra", "Evil HERO Ultra"] },
      { rarity: "secret-rare", names: ["Yubel Secret", "The Morning Star Secret", "Malice Secret"] },
    ]),
  },
  {
    id: "wild-survivors",
    name: "Wild Survivors",
    releaseDate: "2023-07-27",
    packImage: "/pack-opener/packs/yugioh-wild-survivors.png",
    priceGBP: 3.99,
    cards: makeCards("Wild Survivors", [
      { rarity: "common", names: ["Chimera the Flying Mythical Beast", "Gazelle the King of Mythical Beasts", "Berfomet", "Berfomet the Mythical Beast Ravager", "Cornfield Coatl", "Chiwen, Light of the Yang Zing", "Bi'an, Earth of the Yang Zing", "Suanni, Fire of the Yang Zing"] },
      { rarity: "rare", names: ["Chimera the Illusion Beast", "Phantom Skyblaster", "Yang Zing Path", "Saffira, Dragon Queen of the Fairy World"] },
      { rarity: "super-rare", names: ["Nibiru, the Primal Being", "Appointer of the Red Lotus", "Chimera Fusion", "Yang Zing Creation"] },
      { rarity: "ultra-rare", names: ["Chimera Ultra", "Nibiru Ultra", "Saffira Ultra"] },
      { rarity: "secret-rare", names: ["Chimera Secret", "Nibiru Secret", "Yang Zing Secret"] },
    ]),
  },
  {
    id: "duelist-nexus",
    name: "Duelist Nexus",
    releaseDate: "2023-07-27",
    packImage: "/pack-opener/packs/yugioh-duelist-nexus.png",
    priceGBP: 3.99,
    cards: makeCards("Duelist Nexus", [
      { rarity: "common", names: ["Labrynth Cooclock", "Labrynth Stovie Torbie", "Labrynth Chandraglier", "Labrynth Labyrinth", "Labrynth Ariadne", "Big Welcome Labrynth", "Lovely Labrynth of the Silver Castle", "Welcome Labrynth"] },
      { rarity: "rare", names: ["Lovely Labrynth Rare", "Labrynth Cooclock Rare", "Impcantation Talismandra", "Impcantation Bookstone"] },
      { rarity: "super-rare", names: ["Lady Labrynth of the Silver Castle", "Muckraker From the Underworld", "Impcantation Penciplume", "Impcantation Candoll"] },
      { rarity: "ultra-rare", names: ["Lady Labrynth Ultra", "Muckraker Ultra", "Kurikara Divincarnate"] },
      { rarity: "secret-rare", names: ["Lady Labrynth Secret", "Muckraker Secret", "Labrynth Chandraglier Secret"] },
    ]),
  },
  {
    id: "darkwing-blast",
    name: "Darkwing Blast",
    releaseDate: "2022-10-21",
    packImage: "/pack-opener/packs/yugioh-darkwing-blast.png",
    priceGBP: 3.79,
    cards: makeCards("Darkwing Blast", [
      { rarity: "common", names: ["Floowandereeze & Empen", "Floowandereeze & Toccan", "Floowandereeze & Eglen", "Floowandereeze & Robina", "Floowandereeze & Stri", "Floowandereeze & Katy", "Floowandereeze the Advent Wind", "Barrier Statue of the Stormwinds"] },
      { rarity: "rare", names: ["Horus the Black Flame Dragon LV8", "Dark Armed Dragon", "Chaos Dragon Levianeer", "Floowandereeze Rare"] },
      { rarity: "super-rare", names: ["Runick Tip", "Runick Freezing Curses", "Runick Destruction", "Runick Slumber"] },
      { rarity: "ultra-rare", names: ["Hugin the Runick Wings", "Geri the Runick Fangs", "Freki the Runick Fangs"] },
      { rarity: "secret-rare", names: ["Hugin Secret", "Chaos Dragon Levianeer Secret", "Dark Armed Dragon Secret"] },
    ]),
  },
  {
    id: "power-of-the-elements",
    name: "Power of the Elements",
    releaseDate: "2022-08-05",
    packImage: "/pack-opener/packs/yugioh-power-of-the-elements.png",
    priceGBP: 3.79,
    cards: makeCards("Power of the Elements", [
      { rarity: "common", names: ["Spright Blue", "Spright Red", "Spright Carrot", "Spright Jet", "Spright Smashers", "Spright Double Cross", "Gigantic Spright", "Eria the Water Charmer, Gentle"] },
      { rarity: "rare", names: ["Spright Elf", "Spright Pixies", "Tearlaments Merrli", "Tearlaments Scheiren"] },
      { rarity: "super-rare", names: ["Tearlaments Reinoheart", "Tearlaments Rulkallos", "Tearlaments Kaleido-Heart", "Spright Sprind"] },
      { rarity: "ultra-rare", names: ["Spright Elf Ultra", "Tearlaments Kaleido Ultra", "Toadally Awesome"] },
      { rarity: "secret-rare", names: ["Spright Elf Secret", "Tearlaments Rulkallos Secret", "Gigantic Spright Secret"] },
    ]),
  },
  {
    id: "tactical-masters",
    name: "Tactical Masters",
    releaseDate: "2022-06-17",
    packImage: "/pack-opener/packs/yugioh-tactical-masters.png",
    priceGBP: 3.79,
    cards: makeCards("Tactical Masters", [
      { rarity: "common", names: ["Swordsoul of Mo Ye", "Swordsoul Strategist", "Swordsoul Sacred Summit", "Tenyi Spirit - Vishuda", "Tenyi Spirit - Adhara", "Blackwing - Zephyros the Elite", "Harpie Lady 1", "Harpie Lady 2"] },
      { rarity: "rare", names: ["Swordsoul Supreme Sovereign - Chengying", "Swordsoul Grandmaster - Chixiao", "Tenyi Spirit - Sahasrara", "Harpie Perfumer"] },
      { rarity: "super-rare", names: ["Bystial Magnamhut", "Bystial Druiswurm", "Bystial Saronir", "Bystial Baldrake"] },
      { rarity: "ultra-rare", names: ["The Bystial Lubellion", "Despian Tragedy", "Swordsoul Blackout"] },
      { rarity: "secret-rare", names: ["Lubellion Secret", "Swordsoul Chengying Secret", "Tearlaments Rulkallos Secret"] },
    ]),
  },
  {
    id: "lightning-overdrive",
    name: "Lightning Overdrive",
    releaseDate: "2021-07-08",
    packImage: "/pack-opener/packs/yugioh-lightning-overdrive.png",
    priceGBP: 3.49,
    cards: makeCards("Lightning Overdrive", [
      { rarity: "common", names: ["Thunder Dragon Thunderstruck", "Thunder Dragonduo", "Therion King Regulus", "Therion Bull Ain", "Therion Discolosseum", "Predaplant Verte Anaconda", "Predaplant Dragostapelia", "Infinitrack Tunneler"] },
      { rarity: "rare", names: ["Thunder Dragon Colossus", "Therion Reaper Fray", "Therion Discolosseum Rare", "Marincess Coral Triangle"] },
      { rarity: "super-rare", names: ["Accesscode Talker", "Apollousa, Bow of the Goddess", "Selene, Queen of the Master Magicians", "I:P Masquerena"] },
      { rarity: "ultra-rare", names: ["Accesscode Talker Ultra", "Apollousa Ultra", "Baronne de Fleur"] },
      { rarity: "secret-rare", names: ["Accesscode Talker Secret", "Apollousa Secret", "Predaplant Verte Secret"] },
    ]),
  },
];

// ─── MAGIC: THE GATHERING SETS ─────────────────────────────────────────────
const mtgSets: TcgSet[] = [
  {
    id: "foundations",
    name: "Magic: The Gathering Foundations",
    releaseDate: "2024-11-15",
    packImage: "/pack-opener/packs/mtg-foundations.png",
    priceGBP: 5.99,
    cards: makeCards("Foundations", [
      { rarity: "common", names: ["Lightning Bolt", "Giant Growth", "Counterspell", "Dark Ritual", "Llanowar Elves", "Shock", "Terror", "Healing Salve"] },
      { rarity: "uncommon", names: ["Serra Angel", "Shivan Dragon", "Nightmare", "Mahamoti Djinn", "Air Elemental", "Lord of the Pit"] },
      { rarity: "rare", names: ["Black Lotus", "Mox Sapphire", "Ancestral Recall", "Time Walk", "Timetwister"] },
      { rarity: "mythic", names: ["Sol Ring Mythic", "Demonic Tutor Mythic", "Swords to Plowshares Mythic", "Force of Will Mythic"] },
    ]),
  },
  {
    id: "duskmourn-house-of-horror",
    name: "Duskmourn: House of Horror",
    releaseDate: "2024-09-27",
    packImage: "/pack-opener/packs/mtg-duskmourn.png",
    priceGBP: 5.99,
    cards: makeCards("Duskmourn", [
      { rarity: "common", names: ["Enduring Innocence", "Fear of Missing Out", "Midnight Mayhem", "Crawl Space", "Inside Story", "Phantom Interference", "Brave the Labyrinth", "Creep Show"] },
      { rarity: "uncommon", names: ["Overlord of the Balemurk", "Dollmaker's Shop", "Fear of Death", "Endure as One", "Nowhere to Run", "Final Vengeance"] },
      { rarity: "rare", names: ["The Wandering Duelist", "Glasswork Oracle", "Zimone, All-Questions Answered", "Valgavoth, Terror Eater"] },
      { rarity: "mythic", names: ["Valgavoth Mythic", "Overlord Mythic", "Glasswork Oracle Mythic", "Zimone Mythic"] },
    ]),
  },
  {
    id: "bloomburrow",
    name: "Bloomburrow",
    releaseDate: "2024-07-26",
    packImage: "/pack-opener/packs/mtg-bloomburrow.png",
    priceGBP: 5.99,
    cards: makeCards("Bloomburrow", [
      { rarity: "common", names: ["Mabel's Sureshot", "Pawpatch Formation", "Crackling Emergence", "Frantic Salvage", "Frog Out", "Lumbering Laundry", "Splash, Otter Enthusiast", "Sunshield Heron"] },
      { rarity: "uncommon", names: ["Mabel, Heir to Cragflame", "Cheeky House-Mouse", "Lumra, Bellow of the Woods", "Hazel of the Rootbloom"] },
      { rarity: "rare", names: ["Glarb, Calamity's Augur", "Ygra, Eater of All", "Mabel's Gleam", "The Infamous Cruelclaw"] },
      { rarity: "mythic", names: ["Ygra Mythic", "Glarb Mythic", "Lumra Mythic", "Zinnia Mythic"] },
    ]),
  },
  {
    id: "outlaws-of-thunder-junction",
    name: "Outlaws of Thunder Junction",
    releaseDate: "2024-04-19",
    packImage: "/pack-opener/packs/mtg-thunder-junction.png",
    priceGBP: 5.99,
    cards: makeCards("Thunder Junction", [
      { rarity: "common", names: ["Slick Sequence", "Duelist of the Mind", "Pickpocket", "Painful Quandary", "Three Steps Ahead", "Lawless Broker", "Shoot the Sheriff", "Forsaken Miner"] },
      { rarity: "uncommon", names: ["Vraska, the Silencer", "Kellan, the Daring Traveler", "Geralf, the Fleshwright", "Satoru, the Infiltrator"] },
      { rarity: "rare", names: ["Oko, the Ringleader", "Tinybones Joins Up", "Pillage the Bog", "Bad Deal"] },
      { rarity: "mythic", names: ["Oko Mythic", "Vraska Mythic", "Kellan Mythic", "Satoru Mythic"] },
    ]),
  },
  {
    id: "murders-at-karlov-manor",
    name: "Murders at Karlov Manor",
    releaseDate: "2024-02-09",
    packImage: "/pack-opener/packs/mtg-karlov-manor.png",
    priceGBP: 5.99,
    cards: makeCards("Karlov Manor", [
      { rarity: "common", names: ["Shock", "Lay Down Arms", "Summons from Beyond", "Blink of an Eye", "Deadly Cover-Up", "Cold Case Cracker", "Gleaming Geardrake", "Novice Inspector"] },
      { rarity: "uncommon", names: ["Nelly Borca, Impulsive Accuser", "Teysa Karlov", "Kaya, Spirits' Justice", "Delney, Streetwise Lookout"] },
      { rarity: "rare", names: ["Judith, Carnage Connoisseur", "Anzrag the Quake-Mole", "The Enigma Jewel", "Warleader's Call"] },
      { rarity: "mythic", names: ["Judith Mythic", "Anzrag Mythic", "Kaya Mythic", "Niv-Mizzet Mythic"] },
    ]),
  },
  {
    id: "lost-caverns-of-ixalan",
    name: "Lost Caverns of Ixalan",
    releaseDate: "2023-11-17",
    packImage: "/pack-opener/packs/mtg-ixalan.png",
    priceGBP: 5.49,
    cards: makeCards("Lost Caverns of Ixalan", [
      { rarity: "common", names: ["Attentive Skywarden", "Brazen Blademaster", "Cache Grab", "Cenote Scout", "Chirognome", "Cosmium Confluence", "Dreadmaw's Ire", "Dueling Rapier"] },
      { rarity: "uncommon", names: ["Abuelo, Ancestral Echo", "Clavileño, First of the Blessed", "Hakbal of the Surging Soul", "Quintorius Kand"] },
      { rarity: "rare", names: ["Aclazotz, Deepest Betrayal", "Sovereign Okinec Ahau", "Amalia Benavides Aguirre", "Ojer Axonil, Deepest Might"] },
      { rarity: "mythic", names: ["Aclazotz Mythic", "Sovereign Mythic", "Ojer Axonil Mythic", "Nicol Bolas Mythic"] },
    ]),
  },
  {
    id: "wilds-of-eldraine",
    name: "Wilds of Eldraine",
    releaseDate: "2023-09-08",
    packImage: "/pack-opener/packs/mtg-wilds-eldraine.png",
    priceGBP: 5.49,
    cards: makeCards("Wilds of Eldraine", [
      { rarity: "common", names: ["Brave the Wilds", "Candy Trail", "Edgewall Innkeeper", "Ferocious Werefox", "Glass Casket", "Gruff Triplets", "Hopeful Vigil", "Heartthrob"] },
      { rarity: "uncommon", names: ["Kellan, the Fae-Blooded", "Eriette of the Charmed Apple", "Rowan, Scion of War", "Tegwyll, Duke of Splendor"] },
      { rarity: "rare", names: ["Agatha's Soul Cauldron", "Beseech the Mirror", "Talion, the Kindly Lord", "Virtue of Persistence"] },
      { rarity: "mythic", names: ["Virtue of Persistence Mythic", "Talion Mythic", "Beseech Mythic", "Agatha Mythic"] },
    ]),
  },
  {
    id: "march-of-the-machine",
    name: "March of the Machine",
    releaseDate: "2023-04-21",
    packImage: "/pack-opener/packs/mtg-march-machine.png",
    priceGBP: 5.49,
    cards: makeCards("March of the Machine", [
      { rarity: "common", names: ["Archangel Elspeth", "Invasion of Alara", "Elesh Norn, Mother of Machines", "Phyrexian Obliterator", "Jin-Gitaxias, Core Augur", "Vorinclex, Monstrous Raider", "Sheoldred", "Nissa Restored"] },
      { rarity: "uncommon", names: ["Jodah, the Unifier", "Thalia and The Gitrog Monster", "Invasion of Zendikar", "Raugrin Triome"] },
      { rarity: "rare", names: ["Elesh Norn Rare", "Jin-Gitaxias Rare", "Sheoldred Rare", "Vorinclex Rare"] },
      { rarity: "mythic", names: ["Elesh Norn Mythic", "Jin-Gitaxias Mythic", "Omnath Mythic", "Wrenn and Realmbreaker"] },
    ]),
  },
  {
    id: "phyrexia-all-will-be-one",
    name: "Phyrexia: All Will Be One",
    releaseDate: "2023-02-10",
    packImage: "/pack-opener/packs/mtg-phyrexia.png",
    priceGBP: 5.49,
    cards: makeCards("Phyrexia", [
      { rarity: "common", names: ["Compleat Devotion", "Corrupted Conviction", "Experimental Augmentation", "Fang of Shigeki", "Flesh-Cult Manipulator", "Furnace Punisher", "Gitaxian Raptor", "Glistening Deluge"] },
      { rarity: "uncommon", names: ["Atraxa, Grand Unifier", "Elesh Norn", "Nissa, Ascended Animist", "Karn, Living Legacy"] },
      { rarity: "rare", names: ["All Will Be One", "The Eternal Wanderer", "Tyvar's Stand", "Melira, the Living Cure"] },
      { rarity: "mythic", names: ["Elesh Norn Mythic", "Atraxa Mythic", "Nissa Mythic", "Karn Mythic"] },
    ]),
  },
  {
    id: "the-brothers-war",
    name: "The Brothers' War",
    releaseDate: "2022-11-18",
    packImage: "/pack-opener/packs/mtg-brothers-war.png",
    priceGBP: 5.49,
    cards: makeCards("Brothers War", [
      { rarity: "common", names: ["Mishra's Research Desk", "Yotian Dissident", "Stern Lesson", "Third Path Iconoclast", "Reconstruction Chamber", "Terisiare's Devastation", "Energy Refractor", "Static Net"] },
      { rarity: "uncommon", names: ["Urza, Lord Protector", "Mishra, Claimed by Gix", "Harbin, Vanguard Aviator", "Phyrexian Dragon Engine"] },
      { rarity: "rare", names: ["Urza, Prince of Kroog", "Mishra, Tamer of Mak Fawa", "Titania, Voice of Gaea", "Ruthless Technomancer"] },
      { rarity: "mythic", names: ["Urza Mythic", "Mishra Mythic", "Titania Mythic", "Gix Mythic"] },
    ]),
  },
];

// ─── ONE PIECE SETS ────────────────────────────────────────────────────────
const onePieceSets: TcgSet[] = [
  {
    id: "op09-emperors-in-the-new-world",
    name: "Emperors In The New World",
    releaseDate: "2024-09-06",
    packImage: "/pack-opener/packs/onepiece-emperors-new-world.png",
    priceGBP: 4.49,
    cards: makeCards("Emperors In The New World", [
      { rarity: "common", names: ["Monkey D. Luffy", "Roronoa Zoro", "Nami", "Usopp", "Sanji", "Tony Tony Chopper", "Nico Robin", "Franky"] },
      { rarity: "uncommon", names: ["Charlotte Linlin", "Kaido", "Shanks", "Whitebeard", "Roger", "Garp"] },
      { rarity: "rare", names: ["Luffy Gear 5", "Zoro Three Sword Style", "Sanji Ifrit Jambe", "Big Mom Leader"] },
      { rarity: "super-rare", names: ["Kaido Full Art", "Luffy Gear 5 Full Art", "Shanks Full Art", "Roger Full Art"] },
      { rarity: "secret-rare", names: ["Luffy Secret", "Kaido Secret", "Big Mom Secret"] },
    ]),
  },
  {
    id: "op08-two-legends",
    name: "Two Legends",
    releaseDate: "2024-06-28",
    packImage: "/pack-opener/packs/onepiece-two-legends.png",
    priceGBP: 4.49,
    cards: makeCards("Two Legends", [
      { rarity: "common", names: ["Gol D. Roger", "Whitebeard", "Rayleigh", "Scopper Gaban", "Sunbell", "Crocus", "Oden Kozuki", "Toki Kozuki"] },
      { rarity: "uncommon", names: ["Roger Leader", "Whitebeard Leader", "Oden Full Bloom", "Rayleigh Commander"] },
      { rarity: "rare", names: ["Roger & Whitebeard", "Pirate King Roger", "Greatest of All Time Whitebeard"] },
      { rarity: "super-rare", names: ["Roger Full Art", "Whitebeard Full Art", "Oden Full Art"] },
      { rarity: "secret-rare", names: ["Roger Secret", "Whitebeard Secret", "Oden Secret"] },
    ]),
  },
  {
    id: "op07-500-years-in-the-future",
    name: "500 Years In The Future",
    releaseDate: "2024-03-08",
    packImage: "/pack-opener/packs/onepiece-500-years.png",
    priceGBP: 4.49,
    cards: makeCards("500 Years In The Future", [
      { rarity: "common", names: ["Jewelry Bonney", "Eustass Kid", "Trafalgar Law", "Basil Hawkins", "X Drake", "Capone Bege", "Urouge", "Scratchmen Apoo"] },
      { rarity: "uncommon", names: ["Bonney Leader", "Kid Leader", "Law Leader", "The Worst Generation"] },
      { rarity: "rare", names: ["Bonney Nika", "Luffy & Bonney", "Kid & Law Alliance"] },
      { rarity: "super-rare", names: ["Jewelry Bonney Full Art", "Eustass Kid Full Art", "Law Full Art"] },
      { rarity: "secret-rare", names: ["Bonney Secret", "Kid Secret", "Law Secret"] },
    ]),
  },
  {
    id: "op06-wings-of-the-captain",
    name: "Wings of the Captain",
    releaseDate: "2023-12-08",
    packImage: "/pack-opener/packs/onepiece-wings-captain.png",
    priceGBP: 4.49,
    cards: makeCards("Wings of the Captain", [
      { rarity: "common", names: ["Marco", "Portgas D. Ace", "Izo", "Deuce", "Vista", "Jozu", "Thatch", "Speed Jiru"] },
      { rarity: "uncommon", names: ["Marco Leader", "Ace Leader", "Thatch Commander", "Vista Commander"] },
      { rarity: "rare", names: ["Marco the Phoenix", "Ace Fire Fist", "Whitebeard & Ace"] },
      { rarity: "super-rare", names: ["Marco Full Art", "Ace Full Art", "Whitebeard Full Art"] },
      { rarity: "secret-rare", names: ["Marco Secret", "Ace Secret", "Whitebeard Secret"] },
    ]),
  },
  {
    id: "op05-awakening-of-the-new-era",
    name: "Awakening of the New Era",
    releaseDate: "2023-09-22",
    packImage: "/pack-opener/packs/onepiece-awakening.png",
    priceGBP: 4.49,
    cards: makeCards("Awakening of the New Era", [
      { rarity: "common", names: ["Trafalgar Law", "Eustass Kid", "Crocodile", "Doflamingo", "Magellan", "Ivankov", "Jinbe", "Hancock"] },
      { rarity: "uncommon", names: ["Law Warlord", "Kid Warlord", "Crocodile Warlord", "Doflamingo Warlord"] },
      { rarity: "rare", names: ["Awakened Law", "Awakened Kid", "Luffy vs Kaido"] },
      { rarity: "super-rare", names: ["Law Full Art", "Kid Full Art", "Crocodile Full Art"] },
      { rarity: "secret-rare", names: ["Luffy Secret Awakening", "Law Secret Awakening", "Kid Secret Awakening"] },
    ]),
  },
  {
    id: "op04-kingdoms-of-intrigue",
    name: "Kingdoms of Intrigue",
    releaseDate: "2023-07-28",
    packImage: "/pack-opener/packs/onepiece-kingdoms.png",
    priceGBP: 4.49,
    cards: makeCards("Kingdoms of Intrigue", [
      { rarity: "common", names: ["Monkey D. Luffy", "Vivi", "Crocodile", "Nico Robin", "Mr. 1", "Mr. 2 Bon Clay", "Cobra", "Pell"] },
      { rarity: "uncommon", names: ["Luffy vs Crocodile", "Vivi Leader", "Cobra Leader", "Sand Crocodile"] },
      { rarity: "rare", names: ["Crocodile Final Battle", "Luffy Alabasta", "Vivi Final Dance"] },
      { rarity: "super-rare", names: ["Crocodile Full Art", "Luffy Full Art Alabasta", "Vivi Full Art"] },
      { rarity: "secret-rare", names: ["Luffy Secret Alabasta", "Crocodile Secret", "Vivi Secret"] },
    ]),
  },
  {
    id: "op03-pillars-of-strength",
    name: "Pillars of Strength",
    releaseDate: "2023-05-26",
    packImage: "/pack-opener/packs/onepiece-pillars.png",
    priceGBP: 4.29,
    cards: makeCards("Pillars of Strength", [
      { rarity: "common", names: ["Franky", "Brook", "Jimbei", "Usopp", "Nami", "Tony Tony Chopper", "Roronoa Zoro", "Sanji"] },
      { rarity: "uncommon", names: ["Franky Shogun", "Brook Soul Solid", "Jinbe Fishman Karate", "Monster Trio"] },
      { rarity: "rare", names: ["Franky General Cannon", "Brook Grave Rondo", "Jinbe vs Big Mom"] },
      { rarity: "super-rare", names: ["Franky Full Art", "Brook Full Art", "Jinbe Full Art"] },
      { rarity: "secret-rare", names: ["Franky Secret", "Brook Secret", "Jinbe Secret"] },
    ]),
  },
  {
    id: "op02-paramount-war",
    name: "Paramount War",
    releaseDate: "2023-03-10",
    packImage: "/pack-opener/packs/onepiece-paramount-war.png",
    priceGBP: 4.29,
    cards: makeCards("Paramount War", [
      { rarity: "common", names: ["Portgas D. Ace", "Marco", "Whitebeard", "Garp", "Sengoku", "Crocodile", "Doflamingo", "Teach"] },
      { rarity: "uncommon", names: ["Ace Leader", "Marco Phoenix", "Whitebeard Quake", "Garp Fist"] },
      { rarity: "rare", names: ["Ace vs Teach", "Whitebeard Marineford", "Luffy & Ace"] },
      { rarity: "super-rare", names: ["Ace Full Art Paramount", "Whitebeard Full Art Paramount", "Marco Full Art"] },
      { rarity: "secret-rare", names: ["Ace Secret Paramount", "Whitebeard Secret Paramount", "Luffy Secret Paramount"] },
    ]),
  },
  {
    id: "op01-romance-dawn",
    name: "Romance Dawn",
    releaseDate: "2022-12-02",
    packImage: "/pack-opener/packs/onepiece-romance-dawn.png",
    priceGBP: 4.29,
    cards: makeCards("Romance Dawn", [
      { rarity: "common", names: ["Monkey D. Luffy", "Roronoa Zoro", "Nami", "Usopp", "Sanji", "Tony Tony Chopper", "Nico Robin", "Franky"] },
      { rarity: "uncommon", names: ["Luffy Gear 2", "Zoro Sandai Kitetsu", "Sanji Diable Jambe", "The Straw Hat Pirates"] },
      { rarity: "rare", names: ["Luffy Gear 3", "Zoro Ashura", "Sanji Raid Suit"] },
      { rarity: "super-rare", names: ["Luffy Full Art", "Zoro Full Art", "Sanji Full Art"] },
      { rarity: "secret-rare", names: ["Luffy Secret Romance", "Shanks Secret", "Roger Secret"] },
    ]),
  },
  {
    id: "op10-royal-blood",
    name: "Royal Blood",
    releaseDate: "2024-12-06",
    packImage: "/pack-opener/packs/onepiece-royal-blood.png",
    priceGBP: 4.49,
    cards: makeCards("Royal Blood", [
      { rarity: "common", names: ["Cobra", "Vivi", "Shirahoshi", "Rebecca", "Viola", "King Riku", "Hina", "Smoker"] },
      { rarity: "uncommon", names: ["Vivi Leader Royal", "Shirahoshi Leader", "Rebecca Leader", "Neptune"] },
      { rarity: "rare", names: ["Royal Bloodline", "Vivi Queen", "Shirahoshi Mermaid Princess"] },
      { rarity: "super-rare", names: ["Vivi Full Art Royal", "Shirahoshi Full Art", "Rebecca Full Art"] },
      { rarity: "secret-rare", names: ["Vivi Secret Royal", "Shirahoshi Secret", "Rebecca Secret"] },
    ]),
  },
];

// ─── DRAGON BALL SUPER SETS ────────────────────────────────────────────────
const dbsSets: TcgSet[] = [
  {
    id: "bt24-beyond-generations",
    name: "Beyond Generations",
    releaseDate: "2024-11-22",
    packImage: "/pack-opener/packs/dbs-beyond-generations.png",
    priceGBP: 4.49,
    cards: makeCards("Beyond Generations", [
      { rarity: "common", names: ["Son Goku", "Vegeta", "Piccolo", "Krillin", "Tien", "Yamcha", "Chiaotzu", "Gohan"] },
      { rarity: "uncommon", names: ["Goku Black", "Future Trunks", "Zamasu", "Gowasu", "Hit", "Cabba"] },
      { rarity: "rare", names: ["Super Saiyan Blue Goku", "Super Saiyan Blue Vegeta", "Vegito Blue", "Gogeta Blue"] },
      { rarity: "super-rare", names: ["Vegito Blue Full Art", "Gogeta Blue Full Art", "Goku Mastered Ultra Instinct Full Art"] },
      { rarity: "special-rare", names: ["Mastered UI Goku Secret", "Gogeta Blue Secret", "Broly Legendary Secret"] },
    ]),
  },
  {
    id: "bt23-perfect-combination",
    name: "Perfect Combination",
    releaseDate: "2024-08-02",
    packImage: "/pack-opener/packs/dbs-perfect-combination.png",
    priceGBP: 4.49,
    cards: makeCards("Perfect Combination", [
      { rarity: "common", names: ["Cell", "Cell Jr.", "Android 17", "Android 18", "Android 16", "Dr. Gero", "Super 17", "Hell Fighter 17"] },
      { rarity: "uncommon", names: ["Perfect Cell", "Cell Max", "Android 21", "Evil Android 21"] },
      { rarity: "rare", names: ["Perfect Cell Full Power", "Cell Max Awakened", "Android 21 Evil Form"] },
      { rarity: "super-rare", names: ["Perfect Cell Full Art", "Cell Max Full Art", "Android 21 Full Art"] },
      { rarity: "special-rare", names: ["Cell Secret Perfect", "Cell Max Secret", "Android 21 Secret"] },
    ]),
  },
  {
    id: "bt22-critical-blow",
    name: "Critical Blow",
    releaseDate: "2024-05-10",
    packImage: "/pack-opener/packs/dbs-critical-blow.png",
    priceGBP: 4.49,
    cards: makeCards("Critical Blow", [
      { rarity: "common", names: ["Son Goku", "Vegeta", "Pan", "Uub", "Majuub", "Beerus", "Whis", "Vados"] },
      { rarity: "uncommon", names: ["Goku GT", "Vegeta GT", "Super Saiyan 4 Goku", "Super Saiyan 4 Vegeta"] },
      { rarity: "rare", names: ["SS4 Gogeta", "Omega Shenron", "Goku & Pan", "Gogeta GT"] },
      { rarity: "super-rare", names: ["SS4 Gogeta Full Art", "Omega Shenron Full Art", "Goku GT Full Art"] },
      { rarity: "special-rare", names: ["SS4 Gogeta Secret", "Omega Shenron Secret", "Gogeta GT Secret"] },
    ]),
  },
  {
    id: "bt21-wild-resurgence",
    name: "Wild Resurgence",
    releaseDate: "2024-02-02",
    packImage: "/pack-opener/packs/dbs-wild-resurgence.png",
    priceGBP: 4.49,
    cards: makeCards("Wild Resurgence", [
      { rarity: "common", names: ["Broly", "Paragus", "Cheelai", "Lemo", "Wrathful Broly", "Bardock", "Gine", "Raditz"] },
      { rarity: "uncommon", names: ["Super Saiyan Broly", "Legendary SS Broly", "Broly Controlled", "Paragus Commander"] },
      { rarity: "rare", names: ["Legendary Super Saiyan Broly Full Power", "Gogeta vs Broly", "Cheelai & Broly"] },
      { rarity: "super-rare", names: ["Broly Full Art", "Gogeta Full Art Wild", "Legendary Broly Full Art"] },
      { rarity: "special-rare", names: ["Broly Secret Wild", "Gogeta Secret Wild", "Legendary Secret"] },
    ]),
  },
  {
    id: "bt20-fighter-ambition",
    name: "Fighter's Ambition",
    releaseDate: "2023-11-03",
    packImage: "/pack-opener/packs/dbs-fighters-ambition.png",
    priceGBP: 4.49,
    cards: makeCards("Fighter Ambition", [
      { rarity: "common", names: ["Gohan Beast", "Orange Piccolo", "Gamma 1", "Gamma 2", "Cell Max", "Dr. Hedo", "Shenron", "Android 18"] },
      { rarity: "uncommon", names: ["Gohan Beast Leader", "Orange Piccolo Leader", "Gohan & Piccolo", "Gamma Bros"] },
      { rarity: "rare", names: ["Gohan Beast Full Power", "Orange Piccolo Max Power", "Gohan vs Cell Max"] },
      { rarity: "super-rare", names: ["Gohan Beast Full Art", "Orange Piccolo Full Art", "Shenron Full Art"] },
      { rarity: "special-rare", names: ["Gohan Beast Secret", "Piccolo Secret Orange", "Cell Max Secret Fighter"] },
    ]),
  },
  {
    id: "bt19-mythic-booster",
    name: "Mythic Booster",
    releaseDate: "2023-08-11",
    packImage: "/pack-opener/packs/dbs-mythic-booster.png",
    priceGBP: 5.49,
    cards: makeCards("Mythic Booster", [
      { rarity: "common", names: ["Kid Goku", "Kid Vegeta", "Baby Gohan", "Baby Goten", "Kid Trunks", "Kid Uub", "Young Gohan", "Young Gotenks"] },
      { rarity: "uncommon", names: ["SS Goku Mythic", "SS Vegeta Mythic", "Gohan SSJ Mythic", "Gotenks SSJ3 Mythic"] },
      { rarity: "rare", names: ["SS3 Goku Mythic Rare", "Vegeta Majin Mythic", "Vegito Mythic"] },
      { rarity: "super-rare", names: ["Goku Mythic Full Art", "Vegeta Mythic Full Art", "Vegito Mythic Full Art"] },
      { rarity: "special-rare", names: ["Goku Mythic Secret", "Vegeta Mythic Secret", "Vegito Mythic Secret"] },
    ]),
  },
  {
    id: "bt18-dawn-of-the-z-legends",
    name: "Dawn of the Z-Legends",
    releaseDate: "2023-05-19",
    packImage: "/pack-opener/packs/dbs-dawn-z-legends.png",
    priceGBP: 4.49,
    cards: makeCards("Dawn Z-Legends", [
      { rarity: "common", names: ["Son Goku", "Son Gohan", "Piccolo", "Krillin", "Tien", "Yamcha", "Nappa", "Raditz"] },
      { rarity: "uncommon", names: ["SS Goku Z", "Frieza Final Form Z", "Vegeta Saiyan Saga Z", "Gohan Namek Z"] },
      { rarity: "rare", names: ["Goku Resurrection Z", "Frieza Golden Form", "Gohan Future Z"] },
      { rarity: "super-rare", names: ["Goku Full Art Z", "Frieza Full Art Z", "Gohan Full Art Z"] },
      { rarity: "special-rare", names: ["Goku Secret Z-Legend", "Frieza Secret Z-Legend", "Gohan Secret Z-Legend"] },
    ]),
  },
  {
    id: "bt17-ultimate-squad",
    name: "Ultimate Squad",
    releaseDate: "2023-02-24",
    packImage: "/pack-opener/packs/dbs-ultimate-squad.png",
    priceGBP: 4.49,
    cards: makeCards("Ultimate Squad", [
      { rarity: "common", names: ["Goku Universe 7", "Vegeta Universe 7", "Gohan Universe 7", "Piccolo Universe 7", "Frieza Universe 7", "Android 17 U7", "Krillin Universe 7", "Tien Universe 7"] },
      { rarity: "uncommon", names: ["Toppo God of Destruction", "Jiren Limit Breaker", "Hit Champion", "Caulifla Super Saiyan 2"] },
      { rarity: "rare", names: ["Jiren Ultra Rare", "Goku Ultra Instinct Sign", "Toppo Destroyer Form"] },
      { rarity: "super-rare", names: ["Jiren Full Art Ultimate", "Goku UI Full Art Ultimate", "Toppo Full Art"] },
      { rarity: "special-rare", names: ["Jiren Secret Ultimate", "Goku UI Secret Ultimate", "Toppo Secret Ultimate"] },
    ]),
  },
  {
    id: "bt16-realm-of-the-gods",
    name: "Realm of the Gods",
    releaseDate: "2022-11-11",
    packImage: "/pack-opener/packs/dbs-realm-gods.png",
    priceGBP: 4.49,
    cards: makeCards("Realm Gods", [
      { rarity: "common", names: ["Beerus", "Whis", "Goku SSGSS", "Vegeta SSGSS", "Champa", "Vados", "Botamo", "Magetta"] },
      { rarity: "uncommon", names: ["Beerus Leader", "SSG Goku", "Vegeta SSG", "Zamasu Fused"] },
      { rarity: "rare", names: ["Fused Zamasu Supreme", "SSB Vegito", "Beerus Supreme"] },
      { rarity: "super-rare", names: ["Vegito Blue Full Art", "Zamasu Full Art Fused", "Beerus Full Art Gods"] },
      { rarity: "special-rare", names: ["Vegito Secret Realm", "Zamasu Secret Realm", "Beerus Secret Realm"] },
    ]),
  },
  {
    id: "bt15-zenkai-series",
    name: "Zenkai Series Set 02",
    releaseDate: "2022-08-12",
    packImage: "/pack-opener/packs/dbs-zenkai-02.png",
    priceGBP: 4.49,
    cards: makeCards("Zenkai Series 02", [
      { rarity: "common", names: ["Son Goku Zenkai", "Vegeta Zenkai", "Gohan Zenkai", "Piccolo Zenkai", "Android 18 Zenkai", "Krillin Zenkai", "Trunks Zenkai", "Goten Zenkai"] },
      { rarity: "uncommon", names: ["Goku Zenkai Leader", "Vegeta Zenkai Leader", "Gohan Zenkai Leader", "Piccolo Zenkai Leader"] },
      { rarity: "rare", names: ["Zenkai Awakening Goku", "Zenkai Awakening Vegeta", "Zenkai Awakening Gohan"] },
      { rarity: "super-rare", names: ["Goku Zenkai Full Art", "Vegeta Zenkai Full Art", "Gohan Zenkai Full Art"] },
      { rarity: "special-rare", names: ["Goku Zenkai Secret", "Vegeta Zenkai Secret", "Gohan Zenkai Secret"] },
    ]),
  },
];

// ─── TCG_GAMES export ──────────────────────────────────────────────────────
export const TCG_GAMES: TcgGame[] = [
  { id: "pokemon", name: "Pokémon", icon: "🎴", sets: pokemonSets },
  { id: "yugioh", name: "Yu-Gi-Oh!", icon: "⭐", sets: yugiohSets },
  { id: "mtg", name: "Magic: The Gathering", icon: "🔮", sets: mtgSets },
  { id: "onepiece", name: "One Piece", icon: "⚓", sets: onePieceSets },
  { id: "dbs", name: "Dragon Ball Super", icon: "🐉", sets: dbsSets },
];

// ─── Rarity odds per TCG ───────────────────────────────────────────────────
const RARITY_ODDS: Record<string, RarityOdds> = {
  pokemon: { common: 55, uncommon: 30, rare: 10, holo: 3, "ultra-rare": 2 },
  yugioh: { common: 60, rare: 20, "super-rare": 12, "ultra-rare": 6, "secret-rare": 2 },
  mtg: { common: 50, uncommon: 30, rare: 15, mythic: 5 },
  onepiece: { common: 55, uncommon: 25, rare: 13, "super-rare": 5, "secret-rare": 2 },
  dbs: { common: 55, uncommon: 25, rare: 12, "super-rare": 6, "special-rare": 2 },
};

// Pack slot definitions: how many of each rarity per pack
type PackSlot = { rarity: string; count: number; orBetter?: boolean };

const PACK_SLOTS: Record<string, PackSlot[]> = {
  pokemon: [
    { rarity: "common", count: 6 },
    { rarity: "uncommon", count: 3 },
    { rarity: "rare", count: 1, orBetter: true },
  ],
  yugioh: [
    { rarity: "common", count: 5 },
    { rarity: "rare", count: 2 },
    { rarity: "super-rare", count: 1 },
    { rarity: "ultra-rare", count: 1, orBetter: true },
  ],
  mtg: [
    { rarity: "common", count: 10 },
    { rarity: "uncommon", count: 3 },
    { rarity: "rare", count: 1, orBetter: true },
    { rarity: "common", count: 1 }, // land slot
  ],
  onepiece: [
    { rarity: "common", count: 6 },
    { rarity: "uncommon", count: 3 },
    { rarity: "rare", count: 2 },
    { rarity: "super-rare", count: 1, orBetter: true },
  ],
  dbs: [
    { rarity: "common", count: 6 },
    { rarity: "uncommon", count: 3 },
    { rarity: "rare", count: 2 },
    { rarity: "super-rare", count: 1, orBetter: true },
  ],
};

// Rarity upgrade path for "orBetter" rolls
const RARITY_UPGRADES: Record<string, string[]> = {
  pokemon: ["rare", "holo", "ultra-rare"],
  yugioh: ["ultra-rare", "secret-rare"],
  mtg: ["rare", "mythic"],
  onepiece: ["super-rare", "secret-rare"],
  dbs: ["super-rare", "special-rare"],
};

function rollRarityUpgrade(baseRarity: string, tcgId: string, odds: RarityOdds): string {
  const upgrades = RARITY_UPGRADES[tcgId];
  if (!upgrades) return baseRarity;
  const idx = upgrades.indexOf(baseRarity);
  if (idx === -1) return baseRarity;

  // Roll from this rarity onwards
  const subOdds: RarityOdds = {};
  for (const r of upgrades.slice(idx)) {
    if (odds[r] !== undefined) subOdds[r] = odds[r];
  }
  const total = Object.values(subOdds).reduce((a, b) => a + b, 0);
  if (total === 0) return baseRarity;

  let roll = Math.random() * total;
  for (const [r, weight] of Object.entries(subOdds)) {
    roll -= weight;
    if (roll <= 0) return r;
  }
  return baseRarity;
}

function pickCardOfRarity(cards: TcgCard[], rarity: string): TcgCard {
  const pool = cards.filter(c => c.rarity === rarity);
  if (pool.length === 0) {
    // Fallback: any card
    return cards[Math.floor(Math.random() * cards.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getPackContents(tcgId: string, setId: string): TcgCard[] {
  const game = TCG_GAMES.find(g => g.id === tcgId);
  if (!game) return [];
  const set = game.sets.find(s => s.id === setId);
  if (!set) return [];

  const slots = PACK_SLOTS[tcgId] ?? PACK_SLOTS.pokemon;
  const odds = RARITY_ODDS[tcgId] ?? RARITY_ODDS.pokemon;
  const result: TcgCard[] = [];

  for (const slot of slots) {
    for (let i = 0; i < slot.count; i++) {
      let rarity = slot.rarity;
      if (slot.orBetter) {
        rarity = rollRarityUpgrade(slot.rarity, tcgId, odds);
      }
      result.push(pickCardOfRarity(set.cards, rarity));
    }
  }

  return result;
}
