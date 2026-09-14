"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitFeedback } from "@/lib/api";
import ActionCard from "./ActionCard";
import ConfidenceBadge from "./ConfidenceBadge";
import SourceCard from "./SourceCard";

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-[#17315C]/90 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-lg">
        {text}
      </div>
    </div>
  );
}

// Maps our BCP-47-ish language codes to speechSynthesis locale tags.
const TTS_LOCALES = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
};

function speak(text, langCode) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    alert("Voice output is not supported in this browser. Please use Chrome.");
    return;
  }
  window.speechSynthesis.cancel(); // stop anything already playing
  // Strip markdown-ish formatting before reading aloud
  const plain = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
  const utterance = new SpeechSynthesisUtterance(plain);
  utterance.lang = TTS_LOCALES[langCode] || "en-IN";
  window.speechSynthesis.speak(utterance);
}

function AssistantBubble({ data }) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeakToggle = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }
    speak(data.answer, data.detected_language);
    setIsSpeaking(true);
    // speechSynthesis has no reliable "ended" promise across browsers when
    // interrupted, so poll for completion.
    const check = setInterval(() => {
      if (!window.speechSynthesis?.speaking) {
        setIsSpeaking(false);
        clearInterval(check);
      }
    }, 300);
  };

  const lowConfidence = data.confidence === "LOW";
  // "Complex" answers — low confidence, or medium confidence with few sources to lean on —
  // are the ones where handing off to a human expert actually helps.
  const needsExpertReview =
    data.confidence === "LOW" ||
    (data.confidence === "MEDIUM" && (data.sources?.length ?? 0) <= 1);

  const goToExpertBrief = () => {
    const params = new URLSearchParams();
    if (data.conversation_id) params.set("conversation_id", data.conversation_id);
    navigate(`/expert-brief?${params.toString()}`);
  };

  const handleFeedback = async (r) => {
    if (feedbackSent) return;
    setRating(r);
    setFeedbackSent(true);
    try {
      await submitFeedback(data.message_id, r);
    } catch (e) {
      console.warn("Feedback submission failed", e);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Low confidence banner */}
      {lowConfidence && (
        <div className="flex items-start gap-3 bg-[#9B3B34]/10 border border-[#9B3B34]/30 rounded-xl px-4 py-3">
          <span className="text-[#8B332C] text-lg flex-shrink-0" aria-hidden="true">⚠️</span>
          <div className="flex-1">
            <p className="text-sm text-[#7A2E28]">
              <strong>Insufficient evidence found.</strong> The knowledge base does not contain enough
              information to fully answer this question. Please consult the official sources directly
              and consider rephrasing your question.
            </p>
          </div>
        </div>
      )}

      {/* Answer text */}
      <div className="bg-[#E9E2CD]/60 border border-[#D9D0B8]/50 rounded-2xl rounded-tl-sm px-5 py-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#17315C] ring-1 ring-[#B8862B]/70 flex items-center justify-center text-xs font-serif font-bold text-[#D9AE5C] flex-shrink-0">
              S
            </span>
            <span className="text-xs font-semibold text-[#4B4636]">IP-SAKTI Sahayak</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeakToggle}
              className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${
                isSpeaking
                  ? "bg-red-600/30 border-red-500/40 text-red-300"
                  : "bg-[#D9D0B8]/40 border-[#8B8368]/40 text-[#2E2B22] hover:bg-[#D9D0B8]/70"
              }`}
              aria-label={isSpeaking ? "Stop reading answer aloud" : "Read answer aloud"}
              title={isSpeaking ? "Stop" : "Listen to this answer"}
            >
              {isSpeaking ? "⏹ Stop" : "🔊 Listen"}
            </button>
            <ConfidenceBadge
              confidence={data.confidence}
              score={data.confidence_score}
            />
          </div>
        </div>

        {/* Answer */}
        <div
          className="text-sm text-[#221F17] leading-relaxed whitespace-pre-wrap prose-answer"
          dangerouslySetInnerHTML={{ __html: formatAnswer(data.answer) }}
        />

        {/* Feedback */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[#D9D0B8]/50">
          <span className="text-xs text-[#6E6754]">Was this helpful?</span>
          <button
            onClick={() => handleFeedback(1)}
            disabled={feedbackSent}
            className={`text-sm transition-all ${
              rating === 1 ? "opacity-100" : "opacity-40 hover:opacity-80"
            } disabled:cursor-default`}
            aria-label="Thumbs up"
            id={`thumbs-up-${data.message_id}`}
          >
            👍
          </button>
          <button
            onClick={() => handleFeedback(-1)}
            disabled={feedbackSent}
            className={`text-sm transition-all ${
              rating === -1 ? "opacity-100" : "opacity-40 hover:opacity-80"
            } disabled:cursor-default`}
            aria-label="Thumbs down"
            id={`thumbs-down-${data.message_id}`}
          >
            👎
          </button>
          {feedbackSent && (
            <span className="text-xs text-[#6E6754] ml-1">Thanks for your feedback!</span>
          )}
          {needsExpertReview && (
            <button
              onClick={goToExpertBrief}
              className="ml-auto text-xs bg-[#2C5282]/15 hover:bg-[#2C5282]/25 border border-[#2C5282]/30 text-[#17315C] rounded-full px-3 py-1.5 transition-colors flex items-center gap-1.5"
            >
              📄 Generate Expert Brief
            </button>
          )}
        </div>
      </div>

      {/* Sources */}
      {data.sources && data.sources.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#6E6754] uppercase tracking-widest mb-2">
            Sources
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.sources.map((source, i) => (
              <SourceCard key={source.id} source={source} index={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {data.actions && data.actions.length > 0 && (
        <ActionCard actions={data.actions} />
      )}
    </div>
  );
}

function formatAnswer(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^(\d+)\.\s/gm, '<span class="text-[#1E3A5F] font-semibold">$1.</span> ')
    .replace(/^[-•]\s/gm, '<span class="text-[#6E6754] mr-1">·</span>');
}

export default function ChatMessage({ message }) {
  if (message.role === "user") {
    return <UserBubble text={message.text} />;
  }

  return <AssistantBubble data={message.data} />;
}
