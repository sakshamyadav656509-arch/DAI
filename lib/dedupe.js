import crypto from 'crypto';

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function gameFingerprint(game) {
  const normalized = {
    gameType: game.gameType,
    mechanics: game.mechanics,
    obstaclePattern: game.obstaclePattern,
    physics: game.physics,
    durationSec: game.durationSec,
  };
  return crypto.createHash('sha256').update(stableStringify(normalized)).digest('hex');
}

export function textHash(text) {
  return crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}

export function textToVector(text) {
  const vec = Array(26).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z]/g, '');
  for (const ch of normalized) vec[ch.charCodeAt(0) - 97] += 1;
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineDistance(a, b) {
  const dot = a.reduce((sum, v, idx) => sum + v * b[idx], 0);
  return 1 - dot;
}

export function isMemeUnique(text, recentMemes, minDistance = 0.12) {
  const hash = textHash(text);
  const v = textToVector(text);
  return !recentMemes.some((m) => m.hash === hash || cosineDistance(v, m.vector) < minDistance);
}
