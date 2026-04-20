import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [cookie, setCookie] = useState('');
  const [gamepassId, setGamepassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [purchaseDetails, setPurchaseDetails] = useState(null);

  const purchaseGamepass = async () => {
    if (!cookie || !gamepassId) {
      setResult({ type: 'error', message: 'Please enter both cookie and gamepass ID' });
      return;
    }

    setLoading(true);
    setResult({ type: 'info', message: 'Processing purchase...' });
    setPurchaseDetails(null);

    try {
      // Step 1: Get CSRF Token
      const csrfResponse = await axios.post('https://auth.roblox.com/v2/logout', {}, {
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'Content-Type': 'application/json'
        }
      });
      
      const csrfToken = csrfResponse.headers['x-csrf-token'];
      if (!csrfToken) {
        throw new Error('Invalid cookie - Could not get CSRF token');
      }

      // Step 2: Get User Info
      const userResponse = await axios.get('https://users.roblox.com/v1/users/authenticated', {
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`
        }
      });
      
      const userId = userResponse.data.id;
      const username = userResponse.data.name;

      // Step 3: Get Gamepass Info
      const productResponse = await axios.get(
        `https://economy.roblox.com/v1/game-pass/${gamepassId}/product-info`,
        {
          headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`
          }
        }
      );

      const productData = productResponse.data;
      
      // Step 4: Execute Purchase
      const purchaseData = {
        expectedCurrency: 1,
        expectedPrice: productData.Price,
        expectedSellerId: productData.Creator.Id
      };

      const purchaseResponse = await axios.post(
        `https://economy.roblox.com/v1/purchases/products/${productData.ProductId}`,
        purchaseData,
        {
          headers: {
            'Cookie': `.ROBLOSECURITY=${cookie}`,
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          }
        }
      );

      setResult({ type: 'success', message: 'Purchase completed successfully!' });
      setPurchaseDetails({
        username: username,
        userId: userId,
        gamepassName: productData.Name,
        price: productData.Price,
        transactionId: purchaseResponse.data.transactionId || 'N/A'
      });

    } catch (error) {
      console.error('Purchase error:', error);
      
      let errorMessage = 'Purchase failed';
      
      if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors[0]?.message || errorMessage;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid or expired cookie. Please refresh your cookie.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Cookie may be IP-locked or invalid.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid gamepass ID or already owned.';
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
            Regular cookies will fail due to IP locking. Use your cookie refresher first,
            then paste the refreshed cookie below.
          </p>
        </div>

        <div className="info-box">
          <strong>📋 How It Works</strong>
          <p>
            1. Refresh your cookie using your cookie refresher<br/>
            2. Paste the refreshed cookie below<br/>
            3. Enter the gamepass ID<br/>
            4. Click "Purchase Gamepass" - it processes instantly!
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
                placeholder="_|WARNING:-DO-NOT-SHARE--YOUR-REFRESHED-COOKIE-HERE..."
                rows="4"
                required
                disabled={loading}
              />
              <small className="helper-text">
                Paste your REFRESHED cookie here (must be unlocked/IP-free)
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
                disabled={loading}
              />
              <small className="helper-text">
                Found in URL: roblox.com/game-pass/<strong>12345678</strong>/Name
              </small>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="primary-button"
            >
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
