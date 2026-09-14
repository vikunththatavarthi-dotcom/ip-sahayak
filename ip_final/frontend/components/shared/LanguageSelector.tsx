"use client";

import { useLanguage, LANGUAGES, LanguageCode } from "@/lib/i18n";

export { LANGUAGES };

interface Props {
  value?: string;
  onChange?: (code: string) => void;
  className?: string;
}

export default function LanguageSelector({ value, onChange, className = "" }: Props) {
  const { language, setLanguage } = useLanguage();
  const activeValue = value || language;

  const handleChange = (newCode: string) => {
    setLanguage(newCode as LanguageCode);
    if (onChange) {
      onChange(newCode);
    }
  };

  return (
    <select
      value={activeValue}
      onChange={(e) => handleChange(e.target.value)}
      className={`bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs ${className}`}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          🌐 {lang.label} ({lang.name})
        </option>
      ))}
    </select>
  );
}
