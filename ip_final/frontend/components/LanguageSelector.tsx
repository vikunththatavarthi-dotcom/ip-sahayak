"use client";

import { useState, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";

interface LanguageOption {
  code: string;
  name: string;
  native_name: string;
}

interface LanguageSelectorProps {
  value?: string;
  onChange: (langCode: string) => void;
}

export default function LanguageSelector({ value = "en", onChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"}/config`)
      .then((res) => res.json())
      .then((data) => {
        setLanguages(data.languages);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        // Fallback languages
        setLanguages([
          { code: "en", name: "English", native_name: "English" },
          { code: "hi", name: "Hindi", native_name: "हिन्दी" },
          { code: "ta", name: "Tamil", native_name: "தமிழ்" },
        ]);
      });
  }, []);

  const selectedLang = languages.find((l) => l.code === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm"
      >
        <Globe size={16} />
        <span>{selectedLang?.native_name || "English"}</span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 min-w-[200px]">
          {loading ? (
            <div className="p-3 text-slate-400 text-sm">Loading...</div>
          ) : (
            <div className="py-1 max-h-[300px] overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onChange(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    value === lang.code
                      ? "bg-emerald-600/30 text-emerald-300 border-l-2 border-emerald-500"
                      : "text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <div className="font-medium">{lang.native_name}</div>
                  <div className="text-xs text-slate-400">{lang.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
