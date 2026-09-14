"use client";

import React, { useCallback, useRef, useState } from "react";
import { uploadDocument } from "@/lib/api";

export default function UploadZone({ onUploaded }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState("");
  const inputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Only PDF files are supported.");
        setState("error");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("File exceeds the 20 MB limit.");
        setState("error");
        return;
      }

      setState("uploading");
      setProgress("Uploading…");
      setError(null);

      try {
        setProgress("Extracting text…");
        const response = await uploadDocument(file);
        setState("done");
        onUploaded(response);
      } catch (err) {
        setError(err.message ?? "Upload failed. Please try again.");
        setState("error");
      }
    },
    [onUploaded]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setState("idle");
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const isDragging = state === "dragging";
  const isUploading = state === "uploading";

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer
        ${
          isDragging
            ? "border-[#1E3A5F] bg-[#2C5282]/10 scale-[1.01]"
            : "border-[#D9D0B8] bg-[#F3EEE0]/50 hover:border-[#8B8368] hover:bg-[#F3EEE0]/80"
        }
        ${isUploading ? "pointer-events-none opacity-70" : ""}
      `}
      onDragOver={(e) => {
        e.preventDefault();
        setState("dragging");
      }}
      onDragLeave={() => setState("idle")}
      onDrop={onDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
      role="button"
      aria-label="Upload PDF document"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={onInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {state === "idle" || state === "dragging" ? (
        <>
          <div className="text-4xl mb-3">📄</div>
          <p className="text-sm text-[#2E2B22]">
            Drag a PDF here or click to browse
          </p>
          <p className="text-xs text-[#6E6754] mt-1">Max 20 MB</p>
        </>
      ) : state === "uploading" ? (
        <>
          <div className="inline-block animate-spin text-2xl mb-3">⏳</div>
          <p className="text-sm text-[#17315C]">{progress}</p>
        </>
      ) : state === "done" ? (
        <>
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm text-[#1F4D37]">Upload complete!</p>
        </>
      ) : state === "error" ? (
        <>
          <div className="text-4xl mb-3">❌</div>
          <p className="text-sm text-[#7A2E28]">{error}</p>
        </>
      ) : null}
    </div>
  );
}
