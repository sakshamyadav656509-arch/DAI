import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GameEngine from '../components/GameEngine';
import { buildGameFromSeed } from '../lib/generator';

describe('integration', () => {
  it('generated game renders playable instance', () => {
    const game = buildGameFromSeed('12345');
    render(<GameEngine config={game} />);
    expect(screen.getByText(/Playing|Win|Lose/)).toBeTruthy();
    expect(screen.getByText(/Space jump/i)).toBeTruthy();
  });
});
