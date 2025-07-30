import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuery = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnswer('');
    setError('');

    if (!query || query.trim() === '') {
      setError('Please enter a valid query');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending request to /api/query with query:', query);
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Unknown error');
      }

      setAnswer(data.answer);
    } catch (err) {
      console.error('Query failed:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', padding: '20px' }}>
      <h1>🧠 RAG Chatbot</h1>
      <form onSubmit={handleQuery} style={{ marginBottom: 20 }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={4}
          placeholder="Ask me anything..."
          style={{ width: '100%', padding: 10 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 10,
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Loading...' : 'Ask'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {answer && (
        <div style={{ backgroundColor: '#f9f9f9', padding: 15, borderRadius: 4 }}>
          <strong>Answer:</strong>
          <p>{answer}</p>
        </div>
      )}
    </main>
  );
}