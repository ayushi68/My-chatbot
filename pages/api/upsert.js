// pages/api/upsert.js
import { getEmbedding } from '@/lib/embedding';
import { getPineconeIndex } from '@/lib/pinecone';

export default async function handler(req, res) {
  const { id, text } = req.body;
  if (!id || !text) return res.status(400).json({ error: 'ID or text missing' });

  const embedding = await getEmbedding(text);
  const index = await getPineconeIndex();

  await index.upsert([{ id, values: embedding }]);
  res.status(200).json({ message: 'Upserted successfully' });
}
