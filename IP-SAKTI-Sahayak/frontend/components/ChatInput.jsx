"use client";

import React, { useCallback, useRef, useState } from "react";

export default function ChatInput({
  onSend,
  onUploadClick,
  disabled = false,
  placeholder = "Ask about patents, trademarks, copyright, or AYUSH regulations…",
}) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleSend = useCallback(() => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setValue(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  };

  const toggleVoice = useCallback(() => {
    const win = typeof window !== "undefined" ? window : {};
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  return (
    <div className="flex gap-3 items-end">
      <button
        onClick={onUploadClick}
        disabled={disabled}
        className="p-2.5 rounded-lg bg-[#17315C]/30 hover:bg-[#17315C]/50 transition-colors disabled:opacity-50"
        aria-label="Upload document"
        title="Upload a PDF document"
      >
        📎
      </button>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 bg-[#F3EEE0]/50 border border-[#E9E2CD] rounded-lg px-4 py-2.5 text-sm text-[#1B1712] placeholder-[#6E6754] focus:outline-none focus:border-[#2C5282] resize-none transition-colors disabled:opacity-50"
        rows={1}
      />

      <button
        onClick={toggleVoice}
        disabled={disabled}
        className={`p-2.5 rounded-lg transition-all ${
          isListening
            ? "bg-red-600/50 hover:bg-red-600/70"
            : "bg-[#E9E2CD]/50 hover:bg-[#E9E2CD]/80"
        } disabled:opacity-50`}
        aria-label={isListening ? "Stop listening" : "Start voice input"}
        title={isListening ? "Stop listening" : "Click to speak (Chrome only)"}
      >
        {isListening ? "🔴" : "🎤"}
      </button>

      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="p-2.5 rounded-lg bg-[#17315C] hover:bg-[#2C5282] transition-colors disabled:bg-[#D9D0B8] disabled:cursor-not-allowed"
        aria-label="Send message"
        title="Send (Shift+Enter for new line)"
      >
        📤
      </button>
    </div>
  );
}
