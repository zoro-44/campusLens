import React from "react";

export const Spinner = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 rounded bg-gray-200"></div>
          <div className="h-6 w-16 rounded bg-gray-200"></div>
        </div>
        <div className="h-12 w-12 rounded-xl bg-gray-200"></div>
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="animate-pulse rounded-xl border border-gray-150 bg-white p-4 shadow-sm">
      <div className="mb-4 h-6 w-48 rounded bg-gray-200"></div>
      <div className="space-y-4">
        <div className="h-8 w-full rounded bg-gray-100"></div>
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="h-10 flex-1 rounded bg-gray-100"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="flex h-80 animate-pulse flex-col justify-end gap-3 rounded-xl border border-gray-150 bg-white p-6 shadow-sm">
      <div className="h-4 w-40 rounded bg-gray-200"></div>
      <div className="flex items-end gap-6 h-full w-full px-4 pt-8">
        <div className="h-3/4 flex-1 rounded-t bg-gray-200"></div>
        <div className="h-1/2 flex-1 rounded-t bg-gray-200"></div>
        <div className="h-5/6 flex-1 rounded-t bg-gray-200"></div>
        <div className="h-2/3 flex-1 rounded-t bg-gray-200"></div>
        <div className="h-1/3 flex-1 rounded-t bg-gray-200"></div>
      </div>
    </div>
  );
};
