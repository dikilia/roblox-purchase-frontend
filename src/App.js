import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [cookie, setCookie] = useState('');
  const [gamepassId, setGamepassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [purchaseDetails, setPurchaseDetails] = useState(null);

  // Use your backend URL
  const BACKEND_URL = 'https://roblox-purchase-backend.vercel.app';

  const purchaseGamepass = async () => {
    if (!cookie || !gamepassId) {
      setResult({ type: 'error', message: 'Please enter both cookie and gamepass ID' });
      return;
    }

    setLoading(true);
    setResult({ type: 'info', message: 'Processing purchase...' });
    setPurchaseDetails(null);

    try {
      // Single API call to your backend proxy
      const response = await axios.post(`${BACKEND_URL}/api/proxy-purchase`, {
        cookie: cookie.trim(),
        gamepassId: gamepassId.trim()
      });

      if (response.data.success) {
        setResult({ type: 'success', message: 'Purchase completed successfully!' });
        setPurchaseDetails(response.data.data);
      } else {
        setResult({ type: 'error', message: response.data.error });
      }

    } catch (error) {
      console.error('Purchase error:', error);
      
      let errorMessage = 'Purchase failed';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.message;
      }
      
      setResult({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    purchaseGamepass();
  };

  const resetForm = () => {
    setCookie('');
    setGamepassId('');
    setResult(null);
    setPurchaseDetails(null);
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>🎮 Roblox Gamepass Auto-Purchase</h1>
          <span className="version">v2.0.0</span>
        </div>

        <div className="warning-box">
          <strong>⚠️ Important: Use REFRESHED Cookie Only</strong>
          <p>
            This tool requires a <strong>refreshed/unlocked</strong> .ROBLOSECURITY cookie.
            Regular cookies will fail due to IP locking.
          </p>
        </div>

        {!purchaseDetails ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                <span className="label-text">Refreshed .ROBLOSECURITY Cookie</span>
                <span className="required">*</span>
              </label>
              <textarea
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                placeholder="_|WARNING:-DO-NOT-SHARE..."
                rows="4"
                required
                disabled={loading}
              />
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
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="primary-button">
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                '💰 Purchase Gamepass'
              )}
            </button>
          </form>
        ) : (
          <div className="success-container">
            <div className="success-box">
              <h3>✅ Purchase Successful!</h3>
              <div className="purchase-details">
                <div className="detail-row">
                  <span>Username:</span>
                  <strong>{purchaseDetails.username}</strong>
                </div>
                <div className="detail-row">
                  <span>User ID:</span>
                  <strong>{purchaseDetails.userId}</strong>
                </div>
                <div className="detail-row">
                  <span>Gamepass:</span>
                  <strong>{purchaseDetails.gamepassName}</strong>
                </div>
                <div className="detail-row">
                  <span>Price:</span>
                  <strong>{purchaseDetails.price} Robux</strong>
                </div>
                <div className="detail-row">
                  <span>Transaction ID:</span>
                  <strong>{purchaseDetails.transactionId}</strong>
                </div>
              </div>
            </div>
            <button onClick={resetForm} className="secondary-button">
              🔄 Purchase Another Gamepass
            </button>
          </div>
        )}

        {result && !purchaseDetails && (
          <div className={`result-box result-${result.type}`}>
            {result.type === 'info' && <span className="spinner-small"></span>}
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
