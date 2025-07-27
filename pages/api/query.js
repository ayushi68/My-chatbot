// pages/api/query.js

import { getEmbedding } from '@/lib/embedding';
import { getPineconeIndex } from '@/lib/pinecone';
import { callLLM } from '@/lib/llm';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // 1. Generate embedding from Hugging Face
    let embedding;
    try {
      console.log('Input query:', query);
      console.log('getEmbedding function:', getEmbedding, 'Type:', typeof getEmbedding);
      if (typeof getEmbedding !== 'function') {
        // Respond with a clear error if import is broken
        return res.status(500).json({ error: 'getEmbedding is not a function. Check your import.' });
      }
      embedding = await getEmbedding(query);
      console.log('Raw embedding result:', embedding, 'Type:', typeof embedding, 'IsArray:', Array.isArray(embedding));
      if (embedding && typeof embedding === 'object' && !Array.isArray(embedding)) {
        console.log('Embedding is an object. Keys:', Object.keys(embedding));
        // Try to extract embedding from common keys
        if (embedding.data) {
          console.log('Using embedding.data');
          embedding = embedding.data;
        } else if (embedding.embedding) {
          console.log('Using embedding.embedding');
          embedding = embedding.embedding;
        }
      }
      // If embedding is a nested array (e.g., [[...]]), flatten it
      if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
        console.log('Flattening nested embedding array');
        embedding = embedding[0];
      }
    } catch (embedErr) {
      console.error('Error in getEmbedding:', embedErr);
      // Respond with the actual error message for debugging
      return res.status(500).json({ error: `Failed to generate embedding: ${embedErr.message || embedErr}` });
    }
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      console.error('Invalid embedding:', embedding);
      // TEMP: Return the raw embedding for debugging
      return res.status(500).json({ 
        error: 'Failed to generate embedding: embedding is empty or invalid.',
        rawEmbedding: embedding
      });
    }

    // 2. Get Pinecone index
    const index = await getPineconeIndex();

    // 3. Search Pinecone with query vector
    const result = await index.query({
      vector: embedding,
      topK: 3,
      includeMetadata: true,
    });

    const contextChunks = result.matches?.map(
      (match) => match.metadata?.text || ''
    );

    const context = contextChunks?.join('\n') || 'No relevant context found.';

    // 4. Call LLM (Groq/Gemini) with context + user query
    const prompt = `Use the following context to answer the question:\n${context}\n\nQuestion: ${query}`;
    const answer = await callLLM(prompt);

    return res.status(200).json({ answer });
  } catch (error) {
    console.error('QUERY API ERROR:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
