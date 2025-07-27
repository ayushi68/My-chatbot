// pages/api/embed.js
import { getEmbedding } from '@/lib/embedding';

export default async function handler(req, res) {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const embedding = await getEmbedding(text);
  res.status(200).json({ embedding });
}
