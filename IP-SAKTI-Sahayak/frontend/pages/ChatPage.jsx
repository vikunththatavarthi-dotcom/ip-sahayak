import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import UploadZone from "@/components/UploadZone";
import { analyzeDocument, createCalendarEvent, getSources, sendChat } from "@/lib/api";
import { useProfile } from "@/lib/useProfile";
import { useTranslation } from "@/lib/i18n";

// Quick-action chips
const QUICK_ACTIONS = [
  { label: "Patent Filing", emoji: "🔬", query: "How do I file a patent application in India? What are the steps and fees?" },
  { label: "Trademark", emoji: "™️", query: "How do I register a trademark for my AYUSH brand in India?" },
  { label: "Copyright", emoji: "©️", query: "How do I protect my creative work with copyright in India?" },
  { label: "AYUSH Startup", emoji: "🌿", query: "What IP protections are available for an AYUSH startup's formulations and brand?" },
  { label: "PCT Application", emoji: "🌍", query: "How can an Indian inventor file an international patent via PCT?" },
  { label: "TK Protection", emoji: "📜", query: "How does India protect Traditional Knowledge from biopiracy?" },
];

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-fade-up">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full skeleton" />
        <div className="h-3 w-28 skeleton" />
      </div>
      <div className="h-3 w-full skeleton" />
      <div className="h-3 w-5/6 skeleton" />
      <div className="h-3 w-4/6 skeleton" />
      <div className="h-3 w-3/6 skeleton mt-1" />
    </div>
  );
}

function SourcesStrip({ sources }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <span className="text-xs text-[#6E6754] flex-shrink-0">{useTranslation().t("trusted_sources")}</span>
      {sources.map((src) => (
        <a
          key={src.id}
          href={src.url ?? "#"}
          target={src.url ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="flex-shrink-0 text-xs text-[#4B4636] hover:text-[#17315C] border border-[#E9E2CD] hover:border-[#2C5282]/40 px-2.5 py-1 rounded-full transition-all duration-200"
        >
          {src.authority ?? src.title}
        </a>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profileId } = useProfile();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [sources, setSources] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [pendingDoc, setPendingDoc] = useState(null);
  const [docAnalysis, setDocAnalysis] = useState(null);
  const [analyzingDoc, setAnalyzingDoc] = useState(false);
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const { t: uiT } = useTranslation();
  const [language, setLanguage] = useState(""); // "" = auto-detect
  const messagesEndRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const autoSentRef = useRef(false);

  // Fetch trusted sources on mount
  useEffect(() => {
    getSources()
      .then((r) => setSources(r.sources))
      .catch(() => {});
  }, []);

  // If we navigated here with a pre-composed question (e.g. from the TK Risk
  // page's "Ask Sahayak" link), send it automatically, once.
  useEffect(() => {
    const autoQuery = location.state?.autoQuery;
    if (autoQuery && !autoSentRef.current) {
      autoSentRef.current = true;
      sendMessage(autoQuery);
      // Clear the navigation state so a refresh/back doesn't resend it.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text) => {
      const userMsg = {
        role: "user",
        text,
        id: `user-${Date.now()}`,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const response = await sendChat(text, language || null, conversationId);
        if (!conversationId) {
          setConversationId(response.conversation_id);
        }
        const assistantMsg = {
          role: "assistant",
          id: response.message_id,
          data: response,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error) {
        console.error("Chat error:", error);
        const errorMsg = {
          role: "assistant",
          id: `error-${Date.now()}`,
          data: {
            message_id: `error-${Date.now()}`,
            conversation_id: conversationId || "unknown",
            answer: "Sorry, there was an error processing your question. Please try again.",
            sources: [],
            confidence: "LOW",
            confidence_score: 0,
            actions: [],
          },
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const handleQuickAction = (query) => {
    sendMessage(query);
  };

  const handleDocumentUploaded = async (response) => {
    setPendingDoc(response);
    setDocAnalysis(null);
    setAddedToCalendar(false);
    setShowUpload(false);

    // Immediately classify the document and extract any deadline so the
    // person doesn't have to ask a follow-up question just to find out
    // whether there's a filing/response date buried in the notice.
    setAnalyzingDoc(true);
    try {
      const analysis = await analyzeDocument(response.document_id);
      setDocAnalysis(analysis);
    } catch (e) {
      console.warn("Document analysis failed", e);
    } finally {
      setAnalyzingDoc(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!docAnalysis?.deadline?.deadline_date || !profileId) return;
    setAddingToCalendar(true);
    try {
      await createCalendarEvent({
        profile_id: profileId,
        title: pendingDoc?.filename
          ? `Deadline — ${pendingDoc.filename}`
          : "Deadline from uploaded document",
        event_type: "deadline",
        due_date: docAnalysis.deadline.deadline_date,
        notes: docAnalysis.deadline.description || "Extracted automatically from an uploaded document.",
      });
      setAddedToCalendar(true);
    } catch (e) {
      console.error(e);
      alert("Failed to add event to calendar. Is the backend running?");
    } finally {
      setAddingToCalendar(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 flex flex-col h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#17315C] ring-1 ring-[#B8862B]/70 flex items-center justify-center text-[#D9AE5C] font-serif font-bold">
                S
              </div>
              <h1 className="text-2xl font-bold text-[#1B1712]">IP-SAKTI Sahayak</h1>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              title="Response language — 'Auto' detects the language of what you type"
              className="text-xs bg-[#E9E2CD]/60 border border-[#D9D0B8]/50 rounded-lg px-3 py-1.5 text-[#2E2B22] focus:outline-none focus:border-[#2C5282]"
            >
              <option value="">🌐 Auto-detect</option>
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>
          <p className="text-sm text-[#4B4636]">{uiT("app_tagline")}</p>
        </div>

        {/* Messages area */}
        <div
          role="log"
          aria-live="polite"
          aria-label="Conversation"
          className="flex-1 overflow-y-auto mb-6 space-y-6 pr-2"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col gap-6 items-center justify-center h-full text-center py-12">
              <div className="text-6xl">⚖️</div>
              <div>
                <h2 className="text-xl font-semibold text-[#221F17] mb-2">Welcome to IP-SAKTI Sahayak</h2>
                <p className="text-sm text-[#4B4636] max-w-md mb-6">
                  Ask questions about patent law, trademark registration, copyright, AYUSH regulations,
                  and more. All answers are grounded in official Indian IP guidelines.
                </p>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.query)}
                    className="p-4 rounded-lg border border-[#D9D0B8]/50 bg-[#E9E2CD]/30 hover:bg-[#E9E2CD]/60 hover:border-[#2C5282]/50 transition-all text-left group"
                  >
                    <div className="text-2xl mb-2">{action.emoji}</div>
                    <div className="text-sm font-medium text-[#221F17] group-hover:text-[#17315C] transition-colors">
                      {action.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}

          {isLoading && <LoadingSkeleton />}
          <div ref={messagesEndRef} />
        </div>

        {/* Upload section */}
        {showUpload && (
          <div ref={uploadSectionRef} className="mb-6">
            <UploadZone onUploaded={handleDocumentUploaded} />
            {pendingDoc && (
              <div className="mt-4 p-4 rounded-lg bg-[#2F6B4F]/10 border border-[#2F6B4F]/30">
                <p className="text-sm text-[#1F4D37]">
                  ✅ Uploaded: <strong>{pendingDoc.filename}</strong>
                </p>
                <p className="text-xs text-[#1F4D37]/70 mt-1">
                  {pendingDoc.page_count} pages · {(pendingDoc.file_size / 1024).toFixed(0)} KB
                </p>
              </div>
            )}

            {analyzingDoc && (
              <div className="mt-3 p-4 rounded-lg bg-[#E9E2CD]/40 border border-[#D9D0B8]/50 flex flex-col gap-2">
                <div className="h-3 w-1/3 skeleton" />
                <div className="h-3 w-full skeleton" />
                <div className="h-3 w-2/3 skeleton" />
              </div>
            )}

            {!analyzingDoc && docAnalysis && (
              <div className="mt-3 p-4 rounded-lg bg-[#E9E2CD]/40 border border-[#D9D0B8]/50 flex flex-col gap-3">
                <div>
                  <div className="text-xs uppercase text-[#6E6754] mb-1">
                    Document type: {docAnalysis.summary?.doc_type || "unknown"}
                  </div>
                  {docAnalysis.summary?.summary && (
                    <p className="text-sm text-[#2E2B22] leading-relaxed">{docAnalysis.summary.summary}</p>
                  )}
                </div>

                {docAnalysis.deadline?.deadline_date ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#B8862B]/10 border border-[#B8862B]/30 rounded-lg px-3 py-2.5">
                    <div className="text-sm text-[#7A551A]">
                      ⏰ Deadline extracted: <strong>{docAnalysis.deadline.deadline_date}</strong>
                    </div>
                    {profileId ? (
                      addedToCalendar ? (
                        <span className="text-xs text-[#1F4D37]">✅ Added to calendar</span>
                      ) : (
                        <button
                          onClick={handleAddToCalendar}
                          disabled={addingToCalendar}
                          className="text-xs bg-[#17315C] hover:bg-[#2C5282] disabled:opacity-50 text-white rounded-lg px-3 py-1.5 transition-colors"
                        >
                          {addingToCalendar ? "Adding…" : "🗓️ Add to Compliance Calendar"}
                        </button>
                      )
                    ) : (
                      <a href="/twin" className="text-xs text-[#7A551A] underline">
                        Create a Digital Twin profile to save this to your calendar
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#6E6754]">No explicit deadline was detected in this document.</p>
                )}

                {docAnalysis.requirements?.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-[#6E6754] mb-1.5">Key requirements</div>
                    <ul className="text-sm text-[#2E2B22] space-y-1">
                      {docAnalysis.requirements.map((r, i) => (
                        <li key={i} className="flex gap-2"><span>•</span><span>{r}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setShowUpload(false)}
              className="mt-2 text-sm text-[#4B4636] hover:text-[#2E2B22] underline"
            >
              Close
            </button>
          </div>
        )}

        {/* Sources strip */}
        {sources.length > 0 && !showUpload && (
          <div className="mb-4 pb-4 border-b border-[#E9E2CD]/50">
            <SourcesStrip sources={sources} />
          </div>
        )}

        {/* Input area */}
        <div className="flex flex-col gap-3">
          <ChatInput
            onSend={sendMessage}
            onUploadClick={() => setShowUpload(true)}
            disabled={isLoading}
          />
          <p className="text-xs text-[#6E6754] text-center">
            Answers are grounded in official IP India and AYUSH guidelines. Always verify with official sources.
          </p>
        </div>
      </div>
  );
}
