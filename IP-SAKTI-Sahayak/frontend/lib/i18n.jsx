import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * lib/i18n.jsx — App-wide UI language (nav, buttons, labels, empty states).
 *
 * This is separate from the per-chat "response language" selector in ChatPage,
 * which controls what language the AI *answers* in (handled server-side by
 * backend/app/services/language.py). This file controls the language of the
 * interface itself — sidebar, nav, buttons — so a non-English-first user gets
 * a consistent experience, not just translated chat replies.
 */

export const SUPPORTED_UI_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
];

// Core UI strings. Extend this object as new screens/components are added —
// every key must exist for every language, falling back to English otherwise.
const STRINGS = {
  en: {
    nav_chat: "Chat",
    nav_twin: "Digital Twin",
    nav_tk_risk: "TK Risk Indicator",
    nav_regulations: "Regulation Impact",
    nav_calendar: "Compliance Calendar",
    nav_expert_brief: "Expert Brief",
    app_tagline: "Expert guidance on Indian IP law and AYUSH regulations",
    disclaimer: "Informational guidance only — not a substitute for professional legal advice.",
    skip_to_content: "Skip to main content",
    ui_language: "Interface language",
    send: "Send",
    upload: "Upload",
    loading: "Thinking…",
    trusted_sources: "Trusted:",
    new_chat: "New chat",
    type_message: "Type your question…",
  },
  hi: {
    nav_chat: "चैट",
    nav_twin: "डिजिटल ट्विन",
    nav_tk_risk: "TK जोखिम संकेतक",
    nav_regulations: "विनियम प्रभाव",
    nav_calendar: "अनुपालन कैलेंडर",
    nav_expert_brief: "विशेषज्ञ संक्षिप्त",
    app_tagline: "भारतीय आईपी कानून और आयुष विनियमों पर विशेषज्ञ मार्गदर्शन",
    disclaimer: "केवल सूचनात्मक मार्गदर्शन — पेशेवर कानूनी सलाह का विकल्प नहीं।",
    skip_to_content: "मुख्य सामग्री पर जाएं",
    ui_language: "इंटरफ़ेस भाषा",
    send: "भेजें",
    upload: "अपलोड करें",
    loading: "सोच रहा है…",
    trusted_sources: "विश्वसनीय:",
    new_chat: "नई चैट",
    type_message: "अपना प्रश्न लिखें…",
  },
  ta: {
    nav_chat: "அரட்டை",
    nav_twin: "டிஜிட்டல் ட்வின்",
    nav_tk_risk: "TK அபாய குறிகாட்டி",
    nav_regulations: "ஒழுங்குமுறை தாக்கம்",
    nav_calendar: "இணக்க நாட்காட்டி",
    nav_expert_brief: "நிபுணர் சுருக்கம்",
    app_tagline: "இந்திய அறிவுசார் சொத்து சட்டம் மற்றும் ஆயுஷ் ஒழுங்குமுறைகள் குறித்த வழிகாட்டுதல்",
    disclaimer: "தகவல் வழிகாட்டுதல் மட்டுமே — தொழில்முறை சட்ட ஆலோசனைக்கு மாற்றாக இல்லை.",
    skip_to_content: "முக்கிய உள்ளடக்கத்திற்குச் செல்",
    ui_language: "இடைமுக மொழி",
    send: "அனுப்பு",
    upload: "பதிவேற்று",
    loading: "யோசிக்கிறது…",
    trusted_sources: "நம்பகமான:",
    new_chat: "புதிய அரட்டை",
    type_message: "உங்கள் கேள்வியை தட்டச்சு செய்யவும்…",
  },
  // Telugu / Kannada / Marathi / Bengali: fall back to English until translated.
  // Add entries here the same way as above — the useTranslation hook will
  // automatically pick them up once present.
  te: {},
  kn: {},
  mr: {},
  bn: {},
};

const STORAGE_KEY = "ipsakti_ui_lang";
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* localStorage unavailable (e.g. private mode) — non-fatal */
    }
    // Keep the <html lang="..."> attribute in sync for screen readers / browser translate.
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => {
    const dict = { ...STRINGS.en, ...(STRINGS[lang] || {}) };
    return (key) => dict[key] || STRINGS.en[key] || key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return ctx;
}
