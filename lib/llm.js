// lib/llm.js
export const callLLM = async (prompt) => {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768', // or gemini model if using Gemini
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
};
