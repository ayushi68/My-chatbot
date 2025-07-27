// lib/pinecone.js
import { Pinecone } from '@pinecone-database/pinecone';

// If PINECONE_API_KEY is set in env, no need to pass config object
const pinecone = new Pinecone();

export const getPineconeIndex = async () => {
  return pinecone.index(process.env.PINECONE_INDEX);
};
