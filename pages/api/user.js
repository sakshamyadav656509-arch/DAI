import { getUser, readStore } from '../../lib/store';

export default function handler(req, res) {
  const userId = req.headers['x-user-id'] || 'demo';
  const data = readStore();
  const user = getUser(data, userId);
  const trending = Object.entries(data.engagements)
    .filter(([k]) => k !== 'global')
    .sort((a, b) => (b[1].likes + b[1].plays + b[1].comments) - (a[1].likes + a[1].plays + a[1].comments))
    .slice(0, 20)
    .map(([seed]) => seed);
  res.status(200).json({ user, trending });
}
