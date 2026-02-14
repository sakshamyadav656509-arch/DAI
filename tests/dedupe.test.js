import { describe, expect, it } from 'vitest';
import { cosineDistance, gameFingerprint, isMemeUnique, textToVector } from '../lib/dedupe';
import { parsePromptToOptions } from '../lib/generator';
import { isSafeText } from '../lib/moderation';

describe('dedupe', () => {
  it('creates stable game fingerprints', () => {
    const a = { gameType: 'runner', mechanics: { x: 1 }, obstaclePattern: { y: 2 }, physics: { g: 1 }, durationSec: 20 };
    const b = { durationSec: 20, physics: { g: 1 }, obstaclePattern: { y: 2 }, mechanics: { x: 1 }, gameType: 'runner' };
    expect(gameFingerprint(a)).toBe(gameFingerprint(b));
  });

  it('checks semantic meme distance', () => {
    const recent = [{ hash: 'x', vector: textToVector('quantum raccoon we ball') }];
    expect(isMemeUnique('quantum raccoon we ball', recent)).toBe(false);
    expect(isMemeUnique('totally different sentence', recent)).toBe(true);
    expect(cosineDistance(textToVector('abc'), textToVector('abc'))).toBeLessThan(0.001);
  });

  it('parses prompt and moderates unsafe text', () => {
    expect(parsePromptToOptions('hard parkour game').gameType).toBe('parkour');
    expect(parsePromptToOptions('hard parkour game').difficultyHint).toBe('hard');
    expect(isSafeText('friendly sentence')).toBe(true);
    expect(isSafeText('hate group phrase')).toBe(false);
  });
});
