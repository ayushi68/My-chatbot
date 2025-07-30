import { getEmbedding } from '@/lib/embedding';

export default async function handler(req, res) {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    const embedding = await getEmbedding(text);
    res.status(200).json({ embedding });
  } catch (err) {
    res.status(500).json({ error: `Failed to generate embedding: ${err.message}` });
  }
}