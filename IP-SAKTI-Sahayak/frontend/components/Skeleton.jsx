"use client";

import React from "react";

/** A single skeleton line/block. Pass className to control size. */
export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

/** A card-shaped skeleton — mimics the rounded bordered panels used across the app. */
export function SkeletonCard({ lines = 3, className = "" }) {
  return (
    <div className={`bg-[#F3EEE0]/40 border border-[#E9E2CD] rounded-xl p-5 flex flex-col gap-2.5 ${className}`}>
      <SkeletonBlock className="h-3 w-1/3 mb-1" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/** A row of pill-shaped skeletons, e.g. for a checklist or tag list. */
export function SkeletonRows({ rows = 3, className = "" }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

/** Simple empty-state block with icon, title, and optional action. */
export function EmptyState({ icon = "🗂️", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 border border-dashed border-[#D9D0B8]/70 rounded-xl p-10">
      <div className="text-4xl opacity-70 mb-1">{icon}</div>
      {title && <div className="text-sm font-medium text-[#2E2B22]">{title}</div>}
      {description && <p className="text-xs text-[#6E6754] max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
