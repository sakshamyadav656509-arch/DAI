import { buildFeedItems } from '../../lib/generator';
import { getUser, withStore } from '../../lib/store';

export default function handler(req, res) {
  const userId = req.headers['x-user-id'] || 'demo';
  const count = Number(req.query.count || 9);
  const cursor = Number(req.query.cursor || 0);
  const payload = withStore((data) => {
    const user = getUser(data, userId);
    const items = buildFeedItems(data, user, count);
    return { items, nextCursor: cursor + items.length };
  });
  res.status(200).json(payload);
}
