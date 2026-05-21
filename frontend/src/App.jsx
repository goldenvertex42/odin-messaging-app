import { useState, useEffect } from 'react';

function App() {
  const [message, setMessage] = useState('Connecting to API...');

  useEffect(() => {
    // Points directly to your Express backend local development port
    fetch('http://localhost:3000/api/test')
      .then((res) => {
        if (!res.ok) throw new Error('API server returned an error');
        return res.json();
      })
      .then((data) => setMessage(data.message || 'Connected!'))
      .catch((err) => setMessage(`❌ API Connection Failed: ${err.message}`));
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', textAlign: 'center' }}>
      <h1>Monorepo Frontend Template</h1>
      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{message}</p>
    </div>
  );
}

export default App;
