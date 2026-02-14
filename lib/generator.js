import { gameFingerprint, isMemeUnique, textHash, textToVector } from './dedupe';
import { validateGameConfig } from './schema';
import { moderateOrThrow } from './moderation';

const GAME_TYPES = ['runner', 'parkour', 'reaction', 'clicker', 'physics'];
const PALETTES = [
  ['#0F172A', '#22D3EE', '#E2E8F0', '#F59E0B'],
  ['#111827', '#34D399', '#F9FAFB', '#EF4444'],
  ['#1E1B4B', '#A78BFA', '#F3E8FF', '#22C55E'],
];

function seededRandom(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function getPersonalization(user = {}) {
  const likes = user.liked?.length || 0;
  const dislikes = user.disliked?.length || 0;
  const saves = user.savedSeeds?.length || 0;
  const skips = user.skipCount || 0;
  const play = user.playSeconds || 0;
  const sessions = user.sessions || 1;
  const avgPlay = play / sessions;

  const affinity = clamp((likes + saves - dislikes) / 25, -0.3, 0.5);
  const impatience = clamp(skips / 200, 0, 0.35);
  const playBias = clamp(avgPlay / 5000, 0, 0.25);
  const difficultyBias = clamp(0.45 + affinity - impatience + playBias, 0.1, 0.95);

  return { difficultyBias };
}

export function parsePromptToOptions(prompt = '') {
  const p = String(prompt).toLowerCase();
  const gameType = GAME_TYPES.find((t) => p.includes(t));
  const difficultyHint = p.includes('hard') ? 'hard' : p.includes('easy') ? 'easy' : 'normal';
  return { gameType, difficultyHint };
}

export function buildGameFromSeed(seed, opts = {}, user = {}) {
  const rand = seededRandom(seed);
  const personalization = getPersonalization(user);
  const gameType = opts.gameType || GAME_TYPES[Math.floor(rand() * GAME_TYPES.length)];

  const diffBump = opts.difficultyHint === 'hard' ? 0.2 : opts.difficultyHint === 'easy' ? -0.2 : 0;
  const targetDifficulty = clamp(personalization.difficultyBias + diffBump, 0.05, 0.98);

  const durationSec = 25 + Math.floor(rand() * 70);
  const chaosLevel = opts.chaosMode ? Math.min(1, 0.45 + rand()) : rand() * 0.4;
  const spawnScale = 0.7 + targetDifficulty * 0.9;
  const speedScale = 0.8 + targetDifficulty * 1.2;

  const cfg = {
    seed,
    gameType,
    title: `${gameType.toUpperCase()} // ${seed.slice(0, 8)}`,
    controls: {
      touch: 'Tap to jump/dash. Hold for charged move.',
      keyboard: 'Space jump, ArrowUp dash, ArrowDown duck.',
    },
    mechanics: {
      laneCount: 2 + Math.floor(rand() * 3),
      spawnRate: Number((0.45 * spawnScale + rand() * 1.1).toFixed(2)),
      scorePerTick: 1 + Math.floor(rand() * (2 + targetDifficulty * 4)),
      chaosLevel,
    },
    difficultyCurve: {
      start: Number(clamp(0.05 + rand() * 0.3 + targetDifficulty * 0.2, 0, 1).toFixed(2)),
      end: Number(clamp(0.6 + rand() * 0.25 + targetDifficulty * 0.25, 0, 1).toFixed(2)),
      durationSec,
    },
    obstaclePattern: {
      type: ['pulse', 'cluster', 'wave'][Math.floor(rand() * 3)],
      gapMin: 50 + Math.floor(rand() * 30),
      gapMax: 120 + Math.floor(rand() * 120),
      speedBase: Math.floor((95 + rand() * 150) * speedScale),
    },
    physics: {
      gravity: Number((0.22 + rand() * 0.6 + chaosLevel * 0.55).toFixed(2)),
      friction: Number((0.76 + rand() * 0.2).toFixed(2)),
      jumpForce: Number((5 + rand() * 7).toFixed(2)),
    },
    colorPalette: PALETTES[Math.floor(rand() * PALETTES.length)],
    winCondition: `Survive ${durationSec}s and keep score above ${Math.floor(durationSec * (1.3 + targetDifficulty))}.`,
    loseCondition: 'Hit 3 obstacles or timer expires with low score.',
    durationSec,
  };

  moderateOrThrow(cfg.title);
  moderateOrThrow(cfg.winCondition);
  moderateOrThrow(cfg.loseCondition);
  return validateGameConfig(cfg);
}

export function generateUniqueGame(data, user, params = {}) {
  const retries = 5;
  let finalGame;
  let remix = false;

  for (let i = 0; i < retries; i++) {
    const seed = params.seed || `${Date.now()}-${Math.floor(Math.random() * 1e9)}-${i}`;
    const candidate = buildGameFromSeed(seed, params, user);
    const fp = gameFingerprint(candidate);
    const alreadyGlobal = data.recentGameFingerprints.includes(fp);
    const alreadySeen = user.seenSeeds.includes(candidate.seed);
    if (!alreadyGlobal && !alreadySeen) {
      finalGame = candidate;
      data.recentGameFingerprints.unshift(fp);
      data.recentGameFingerprints = data.recentGameFingerprints.slice(0, 500);
      break;
    }
  }

  if (!finalGame) {
    remix = true;
    const base = params.seed || `fallback-${Date.now()}`;
    finalGame = buildGameFromSeed(`${base}-variant-${user.seenSeeds.length}`, params, user);
    finalGame.title = `${finalGame.title} (Remix)`;
    const fp = gameFingerprint(finalGame);
    data.recentGameFingerprints.unshift(fp);
  }

  user.seenSeeds.push(finalGame.seed);
  user.seenSeeds = user.seenSeeds.slice(-2000);
  data.games[finalGame.seed] = finalGame;
  return { game: finalGame, remix };
}

const MEME_STYLES = ['brainrot', 'absurdist', 'glitchcore'];
const SUBJECTS = ['NPC speedrun', 'quantum raccoon', 'lag wizard', 'sigma toaster', 'doom carrot'];

export function generateUniqueMeme(data, requestedSeed) {
  for (let i = 0; i < 6; i++) {
    const seed = requestedSeed || `${Date.now()}-m-${Math.floor(Math.random() * 99999)}-${i}`;
    const rand = seededRandom(seed);
    const style = MEME_STYLES[Math.floor(rand() * MEME_STYLES.length)];
    const text = `${SUBJECTS[Math.floor(rand() * SUBJECTS.length)]} says: "${['no cap', 'buff gravity', 'we ball', 'spawn chaos'][Math.floor(rand() * 4)]}"`;

    moderateOrThrow(text);
    if (isMemeUnique(text, data.recentMemeItems)) {
      const id = `meme_${seed}`;
      const meme = { id, text, style, seed };
      data.memes[id] = meme;
      data.recentMemeItems.unshift({ hash: textHash(text), vector: textToVector(text), id });
      data.recentMemeItems = data.recentMemeItems.slice(0, 500);
      return meme;
    }
  }

  const seed = `${Date.now()}-det`;
  const text = moderateOrThrow(`Remix meme ${seed}: chaos upgraded responsibly.`);
  const id = `meme_${seed}`;
  const meme = { id, text, style: 'brainrot', seed };
  data.memes[id] = meme;
  data.recentMemeItems.unshift({ hash: textHash(text), vector: textToVector(text), id });
  return meme;
}

export function buildFeedItems(data, user, count = 12) {
  const items = [];
  let gameCount = 0;
  while (items.length < count) {
    const { game, remix } = generateUniqueGame(data, user);
    items.push({ type: 'game', id: game.seed, game, remix });
    gameCount += 1;
    if (gameCount % 3 === 0 && items.length < count) {
      const meme = generateUniqueMeme(data);
      items.push({ type: 'meme', id: meme.id, meme });
    }
  }
  return items.slice(0, count);
}
