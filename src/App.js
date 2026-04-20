import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [cookie, setCookie] = useState('');
  const [gamepassId, setGamepassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [queueId, setQueueId] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [error, setError] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQueueStatus(null);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/queue-purchase`, {
        cookie,
        gamepassId
      });

      setQueueId(response.data.queueId);
      
      // Start polling for status
      pollQueueStatus(response.data.queueId);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to queue purchase');
      setLoading(false);
    }
  };

  const pollQueueStatus = (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/queue-status/${id}`);
        setQueueStatus(response.data);
        
        if (response.data.status !== 'pending') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        clearInterval(interval);
        setError('Failed to fetch queue status');
        setLoading(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <div className="App">
      <div className="container">
        <h1>🎮 Roblox Gamepass Automation</h1>
        <p className="warning">
          ⚠️ This tool queues purchases for processing by your local bridge.
          Your .ROBLOSECURITY cookie will be stored temporarily in the queue.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>.ROBLOSECURITY Cookie</label>
            <textarea
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              placeholder="_|WARNING:-DO-NOT-SHARE..."
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Gamepass ID</label>
            <input
              type="text"
              value={gamepassId}
              onChange={(e) => setGamepassId(e.target.value)}
              placeholder="e.g., 12345678"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Queue Purchase'}
          </button>
        </form>

        {queueId && (
          <div className="queue-info">
            <h3>Queue ID: {queueId}</h3>
            <p>Status: {queueStatus?.status || 'pending'}</p>
            {queueStatus?.status === 'completed' && (
              <div className="success">
                ✅ Purchase successful!<br />
                User ID: {queueStatus.user_id}<br />
                Transaction: {queueStatus.transaction_id}
              </div>
            )}
            {queueStatus?.status === 'failed' && (
              <div className="error">
                ❌ Purchase failed: {queueStatus.error_message}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;