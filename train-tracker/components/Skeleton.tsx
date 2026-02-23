/**
 * Skeleton Component
 * Provides reusable skeleton loading states for various content types
 */

export interface SkeletonProps {
  className?: string;
  count?: number;
}

/**
 * Generic skeleton line - use for text content
 */
export function SkeletonLine({ className = "h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" }: SkeletonProps) {
  return <div className={`animate-pulse ${className}`} />;
}

/**
 * Card skeleton - mimics a content card structure
 */
export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6 shadow-card space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      </div>
    </div>
  );
}

/**
 * Avatar skeleton - for user profile images
 */
export function SkeletonAvatar() {
  return (
    <div className="animate-pulse">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
  );
}

/**
 * User list skeleton - grid of user cards
 */
export function SkeletonUserList({ count = 3 }: SkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Table skeleton - shows skeleton rows for table data
 */
export function SkeletonTable({ count = 5 }: SkeletonProps) {
  return (
    <div className="overflow-x-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Header */}
        <div className="animate-pulse bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-4 gap-4 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full" />
            ))}
          </div>
        </div>

        {/* Rows */}
        {Array.from({ length: count }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="animate-pulse border-b border-gray-200 dark:border-gray-600 last:border-b-0"
          >
            <div className="grid grid-cols-4 gap-4 p-4">
              {Array.from({ length: 4 }).map((_, colIdx) => (
                <div key={colIdx} className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full page skeleton - comprehensive loading state
 */
export function SkeletonPage() {
  return (
    <div className="space-y-6 p-6 min-h-screen">
      {/* Header */}
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
        <SkeletonTable count={4} />
      </div>
    </div>
  );
}
