import { SkeletonUserList } from '@/components/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>

        {/* Filters Skeleton */}
        <div className="animate-pulse flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          ))}
        </div>

        {/* Users Grid */}
        <SkeletonUserList count={6} />
      </div>
    </div>
  );
}
