import { HuggingFaceEmbeddings } from '@langchain/community/embeddings/hf';

let embeddings = null;

export const getEmbedding = async (text) => {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Invalid input: Text must be a non-empty string');
  }

  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY is not set');
  }

  if (!embeddings) {
    embeddings = new HuggingFaceEmbeddings({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      apiKey: process.env.HUGGINGFACE_API_KEY,
    });
  }

  try {
    const embedding = await embeddings.embedQuery(text);
    return embedding; // array of floats
  } catch (err) {
    throw new Error(`Failed to generate embedding: ${err.message}`);
  }
};