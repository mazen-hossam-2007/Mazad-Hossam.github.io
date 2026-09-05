/**
 * MAZAD — Football Auction Game Database (Mazad Hossam)
 * 2026/27 Season authentic player dataset.
 * Combines modular datasets for Egyptian Premier League, Premier League,
 * La Liga, Serie A, Bundesliga, Ligue 1, Saudi Pro League, and MLS.
 * Contains 500+ realistic players with accurate positions, ratings, and stats.
 */

import { EGYPTIAN_LEAGUE_PLAYERS } from "./data/egyptianLeague.js";
import { EUROPEAN_LEAGUES_PLAYERS } from "./data/europeanLeagues.js";
import { WORLD_LEAGUES_PLAYERS } from "./data/worldLeagues.js";
import { ADDITIONAL_PLAYERS } from "./data/additionalPlayers.js";

// Combine and deduplicate players by unique ID
const RAW_PLAYERS = [
  ...EGYPTIAN_LEAGUE_PLAYERS,
  ...EUROPEAN_LEAGUES_PLAYERS,
  ...WORLD_LEAGUES_PLAYERS,
  ...ADDITIONAL_PLAYERS
];

// Deduplication map ensuring unique IDs
const playerMap = new Map();
RAW_PLAYERS.forEach(player => {
  if (player && player.id) {
    // Normalize market value and value
    const val = Number(player.marketValue || player.value || Math.round(player.rating * 0.75));
    const rating = Number(player.rating) || 75;
    
    // Assign proper tier
    let tier = player.tier;
    if (!tier) {
      if (rating >= 92) tier = "Legendary / Superstar";
      else if (rating >= 88) tier = "World Class";
      else if (rating >= 84) tier = "Elite";
      else if (rating >= 80) tier = "Very Good";
      else if (rating >= 75) tier = "Good";
      else if (rating >= 70) tier = "Average";
      else tier = "Below Average";
    }

    const normalized = {
      id: String(player.id),
      name: String(player.name),
      club: String(player.club || "Free Agent"),
      league: String(player.league || "World League"),
      nation: String(player.nation || "Unknown"),
      position: String(player.position || "CM").toUpperCase(),
      rating: rating,
      tier: tier,
      pace: Number(player.pace !== undefined ? player.pace : rating),
      shooting: Number(player.shooting !== undefined ? player.shooting : rating),
      passing: Number(player.passing !== undefined ? player.passing : rating),
      dribbling: Number(player.dribbling !== undefined ? player.dribbling : rating),
      defending: Number(player.defending !== undefined ? player.defending : rating),
      physical: Number(player.physical !== undefined ? player.physical : rating),
      marketValue: val,
      value: val
    };

    playerMap.set(normalized.id, normalized);
  }
});

export const PLAYER_DATABASE = Array.from(playerMap.values());

export const LEAGUES = [
  "ALL LEAGUES",
  "Egyptian Premier League",
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Saudi Pro League",
  "MLS"
];

export const PLAYER_TIERS = {
  LEGENDARY: "Legendary / Superstar",
  WORLD_CLASS: "World Class",
  ELITE: "Elite",
  VERY_GOOD: "Very Good",
  GOOD: "Good",
  AVERAGE: "Average",
  BELOW_AVERAGE: "Below Average",
  WEAK: "Weak"
};

/**
 * Filter players by slot position and league
 */
export function getPlayersByPosition(targetPosition, league = "ALL LEAGUES") {
  const normPos = (targetPosition || "").toUpperCase().trim();
  const normLeague = (league || "").toUpperCase().trim();

  // Position compatibility map for flexible slot matching
  const compatMap = {
    "GK": ["GK"],
    "CB": ["CB", "SW"],
    "RB": ["RB", "RWB"],
    "LB": ["LB", "LWB"],
    "CDM": ["CDM", "CM"],
    "CM": ["CM", "CDM", "CAM"],
    "CAM": ["CAM", "CM", "LW", "RW"],
    "RW": ["RW", "RM", "CAM", "ST"],
    "LW": ["LW", "LM", "CAM", "ST"],
    "RM": ["RM", "RW", "CM"],
    "LM": ["LM", "LW", "CM"],
    "ST": ["ST", "CF", "RW", "LW"]
  };

  const allowedPositions = compatMap[normPos] || [normPos];

  return PLAYER_DATABASE.filter(player => {
    const posMatch = allowedPositions.includes(player.position) || player.position === normPos;
    if (!posMatch) return false;

    if (!normLeague || normLeague === "ALL LEAGUES" || normLeague === "ALL") {
      return true;
    }

    return player.league.toUpperCase().trim() === normLeague;
  });
}

/**
 * Retrieves a single player by ID
 */
export function getPlayerById(id) {
  return playerMap.get(id) || PLAYER_DATABASE.find(p => p.id === id) || null;
}

/**
 * Picks an exciting candidate for the auction round of target position
 */
export function getAuctionCandidate(targetPosition, league = "ALL LEAGUES", excludedIds = []) {
  const pool = getPlayersByPosition(targetPosition, league).filter(p => !excludedIds.includes(p.id));
  const candidatePool = pool.length ? pool : getPlayersByPosition(targetPosition, "ALL LEAGUES").filter(p => !excludedIds.includes(p.id));

  if (!candidatePool.length) {
    const allMatching = PLAYER_DATABASE.filter(p => p.position === targetPosition);
    return allMatching[Math.floor(Math.random() * allMatching.length)] || PLAYER_DATABASE[0];
  }

  // Weight towards higher rated exciting players for auction
  candidatePool.sort((a, b) => b.rating - a.rating);

  // Pick weighted towards top half
  const weights = candidatePool.map((p, idx) => Math.max(1, candidatePool.length - idx));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let randomWeight = Math.random() * totalWeight;

  for (let i = 0; i < candidatePool.length; i++) {
    if (randomWeight < weights[i]) {
      return candidatePool[i];
    }
    randomWeight -= weights[i];
  }

  return candidatePool[Math.floor(Math.random() * candidatePool.length)];
}

/**
 * Picks a random free player for the player who lost the auction (Lucky Draw system)
 * Includes true stochastic distribution across tiers with suspense metadata
 */
export function getRandomFreePlayer(targetPosition, league = "ALL LEAGUES", excludedIds = []) {
  if (typeof targetPosition === "object" && targetPosition !== null) {
    const arg2 = league;
    const arg3 = excludedIds;
    targetPosition = targetPosition.position || "CM";
    if (typeof arg2 === "string") league = arg2;
    if (Array.isArray(arg3)) excludedIds = arg3;
  }

  const pool = getPlayersByPosition(targetPosition, league).filter(p => !excludedIds.includes(p.id));
  const candidatePool = pool.length ? pool : getPlayersByPosition(targetPosition, "ALL LEAGUES").filter(p => !excludedIds.includes(p.id));

  if (!candidatePool.length) {
    const allMatching = PLAYER_DATABASE.filter(p => p.position === targetPosition);
    const fallback = allMatching[Math.floor(Math.random() * allMatching.length)] || PLAYER_DATABASE[0];
    return { ...fallback, player: fallback, luckText: "AVERAGE LUCK ⚖️", luckClass: "luck-average" };
  }

  const rand = Math.random() * 100;
  let targetTier;
  let luckText = "AVERAGE LUCK";
  let luckClass = "luck-average";

  if (rand < 4) {
    targetTier = "Legendary / Superstar";
    luckText = "INSANE LUCK! 🌟";
    luckClass = "luck-insane";
  } else if (rand < 12) {
    targetTier = "World Class";
    luckText = "GREAT LUCK! 🔥";
    luckClass = "luck-great";
  } else if (rand < 25) {
    targetTier = "Elite";
    luckText = "GREAT LUCK! ⚡";
    luckClass = "luck-great";
  } else if (rand < 45) {
    targetTier = "Very Good";
    luckText = "GOOD LUCK! ✨";
    luckClass = "luck-good";
  } else if (rand < 70) {
    targetTier = "Good";
    luckText = "DECENT DRAW 👍";
    luckClass = "luck-good";
  } else if (rand < 88) {
    targetTier = "Average";
    luckText = "AVERAGE LUCK ⚖️";
    luckClass = "luck-average";
  } else if (rand < 96) {
    targetTier = "Below Average";
    luckText = "BAD LUCK 📉";
    luckClass = "luck-bad";
  } else {
    targetTier = "Weak";
    luckText = "TERRIBLE LUCK! 💀";
    luckClass = "luck-terrible";
  }

  let matches = candidatePool.filter(p => p.tier === targetTier);
  if (!matches.length) {
    // If exact tier not in this position pool, pick randomly from candidate pool
    matches = candidatePool;
  }

  const player = matches[Math.floor(Math.random() * matches.length)] || candidatePool[0] || PLAYER_DATABASE[0];
  
  // Refine luck assessment by actual rating
  if (player.rating >= 92) {
    luckText = "INSANE LUCK! 🌟";
    luckClass = "luck-insane";
  } else if (player.rating >= 86) {
    luckText = "GREAT LUCK! 🔥";
    luckClass = "luck-great";
  } else if (player.rating >= 80) {
    luckText = "GOOD LUCK! ✨";
    luckClass = "luck-good";
  } else if (player.rating >= 72) {
    luckText = "AVERAGE LUCK ⚖️";
    luckClass = "luck-average";
  } else if (player.rating >= 65) {
    luckText = "BAD DRAW 📉";
    luckClass = "luck-bad";
  } else {
    luckText = "TERRIBLE LUCK! 💀";
    luckClass = "luck-terrible";
  }

  return { ...player, player, luckText, luckClass };
}

/**
 * Calculates weighted performance of a player based on position
 */
export function calculateWeightedPerformance(player, slotPosition = null) {
  if (!player) return 70;
  const pos = slotPosition || player.position;
  const rating = Number(player.rating) || 75;
  const pace = Number(player.pace !== undefined ? player.pace : rating);
  const shooting = Number(player.shooting !== undefined ? player.shooting : rating);
  const passing = Number(player.passing !== undefined ? player.passing : rating);
  const dribbling = Number(player.dribbling !== undefined ? player.dribbling : rating);
  const defending = Number(player.defending !== undefined ? player.defending : rating);
  const physical = Number(player.physical !== undefined ? player.physical : rating);

  let score = 0;

  switch (pos) {
    case "GK":
      score = rating * 0.45 + defending * 0.35 + physical * 0.15 + passing * 0.05;
      break;
    case "CB":
      score = rating * 0.35 + defending * 0.35 + physical * 0.20 + pace * 0.10;
      break;
    case "RB":
    case "LB":
      score = rating * 0.30 + defending * 0.25 + pace * 0.25 + physical * 0.10 + passing * 0.10;
      break;
    case "CDM":
      score = rating * 0.35 + defending * 0.30 + physical * 0.20 + passing * 0.15;
      break;
    case "CM":
      score = rating * 0.30 + passing * 0.25 + dribbling * 0.20 + physical * 0.15 + shooting * 0.10;
      break;
    case "CAM":
      score = rating * 0.30 + passing * 0.25 + dribbling * 0.25 + shooting * 0.15 + pace * 0.05;
      break;
    case "RW":
    case "LW":
    case "RM":
    case "LM":
      score = rating * 0.30 + pace * 0.30 + dribbling * 0.20 + shooting * 0.15 + passing * 0.05;
      break;
    case "ST":
      score = rating * 0.35 + shooting * 0.35 + pace * 0.15 + physical * 0.10 + dribbling * 0.05;
      break;
    default:
      score = rating;
  }

  return Math.round(score);
}

/**
 * Returns statistics and counts per league
 */
export function getLeagueSummary() {
  const summary = {};
  PLAYER_DATABASE.forEach(p => {
    summary[p.league] = (summary[p.league] || 0) + 1;
  });
  return summary;
}
