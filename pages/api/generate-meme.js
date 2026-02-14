import { generateUniqueMeme } from '../../lib/generator';
import { withStore } from '../../lib/store';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const meme = withStore((data) => generateUniqueMeme(data, req.body?.seed));
  res.status(200).json(meme);
}
