"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Shield,
  UploadCloud,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  BriefcaseBusiness,
  Activity,
  Droplets,
  Gauge,
  Thermometer,
  Volume2
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import WizardModal from "@/components/dashboard/WizardModal";
import { getUser, greeting, UserProfile } from "@/lib/auth";
import { getAllSessions, HistorySession } from "@/lib/history";
import { useLanguage } from "@/lib/i18n";

type SensorReading = {
  time: string;
  temperature: number;
  humidity: number;
  sound: number;
};

const sensorReadings: SensorReading[] = [
  { time: "08:00", temperature: 28, humidity: 60, sound: 41 },
  { time: "09:00", temperature: 29, humidity: 62, sound: 44 },
  { time: "10:00", temperature: 30, humidity: 64, sound: 47 },
  { time: "11:00", temperature: 31, humidity: 63, sound: 52 },
  { time: "12:00", temperature: 32, humidity: 66, sound: 58 },
  { time: "13:00", temperature: 31.5, humidity: 68, sound: 55 },
  { time: "14:00", temperature: 30.8, humidity: 65, sound: 49 },
  { time: "15:00", temperature: 30.2, humidity: 61, sound: 45 },
];

function buildLinePath(data: number[], width: number, height: number, padding: number) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return data
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

function MetricCard({
  label,
  value,
  unit,
  accent,
  detail,
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
  detail: string;
}) {
  const iconMap = {
    Temperature: <Thermometer size={15} className="text-amber-300" />,
    Humidity: <Droplets size={15} className="text-sky-300" />,
    "Ambient Sound": <Volume2 size={15} className="text-violet-300" />,
  } as Record<string, ReactNode>;

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
            {iconMap[label] ?? <Gauge size={15} className="text-emerald-300" />}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</span>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full ${accent}`} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-2xl font-black text-white">{value}</span>
        <span className="text-xs text-slate-400 mb-1">{unit}</span>
      </div>

      <div className="mt-3 h-px w-full bg-slate-800" />
      <p className="mt-2 text-[11px] text-slate-400">{detail}</p>
    </div>
  );
}

function TrendChart({
  title,
  color,
  data,
  unit,
}: {
  title: string;
  color: string;
  data: number[];
  unit: string;
}) {
  const width = 320;
  const height = 110;
  const padding = 14;
  const path = buildLinePath(data, width, height, padding);
  const last = data[data.length - 1];
  const first = data[0];
  const delta = last - first;

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{title}</h3>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] font-semibold text-slate-300">
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)} {unit}
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full">
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const { t } = useLanguage();

  const IP_TYPES = [
    {
      id: "patent",
      icon: "🔬",
      title: t("patent_domain", "Patent Protection"),
      desc: "Inventions, chemical & Ayurvedic processes, formulations",
      prompt: "I want to check patent eligibility for my technical invention under the Indian Patents Act 1970."
    },
    {
      id: "trademark",
      icon: "™️",
      title: t("trademark_domain", "Trademark & Brand"),
      desc: "Brand names, logos, slogans, Class 5 pharmaceuticals",
      prompt: "How do I register a Trademark for my AYUSH brand under the Trade Marks Act 1999?"
    },
    {
      id: "copyright",
      icon: "©️",
      title: "Copyright & Content",
      desc: "Manuals, software code, label artwork, research papers",
      prompt: "What is the procedure for registering Copyright for my product documentation in India?"
    },
    {
      id: "tk",
      icon: "🌿",
      title: t("ayurveda_domain", "Traditional Knowledge"),
      desc: "Herbal formulations, TKDL prior-art, Section 3(p) compliance",
      prompt: "How do I ensure my herbal formulation complies with TKDL and Section 3(p) of the Patents Act?"
    }
  ];

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
    } else {
      setUser(u);
      setHistory(getAllSessions());
    }
  }, [router]);

  if (!user) return null;

  return (
    <AppShell>
      <div className="h-full overflow-y-auto p-8 max-w-6xl mx-auto space-y-8">
        
        {/* ── 1. Personalized Greeting Banner ── */}
        <div className="bg-gradient-to-r from-[#0c1911] via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">
                {user.role}
              </span>
              <span className="text-xs text-slate-400">• {user.org || "Independent"}</span>
            </div>
            <h1 className="font-bold text-2xl text-white">{t("welcome_back", "Welcome back")}, {user.name}</h1>
            <p className="text-xs text-slate-300 max-w-xl">
              {t("dashboard_subtitle", "What compliance or IP guidance do you need for your product today? Every answer is backed by Indian legal gazettes.")}
            </p>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105 flex-shrink-0 relative z-10"
          >
            <Sparkles size={16} />
            <span>{t("wizard_button", "\"What IP Do I Need?\" Wizard")}</span>
          </button>
        </div>

        {/* ── 2. Hardware Monitoring Section ── */}
        <div className="rounded-3xl border border-slate-700 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(135deg,#081a1b_0%,#0b1320_52%,#111827_100%)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                  <Activity size={12} />
                  Live telemetry
                </span>
                <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">
                  Node 04
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">Hardware Monitoring Dashboard</h2>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-[10px] font-semibold text-slate-300">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse" />
              System online • Updated 2 min ago
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Facility</p>
              <p className="mt-2 text-sm font-bold text-white">IP-SAKTI Lab</p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Power status</p>
              <p className="mt-2 text-sm font-bold text-emerald-300">Stable</p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Signal quality</p>
              <p className="mt-2 text-sm font-bold text-sky-300">92%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MetricCard
              label="Temperature"
              value="31.5"
              unit="°C"
              accent="bg-amber-400"
              detail="Average daytime condition across the latest cycle"
            />
            <MetricCard
              label="Humidity"
              value="66"
              unit="%"
              accent="bg-sky-400"
              detail="Moisture level is within safe operating range"
            />
            <MetricCard
              label="Ambient Sound"
              value="58"
              unit="dB"
              accent="bg-violet-400"
              detail="Noise threshold remains low-to-moderate"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TrendChart title="Temperature" color="#fbbf24" data={sensorReadings.map((item) => item.temperature)} unit="°C" />
            <TrendChart title="Humidity" color="#38bdf8" data={sensorReadings.map((item) => item.humidity)} unit="%" />
            <TrendChart title="Sound" color="#a78bfa" data={sensorReadings.map((item) => item.sound)} unit="dB" />
          </div>
        </div>

        {/* ── 3. Quick Action Feature Grid ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">{t("quick_ip_types", "Select IP Protection Category")}</h2>
            <span className="text-xs text-slate-500">Click a card to launch a guided AI consultation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {IP_TYPES.map((card) => (
              <div
                key={card.id}
                onClick={() => router.push(`/chat?prompt=${encodeURIComponent(card.prompt)}`)}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl mb-3">{card.icon}</div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>Start Consultation</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Personalized portfolio quick access ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => router.push("/case-management")}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <BriefcaseBusiness size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">{t("case_board_title", "Case Management Board")}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t("case_board_desc", "Track active filings, priorities, deadlines, and portfolio progress.")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mt-3">
              Open board <ArrowRight size={12} />
            </span>
          </div>

          <div
            onClick={() => router.push("/workflows")}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center mb-3">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-sky-700">{t("workflow_title", "Workflow Library")}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t("workflow_desc", "Jump into statutory templates, filing workflows, and step-by-step guides.")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 mt-3">
              View workflows <ArrowRight size={12} />
            </span>
          </div>

          <div
            onClick={() => router.push("/protection-guidance")}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-3">
                <Shield size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700">{t("protection_hub_title", "GI, TM, CR & TK Hub")}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t("protection_hub_desc", "Guidance for Geographical Indications, Trade Marks, Copyright & TK.")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 mt-3">
              Open Protection Hub <ArrowRight size={12} />
            </span>
          </div>

          <div
            onClick={() => router.push("/international-ip")}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center mb-3">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-violet-700">{t("global_ip_title", "Global IP (WIPO/USPTO/EPO)")}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t("global_ip_desc", "Cross-border PCT, US/EU prosecution & Section 39 FFL compliance.")}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 mt-3">
              International Advisor <ArrowRight size={12} />
            </span>
          </div>
        </div>

        {/* ── 3. Document Analysis & Consultation Section ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ask AI Prompt Card */}
          <div
            onClick={() => router.push("/chat")}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700">
                {t("ask_advisor_title", "Ask Legal & AYUSH Advisor")}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t("ask_advisor_desc", "Type natural queries about patent validity, trademark class search, Form 25-D renewal, or label claims.")}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mt-3">
                Open Prompt Interface <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Upload PDF Card */}
          <div
            onClick={() => router.push("/chat")}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <UploadCloud size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-700">
                {t("scan_pdf_title", "Scan Government Notice / PDF")}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t("scan_pdf_desc", "Upload a Trademark Examination Report, Patent Office Action, or label artwork to extract requirements.")}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 mt-3">
                Upload &amp; Analyze PDF <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </div>

        {/* ── 4. Recent Chat Sessions ── */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-slate-500" />
                <span>Recent Consultations</span>
              </h3>
              <button
                onClick={() => router.push("/chat")}
                className="text-xs text-emerald-700 font-semibold hover:underline"
              >
                View all
              </button>
            </div>

            <div className="space-y-2">
              {history.slice(0, 3).map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => router.push(`/chat?session=${sess.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      IP
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{sess.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(sess.createdAt).toLocaleDateString()} • {sess.messages.length} messages
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. Legal Trust Layer Disclaimer ── */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-800">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Statutory Information Disclaimer</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              IP-SAKTI Sahayak is an AI digital twin trained on Indian legal and AYUSH regulatory gazettes. Content generated is for decision-support and educational purposes and does not constitute formal legal advice.
            </p>
          </div>
        </div>

      </div>

      {/* ── Wizard Modal ── */}
      {showWizard && <WizardModal onClose={() => setShowWizard(false)} />}
    </AppShell>
  );
}
