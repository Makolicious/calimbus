"use client";

// Base Skeleton component with shimmer effect
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer rounded ${className}`}
    />
  );
}

// Card skeleton for loading states
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-700/50 rounded-lg border-l-4 border-l-gray-300 dark:border-l-gray-600 p-4 mb-2.5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// Column skeleton for loading states
export function ColumnSkeleton() {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl w-72 flex-shrink-0 flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 border-t-4 border-t-gray-300 dark:border-t-gray-600 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
      </div>
      <div className="p-2 space-y-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

// Board skeleton for initial loading
export function BoardSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
    </div>
  );
}

// Toolbar skeleton
export function ToolbarSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-8 w-8" />
      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-16" />
      <div className="flex-1" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

// Full page skeleton
export function PageSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <ToolbarSkeleton />
      <div className="flex-1 overflow-hidden">
        <BoardSkeleton />
      </div>
    </div>
  );
}

export { Skeleton };
