import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-900 rounded ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded bg-slate-950 border border-slate-900 p-5 flex flex-col justify-between h-36">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-28" />
        </div>
        <Skeleton className="w-8.5 h-8.5 rounded" />
      </div>
      <div className="flex justify-between items-center border-t border-slate-900 pt-4 mt-4">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}

export function IncidentCardSkeleton() {
  return (
    <div className="bg-slate-950 border border-slate-900 border-l-4 border-l-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-3.5 w-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <Skeleton className="h-8 w-full rounded" />
      <div className="flex justify-between items-center border-t border-slate-900 pt-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}

export function FacilityCardSkeleton() {
  return (
    <div className="bg-slate-950 border border-slate-900 rounded-lg p-5 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-12" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="space-y-2 bg-slate-900/40 p-3 rounded border border-slate-900">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-10" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-28" />
        <div className="flex gap-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
      <Skeleton className="h-8 w-full border border-slate-900 rounded pt-4" />
    </div>
  );
}
