import { CohereEmbeddings } from '@langchain/cohere';

let embeddings = null;

export const getEmbedding = async (text) => {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Invalid input: Text must be a non-empty string');
  }

  if (!process.env.COHERE_API_KEY) {
    throw new Error('COHERE_API_KEY is not set');
  }

  if (!embeddings) {
    embeddings = new CohereEmbeddings({
      apiKey: process.env.COHERE_API_KEY,
      model: 'embed-english-v3.0',
    });
  }

  try {
    const embedding = await embeddings.embedQuery(text);
    return embedding; // array of floats
  } catch (err) {
    throw new Error(`Failed to generate embedding: ${err.message}`);
  }
};