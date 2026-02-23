export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Title Skeleton */}
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mx-auto" />
        </div>

        {/* Form Fields */}
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded" />

        {/* Footer Link */}
        <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
      </div>
    </div>
  );
}
