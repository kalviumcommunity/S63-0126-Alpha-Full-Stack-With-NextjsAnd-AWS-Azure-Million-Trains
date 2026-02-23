'use client';

import { useState, useEffect } from 'react';
import { useAuthFetch } from '@/lib/auth-fetch';

/**
 * JWT Token Refresh Demo
 * Visualizes the token refresh flow with interactive controls
 */
export default function JWTDemoPage() {
  const { fetchWithAuth, refreshAccessToken, isRefreshing } = useAuthFetch();
  
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean;
    expiresIn: number | null;
    user: any;
  }>({
    hasToken: false,
    expiresIn: null,
    user: null,
  });
  
  const [apiResponse, setApiResponse] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  
  // Check token status on mount
  useEffect(() => {
    checkTokenStatus();
  }, []);
  
  // Update token countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (tokenInfo.expiresIn && tokenInfo.expiresIn > 0) {
        setTokenInfo(prev => ({
          ...prev,
          expiresIn: prev.expiresIn ? prev.expiresIn - 1 : null,
        }));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [tokenInfo.expiresIn]);
  
  async function checkTokenStatus() {
    addLog('Checking token status...');
    
    try {
      // Check if we have a valid refresh token
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Decode token to get expiry (simplified - just for demo)
        try {
          const base64Url = data.accessToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          
          const expiresAt = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          const expiresIn = Math.floor((expiresAt - now) / 1000);
          
          setTokenInfo({
            hasToken: true,
            expiresIn,
            user: data.user,
          });
          
          addLog(`✅ Valid session found. Token expires in ${expiresIn} seconds.`);
        } catch (decodeError) {
          addLog('⚠️ Could not decode token');
        }
      } else {
        setTokenInfo({
          hasToken: false,
          expiresIn: null,
          user: null,
        });
        addLog('❌ No valid session. Please login first.');
      }
    } catch (error) {
      addLog('❌ Error checking token status');
      console.error(error);
    }
  }
  
  async function handleManualRefresh() {
    addLog('🔄 Manually triggering token refresh...');
    
    try {
      const newToken = await refreshAccessToken();
      addLog('✅ Token refreshed successfully!');
      await checkTokenStatus(); // Update token info
    } catch (error) {
      addLog('❌ Token refresh failed. Session may be expired.');
      setTokenInfo({
        hasToken: false,
        expiresIn: null,
        user: null,
      });
    }
  }
  
  async function handleProtectedRequest() {
    addLog('📡 Making protected API request...');
    setApiResponse('Loading...');
    
    try {
      const response = await fetchWithAuth('/api/users/profile');
      
      if (response.ok) {
        const data = await response.json();
        setApiResponse(JSON.stringify(data, null, 2));
        addLog('✅ API request successful!');
      } else {
        const errorData = await response.json();
        setApiResponse(JSON.stringify(errorData, null, 2));
        addLog(`❌ API request failed: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      setApiResponse(`Error: ${error.message}`);
      addLog(`❌ API request error: ${error.message}`);
    }
  }
  
  async function handleSimulateExpiry() {
    addLog('⏰ Simulating token expiry...');
    
    // This is just visual simulation - in real scenario, wait 15 minutes
    setTokenInfo(prev => ({
      ...prev,
      expiresIn: 0,
    }));
    
    addLog('⚠️ Token expired! Next API call will trigger auto-refresh.');
    addLog('💡 Click "Call Protected API" to see auto-refresh in action.');
  }
  
  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  }
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            JWT Token Refresh Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Interactive demonstration of automatic token refresh flow
          </p>
          
          {/* Session Status */}
          <div className={`p-6 rounded-lg mb-6 ${
            tokenInfo.hasToken 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {tokenInfo.hasToken ? '🟢 Session Active' : '🔴 No Active Session'}
                </h2>
                {tokenInfo.user && (
                  <p className="text-gray-700">
                    Logged in as: <strong>{tokenInfo.user.email}</strong> ({tokenInfo.user.role})
                  </p>
                )}
              </div>
              
              {tokenInfo.expiresIn !== null && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Access Token Expires In:</p>
                  <p className={`text-3xl font-bold ${
                    tokenInfo.expiresIn < 60 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatTime(tokenInfo.expiresIn)}
                  </p>
                  {tokenInfo.expiresIn < 60 && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Token expiring soon!
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {isRefreshing && (
              <div className="bg-yellow-100 border border-yellow-300 rounded p-3 text-yellow-800">
                🔄 Token refresh in progress...
              </div>
            )}
          </div>
          
          {/* Control Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={checkTokenStatus}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              📊 Check Status
            </button>
            
            <button
              onClick={handleManualRefresh}
              disabled={!tokenInfo.hasToken || isRefreshing}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Manual Refresh
            </button>
            
            <button
              onClick={handleProtectedRequest}
              disabled={!tokenInfo.hasToken}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📡 Call Protected API
            </button>
            
            <button
              onClick={handleSimulateExpiry}
              disabled={!tokenInfo.hasToken}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⏰ Simulate Expiry
            </button>
          </div>
        </div>
        
        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* API Response */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">API Response</h2>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
              {apiResponse || '// API response will appear here'}
            </pre>
          </div>
          
          {/* Event Logs */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Event Logs</h2>
              <button
                onClick={() => setLogs([])}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Logs
              </button>
            </div>
            <div className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
              {logs.length === 0 ? (
                <p className="text-gray-500">// Event logs will appear here</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* How It Works */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">How It Works</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">1. Token Pair Generation</h3>
              <p className="text-gray-700">
                On login, server generates two tokens:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-600 mt-2">
                <li><strong>Access Token</strong> (15 min): Used for API requests</li>
                <li><strong>Refresh Token</strong> (7 days): Stored in HTTP-only cookie</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">2. Automatic Refresh</h3>
              <p className="text-gray-700">
                When access token expires:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-600 mt-2">
                <li>Protected API returns <code className="bg-gray-100 px-1">401 Unauthorized</code></li>
                <li>Client automatically calls <code className="bg-gray-100 px-1">/api/auth/refresh</code></li>
                <li>Server validates refresh token and issues new access token</li>
                <li>Original request retries with new token</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">3. Security Features</h3>
              <ul className="list-disc list-inside ml-4 text-gray-600">
                <li><strong>HTTP-only cookies</strong>: JavaScript cannot access refresh token (XSS protection)</li>
                <li><strong>SameSite: strict</strong>: Cookies not sent cross-origin (CSRF protection)</li>
                <li><strong>Token blacklist</strong>: Logout immediately invalidates tokens</li>
                <li><strong>Short expiry</strong>: Access token expires in 15 minutes (limited attack window)</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-lg mb-2">4. Session Expiry</h3>
              <p className="text-gray-700">
                If refresh token is invalid or expired:
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-600 mt-2">
                <li>User redirected to login page with <code className="bg-gray-100 px-1">?session=expired</code></li>
                <li>All client-side data cleared</li>
                <li>User must re-authenticate</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Testing Instructions */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Testing Instructions</h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">📝 Prerequisite: Login Required</h3>
              <p>
                Before testing this demo, ensure you are logged in. Visit{' '}
                <a href="/login" className="text-blue-600 hover:underline">/login</a> to authenticate.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">🧪 Test 1: Check Token Status</h3>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>Click <strong>"Check Status"</strong> button</li>
                <li>Verify session is active and token countdown appears</li>
                <li>Open DevTools → Network tab</li>
                <li>See <code className="bg-gray-100 px-1">POST /api/auth/refresh</code> returning 200 OK</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">🧪 Test 2: Manual Token Refresh</h3>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>Click <strong>"Manual Refresh"</strong> button</li>
                <li>Watch event log show refresh process</li>
                <li>Token countdown resets to 15 minutes</li>
                <li>Network tab shows new token issued</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">🧪 Test 3: Auto-Refresh on Expiry</h3>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>Click <strong>"Simulate Expiry"</strong> (or wait 15 real minutes)</li>
                <li>Click <strong>"Call Protected API"</strong></li>
                <li>Watch Network tab: <code className="bg-gray-100 px-1">401</code> → <code className="bg-gray-100 px-1">/refresh</code> → retry</li>
                <li>API response shows successful data</li>
                <li>Event log shows auto-refresh happened transparently</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">🧪 Test 4: Session Expiry After Logout</h3>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>Open new tab and visit <a href="/dashboard" className="text-blue-600 hover:underline">/dashboard</a></li>
                <li>Logout from dashboard</li>
                <li>Return to this demo page</li>
                <li>Click <strong>"Manual Refresh"</strong></li>
                <li>Watch refresh fail with 401 (token blacklisted)</li>
                <li>Page should redirect to <code className="bg-gray-100 px-1">/login?session=expired</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
