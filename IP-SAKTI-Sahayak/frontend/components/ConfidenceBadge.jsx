"use client";

import React from "react";

export default function ConfidenceBadge({ confidence, score }) {
  const colors = {
    HIGH: "bg-[#2F6B4F]/20 text-[#1F4D37] border-[#2F6B4F]/30",
    MEDIUM: "bg-[#B8862B]/20 text-[#7A551A] border-[#B8862B]/30",
    LOW: "bg-[#9B3B34]/20 text-[#7A2E28] border-[#9B3B34]/30",
  };

  const icons = {
    HIGH: "🟢",
    MEDIUM: "🟡",
    LOW: "🔴",
  };

  const color = colors[confidence] || colors.MEDIUM;
  const icon = icons[confidence] || "❓";

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${color}`}
      title={`Confidence: ${confidence} (Score: ${score?.toFixed(2)})`}
    >
      <span>{icon}</span>
      <span>{confidence}</span>
      {score !== undefined && (
        <span className="text-xs opacity-70">({score.toFixed(1)})</span>
      )}
    </div>
  );
}
