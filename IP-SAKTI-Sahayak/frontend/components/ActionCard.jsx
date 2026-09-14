"use client";

import React from "react";

export default function ActionCard({ actions }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-[#6E6754] uppercase tracking-widest mb-2">
        Next Steps
      </h3>
      <div className="bg-[#2C5282]/10 border border-[#2C5282]/30 rounded-lg p-4">
        <ol className="space-y-2">
          {actions.map((action) => (
            <li key={action.step} className="text-sm text-[#221F17]">
              <span className="font-semibold text-[#1E3A5F]">{action.step}.</span>{" "}
              {action.description}
              {action.required_documents && action.required_documents.length > 0 && (
                <div className="mt-1 text-xs text-[#4B4636] ml-6">
                  📋 Docs needed:{" "}
                  {action.required_documents.join(", ")}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
