import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import HealthBanner from "./HealthBanner";
import { SUPPORTED_UI_LANGUAGES, useTranslation } from "@/lib/i18n";

function useNavItems() {
  const { t } = useTranslation();
  return [
    { to: "/", label: t("nav_chat"), emoji: "💬", end: true },
    { to: "/twin", label: t("nav_twin"), emoji: "🪪" },
    { to: "/tk-risk", label: t("nav_tk_risk"), emoji: "🌿" },
    { to: "/regulations", label: t("nav_regulations"), emoji: "📢" },
    { to: "/calendar", label: t("nav_calendar"), emoji: "🗓️" },
    { to: "/expert-brief", label: t("nav_expert_brief"), emoji: "📄" },
  ];
}

function UiLanguageSwitcher() {
  const { lang, setLang, t } = useTranslation();
  return (
    <label className="flex items-center gap-1.5 px-2">
      <span className="sr-only">{t("ui_language")}</span>
      <select
        aria-label={t("ui_language")}
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="w-full text-xs bg-[#E9E2CD]/60 border border-[#D9D0B8]/50 rounded-lg px-2 py-1.5 text-[#2E2B22] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C5282]"
      >
        {SUPPORTED_UI_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AppShell() {
  const NAV_ITEMS = useNavItems();
  const { t } = useTranslation();

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#FAF8F2] via-[#F3EEE0] to-[#FAF8F2] flex">
      {/* Skip link — first focusable element, invisible until tabbed to */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-[#17315C] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        {t("skip_to_content")}
      </a>

      {/* Sidebar */}
      <aside
        aria-label="Primary"
        className="hidden md:flex flex-col w-60 shrink-0 border-r border-[#E9E2CD]/60 bg-[#FAF8F2]/60 backdrop-blur-sm py-6 px-3"
      >
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#17315C] ring-1 ring-[#B8862B]/70 flex items-center justify-center text-[#D9AE5C] font-serif font-bold shrink-0">
            S
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-[#1B1712]">IP-SAKTI</div>
            <div className="text-[11px] text-[#4B4636]">Sahayak</div>
          </div>
        </div>

        <div className="mb-6">
          <UiLanguageSwitcher />
        </div>

        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C5282] ${
                  isActive
                    ? "bg-[#2C5282]/15 text-[#17315C] border border-[#2C5282]/30"
                    : "text-[#4B4636] hover:text-[#221F17] hover:bg-[#E9E2CD]/40 border border-transparent"
                }`
              }
            >
              <span aria-hidden="true">{item.emoji}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-2 pt-6 text-[11px] text-[#6E6754] leading-relaxed">
          {t("disclaimer")}
        </div>
      </aside>

      {/* Mobile top nav */}
      <nav
        aria-label="Main navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FAF8F2]/95 border-t border-[#E9E2CD] backdrop-blur-sm flex justify-around py-2"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C5282] rounded ${
                isActive ? "text-[#17315C]" : "text-[#6E6754]"
              }`
            }
          >
            <span aria-hidden="true" className="text-base">
              {item.emoji}
            </span>
            <span>{item.label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 pb-16 md:pb-0 flex flex-col">
        <HealthBanner />
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
