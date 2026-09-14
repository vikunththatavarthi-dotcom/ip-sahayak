"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Leaf,
  LayoutDashboard,
  MessageSquare,
  UploadCloud,
  LogOut,
  UserCheck,
  Sparkles,
  Shield,
  Clock,
  Bell,
  FileText,
  BriefcaseBusiness,
  Globe2,
  MapPin,
} from "lucide-react";
import { getUser, clearUser, UserProfile } from "@/lib/auth";
import LanguageSelector from "@/components/shared/LanguageSelector";
import StatusDot from "@/components/shared/StatusDot";
import HistorySidebar from "@/components/chat/HistorySidebar";
import { useLanguage, LanguageCode } from "@/lib/i18n";

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u && pathname !== "/login") {
      router.push("/login");
    } else if (u) {
      setUser(u);
      if (u.language && u.language !== language) {
        setLanguage(u.language as LanguageCode);
      }
    }

    const savedNotifications = localStorage.getItem("ipsakti_notifications");
    if (savedNotifications !== null) {
      setNotificationsEnabled(savedNotifications === "true");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    clearUser();
    router.push("/login");
  };

  const handleLangChange = (code: string) => {
    setLanguage(code as LanguageCode);
    if (user) {
      const updated = { ...user, language: code };
      setUser(updated);
      localStorage.setItem("ipsakti_user", JSON.stringify(updated));
    }
  };

  const handleNotificationsToggle = () => {
    const nextValue = !notificationsEnabled;
    setNotificationsEnabled(nextValue);
    localStorage.setItem("ipsakti_notifications", String(nextValue));
  };

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full min-h-0 bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* ── Persistent Left Navigation Sidebar ── */}
      <aside className="w-64 bg-[#0c1911] text-white flex flex-col h-full flex-shrink-0 border-r border-emerald-950 select-none">
        {/* Fixed Header: Logo Brand */}
        <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0 border-b border-white/5 bg-[#0a150e]">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/50 flex-shrink-0">
            <Leaf size={22} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base leading-tight truncate">{t("brand_title", "IP-SAKTI Sahayak")}</h1>
            <p className="text-[11px] text-emerald-400 truncate">{t("brand_subtitle", "Explainable IP & AYUSH Twin")}</p>
          </div>
        </div>

        {/* Scrollable Middle Section: Nav Items + User Profile Context + Chat History */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
          {/* Core Navigation Items */}
          <nav className="space-y-1">
            <button
              onClick={() => router.push("/dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <LayoutDashboard size={16} className={pathname === "/dashboard" ? "text-emerald-400" : ""} />
              <span>{t("nav_dashboard", "MSME Dashboard")}</span>
            </button>
            <button
              onClick={() => router.push("/ip-recommender")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/ip-recommender"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Sparkles size={16} className={pathname === "/ip-recommender" ? "text-emerald-400" : ""} />
              <span>{t("nav_identify_ip", "Identify My IP")}</span>
            </button>
            <button
              onClick={() => router.push("/patentability")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/patentability"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <UserCheck size={16} className={pathname === "/patentability" ? "text-emerald-400" : ""} />
              <span>{t("nav_patentability", "Patentability Pre-Screen")}</span>
            </button>
            <button
              onClick={() => router.push("/tk-risk")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/tk-risk"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Leaf size={16} className={pathname === "/tk-risk" ? "text-emerald-400" : ""} />
              <span>{t("nav_ayush_tk", "AYUSH & TK Assessor")}</span>
            </button>
            <button
              onClick={() => router.push("/biomaterial")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/biomaterial"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <UploadCloud size={16} className={pathname === "/biomaterial" ? "text-emerald-400" : ""} />
              <span>{t("nav_biomaterial", "Bio-Material Checker")}</span>
            </button>
            <button
              onClick={() => router.push("/protection-guidance")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/protection-guidance"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <MapPin size={16} className={pathname === "/protection-guidance" ? "text-emerald-400" : ""} />
              <span>{t("nav_protection_hub", "GI, TM, CR & TK Hub")}</span>
            </button>
            <button
              onClick={() => router.push("/international-ip")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/international-ip"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Globe2 size={16} className={pathname === "/international-ip" ? "text-emerald-400" : ""} />
              <span>{t("nav_global_ip", "Global IP (WIPO/USPTO/EPO)")}</span>
            </button>
            <button
              onClick={() => router.push("/document-analyzer")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/document-analyzer"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Clock size={16} className={pathname === "/document-analyzer" ? "text-emerald-400" : ""} />
              <span>{t("nav_documents", "Document & Deadlines")}</span>
            </button>
            <button
              onClick={() => router.push("/workflows")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/workflows"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <FileText size={16} className={pathname === "/workflows" ? "text-emerald-400" : ""} />
              <span>{t("nav_workflows", "Workflows & Templates")}</span>
            </button>
            <button
              onClick={() => router.push("/case-management")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/case-management"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <BriefcaseBusiness size={16} className={pathname === "/case-management" ? "text-emerald-400" : ""} />
              <span>{t("nav_case_mgmt", "Case Management")}</span>
            </button>
            <button
              onClick={() => router.push("/msme-health")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/msme-health"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Shield size={16} className={pathname === "/msme-health" ? "text-emerald-400" : ""} />
              <span>{t("nav_msme_health", "MSME IP Health Check")}</span>
            </button>
            <button
              onClick={() => router.push("/roadmap-costs")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/roadmap-costs"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <LayoutDashboard size={16} className={pathname === "/roadmap-costs" ? "text-emerald-400" : ""} />
              <span>{t("nav_roadmap_costs", "IP Roadmap & Costs")}</span>
            </button>
            <button
              onClick={() => router.push("/legal-explainer")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/legal-explainer"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <MessageSquare size={16} className={pathname === "/legal-explainer" ? "text-emerald-400" : ""} />
              <span>{t("nav_legal_explainer", "Legal Provision Explainer")}</span>
            </button>
            <button
              onClick={() => router.push("/chat")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/chat"
                  ? "bg-emerald-700/40 text-emerald-300 border border-emerald-600/50 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <MessageSquare size={16} className={pathname === "/chat" ? "text-emerald-400" : ""} />
              <span>{t("nav_chat", "Ask AI Advisor")}</span>
            </button>
          </nav>

          {/* Active User Context Badge */}
          {user && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t("active_profile", "Profile Context")}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700/50">
                  {user.role}
                </span>
              </div>
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.org || "Independent Developer"}</p>
            </div>
          )}

          {/* Session Chat History Component (rendered in sidebar if on /chat) */}
          {pathname === "/chat" && <HistorySidebar />}
        </div>

        {/* Fixed Footer: Backend Health Status + Logout */}
        <div className="border-t border-white/10 p-3.5 space-y-2 flex-shrink-0 bg-[#0a150e]">
          <StatusDot />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
          >
            <LogOut size={14} />
            <span>{t("logout", "Sign Out")}</span>
          </button>
        </div>
      </aside>

      {/* ── Main View Area with Topbar Header ── */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-slate-50">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900">
              {pathname === "/dashboard" ? t("nav_dashboard", "Compliance & IP Dashboard") : t("nav_chat", "AI Legal & AYUSH Consultation")}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-pressed={notificationsEnabled}
              onClick={handleNotificationsToggle}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                notificationsEnabled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              <Bell size={14} className={notificationsEnabled ? "fill-emerald-500 text-emerald-600" : "text-slate-500"} />
              <span>{notificationsEnabled ? t("notifications_on", "Alerts On") : t("notifications_off", "Alerts Muted")}</span>
            </button>

            {/* Multilingual Selector */}
            <div className="flex items-center gap-2">
              <LanguageSelector value={language} onChange={handleLangChange} />
            </div>

            {/* Profile Avatar Chip */}
            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500">{user.role}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Children */}
        <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
