import { getEmbedding } from '@/lib/embedding';
import { getPineconeStore } from '@/lib/pinecone';
import { Document } from '@langchain/core/documents';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { id, text } = req.body;
  if (!id || !text) {
    return res.status(400).json({ error: 'ID or text missing' });
  }

  try {
    const embedding = await getEmbedding(text);
    const vectorStore = await getPineconeStore();
    await vectorStore.addDocuments([
      new Document({
        pageContent: text,
        metadata: { id, text },
      }),
    ]);
    return res.status(200).json({ message: 'Upserted successfully' });
  } catch (error) {
    console.error('UPSERT API ERROR:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}