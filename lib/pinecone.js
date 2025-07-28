import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { HuggingFaceEmbeddings } from '@langchain/community/embeddings/hf';

let pineconeStore = null;

export const getPineconeStore = async () => {
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX || !process.env.PINECONE_ENV) {
    throw new Error('PINECONE_API_KEY, PINECONE_INDEX, or PINECONE_ENV is not set');
  }

  if (!pineconeStore) {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      // Optionally add controllerHostUrl if needed
    });
    const index = pinecone.index(process.env.PINECONE_INDEX);

    try {
      const stats = await index.describeIndexStats();
      if (stats.dimension !== 384) {
        throw new Error(`Pinecone index dimension is ${stats.dimension}, expected 384`);
      }
    } catch (err) {
      throw new Error(`Failed to verify Pinecone index: ${err.message}`);
    }

    const embeddings = new HuggingFaceEmbeddings({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      apiKey: process.env.HUGGINGFACE_API_KEY,
    });

    pineconeStore = new PineconeStore(embeddings, {
      pineconeIndex: index,
      namespace: 'default', // Optional: adjust if using namespaces
    });
  }

  return pineconeStore;
};