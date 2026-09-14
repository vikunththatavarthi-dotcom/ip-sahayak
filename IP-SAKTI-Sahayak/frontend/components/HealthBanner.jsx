"use client";

import React, { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

const POLL_INTERVAL_MS = 20000;

export default function HealthBanner() {
  const [status, setStatus] = useState("checking"); // checking | ok | degraded | offline
  const [health, setHealth] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const h = await getHealth();
        if (cancelled) return;
        setHealth(h);
        if (!h.llm_configured || h.kb_chunk_count === 0) {
          setStatus("degraded");
        } else {
          setStatus("ok");
        }
      } catch (e) {
        if (cancelled) return;
        setHealth(null);
        setStatus("offline");
      }
    };

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Re-show the banner if the situation changes after a dismiss
  useEffect(() => {
    setDismissed(false);
  }, [status]);

  if (status === "checking" || status === "ok" || dismissed) return null;

  if (status === "offline") {
    return (
      <div className="flex items-start gap-3 bg-[#9B3B34]/10 border-b border-[#9B3B34]/30 px-4 py-2.5">
        <span className="text-[#8B332C] text-base flex-shrink-0" aria-hidden="true">🔌</span>
        <p className="text-xs text-[#7A2E28] leading-relaxed flex-1">
          <strong>Backend unreachable.</strong> Can't connect to the API server. Make sure the backend
          is running (<code className="bg-[#9B3B34]/10 px-1 rounded">uvicorn app.main:app</code>) and reachable
          at the configured API URL.
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-[#8B332C]/70 hover:text-[#7A2E28] text-xs flex-shrink-0"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    );
  }

  // degraded
  const llmDown = health && !health.llm_configured;
  const kbEmpty = health && health.kb_chunk_count === 0;

  return (
    <div className="flex items-start gap-3 bg-[#B8862B]/10 border-b border-[#B8862B]/30 px-4 py-2.5">
      <span className="text-[#8A5F1E] text-base flex-shrink-0" aria-hidden="true">⚠️</span>
      <div className="text-xs text-[#7A551A] leading-relaxed flex-1 flex flex-col gap-0.5">
        {llmDown && (
          <p>
            <strong>LLM not connected.</strong> {health?.message || "Answers will be degraded or unavailable."}
          </p>
        )}
        {kbEmpty && (
          <p>
            <strong>Knowledge base is empty (0 chunks indexed).</strong> Retrieval will return no sources.
            Add PDFs to <code className="bg-[#B8862B]/10 px-1 rounded">backend/data/pdfs/</code> and run{" "}
            <code className="bg-[#B8862B]/10 px-1 rounded">python scripts/ingest.py</code>.
          </p>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-[#8A5F1E]/70 hover:text-[#7A551A] text-xs flex-shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
