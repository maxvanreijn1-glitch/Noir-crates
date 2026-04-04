'use strict';

// Deterministic seeded random for reproducible stock/sold values
let seed = 42;
function rand(min, max) {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  const r = ((seed >>> 0) / 0xffffffff);
  return Math.floor(r * (max - min + 1)) + min;
}

const IMAGES = ['/images/midnight.svg', '/images/studio.svg', '/images/mini.svg'];
let imgIdx = 0;
function nextImage() { return IMAGES[imgIdx++ % IMAGES.length]; }

function toSlug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function penceToDisplay(pence) {
  return '£' + (pence / 100).toFixed(2);
}

function priceFromStr(str) {
  return Math.round(parseFloat(str.replace('£','')) * 100);
}

// Varied createdAt over last 6 months from 2026-04-15
const BASE_DATE = new Date('2026-04-15');
let dateOffset = 0;
function nextDate() {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() - (dateOffset * 9 % 183));
  dateOffset++;
  return d.toISOString().split('T')[0];
}

function placeholderImages(name, count) {
  const encoded = encodeURIComponent(name.substring(0, 20));
  const imgs = [];
  for (let i = 0; i < count; i++) imgs.push(`https://placehold.co/600x600/1a1a1a/ffffff?text=${encoded}`);
  return imgs;
}

let skuCounters = { TCG: 1, BB: 1, MC: 1 };
function nextSku(cat, brand) {
  const catCode = cat === 'TCG' ? 'TCG' : cat === 'Blind Boxes' ? 'BB' : 'MC';
  const brandCode = brand.substring(0,3).toUpperCase().replace(/[^A-Z]/g,'');
  const n = skuCounters[catCode]++;
  return `NC-${catCode}-${brandCode}-${String(n).padStart(4,'0')}`;
}

// Featured set (hardcoded indices, 1-based product number)
const FEATURED_NUMS = new Set([1,3,8,10,11,17,19,47,53,67,69,76,86,95,141,147,171,187,241,249,261,263,266,280,282,292]);

let productNum = 0;

function build({ name, priceStr, subcategory, category, brand, type, rarity, badge, contents, tagline, description, featured }) {
  productNum++;
  const price = priceFromStr(priceStr);
  const slug = toSlug(name);
  const id = 'nc-' + slug;
  const sku = nextSku(category, brand);
  const stock = rand(5, 100);
  const sold = rand(2, 50);
  const feat = featured || FEATURED_NUMS.has(productNum) || false;
  const imgCount = rand(2, 4);
  return {
    id,
    sku,
    slug,
    name,
    tagline: tagline || name + ' — a premium collector item.',
    description: description || `${name} is a must-have for collectors. Each item is carefully curated and shipped in protective packaging. Perfect for fans and competitive players alike.`,
    category,
    subcategory,
    price,
    priceDisplay: penceToDisplay(price),
    image: nextImage(),
    images: placeholderImages(name, imgCount),
    stock,
    inStock: stock > 0,
    contents: contents || ['Premium collector item', 'Protective packaging', 'Authenticity card'],
    attributes: { brand, type, rarity },
    badge: badge || undefined,
    badges: badge ? [badge] : [],
    featured: feat,
    sold_this_week: sold,
    createdAt: nextDate(),
    stripePrice: undefined,
  };
}

const products = [];

// ── TCG POKÉMON ──────────────────────────────────────────────────────────────
// Booster Boxes (10)
const pkmBB = [
  { name: 'Scarlet & Violet Booster Box', priceStr: '£139.99', badge: 'Best Seller' },
  { name: 'Paldea Evolved Booster Box', priceStr: '£129.99' },
  { name: 'Obsidian Flames Booster Box', priceStr: '£134.99', badge: 'Hot Item' },
  { name: 'Paradox Rift Booster Box', priceStr: '£139.99' },
  { name: 'Temporal Forces Booster Box', priceStr: '£129.99' },
  { name: 'Twilight Masquerade Booster Box', priceStr: '£134.99' },
  { name: 'Stellar Crown Booster Box', priceStr: '£129.99' },
  { name: 'Surging Sparks Booster Box', priceStr: '£139.99' },
  { name: 'Prismatic Evolution Booster Box', priceStr: '£144.99', badge: 'New' },
  { name: 'Pokémon 151 Booster Box', priceStr: '£149.99', badge: 'Limited Edition' },
];
pkmBB.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Booster Boxes', brand: 'Pokémon', type: 'Booster Box', rarity: 'Standard', tagline: `${p.name} — 36 booster packs of the latest Pokémon set.`, description: `The ${p.name} contains 36 booster packs, giving you the best chance at pulling rare and secret rare cards. Each pack contains 10 cards including at least one holo or better. An essential buy for collectors and competitive players.`, contents: ['36 Booster Packs', 'Display Box', 'Collector checklist'] })));

// ETBs (8)
const pkmETB = [
  { name: 'Scarlet & Violet Elite Trainer Box', priceStr: '£64.99' },
  { name: 'Obsidian Flames Charizard Elite Trainer Box', priceStr: '£67.99', badge: 'Hot Item' },
  { name: 'Paradox Rift Roaring Moon Elite Trainer Box', priceStr: '£62.99' },
  { name: 'Temporal Forces Walking Wake Elite Trainer Box', priceStr: '£59.99' },
  { name: 'Twilight Masquerade Greninja Elite Trainer Box', priceStr: '£64.99' },
  { name: 'Stellar Crown Terapagos Elite Trainer Box', priceStr: '£64.99' },
  { name: 'Surging Sparks Pikachu Elite Trainer Box', priceStr: '£67.99' },
  { name: 'Prismatic Evolution Eevee Elite Trainer Box', priceStr: '£69.99', badge: 'New' },
];
pkmETB.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Elite Trainer Boxes', brand: 'Pokémon', type: 'Elite Trainer Box', rarity: 'Premium', tagline: `${p.name} — everything a trainer needs.`, description: `The ${p.name} includes 9 booster packs, a full-art promo card, 65 card sleeves, 45 energy cards, and essential accessories. The ultimate training kit for serious Pokémon players.`, contents: ['9 Booster Packs', 'Promo Card', '65 Card Sleeves', '45 Energy Cards', 'Accessories'] })));

// Collection Boxes (8)
const pkmCB = [
  { name: 'Charizard ex Premium Collection Box', priceStr: '£69.99', badge: 'Popular' },
  { name: 'Mew ex Premium Collection Box', priceStr: '£59.99' },
  { name: 'Rayquaza ex Premium Collection Box', priceStr: '£64.99' },
  { name: 'Mewtwo ex Premium Collection Box', priceStr: '£59.99' },
  { name: 'Miraidon ex Premium Collection Box', priceStr: '£54.99' },
  { name: 'Koraidon ex Premium Collection Box', priceStr: '£54.99' },
  { name: 'Eevee & Friends Collection Box', priceStr: '£49.99' },
  { name: 'Pikachu ex Premium Collection Box', priceStr: '£59.99' },
];
pkmCB.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Collection Boxes', brand: 'Pokémon', type: 'Collection Box', rarity: 'Premium', tagline: `${p.name} — featuring the iconic Pokémon ex card.`, description: `The ${p.name} features a stunning oversized promo card and a foil promo card alongside multiple booster packs. Perfect for showcasing your favourite Pokémon.`, contents: ['Oversized Promo Card', 'Foil Promo Card', '4 Booster Packs', 'Coin'] })));

// Tins (7)
const pkmTins = [
  { name: 'Charizard ex Ultra-Premium Battle Tin', priceStr: '£44.99', badge: 'Best Seller' },
  { name: 'Garchomp ex Battle Tin', priceStr: '£34.99' },
  { name: 'Lucario ex Battle Tin', priceStr: '£34.99' },
  { name: 'Meowscarada ex Battle Tin', priceStr: '£32.99' },
  { name: 'Skeledirge ex Battle Tin', priceStr: '£32.99' },
  { name: 'Quaquaval ex Battle Tin', priceStr: '£32.99' },
  { name: 'Roaring Moon ex Battle Tin', priceStr: '£39.99' },
];
pkmTins.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Tins', brand: 'Pokémon', type: 'Tin', rarity: 'Standard', tagline: `${p.name} — premium storage with packs included.`, description: `The ${p.name} comes with 3 booster packs and a foil promo card, all inside a collectible metal tin perfect for storing your decks and cards.`, contents: ['3 Booster Packs', 'Foil Promo Card', 'Collectible Metal Tin'] })));

// Bundles (7)
const pkmBundles = [
  { name: 'Scarlet & Violet Three-Pack Blister Bundle', priceStr: '£27.99' },
  { name: 'Paldean Starters Bundle Pack', priceStr: '£29.99' },
  { name: 'Tera Blast Bundle', priceStr: '£34.99' },
  { name: 'Paradox Pack Duo Bundle', priceStr: '£32.99' },
  { name: 'Paldea Mini Tin Bundle Set', priceStr: '£36.99' },
  { name: 'Pokémon TCG Classic Bundle Set', priceStr: '£38.99' },
  { name: 'Scarlet & Violet Build & Battle Bundle', priceStr: '£24.99' },
];
pkmBundles.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Bundles', brand: 'Pokémon', type: 'Bundle', rarity: 'Standard', tagline: `${p.name} — great value for new and experienced collectors.`, description: `The ${p.name} bundles together multiple Pokémon TCG products at a great price. Ideal for gifting or expanding your collection quickly.`, contents: ['Multiple Booster Packs', 'Promo Card', 'Collector packaging'] })));

// ── TCG YU-GI-OH ──────────────────────────────────────────────────────────────
// Booster Boxes (7)
const ygoBB = [
  { name: 'Phantom Nightmare Booster Box', priceStr: '£119.99' },
  { name: 'Rage of the Abyss Booster Box', priceStr: '£114.99' },
  { name: 'Legacy of Destruction Booster Box', priceStr: '£119.99' },
  { name: 'Age of Overlord Booster Box', priceStr: '£109.99' },
  { name: 'Cyberstorm Access Booster Box', priceStr: '£109.99' },
  { name: 'Darkwing Blast Booster Box', priceStr: '£104.99' },
  { name: 'Wild Survivors Booster Box', priceStr: '£109.99' },
];
ygoBB.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Booster Boxes', brand: 'Yu-Gi-Oh', type: 'Booster Box', rarity: 'Standard', tagline: `${p.name} — 24 packs of competitive Yu-Gi-Oh.`, description: `The ${p.name} contains 24 booster packs each with 9 cards. Each box guarantees multiple ultra rares and secret rares for deck building and collection.`, contents: ['24 Booster Packs', 'Display Box', 'Set checklist'] })));

// Structure Decks (5)
const ygoSD = [
  { name: 'Fire Kings Structure Deck', priceStr: '£29.99' },
  { name: 'Legend of the Crystal Beasts Structure Deck', priceStr: '£27.99' },
  { name: 'Albaz Strike Structure Deck', priceStr: '£27.99' },
  { name: 'Dinosmashers Fury Structure Deck', priceStr: '£29.99' },
  { name: 'Beware of Traptrix Structure Deck', priceStr: '£27.99' },
];
ygoSD.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Structure Decks', brand: 'Yu-Gi-Oh', type: 'Structure Deck', rarity: 'Standard', tagline: `${p.name} — a ready-to-play competitive deck.`, description: `The ${p.name} is a complete 43-card pre-built deck themed around a powerful archetype. Perfect for new players or veterans wanting to try a new strategy.`, contents: ['43-card Main Deck', 'Extra Deck Cards', 'Token Cards', 'Rulebook'] })));

// Tins (5)
const ygoTins = [
  { name: '2024 Mega Tin of the Pharaohs Gods', priceStr: '£44.99', badge: 'Limited Edition' },
  { name: '2023 Mega Tin of the Pharaohs Gods', priceStr: '£39.99' },
  { name: 'Duelist Nexus Mega Tin', priceStr: '£37.99' },
  { name: 'Speed Duel Tri-Horned Dragon Tin', priceStr: '£32.99' },
  { name: 'Battles of Legend Monstrous Revenge Tin', priceStr: '£34.99' },
];
ygoTins.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Tins', brand: 'Yu-Gi-Oh', type: 'Tin', rarity: 'Premium', tagline: `${p.name} — mega-sized collector tin with exclusives.`, description: `The ${p.name} is a premium collector tin containing multiple mega-packs with exclusive alternate art cards. A fantastic gift for any duelist.`, contents: ['2 Mega-Packs', 'Alternate Art Promo Card', 'Collectible Tin'] })));

// Bundles (3)
const ygoBundles = [
  { name: 'Speed Duel Starter Decks Bundle', priceStr: '£27.99' },
  { name: 'Legendary Duelists Rage of Ra Bundle', priceStr: '£29.99' },
  { name: 'Yu-Gi-Oh Beginners Box Set Bundle', priceStr: '£34.99' },
];
ygoBundles.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Bundles', brand: 'Yu-Gi-Oh', type: 'Bundle', rarity: 'Standard', tagline: `${p.name} — great value for duelists of all levels.`, description: `The ${p.name} combines multiple Yu-Gi-Oh products at a discounted bundle price. Whether you're new or experienced, this bundle has something for every duelist.`, contents: ['Multiple Decks/Packs', 'Promo Items', 'Bundle packaging'] })));

// ── TCG ONE PIECE ──────────────────────────────────────────────────────────────
// Booster Boxes (7)
const opBB = [
  { name: 'OP01 Romance Dawn Booster Box', priceStr: '£109.99' },
  { name: 'OP02 Paramount War Booster Box', priceStr: '£114.99' },
  { name: 'OP03 Pillars of Strength Booster Box', priceStr: '£119.99' },
  { name: 'OP04 Kingdoms of Intrigue Booster Box', priceStr: '£124.99' },
  { name: 'OP05 Awakening of the New Era Booster Box', priceStr: '£119.99' },
  { name: 'OP06 Wings of the Captain Booster Box', priceStr: '£124.99' },
  { name: 'OP07 500 Years in the Future Booster Box', priceStr: '£129.99' },
];
opBB.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Booster Boxes', brand: 'One Piece', type: 'Booster Box', rarity: 'Standard', tagline: `${p.name} — 24 packs of One Piece TCG action.`, description: `The ${p.name} contains 24 booster packs from the One Piece Card Game. Build your crew and find powerful Leader, Character, and Event cards to dominate your opponents.`, contents: ['24 Booster Packs', 'Display Box', 'Set checklist'] })));

// Collection Boxes (4)
const opCB = [
  { name: 'Roronoa Zoro Special Collection Box', priceStr: '£59.99' },
  { name: 'Monkey D Luffy Premium Collection Box', priceStr: '£64.99' },
  { name: 'Nami & Robin Starter Collection Box', priceStr: '£49.99' },
  { name: 'Straw Hat Pirates Deluxe Collection Box', priceStr: '£69.99' },
];
opCB.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Collection Boxes', brand: 'One Piece', type: 'Collection Box', rarity: 'Premium', tagline: `${p.name} — featuring iconic Straw Hat crew cards.`, description: `The ${p.name} features exclusive promo cards and booster packs celebrating the iconic characters of the One Piece universe. A perfect collectible for fans of the anime and the card game.`, contents: ['Promo Cards', '4 Booster Packs', 'Collector packaging', 'Art Card'] })));

// Tins (2)
const opTins = [
  { name: 'One Piece TCG Premium Card Tin', priceStr: '£34.99' },
  { name: 'ACE Leader Special Card Tin', priceStr: '£32.99' },
];
opTins.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Tins', brand: 'One Piece', type: 'Tin', rarity: 'Standard', tagline: `${p.name} — premium storage with exclusive cards.`, description: `The ${p.name} is a collectible metal tin featuring exclusive promo cards and booster packs. A great gift for any One Piece TCG player.`, contents: ['2 Booster Packs', 'Exclusive Promo Card', 'Collectible Tin'] })));

// Bundles (2)
const opBundles = [
  { name: 'One Piece TCG Starter Bundle', priceStr: '£27.99' },
  { name: 'One Piece Three-Pack Booster Bundle', priceStr: '£29.99' },
];
opBundles.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Bundles', brand: 'One Piece', type: 'Bundle', rarity: 'Standard', tagline: `${p.name} — the ideal way to start your One Piece collection.`, description: `The ${p.name} brings together great One Piece TCG products at a bundled price. Perfect for newcomers or as a gift for fans.`, contents: ['Starter Deck/Packs', 'Promo Item', 'Bundle packaging'] })));

// ── TCG LORCANA ──────────────────────────────────────────────────────────────
// Booster Boxes (4)
const lorcBB = [
  { name: 'The First Chapter Booster Box', priceStr: '£129.99' },
  { name: 'Rise of the Floodborn Booster Box', priceStr: '£124.99' },
  { name: 'Into the Inklands Booster Box', priceStr: '£119.99' },
  { name: 'Ursulas Return Booster Box', priceStr: '£124.99' },
];
lorcBB.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Booster Boxes', brand: 'Lorcana', type: 'Booster Box', rarity: 'Standard', tagline: `${p.name} — 24 packs of Disney Lorcana magic.`, description: `The ${p.name} contains 24 booster packs from the Disney Lorcana trading card game. Discover glimmer cards featuring your favourite Disney characters in breathtaking art.`, contents: ['24 Booster Packs', 'Display Box', 'Set checklist'] })));

// Illumineer's Troves (3)
const lorcIT = [
  { name: "The First Chapter Illumineers Trove", priceStr: '£129.99', badge: 'Popular' },
  { name: "Rise of the Floodborn Illumineers Trove", priceStr: '£124.99' },
  { name: "Into the Inklands Illumineers Trove", priceStr: '£119.99' },
];
lorcIT.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: "Illumineer's Troves", brand: 'Lorcana', type: "Illumineer's Trove", rarity: 'Premium', tagline: `${p.name} — the ultimate Lorcana collector set.`, description: `The ${p.name} is a premium all-in-one set featuring 8 booster packs, a collector's card portfolio, card sleeves, and exclusive promo cards. The perfect gift for any Disney Lorcana fan.`, contents: ['8 Booster Packs', "Collector's Portfolio", 'Card Sleeves', 'Promo Cards'] })));

// Starter Decks (3)
const lorcSD = [
  { name: 'Amber & Amethyst Starter Deck Bundle', priceStr: '£29.99' },
  { name: 'Emerald & Ruby Starter Deck Bundle', priceStr: '£27.99' },
  { name: 'Sapphire & Steel Starter Deck Bundle', priceStr: '£27.99' },
];
lorcSD.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Starter Decks', brand: 'Lorcana', type: 'Starter Deck', rarity: 'Standard', tagline: `${p.name} — learn to play Disney Lorcana.`, description: `The ${p.name} contains two 60-card pre-built decks ready to play right out of the box. Perfect for new players wanting to learn the game or experienced players exploring new ink combinations.`, contents: ['2x 60-Card Decks', 'Quick-Start Guide', 'Lore Counters', 'Rulebook'] })));

// ── TCG MAGIC THE GATHERING ──────────────────────────────────────────────────
// Draft Booster Boxes (5)
const mtgDBB = [
  { name: 'The Lord of the Rings Draft Booster Box', priceStr: '£149.99', badge: 'Best Seller' },
  { name: 'Wilds of Eldraine Draft Booster Box', priceStr: '£129.99' },
  { name: 'Lost Caverns of Ixalan Draft Booster Box', priceStr: '£134.99' },
  { name: 'Murders at Karlov Manor Draft Booster Box', priceStr: '£129.99' },
  { name: 'Outlaws of Thunder Junction Draft Booster Box', priceStr: '£134.99' },
];
mtgDBB.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Draft Booster Boxes', brand: 'Magic The Gathering', type: 'Draft Booster Box', rarity: 'Standard', tagline: `${p.name} — 36 packs for draft play and collection.`, description: `The ${p.name} contains 36 Draft Booster packs, each with 15 cards optimised for booster draft play. The best way to experience a new MTG set and hunt for rare and mythic rare cards.`, contents: ['36 Draft Booster Packs', 'Display Box', 'Set checklist'] })));

// Set Booster Boxes (4)
const mtgSBB = [
  { name: 'March of the Machine Set Booster Box', priceStr: '£134.99' },
  { name: 'Phyrexia All Will Be One Set Booster Box', priceStr: '£129.99' },
  { name: 'Dominaria United Set Booster Box', priceStr: '£124.99' },
  { name: 'The Brothers War Set Booster Box', priceStr: '£124.99' },
];
mtgSBB.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Set Booster Boxes', brand: 'Magic The Gathering', type: 'Set Booster Box', rarity: 'Standard', tagline: `${p.name} — enhanced opening experience with guaranteed hits.`, description: `The ${p.name} contains 30 Set Booster packs designed for the best opening experience. Each pack guarantees an art card, a special treatment card, and at least one rare or better.`, contents: ['30 Set Booster Packs', 'Display Box', 'Set checklist'] })));

// Collector Booster Boxes (4)
const mtgCBB = [
  { name: 'Modern Horizons 3 Collector Booster Box', priceStr: '£299.99', badge: 'Premium' },
  { name: 'Bloomburrow Collector Booster Box', priceStr: '£249.99' },
  { name: 'Duskmourn House of Horror Collector Booster Box', priceStr: '£249.99' },
  { name: 'Foundations Collector Booster Box', priceStr: '£249.99' },
];
mtgCBB.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Collector Booster Boxes', brand: 'Magic The Gathering', type: 'Collector Booster Box', rarity: 'Premium', tagline: `${p.name} — the pinnacle of MTG collecting.`, description: `The ${p.name} contains 12 Collector Booster packs, each packed with foils, extended arts, and serialised cards. Every pack is loaded with the rarest and most visually stunning cards from the set.`, contents: ['12 Collector Booster Packs', 'Display Box', 'Premium packaging'] })));

// Bundles (2)
const mtgBundles = [
  { name: 'Wilds of Eldraine Bundle', priceStr: '£39.99' },
  { name: 'Lost Caverns of Ixalan Bundle', priceStr: '£39.99' },
];
mtgBundles.forEach(p => products.push(build({ ...p, category: 'TCG', subcategory: 'Bundles', brand: 'Magic The Gathering', type: 'Bundle', rarity: 'Standard', tagline: `${p.name} — 8 packs plus lands and accessories.`, description: `The ${p.name} contains 8 Set Booster packs, 40 basic lands with new art, an oversized spindown life counter, and a card storage box. Excellent value for any MTG player.`, contents: ['8 Set Booster Packs', '40 Basic Lands', 'Spindown Die', 'Card Storage Box'] })));

// ── BLIND BOXES ANIME ──────────────────────────────────────────────────────────
const animeItems = [
  { name: 'Naruto Shippuden Mystery Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Naruto Uzumaki Keychain Blind Pack', priceStr: '£9.99', type: 'Keychain' },
  { name: 'Hidden Leaf Village Badge Set', priceStr: '£8.99', type: 'Badge Set' },
  { name: 'One Piece Mystery Figure Box Luffy Edition', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Straw Hat Crew Mini Figures Set', priceStr: '£24.99', type: 'Multi-Pack' },
  { name: 'Wanted Poster Blind Badge Pack', priceStr: '£8.99', type: 'Badge Pack' },
  { name: 'Dragon Ball Z Super Saiyan Figure Box', priceStr: '£15.99', type: 'Figure Box' },
  { name: 'Goku & Vegeta Battle Pack', priceStr: '£27.99', type: 'Multi-Pack' },
  { name: 'Dragon Ball Heroes Keychain Set', priceStr: '£9.99', type: 'Keychain' },
  { name: 'Attack on Titan Mystery Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Survey Corps Blind Badge Pack', priceStr: '£8.99', type: 'Badge Pack' },
  { name: 'Titan Hunters Mini Figures Set', priceStr: '£22.99', type: 'Multi-Pack' },
  { name: 'Gojo Satoru Mystery Figure Box', priceStr: '£15.99', type: 'Figure Box' },
  { name: 'Yuji Itadori Collector Figure Box', priceStr: '£15.99', type: 'Figure Box' },
  { name: 'Cursed Spirit Keychain Blind Pack', priceStr: '£9.99', type: 'Keychain' },
  { name: 'Demon Slayer Mystery Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Hashira Collection Blind Box Series', priceStr: '£24.99', type: 'Multi-Pack' },
  { name: 'Breathing Techniques Badge Blind Pack', priceStr: '£8.99', type: 'Badge Pack' },
  { name: 'My Hero Academia Mystery Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Pro Heroes Collector Multi-Pack', priceStr: '£27.99', type: 'Multi-Pack' },
  { name: 'UA High Students Badge Set', priceStr: '£8.99', type: 'Badge Set' },
  { name: 'Tokyo Revengers Mikey Mystery Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Tokyo Manji Gang Keychain Blind Pack', priceStr: '£9.99', type: 'Keychain' },
  { name: 'Chainsaw Man Mystery Figure Box', priceStr: '£15.99', type: 'Figure Box' },
  { name: 'Chainsaw Man Blind Badge Set', priceStr: '£8.99', type: 'Badge Set' },
  { name: 'Bleach Ichigo Mystery Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Gotei 13 Captains Mini Figures Blind Set', priceStr: '£22.99', type: 'Multi-Pack' },
  { name: 'Hunter x Hunter Gon & Killua Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Phantom Troupe Keychain Blind Pack', priceStr: '£9.99', type: 'Keychain' },
  { name: 'Kirito Sword Art Online Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Asuna Knights of the Blood Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Rem Re Zero Mystery Figure Box', priceStr: '£15.99', type: 'Figure Box' },
  { name: 'Subaru & Ram Keychain Blind Pack', priceStr: '£9.99', type: 'Keychain' },
  { name: 'Anya Forger Spy x Family Mystery Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Forger Family Mini Figures Blind Pack', priceStr: '£19.99', type: 'Multi-Pack' },
  { name: 'Haikyuu Hinata & Kageyama Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Karasuno Volleyball Team Blind Box', priceStr: '£22.99', type: 'Multi-Pack' },
  { name: 'Haikyuu Jump Sets Blind Badge Pack', priceStr: '£8.99', type: 'Badge Pack' },
  { name: 'Edward Elric FMA Mystery Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'FMA Brotherhood Blind Badge Set', priceStr: '£8.99', type: 'Badge Set' },
];
animeItems.forEach(p => products.push(build({ ...p, category: 'Blind Boxes', subcategory: 'Anime', brand: 'Anime Collectibles', rarity: 'Mystery', tagline: `${p.name} — mystery anime collectible.`, description: `The ${p.name} is a mystery blind box featuring characters from the iconic anime series. Each box contains a surprise figure or item — you won't know what you get until you open it!`, contents: ['1 Mystery Item', 'Collectible packaging', 'Character card'] })));

// ── BLIND BOXES GAMING ──────────────────────────────────────────────────────────
const gamingItems = [
  { name: 'PlayStation Icons Mystery Figure Box', priceStr: '£15.99', type: 'Figure Box' },
  { name: 'Spider-Man PS4 Exclusive Figure Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'God of War Kratos Mystery Figure Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'The Last of Us Survivors Figure Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Final Fantasy VII Cloud Figure Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Horizon Zero Dawn Aloy Figure Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Super Mario & Friends Mystery Figure Box', priceStr: '£15.99', type: 'Figure Box' },
  { name: 'Legend of Zelda Link Figure Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Pokemon Nintendo Switch Accessories Box', priceStr: '£14.99', type: 'Accessories Box' },
  { name: 'Kirby Star Allies Mini Figures Blind Pack', priceStr: '£13.99', type: 'Multi-Pack' },
  { name: 'Splatoon Inkling Callie & Marie Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Animal Crossing New Horizons Villager Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Halo Master Chief Mystery Figure Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Halo UNSC Spartan Keychain Blind Pack', priceStr: '£9.99', type: 'Keychain' },
  { name: 'Banjo-Kazooie Retro Figure Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Xbox Retro Legends Badge Set', priceStr: '£8.99', type: 'Badge Set' },
  { name: 'SNES Controller Keychain Blind Pack', priceStr: '£9.99', type: 'Keychain' },
  { name: 'Retro Pixel Art Mystery Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Pac-Man & Friends Retro Box', priceStr: '£15.99', type: 'Figure Box' },
  { name: 'Classic Arcade Heroes Badge Set', priceStr: '£8.99', type: 'Badge Set' },
  { name: 'Retro Game Cartridge Sticker Blind Pack', priceStr: '£9.99', type: 'Sticker Pack' },
  { name: 'Steam Deck Gaming Accessories Blind Box', priceStr: '£14.99', type: 'Accessories Box' },
  { name: 'PC Master Race Figure Mystery Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Team Fortress 2 Character Figure Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'CSGO Tactical Knife Sticker Blind Pack', priceStr: '£9.99', type: 'Sticker Pack' },
  { name: 'Overwatch 2 Heroes Mystery Figure Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Among Us Mystery Crew Figure Box', priceStr: '£13.99', type: 'Figure Box' },
  { name: 'Hollow Knight Figure & Charm Box', priceStr: '£15.99', type: 'Figure Box' },
  { name: 'Undertale Frisk & Friends Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Stardew Valley Farming Life Figure Box', priceStr: '£14.99', type: 'Figure Box' },
];
gamingItems.forEach(p => products.push(build({ ...p, category: 'Blind Boxes', subcategory: 'Gaming', brand: 'Gaming Collectibles', rarity: 'Mystery', tagline: `${p.name} — mystery gaming collectible.`, description: `The ${p.name} is a mystery blind box celebrating iconic video game characters and franchises. Each box contains a surprise collectable — part of a series to collect and complete.`, contents: ['1 Mystery Item', 'Collectible packaging', 'Series card'] })));

// ── BLIND BOXES COLLECTIBLES ──────────────────────────────────────────────────
const collectiblesItems = [
  { name: 'Batman Noir Collector Figure Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Spider-Man Into the Spider-Verse Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Iron Man Mark XLII Collector Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Wonder Woman Gold Variant Figure Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Thor Ragnarok Mystery Figure Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Joker Exclusive Collector Figure Box', priceStr: '£18.99', type: 'Figure Box' },
  { name: 'Captain America Shield Mystery Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Black Panther Vibranium Edition Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Rick & Morty Mystery Figure Box', priceStr: '£15.99', type: 'Figure Box' },
  { name: 'Adventure Time Character Mystery Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Steven Universe Crystal Gems Figure Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Regular Show Mordecai & Rigby Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'Gravity Falls Mystery Collector Box', priceStr: '£15.99', type: 'Figure Box' },
  { name: 'Avatar The Last Airbender Aang Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Futurama Character Mystery Box', priceStr: '£14.99', type: 'Figure Box' },
  { name: 'X-Men First Class Collector Figure Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Avengers Assembly Mystery Figure Box', priceStr: '£18.99', type: 'Figure Box' },
  { name: 'DC Heroes Origins Collector Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Spawn Series 1 Mystery Figure Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Judge Dredd Mega-City Collector Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Game of Thrones Dragons Collector Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Lord of the Rings Fellowship Figure Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Star Wars Mandalorian Mystery Box', priceStr: '£18.99', type: 'Figure Box' },
  { name: 'Dune Arrakis Collector Figure Box', priceStr: '£16.99', type: 'Figure Box' },
  { name: 'Cyberpunk 2077 Night City Figure Box', priceStr: '£17.99', type: 'Figure Box' },
  { name: 'Noir Street Art Limited Figure Series', priceStr: '£19.99', type: 'Figure Box', badge: 'Limited Edition' },
  { name: 'Monochrome Abstract Collector Figure Box', priceStr: '£18.99', type: 'Figure Box' },
  { name: 'Wabi-Sabi Limited Edition Figure Box', priceStr: '£19.99', type: 'Figure Box', badge: 'Limited Edition' },
  { name: 'Crystal Clear Series 1 Mystery Box', priceStr: '£18.99', type: 'Figure Box' },
  { name: 'Obsidian Dark Edition Collector Box', priceStr: '£21.99', type: 'Figure Box' },
];
collectiblesItems.forEach(p => products.push(build({ ...p, category: 'Blind Boxes', subcategory: 'Collectibles', brand: 'Pop Culture Collectibles', rarity: 'Mystery', tagline: `${p.name} — premium pop culture collectible.`, description: `The ${p.name} is a mystery blind box featuring iconic characters from popular culture. Each box reveals a high-quality collector figure in surprise packaging.`, contents: ['1 Mystery Collector Figure', 'Collectible packaging', 'Authentication card'] })));

// ── MYSTERY CRATES BRONZE ──────────────────────────────────────────────────────
const bronzeItems = [
  { name: 'Pokemon Starter Bronze Mystery Crate', priceStr: '£27.99' },
  { name: 'Yu-Gi-Oh Duelist Bronze Mystery Crate', priceStr: '£28.99' },
  { name: 'One Piece Explorer Bronze Crate', priceStr: '£27.99' },
  { name: 'Mystery TCG Sampler Bronze Crate', priceStr: '£29.99' },
  { name: 'Anime Collectibles Bronze Crate', priceStr: '£26.99' },
  { name: 'Retro Gaming Starter Bronze Crate', priceStr: '£27.99' },
  { name: 'Magic The Gathering Entry Bronze Crate', priceStr: '£29.99' },
  { name: 'Blind Box Sampler Bronze Crate', priceStr: '£25.99' },
  { name: 'First Collection Bronze Crate', priceStr: '£25.99' },
  { name: 'TCG Taster Bronze Crate', priceStr: '£27.99' },
  { name: 'Lorcana Beginners Bronze Crate', priceStr: '£28.99' },
  { name: 'Dragon Ball Z Fans Bronze Crate', priceStr: '£26.99' },
  { name: 'Nintendo Fans Starter Bronze Crate', priceStr: '£27.99' },
  { name: 'Marvel Heroes Bronze Crate', priceStr: '£26.99' },
  { name: 'Ninja World Bronze Starter Crate', priceStr: '£27.99' },
  { name: 'Surprise Shuffle Bronze Crate', priceStr: '£29.99' },
  { name: 'Trainers Choice Bronze Crate', priceStr: '£28.99' },
  { name: 'Wild Card Mystery Bronze Crate', priceStr: '£29.99' },
  { name: 'First Pull Bronze Collector Crate', priceStr: '£25.99' },
  { name: 'Discovery Bronze Exploration Crate', priceStr: '£27.99' },
];
bronzeItems.forEach(p => products.push(build({ ...p, category: 'Mystery Crates', subcategory: 'Bronze Tier', brand: 'Noir Crates', type: 'Mystery Crate', rarity: 'Bronze', tagline: `${p.name} — your entry into mystery collecting.`, description: `The ${p.name} is a curated Bronze Tier mystery crate packed with 2-3 TCG or collectible items. A fantastic entry point for new collectors looking to discover new favourites.`, contents: ['2-3 Mystery Items', 'Curated collector picks', 'Branded packaging', 'Collector info card'] })));

// ── MYSTERY CRATES SILVER ──────────────────────────────────────────────────────
const silverItems = [
  { name: 'Pokemon Silver Adventure Crate', priceStr: '£64.99' },
  { name: 'Yu-Gi-Oh Silver Duelist Crate', priceStr: '£59.99' },
  { name: 'Anime Collector Silver Crate', priceStr: '£64.99' },
  { name: 'TCG Variety Silver Crate', priceStr: '£69.99' },
  { name: 'Gaming Legends Silver Crate', priceStr: '£64.99' },
  { name: 'One Piece Grand Voyage Silver Crate', priceStr: '£59.99' },
  { name: 'Lorcana Dreamborn Silver Crate', priceStr: '£64.99' },
  { name: 'MTG Spellbook Silver Crate', priceStr: '£69.99' },
  { name: 'Double Mystery Silver Crate', priceStr: '£74.99' },
  { name: 'Rare Pull Silver Crate', priceStr: '£79.99' },
  { name: 'Heroes Unite Silver Crate', priceStr: '£64.99' },
  { name: 'Forbidden Legends Silver Crate', priceStr: '£74.99' },
  { name: 'Midnight Hunt Silver Crate', priceStr: '£69.99' },
  { name: 'Shining Treasures Silver Crate', priceStr: '£64.99' },
  { name: 'Battle Ready Silver Crate', priceStr: '£59.99' },
  { name: 'Collectors Journey Silver Crate', priceStr: '£64.99' },
  { name: 'Mystic Draws Silver Crate', priceStr: '£74.99' },
  { name: 'Shadow Realms Silver Crate', priceStr: '£79.99' },
  { name: 'Platinum Preview Silver Crate', priceStr: '£84.99' },
  { name: 'Rising Stars Silver Crate', priceStr: '£59.99' },
];
silverItems.forEach(p => products.push(build({ ...p, category: 'Mystery Crates', subcategory: 'Silver Tier', brand: 'Noir Crates', type: 'Mystery Crate', rarity: 'Silver', tagline: `${p.name} — elevated mystery with premium picks.`, description: `The ${p.name} is a curated Silver Tier mystery crate containing 3-5 premium TCG or collectible items. Expect booster packs, accessories, and at least one premium item guaranteed.`, contents: ['3-5 Mystery Items', 'At least 1 premium item', 'Curated collector picks', 'Branded packaging'] })));

// ── MYSTERY CRATES GOLD ──────────────────────────────────────────────────────
const goldItems = [
  { name: 'Pokemon Gold Dragon Premium Crate', priceStr: '£129.99' },
  { name: 'Premium TCG Gold Variety Crate', priceStr: '£139.99' },
  { name: 'Anime Gold Collectors Deluxe Crate', priceStr: '£124.99' },
  { name: 'Yu-Gi-Oh Gold Edition Premium Crate', priceStr: '£119.99' },
  { name: 'MTG Powerhouse Gold Crate', priceStr: '£144.99' },
  { name: 'One Piece Grand Line Gold Crate', priceStr: '£124.99' },
  { name: 'Lorcana Enchanted Gold Crate', priceStr: '£134.99' },
  { name: 'Gaming Hoard Gold Crate', priceStr: '£119.99' },
  { name: 'Rainbow Rare Gold Crate', priceStr: '£149.99', badge: 'Popular' },
  { name: 'Triple Threat Gold Crate', priceStr: '£129.99' },
  { name: 'Rare Pulls Guaranteed Gold Crate', priceStr: '£139.99' },
  { name: 'Hidden Treasures Gold Crate', priceStr: '£124.99' },
  { name: 'Grand Collector Gold Crate', priceStr: '£149.99' },
  { name: 'Obsidian Gold Premium Crate', priceStr: '£154.99' },
  { name: 'Vault Breaker Gold Crate', priceStr: '£144.99' },
  { name: 'Forbidden Archive Gold Crate', priceStr: '£134.99' },
  { name: 'Crimson Edition Gold Crate', priceStr: '£119.99' },
  { name: 'Midnight Premium Gold Crate', priceStr: '£139.99' },
  { name: 'Ancient Origins Gold Crate', priceStr: '£124.99' },
  { name: 'Championship Gold Elite Crate', priceStr: '£164.99' },
];
goldItems.forEach(p => products.push(build({ ...p, category: 'Mystery Crates', subcategory: 'Gold Tier', brand: 'Noir Crates', type: 'Mystery Crate', rarity: 'Gold', tagline: `${p.name} — gold-tier mystery with guaranteed rare pulls.`, description: `The ${p.name} is a premium Gold Tier mystery crate containing 5-8 curated items including at least one booster box and guaranteed rare or holographic cards. A serious upgrade for dedicated collectors.`, contents: ['5-8 Mystery Items', '1 Booster Box', 'Guaranteed rare cards', 'Premium packaging', 'Collector certificate'] })));

// ── MYSTERY CRATES PLATINUM ──────────────────────────────────────────────────
const platinumItems = [
  { name: 'Noir Signature Platinum Crate', priceStr: '£299.99', badge: 'Premium' },
  { name: 'Ultra Premium Platinum Experience', priceStr: '£349.99', badge: 'Premium' },
  { name: 'Championship Edition Platinum Crate', priceStr: '£399.99', badge: 'Limited Edition' },
  { name: 'Graded Card Chance Platinum Crate', priceStr: '£279.99' },
  { name: 'Master Collector Platinum Box', priceStr: '£249.99' },
  { name: 'Prismatic Platinum Vault', priceStr: '£319.99' },
  { name: 'Elite Trainer Platinum Crate', priceStr: '£239.99' },
  { name: 'Dragon Emperor Platinum Crate', priceStr: '£269.99' },
  { name: 'Full Art Hunters Platinum Collection', priceStr: '£259.99' },
  { name: 'Legendary Platinum Bundle', priceStr: '£219.99' },
  { name: 'Sacred Platinum Vault', priceStr: '£299.99' },
  { name: 'Forbidden Legend Platinum Crate', priceStr: '£279.99' },
  { name: 'Galaxy Platinum Collection', priceStr: '£329.99' },
  { name: 'Diamond Treasure Platinum Box', priceStr: '£359.99' },
  { name: 'Ancient Power Platinum Crate', priceStr: '£239.99' },
  { name: 'Dark Matter Platinum Crate', priceStr: '£289.99' },
  { name: 'Apex Hunter Platinum Crate', priceStr: '£249.99' },
  { name: 'Immortal Collector Platinum Bundle', priceStr: '£319.99' },
  { name: 'Crown Mastery Platinum Crate', priceStr: '£379.99' },
  { name: 'Noir Elite Platinum Experience', priceStr: '£399.99', badge: 'Premium' },
];
platinumItems.forEach(p => products.push(build({ ...p, category: 'Mystery Crates', subcategory: 'Platinum Tier', brand: 'Noir Crates', type: 'Mystery Crate', rarity: 'Platinum', tagline: `${p.name} — the ultimate collector experience.`, description: `The ${p.name} is our flagship Platinum Tier mystery crate — the absolute pinnacle of collecting. Includes multiple booster boxes, premium accessories, and a chance at graded cards worth hundreds of pounds.`, contents: ['2+ Booster Boxes', 'Premium accessories', 'Guaranteed ultra-rare cards', 'Chance at graded card', 'Luxury packaging', 'VIP collector certificate'] })));

// ── MYSTERY CRATES THEMED ──────────────────────────────────────────────────────
const themedItems = [
  { name: 'Pokemon Pikachu Theme Crate', priceStr: '£44.99' },
  { name: 'Pokemon Charizard Theme Crate', priceStr: '£64.99', badge: 'Hot Item' },
  { name: 'Pokemon Eeveelutions Theme Crate', priceStr: '£54.99' },
  { name: 'Anime Legends Collector Theme Crate', priceStr: '£49.99' },
  { name: 'Shonen Heroes Theme Crate', priceStr: '£44.99' },
  { name: 'Nintendo Universe Theme Crate', priceStr: '£54.99' },
  { name: 'Retro Gamer Nostalgia Theme Crate', priceStr: '£44.99' },
  { name: 'PlayStation Fans Theme Crate', priceStr: '£49.99' },
  { name: 'Manga Art Collection Theme Crate', priceStr: '£39.99' },
  { name: 'Horror Collectibles Theme Crate', priceStr: '£44.99' },
  { name: 'Starter Pack Beginner Theme Crate', priceStr: '£34.99' },
  { name: 'Advanced Collector Theme Crate', priceStr: '£84.99' },
  { name: 'Kawaii Cute World Theme Crate', priceStr: '£39.99' },
  { name: 'Mecha & Robots Theme Crate', priceStr: '£49.99' },
  { name: 'Fantasy Quest Theme Crate', priceStr: '£54.99' },
  { name: 'Noir Dark Edition Theme Crate', priceStr: '£74.99', badge: 'Limited Edition' },
  { name: 'Trainer Kit Pokemon Theme Crate', priceStr: '£44.99' },
  { name: 'Space Sci-Fi Theme Crate', priceStr: '£49.99' },
  { name: 'Superheroes Universe Theme Crate', priceStr: '£54.99' },
  { name: 'Studio Ghibli Inspired Theme Crate', priceStr: '£64.99', badge: 'Popular' },
];
themedItems.forEach(p => products.push(build({ ...p, category: 'Mystery Crates', subcategory: 'Themed Crates', brand: 'Noir Crates', type: 'Mystery Crate', rarity: 'Themed', tagline: `${p.name} — a curated themed collector experience.`, description: `The ${p.name} is a hand-curated themed mystery crate built around a specific franchise or theme. Every item inside is carefully selected to match the theme for a cohesive and exciting unboxing experience.`, contents: ['3-6 Themed Items', 'Exclusive themed accessories', 'Themed packaging', 'Collector card'] })));

// Output
process.stdout.write(JSON.stringify(products, null, 2));
