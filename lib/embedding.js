// lib/embedding.js
export const getEmbedding = async (text) => {
  const res = await fetch('https://api-inference.huggingface.co/embeddings/sentence-transformers/all-MiniLM-L6-v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  const data = await res.json();
  return data.embedding; // array of floats
};
