'use client';

import React, { useState, Suspense } from 'react';
import toast from 'react-hot-toast';
import {
  SkeletonCard,
  SkeletonUserList,
  SkeletonTable,
  SkeletonPage,
} from '@/components/Skeleton';
import ErrorFallback from '@/components/ErrorFallback';

/**
 * Demo component that throws an error to trigger error boundary
 */
function ErrorTrigger({ shouldError }: { shouldError: boolean }) {
  if (shouldError) {
    throw new Error('This is a simulated error. Click "Try Again" to recover.');
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
      <div className="flex items-center gap-3">
        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <div>
          <h3 className="font-medium text-green-900 dark:text-green-100">All systems operational</h3>
          <p className="text-sm text-green-700 dark:text-green-300">No errors detected</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Simulated data fetcher with delay
 */
async function SlowDataFetcher({ delay }: { delay: number }) {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Data Loaded Successfully</h3>
      <p className="text-gray-600 dark:text-gray-400">This data was loaded after {delay}ms delay.</p>
    </div>
  );
}

export default function ErrorLoadingDemo() {
  const [simulateError, setSimulateError] = useState(false);
  const [showSlowLoader, setShowSlowLoader] = useState(false);
  const [showCardSkeleton, setShowCardSkeleton] = useState(false);
  const [showPageSkeleton, setShowPageSkeleton] = useState(false);
  const [errorKey, setErrorKey] = useState(0);

  const handleErrorToggle = () => {
    if (simulateError) {
      setSimulateError(false);
      setErrorKey((prev) => prev + 1);
    } else {
      setSimulateError(true);
    }
  };

  const handleShowSlowLoader = () => {
    setShowSlowLoader(true);
    setTimeout(() => setShowSlowLoader(false), 3000);
  };

  const handleShowCardSkeleton = () => {
    setShowCardSkeleton(true);
    setTimeout(() => setShowCardSkeleton(false), 2000);
  };

  const handleShowPageSkeleton = () => {
    setShowPageSkeleton(true);
    setTimeout(() => setShowPageSkeleton(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Error & Loading States Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Interactive showcase of loading skeletons and error boundaries
          </p>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-3">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100">How to Test</h2>
          <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
            <li>Click the buttons below to simulate different states</li>
            <li>Observe loading skeletons showing expected content structure</li>
            <li>See error boundaries gracefully handling failures</li>
            <li>Test retry functionality with the "Try Again" button</li>
            <li>Try browser's Network Throttling for realistic slow loading</li>
          </ul>
        </div>

        {/* Control Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interactive Controls</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Error State */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Error Boundary</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {simulateError ? 'Currently showing error state. Click to reset.' : 'Click to trigger an error'}
              </p>
              <button
                onClick={handleErrorToggle}
                className={`w-full px-4 py-2 rounded font-medium transition-colors ${
                  simulateError
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {simulateError ? '✓ Reset Error' : '✗ Trigger Error'}
              </button>
            </div>

            {/* Slow Loader */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Slow Data Loader</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Simulates data fetching with 3 second delay
              </p>
              <button
                onClick={handleShowSlowLoader}
                disabled={showSlowLoader}
                className="w-full px-4 py-2 bg-brand-500 text-white rounded font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {showSlowLoader ? 'Loading...' : 'Start 3s Wait'}
              </button>
            </div>

            {/* Card Skeleton */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Card Skeleton</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shows loading skeleton for 2 seconds
              </p>
              <button
                onClick={handleShowCardSkeleton}
                disabled={showCardSkeleton}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors"
              >
                {showCardSkeleton ? 'Loading...' : 'Show Skeleton'}
              </button>
            </div>

            {/* Full Page Skeleton */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Full Page Skeleton</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete page layout loading state
              </p>
              <button
                onClick={handleShowPageSkeleton}
                disabled={showPageSkeleton}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
              >
                {showPageSkeleton ? 'Loading...' : 'Show Full Page'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Error State Preview</h2>
          <ErrorTrigger key={errorKey} shouldError={simulateError} />
        </div>

        {/* Slow Loader Display */}
        {showSlowLoader && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Slow Data Loading</h2>
            <Suspense fallback={<div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded" />}>
              <SlowDataFetcher delay={3000} />
            </Suspense>
          </div>
        )}

        {/* Card Skeleton Display */}
        {showCardSkeleton && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Card Skeleton Loading</h2>
            <SkeletonCard />
          </div>
        )}

        {/* Full Page Skeleton Display */}
        {showPageSkeleton && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 p-8 pb-0">Full Page Skeleton</h2>
            <SkeletonPage />
          </div>
        )}

        {/* Skeleton Showcase */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Skeleton Types</h2>

          {/* User List Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-8 space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">User List Skeleton</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Preview for users page loading</p>
            <SkeletonUserList count={3} />
          </div>

          {/* Table Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-8 space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Table Skeleton</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Preview for data tables loading</p>
            <SkeletonTable count={4} />
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-8 space-y-4">
          <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Implementation Guide</h2>

          <div className="space-y-4 text-sm text-emerald-800 dark:text-emerald-200">
            <div>
              <h3 className="font-semibold mb-2">Loading States</h3>
              <p>Created <code className="bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 rounded">loading.tsx</code> files in:</p>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>app/users/ - User list loading</li>
                <li>app/dashboard/ - Dashboard page loading</li>
                <li>app/login/ - Login form loading</li>
                <li>app/signup/ - Signup form loading</li>
                <li>app/contact/ - Contact form loading</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Error Boundaries</h3>
              <p>Created <code className="bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 rounded">error.tsx</code> files in:</p>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>All routes above - Graceful error handling with retry</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Testing</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Use browser DevTools: Network tab → Throttle to "Slow 3G" to see skeletons</li>
                <li>Trigger errors by modifying API responses or throwing errors in page.tsx</li>
                <li>Test retry functionality to ensure error recovery works</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
