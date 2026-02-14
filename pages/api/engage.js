import { getUser, withStore } from '../../lib/store';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const userId = req.headers['x-user-id'] || 'demo';
  const { seed, action, playSeconds } = req.body || {};

  const out = withStore((data) => {
    const user = getUser(data, userId);
    if (action === 'like') user.liked = [...new Set([...user.liked, seed])];
    if (action === 'dislike') user.disliked = [...new Set([...user.disliked, seed])];
    if (action === 'save') user.savedSeeds = [...new Set([...user.savedSeeds, seed])];
    if (action === 'skip') user.skipCount += 1;
    if (action === 'play' && typeof playSeconds === 'number') user.playSeconds += playSeconds;
    if (action === 'toggleChaos') user.chaosMode = !user.chaosMode;

    const key = seed || 'global';
    if (!data.engagements[key]) data.engagements[key] = { likes: 0, dislikes: 0, saves: 0, plays: 0, comments: 0 };
    if (action === 'like') data.engagements[key].likes += 1;
    if (action === 'dislike') data.engagements[key].dislikes += 1;
    if (action === 'save') data.engagements[key].saves += 1;
    if (action === 'play') data.engagements[key].plays += 1;

    return { user, engagement: data.engagements[key] };
  });

  return res.status(200).json(out);
}
