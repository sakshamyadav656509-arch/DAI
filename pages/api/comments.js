import { withStore } from '../../lib/store';

export default function handler(req, res) {
  const { seed } = req.query;
  if (!seed) return res.status(400).json({ error: 'seed required' });

  if (req.method === 'GET') {
    const page = Number(req.query.page || 1);
    const pageSize = 10;
    const payload = withStore((data) => {
      const comments = data.comments[seed] || [];
      const start = (page - 1) * pageSize;
      return { items: comments.slice(start, start + pageSize), total: comments.length };
    });
    return res.status(200).json(payload);
  }

  if (req.method === 'POST') {
    const user = req.headers['x-user-id'] || 'demo';
    const text = String(req.body?.text || '').trim().slice(0, 300);
    if (!text) return res.status(400).json({ error: 'text required' });

    const output = withStore((data) => {
      if (!data.comments[seed]) data.comments[seed] = [];
      const comment = { id: `${Date.now()}`, user, text, createdAt: new Date().toISOString() };
      data.comments[seed].unshift(comment);
      if (!data.engagements[seed]) data.engagements[seed] = { likes: 0, dislikes: 0, saves: 0, plays: 0, comments: 0 };
      data.engagements[seed].comments += 1;
      return comment;
    });
    return res.status(200).json(output);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
