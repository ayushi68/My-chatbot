import { RetrievalQAChain } from 'langchain/chains';
import { getPineconeStore } from '@/lib/pinecone';
import { getLLM } from '@/lib/llm';
import { PromptTemplate } from '@langchain/core/prompts';

async function checkServicesConnectivity() {
  const errors = [];

  // 1. Check Hugging Face API
  if (!process.env.HUGGINGFACE_API_KEY) {
    errors.push('HUGGINGFACE_API_KEY is not set in environment variables');
  } else {
    try {
      const testResponse = await fetch('https://api-inference.huggingface.co/embeddings/sentence-transformers/all-MiniLM-L6-v2', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: 'Test connectivity' }),
      });
      const responseData = await testResponse.json();
      console.log('Hugging Face Test Response:', responseData);
      if (!testResponse.ok) {
        errors.push(`Hugging Face API connectivity failed: ${testResponse.status} ${testResponse.statusText} - ${JSON.stringify(responseData)}`);
      } else if (!Array.isArray(responseData.embedding)) {
        errors.push(`Hugging Face API returned invalid embedding: ${JSON.stringify(responseData)}`);
      }
    } catch (err) {
      errors.push(`Hugging Face API connectivity error: ${err.message}`);
    }
  }

  // 2. Check Pinecone
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX || !process.env.PINECONE_ENV) {
    errors.push('PINECONE_API_KEY, PINECONE_INDEX, or PINECONE_ENV is not set in environment variables');
  } else {
    try {
      const pinecone = new (await import('@pinecone-database/pinecone')).Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENV,
      });
      const index = pinecone.index(process.env.PINECONE_INDEX);
      const stats = await index.describeIndexStats();
      if (stats.dimension !== 384) {
        errors.push(`Pinecone index dimension is ${stats.dimension}, expected 384`);
      }
    } catch (err) {
      errors.push(`Pinecone connectivity error: ${err.message}`);
    }
  }

  // 3. Check LLM (Groq API)
  if (!process.env.LLM_API_KEY) {
    errors.push('LLM_API_KEY is not set in environment variables');
  } else {
    try {
      const testResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: 'Test connectivity' }],
        }),
      });
      const responseData = await testResponse.json();
      console.log('Groq Test Response:', responseData);
      if (!testResponse.ok) {
        errors.push(`LLM (Groq) API connectivity failed: ${testResponse.status} ${testResponse.statusText} - ${JSON.stringify(responseData)}`);
      } else if (!responseData.choices?.[0]?.message?.content) {
        errors.push(`LLM (Groq) API returned invalid response: ${JSON.stringify(responseData)}`);
      }
    } catch (err) {
      errors.push(`LLM (Groq) API connectivity error: ${err.message}`);
    }
  }

  return errors.length > 0 ? errors : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'Query must be a non-empty string' });
  }

  const connectivityErrors = await checkServicesConnectivity();
  if (connectivityErrors) {
    console.error('Service connectivity errors:', connectivityErrors);
    return res.status(503).json({ error: 'Service connectivity issues', details: connectivityErrors });
  }

  try {
    const vectorStore = await getPineconeStore();
    const llm = await getLLM();

    const promptTemplate = PromptTemplate.fromTemplate(
      `Use the following context to answer the question:\n{context}\n\nQuestion: {question}`
    );

    const chain = RetrievalQAChain.fromLLM(llm, vectorStore.asRetriever(3), {
      prompt: promptTemplate,
    });

    const result = await chain.call({ query });
    return res.status(200).json({ answer: result.text });
  } catch (error) {
    console.error('QUERY API ERROR:', error);
    return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}