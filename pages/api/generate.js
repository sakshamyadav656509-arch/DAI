import { generateUniqueGame, parsePromptToOptions } from '../../lib/generator';
import { getUser, withStore } from '../../lib/store';

const requests = new Map();

function rateLimit(userId, max = 25, perMs = 60000) {
  const now = Date.now();
  const existing = requests.get(userId) || [];
  const fresh = existing.filter((t) => now - t < perMs);
  if (fresh.length >= max) return false;
  fresh.push(now);
  requests.set(userId, fresh);
  return true;
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const userId = req.headers['x-user-id'] || 'demo';
  if (!rateLimit(userId)) return res.status(429).json({ error: 'Rate limit exceeded' });

  const body = req.body || {};

  try {
    const result = withStore((data) => {
      const user = getUser(data, userId);
      const parsedPrompt = parsePromptToOptions(body.prompt || '');
      return generateUniqueGame(data, user, {
        seed: body.seed,
        gameType: body.gameType || parsedPrompt.gameType,
        difficultyHint: body.difficultyHint || parsedPrompt.difficultyHint,
        chaosMode: body.chaosMode ?? user.chaosMode,
      });
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
