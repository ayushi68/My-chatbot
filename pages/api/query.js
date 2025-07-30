import fetch from 'node-fetch';
import { Pinecone } from '@pinecone-database/pinecone';
import { CohereEmbeddings } from '@langchain/cohere';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query must be a non-empty string' });
  }

  try {
    // Step 1: Get Embedding from Cohere
    const embeddings = new CohereEmbeddings({
      apiKey: process.env.COHERE_API_KEY,
      model: 'embed-english-v3.0',
    });
    const embedding = await embeddings.embedQuery(query);

    // Step 2: Query Pinecone
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pinecone.Index(process.env.PINECONE_INDEX);

    const pineconeQuery = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
    });

    // Step 3: Query Groq LLM
    const llmResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          {
            role: 'user',
            content: `Answer based on this context:\n${JSON.stringify(pineconeQuery)}\n\nQuery: ${query}`,
          },
        ],
      }),
    });

    const llmData = await llmResponse.json();

    if (llmData.error) {
      throw new Error(`LLM error: ${llmData.error.message}`);
    }

    const answer = llmData.choices?.[0]?.message?.content || 'No response from LLM';

    res.status(200).json({ answer });
  } catch (err) {
    console.error('[Error]', err.message);
    res.status(500).json({
      error: 'Service connectivity issues',
      details: err.message,
    });
  }
}