'use client';

import React, { useState, useEffect } from 'react';

/**
 * Headers Demo Page
 * Interactive demonstration of HTTPS enforcement and security headers
 */

interface SecurityHeader {
  name: string;
  description: string;
  importance: 'Critical' | 'High' | 'Medium';
  expectedValue?: string;
  actualValue?: string;
  status?: 'pass' | 'fail' | 'warning';
}

interface HeaderTestResult {
  header: string;
  expected: string;
  actual: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export default function HeadersDemo() {
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [securityHeaders, setSecurityHeaders] = useState<SecurityHeader[]>([]);
  const [testResults, setTestResults] = useState<HeaderTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [protocol, setProtocol] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);

  // Security headers to check
  const expectedHeaders: SecurityHeader[] = [
    {
      name: 'Strict-Transport-Security',
      description: 'Forces HTTPS connections and prevents protocol downgrade attacks',
      importance: 'Critical',
      expectedValue: 'max-age=63072000; includeSubDomains; preload',
    },
    {
      name: 'Content-Security-Policy',
      description: 'Controls which resources can be loaded to prevent XSS attacks',
      importance: 'Critical',
      expectedValue: "default-src 'self'",
    },
    {
      name: 'X-Frame-Options',
      description: 'Prevents clickjacking by controlling iframe embedding',
      importance: 'High',
      expectedValue: 'DENY',
    },
    {
      name: 'X-Content-Type-Options',
      description: 'Prevents MIME-sniffing attacks',
      importance: 'High',
      expectedValue: 'nosniff',
    },
    {
      name: 'Referrer-Policy',
      description: 'Controls how much referrer information is shared',
      importance: 'Medium',
      expectedValue: 'strict-origin-when-cross-origin',
    },
    {
      name: 'Permissions-Policy',
      description: 'Controls browser features like camera, microphone, geolocation',
      importance: 'Medium',
      expectedValue: 'camera=(), microphone=(), geolocation=()',
    },
    {
      name: 'Cross-Origin-Embedder-Policy',
      description: 'Prevents documents from loading cross-origin resources',
      importance: 'Medium',
      expectedValue: 'require-corp',
    },
    {
      name: 'Cross-Origin-Opener-Policy',
      description: 'Isolates browsing context from cross-origin windows',
      importance: 'Medium',
      expectedValue: 'same-origin',
    },
    {
      name: 'Cross-Origin-Resource-Policy',
      description: 'Controls which origins can load this resource',
      importance: 'Medium',
      expectedValue: 'same-origin',
    },
  ];

  useEffect(() => {
    // Fetch headers from server
    const fetchHeaders = async () => {
      setIsLoading(true);
      try {
        // Get protocol (HTTP or HTTPS)
        const currentProtocol = window.location.protocol;
        setProtocol(currentProtocol);

        // Fetch a test endpoint to check headers
        const response = await fetch('/api/security/headers-check', {
          method: 'GET',
        });

        // Get response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        setHeaders(responseHeaders);

        // Check each security header
        const checkedHeaders: SecurityHeader[] = expectedHeaders.map((header) => {
          const actualValue = responseHeaders[header.name.toLowerCase()];
          const status: 'pass' | 'fail' | 'warning' = actualValue
            ? actualValue.includes(header.expectedValue || '')
              ? 'pass'
              : 'warning'
            : 'fail';

          return {
            ...header,
            actualValue: actualValue || 'Not present',
            status,
          };
        });

        setSecurityHeaders(checkedHeaders);

        // Generate test results
        const results: HeaderTestResult[] = checkedHeaders.map((header) => ({
          header: header.name,
          expected: header.expectedValue || '',
          actual: header.actualValue || 'Not present',
          status: header.status || 'fail',
          message:
            header.status === 'pass'
              ? '✓ Header is correctly configured'
              : header.status === 'warning'
              ? '⚠ Header is present but value differs from expected'
              : '✗ Header is missing',
        }));

        setTestResults(results);
      } catch (error) {
        console.error('Error fetching headers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeaders();
  }, []);

  const getStatusColor = (status?: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'fail':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImportanceColor = (importance: 'Critical' | 'High' | 'Medium') => {
    switch (importance) {
      case 'Critical':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'High':
        return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'Medium':
        return 'text-blue-700 bg-blue-100 border-blue-300';
    }
  };

  const overallScore = securityHeaders.filter((h) => h.status === 'pass').length;
  const totalHeaders = securityHeaders.length;
  const scorePercentage = totalHeaders > 0 ? (overallScore / totalHeaders) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔒 Security Headers Verification
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interactive demonstration of HTTPS enforcement and security headers for enhanced web
            application security
          </p>
        </div>

        {/* Protocol Check */}
        <div className="mb-8">
          <div
            className={`p-6 rounded-lg border-2 ${
              protocol === 'https:'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">
                  {protocol === 'https:' ? '🔒' : '⚠️'}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">
                    Connection Protocol:{' '}
                    <span
                      className={
                        protocol === 'https:' ? 'text-green-700' : 'text-red-700'
                      }
                    >
                      {protocol.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    {protocol === 'https:'
                      ? '✓ Your connection is secure and encrypted'
                      : '✗ Your connection is not secure. Use HTTPS in production!'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        {!isLoading && (
          <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Security Score</h2>
              <div className="text-3xl font-bold">
                <span
                  className={
                    scorePercentage >= 80
                      ? 'text-green-600'
                      : scorePercentage >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }
                >
                  {scorePercentage.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  scorePercentage >= 80
                    ? 'bg-green-500'
                    : scorePercentage >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${scorePercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {overallScore} out of {totalHeaders} security headers passed
            </p>
          </div>
        )}

        {/* Security Headers Cards */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Checking security headers...</p>
          </div>
        ) : (
          <div className="space-y-6 mb-8">
            {securityHeaders.map((header, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md border-2 overflow-hidden"
              >
                <div className={`p-6 border-l-4 ${getStatusColor(header.status)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {header.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full border ${getImportanceColor(
                            header.importance
                          )}`}
                        >
                          {header.importance}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            header.status === 'pass'
                              ? 'bg-green-100 text-green-800'
                              : header.status === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {header.status === 'pass'
                            ? 'PASS'
                            : header.status === 'warning'
                            ? 'WARNING'
                            : 'FAIL'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{header.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Expected:</span>
                          <code className="block mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {header.expectedValue}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Actual:</span>
                          <code
                            className={`block mt-1 p-2 rounded text-xs overflow-x-auto ${
                              header.status === 'pass'
                                ? 'bg-green-50 text-green-800'
                                : header.status === 'warning'
                                ? 'bg-yellow-50 text-yellow-800'
                                : 'bg-red-50 text-red-800'
                            }`}
                          >
                            {header.actualValue}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All Response Headers (Collapsible) */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                All Response Headers ({Object.keys(headers).length})
              </h3>
              <span className="text-gray-500">
                {showDetails ? '▼' : '▶'}
              </span>
            </div>
          </button>

          {showDetails && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <pre className="text-sm overflow-x-auto bg-gray-900 text-green-400 p-4 rounded font-mono">
                {JSON.stringify(headers, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* CORS Test Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            🌐 CORS Configuration Test
          </h3>
          <p className="text-gray-600 mb-4">
            CORS headers control which origins can access your API. Click below to test CORS
            configuration.
          </p>
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/security/comments', {
                  method: 'OPTIONS',
                });
                const corsHeaders: Record<string, string> = {};
                response.headers.forEach((value, key) => {
                  if (key.startsWith('access-control')) {
                    corsHeaders[key] = value;
                  }
                });
                alert(
                  'CORS Headers:\n\n' +
                    Object.entries(corsHeaders)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n')
                );
              } catch (error) {
                alert('CORS test failed: ' + error);
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Test CORS Preflight
          </button>
        </div>

        {/* Educational Info */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📚 Why Security Headers Matter
          </h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li>
              <strong>HSTS:</strong> Forces HTTPS connections, preventing man-in-the-middle
              attacks
            </li>
            <li>
              <strong>CSP:</strong> Blocks XSS attacks by controlling script and resource
              loading
            </li>
            <li>
              <strong>X-Frame-Options:</strong> Prevents clickjacking by blocking iframe
              embedding
            </li>
            <li>
              <strong>X-Content-Type-Options:</strong> Stops MIME-sniffing vulnerabilities
            </li>
            <li>
              <strong>CORS:</strong> Controls cross-origin requests to protect your API
            </li>
          </ul>
        </div>

        {/* Documentation Link */}
        <div className="mt-8 text-center">
          <a
            href="/security-demo"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            View XSS & Input Sanitization Demo →
          </a>
        </div>
      </div>
    </div>
  );
}
