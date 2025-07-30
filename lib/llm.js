import { ChatGroq } from '@langchain/groq';

let llm = null;

export const getLLM = async () => {
  if (!process.env.LLM_API_KEY){
    throw new Error('LLM_API_KEY is not set');
  }

  if (!llm) {
    llm = new ChatGroq({
      apiKey: process.env.LLM_API_KEY,
      model: 'llama3-70b-8192',
    });
  }

  return llm;
};