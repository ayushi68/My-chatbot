import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { CohereEmbeddings } from '@langchain/cohere';

let pineconeStore = null;

export const getPineconeStore = async () => {
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX || !process.env.COHERE_API_KEY) {
    throw new Error('PINECONE_API_KEY, PINECONE_INDEX, or COHERE_API_KEY is not set');
  }

  if (!pineconeStore) {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pinecone.index(process.env.PINECONE_INDEX);

    try {
      const stats = await index.describeIndexStats();
      if (stats.dimension !== 1024) {
        throw new Error(`Pinecone index dimension is ${stats.dimension}, expected 1024`);
      }
    } catch (err) {
      throw new Error(`Failed to verify Pinecone index: ${err.message}`);
    }

    const embeddings = new CohereEmbeddings({
      apiKey: process.env.COHERE_API_KEY,
      model: 'embed-english-v3.0',
    });

    pineconeStore = new PineconeStore(embeddings, {
      pineconeIndex: index,
      namespace: 'default',
    });
  }

  return pineconeStore;
};