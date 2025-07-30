import { ChatGroq } from '@langchain/groq';

let llm = null;

export const getLLM = async () => {
  if (!"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") {
    throw new Error('LLM_API_KEY is not set');
  }

  if (!llm) {
    llm = new ChatGroq({
      apiKey: "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",
      model: 'llama3-70b-8192',
    });
  }

  return llm;
};