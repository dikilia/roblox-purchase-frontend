import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [cookie, setCookie] = useState('');
  const [gamepassId, setGamepassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [queueId, setQueueId] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://roblox-purchase-backend.vercel.app';

  // Check backend health on load
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/health`);
        if (response.data.status === 'ok') {
          setBackendStatus('online');
        } else {
          setBackendStatus('error');
        }
      } catch (err) {
        setBackendStatus('offline');
        setError('Cannot connect to backend server. Please try again later.');
      }
    };
    checkBackend();
  }, [BACKEND_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQueueStatus(null);

    // Validate cookie format
    if (!cookie.includes('_|WARNING')) {
      setError('Invalid cookie format. .ROBLOSECURITY cookie should start with "_|WARNING"');
      setLoading(false);
      return;
    }

    // Validate gamepass ID
    if (!/^\d+$/.test(gamepassId)) {
      setError('Gamepass ID must be numeric');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/queue-purchase`, {
        cookie: cookie.trim(),
        gamepassId: gamepassId.trim()
      });

      setQueueId(response.data.queueId);
      pollQueueStatus(response.data.queueId);
      
    } catch (err) {
      if (err.response?.status === 500) {
        setError('Backend server error. The database might be temporarily unavailable.');
      } else {
        setError(err.response?.data?.error || 'Failed to queue purchase. Please try again.');
      }
      setLoading(false);
    }
  };

  const pollQueueStatus = (id) => {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await axios.get(`${BACKEND_URL}/api/queue-status/${id}`);
        setQueueStatus(response.data);
        
        if (response.data.status !== 'pending' || attempts >= maxAttempts) {
          clearInterval(interval);
          setLoading(false);
          
          if (attempts >= maxAttempts && response.data.status === 'pending') {
            setError('Purchase is taking longer than expected. Check back later with Queue ID: ' + id);
          }
        }
      } catch (err) {
        clearInterval(interval);
        setError('Failed to fetch queue status. Your purchase may still be processing.');
        setLoading(false);
      }
    }, 2000);
  };

  const resetForm = () => {
    setCookie('');
    setGamepassId('');
    setQueueId(null);
    setQueueStatus(null);
    setError(null);
  };

  const getStatusDisplay = () => {
    if (backendStatus === 'checking') {
      return <div className="status-banner info">🔄 Checking backend connection...</div>;
    }
    if (backendStatus === 'offline') {
      return <div className="status-banner error">🔴 Backend is offline. Purchases cannot be queued.</div>;
    }
    if (backendStatus === 'error') {
      return <div className="status-banner warning">🟡 Backend connection unstable</div>;
    }
    return <div className="status-banner success">🟢 Backend online - Ready to queue purchases</div>;
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>🎮 Roblox Gamepass Automation</h1>
          <span className="version">v1.0.0</span>
        </div>
        
        {getStatusDisplay()}

        <div className="warning-box">
          <strong>⚠️ Important Security Warning</strong>
          <p>
            This tool queues purchases for automated processing. Never share your 
            .ROBLOSECURITY cookie with anyone. This violates Roblox Terms of Service 
            and may result in account termination. Use only with test accounts.
          </p>
        </div>

        {!queueId ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                <span className="label-text">.ROBLOSECURITY Cookie</span>
                <span className="required">*</span>
              </label>
              <textarea
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                placeholder="_|WARNING:-DO-NOT-SHARE-this-is-your-secret-cookie..."
                rows="3"
                required
                disabled={backendStatus !== 'online'}
              />
              <small className="helper-text">
                Get this from browser DevTools (F12) → Application → Cookies → .ROBLOSECURITY
              </small>
            </div>

            <div className="form-group">
              <label>
                <span className="label-text">Gamepass ID</span>
                <span className="required">*</span>
              </label>
              <input
                type="text"
                value={gamepassId}
                onChange={(e) => setGamepassId(e.target.value)}
                placeholder="e.g., 12345678"
                required
                disabled={backendStatus !== 'online'}
              />
              <small className="helper-text">
                The number in the gamepass URL: roblox.com/game-pass/<strong>12345678</strong>/Name
              </small>
            </div>

            <button 
              type="submit" 
              disabled={loading || backendStatus !== 'online'}
              className="primary-button"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                '📤 Queue Purchase'
              )}
            </button>
          </form>
        ) : (
          <div className="queue-info">
            <h3>📋 Queue Status</h3>
            
            <div className="queue-details">
              <div className="detail-row">
                <span className="label">Queue ID:</span>
                <span className="value">{queueId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className={`status-badge status-${queueStatus?.status || 'pending'}`}>
                  {queueStatus?.status || 'pending'}
                </span>
              </div>
              {queueStatus?.created_at && (
                <div className="detail-row">
                  <span className="label">Queued:</span>
                  <span className="value">{new Date(queueStatus.created_at).toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {queueStatus?.status === 'pending' && (
              <div className="pending-message">
                <div className="loading-spinner"></div>
                <p>Waiting for local bridge to process your purchase...</p>
                <small>This typically takes 10-30 seconds</small>
              </div>
            )}
            
            {queueStatus?.status === 'completed' && (
              <div className="success-box">
                <h4>✅ Purchase Successful!</h4>
                <div className="success-details">
                  <p><strong>User ID:</strong> {queueStatus.user_id}</p>
                  <p><strong>Transaction ID:</strong> {queueStatus.transaction_id}</p>
                  <p><strong>Processed:</strong> {new Date(queueStatus.processed_at).toLocaleString()}</p>
                </div>
              </div>
            )}
            
            {queueStatus?.status === 'failed' && (
              <div className="error-box">
                <h4>❌ Purchase Failed</h4>
                <p><strong>Error:</strong> {queueStatus.error_message}</p>
                <p><strong>Processed:</strong> {new Date(queueStatus.processed_at).toLocaleString()}</p>
                <small className="error-hint">
                  Common issues: Invalid cookie, insufficient funds, or gamepass already owned
                </small>
              </div>
            )}
            
            {(queueStatus?.status === 'completed' || queueStatus?.status === 'failed') && (
              <button onClick={resetForm} className="secondary-button">
                🔄 Queue Another Purchase
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="error-box global-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        <footer className="footer">
          <p>
            Connected to: {BACKEND_URL}<br/>
            <small>© 2024 - For educational purposes only</small>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
