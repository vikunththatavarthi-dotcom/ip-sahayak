"use client";

import React from "react";

export default function SourceCard({ source, index }) {
  const title = source.title || "Unknown Source";
  const authority = source.authority || "Official Source";
  const relevance = source.relevance_score 
    ? `${Math.round(source.relevance_score * 100)}% match`
    : "Related";

  return (
    <a
      href={source.url || "#"}
      target={source.url ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="group block p-3 rounded-lg bg-[#E9E2CD]/40 border border-[#D9D0B8]/50 hover:border-[#2C5282]/50 hover:bg-[#2C5282]/10 transition-all duration-200"
    >
      <div className="flex items-start gap-2">
        <span className="text-xs font-bold text-[#1E3A5F] flex-shrink-0 mt-0.5">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-[#221F17] group-hover:text-[#17315C] line-clamp-2 transition-colors">
            {title}
          </h4>
          <p className="text-xs text-[#6E6754] mt-1">{authority}</p>
          <p className="text-xs text-[#8B8368] mt-0.5">{relevance}</p>
        </div>
      </div>
    </a>
  );
}
