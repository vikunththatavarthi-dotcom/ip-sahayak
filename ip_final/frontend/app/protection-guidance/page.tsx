"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n";
import {
  Shield,
  MapPin,
  Tag,
  FileCode2,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function ProtectionGuidancePage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"gi" | "tm" | "cr" | "tk">("gi");

  // GI Form State
  const [giProductName, setGiProductName] = useState("");
  const [giGoodsCategory, setGiGoodsCategory] = useState("Agricultural");
  const [giOrigin, setGiOrigin] = useState("");
  const [giApplicantType, setGiApplicantType] = useState("Producers Association");
  const [giUniqueness, setGiUniqueness] = useState("");
  const [giLoading, setGiLoading] = useState(false);
  const [giResult, setGiResult] = useState<any>(null);

  // TM Form State
  const [tmName, setTmName] = useState("");
  const [tmGoods, setTmGoods] = useState("");
  const [tmLoading, setTmLoading] = useState(false);
  const [tmResult, setTmResult] = useState<any>(null);

  // Copyright Form State
  const [crTitle, setCrTitle] = useState("");
  const [crCategory, setCrCategory] = useState("Software Code");
  const [crAuthorType, setCrAuthorType] = useState("Employee in Service");
  const [crDescription, setCrDescription] = useState("");
  const [crLoading, setCrLoading] = useState(false);
  const [crResult, setCrResult] = useState<any>(null);

  // Error State
  const [error, setError] = useState<string | null>(null);

  // Handlers
  const handleGiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giProductName || !giOrigin || !giUniqueness) {
      setError("Please fill all required GI fields.");
      return;
    }
    setGiLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/features/gi-protection-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: giProductName,
          goods_category: giGoodsCategory,
          geographical_origin: giOrigin,
          applicant_type: giApplicantType,
          description_of_uniqueness: giUniqueness,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGiResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze GI protection.");
    } finally {
      setGiLoading(false);
    }
  };

  const handleTmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmName || !tmGoods) {
      setError("Please fill all required Trademark fields.");
      return;
    }
    setTmLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/features/trademark-prescreen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: tmName,
          goods_services_description: tmGoods,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTmResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze Trademark.");
    } finally {
      setTmLoading(false);
    }
  };

  const handleCrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crTitle || !crDescription) {
      setError("Please fill all required Copyright fields.");
      return;
    }
    setCrLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/features/copyright-guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_title: crTitle,
          work_category: crCategory,
          author_type: crAuthorType,
          description: crDescription,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCrResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze Copyright.");
    } finally {
      setCrLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="h-full overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto space-y-8 font-sans">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#0a1811] via-[#112d1f] to-[#15462c] rounded-2xl p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
              <Shield size={13} /> Multi-Regime Protection
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">
            {t("protection_hub_title", "GI, Trademark, Copyright & TK Protection Guidance")}
          </h1>
          <p className="text-slate-300 text-sm max-w-3xl mt-2 leading-relaxed">
            {t("protection_hub_desc", "Statutory decision support across non-patent IP regimes: Geographical Indications (GI Act 1999), Trade Marks (Act 1999), Copyright & Software Code (Act 1957), and Traditional Knowledge (TKDL & Section 3(p)).")}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => {
              setActiveTab("gi");
              setError(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === "gi"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <MapPin size={15} /> {t("tab_gi", "Geographical Indications (GI)")}
          </button>

          <button
            onClick={() => {
              setActiveTab("tm");
              setError(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === "tm"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Tag size={15} /> {t("tab_tm", "Trademark & Brand (TM)")}
          </button>

          <button
            onClick={() => {
              setActiveTab("cr");
              setError(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === "cr"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <FileCode2 size={15} /> {t("tab_cr", "Copyright & Software (CR)")}
          </button>

          <button
            onClick={() => {
              setActiveTab("tk");
              setError(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === "tk"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Leaf size={15} /> {t("tab_tk", "Traditional Knowledge (TK)")}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* ─── TAB 1: GI PROTECTION ─── */}
        {activeTab === "gi" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <MapPin className="text-emerald-600" size={22} />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Geographical Indications Eligibility &amp; Authorized User Guide</h2>
                  <p className="text-xs text-slate-500">Under the Geographical Indications of Goods (Registration and Protection) Act, 1999</p>
                </div>
              </div>

              <form onSubmit={handleGiSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={giProductName}
                      onChange={(e) => setGiProductName(e.target.value)}
                      placeholder="e.g. Wayanad Robusta Coffee, Kanchipuram Silk, Alphonso Mango"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Geographical Origin / Region *</label>
                    <input
                      type="text"
                      value={giOrigin}
                      onChange={(e) => setGiOrigin(e.target.value)}
                      placeholder="e.g. Wayanad District, Kerala / Tamil Nadu"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Goods Category</label>
                    <select
                      value={giGoodsCategory}
                      onChange={(e) => setGiGoodsCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    >
                      <option value="Agricultural">Agricultural Goods</option>
                      <option value="Handicraft">Handicraft &amp; Textiles</option>
                      <option value="Manufactured">Manufactured Goods</option>
                      <option value="Foodstuff">Foodstuff &amp; Traditional Cuisine</option>
                      <option value="Natural">Natural Mineral / Geological</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Applicant Structure</label>
                    <select
                      value={giApplicantType}
                      onChange={(e) => setGiApplicantType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    >
                      <option value="Producers Association">Association of Producers / Farmers (Eligible for Form GI-1)</option>
                      <option value="Cooperative Society">Cooperative Society / Producer Organization</option>
                      <option value="Individual Producer">Individual Producer (Eligible for Form GI-3 Authorized User)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Special Qualities / Historical Link *
                  </label>
                  <textarea
                    value={giUniqueness}
                    onChange={(e) => setGiUniqueness(e.target.value)}
                    rows={2}
                    placeholder="Describe specific regional climate, soil factors, traditional craftsmanship, or historical reputation attributable to this region..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={giLoading}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                >
                  {giLoading ? "Analyzing GI Requirements..." : <><Sparkles size={14} /> Evaluate GI Protection &amp; Authorized User Rules</>}
                </button>
              </form>
            </div>

            {giResult && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6 animate-fadeIn">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs uppercase font-bold text-emerald-800 tracking-wider">Statutory Status</div>
                  <div className="text-base font-extrabold text-emerald-950 mt-1">{giResult.eligibility_status}</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium leading-relaxed">
                  ⚠️ {giResult.assignment_rule}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Authorized User Mechanism</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{giResult.authorized_user_guidance}</p>
                    <div className="text-xs font-semibold text-emerald-700 pt-2">
                      Official Form: {giResult.application_form} ({giResult.estimated_official_fee})
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Mandatory Proofs &amp; Demarcations</h4>
                    <ul className="space-y-1">
                      {giResult.required_proofs.map((p: string, i: number) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recommended Steps</h4>
                  {giResult.next_steps.map((st: string, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                      {st}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: TRADEMARK PROTECTION ─── */}
        {activeTab === "tm" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Tag className="text-emerald-600" size={22} />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Trademark Pre-Screening &amp; Nice Classification</h2>
                  <p className="text-xs text-slate-500">Under the Trade Marks Act, 1999 &amp; Trade Marks Rules 2017</p>
                </div>
              </div>

              <form onSubmit={handleTmSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Brand / Mark Name *</label>
                    <input
                      type="text"
                      value={tmName}
                      onChange={(e) => setTmName(e.target.value)}
                      placeholder="e.g. AyurVedaPure, Vedika SkinCare"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Goods / Services Description *</label>
                    <input
                      type="text"
                      value={tmGoods}
                      onChange={(e) => setTmGoods(e.target.value)}
                      placeholder="e.g. Herbal cosmetics, anti-inflammatory cream, nutraceutical capsules"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={tmLoading}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                >
                  {tmLoading ? "Checking Nice Classification..." : <><Sparkles size={14} /> Screen Trademark &amp; Nice Class</>}
                </button>
              </form>
            </div>

            {tmResult && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Recommended Nice Class</div>
                    <div className="text-xl font-extrabold text-emerald-700 mt-1">Class {tmResult.recommended_class}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Distinctiveness Level</div>
                    <div className="text-base font-extrabold text-slate-900 mt-1">{tmResult.distinctiveness}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Risk Level</div>
                    <div className="text-base font-extrabold text-slate-900 mt-1">{tmResult.risk_level}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                  {tmResult.reasoning}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Next Action Steps</h4>
                  {tmResult.next_steps.map((st: string, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                      {st}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: COPYRIGHT & SOFTWARE ─── */}
        {activeTab === "cr" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <FileCode2 className="text-emerald-600" size={22} />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Copyright, Software Code &amp; Documentation Protection</h2>
                  <p className="text-xs text-slate-500">Under the Copyright Act, 1957 &amp; Copyright Rules 2013</p>
                </div>
              </div>

              <form onSubmit={handleCrSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Work / Code Title *</label>
                    <input
                      type="text"
                      value={crTitle}
                      onChange={(e) => setCrTitle(e.target.value)}
                      placeholder="e.g. AYUSH Diagnostic Algorithm &amp; Herbal Formulation DB"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Work Category</label>
                    <select
                      value={crCategory}
                      onChange={(e) => setCrCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    >
                      <option value="Software Code">Software Code / Database (Literary Work Sec 2(o))</option>
                      <option value="User Manual / Documentation">Product User Manual &amp; Instructional Leaflet</option>
                      <option value="Label Artwork / Graphics">Packaging Graphics &amp; 2D Artistic Work</option>
                      <option value="Website Content">Website Architecture &amp; Literary Content</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Author / Creation Context</label>
                  <select
                    value={crAuthorType}
                    onChange={(e) => setCrAuthorType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="Employee in Service">Created by Employee in course of employment (Sec 17(c))</option>
                    <option value="Independent Contractor / Agency">Created by Third-Party Contractor / Dev Agency (Sec 19)</option>
                    <option value="Sole Author / Individual">Created by Sole Individual Author</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Summary of Work *</label>
                  <textarea
                    value={crDescription}
                    onChange={(e) => setCrDescription(e.target.value)}
                    rows={2}
                    placeholder="Describe the original software architecture, codebase components, algorithms, or instructional text..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={crLoading}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                >
                  {crLoading ? "Evaluating Copyright Ownership..." : <><Sparkles size={14} /> Analyze Copyright &amp; Ownership Rules</>}
                </button>
              </form>
            </div>

            {crResult && (
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
                    <div className="text-[11px] font-bold text-indigo-900 uppercase">Statutory Category</div>
                    <div className="text-sm font-extrabold text-indigo-950 mt-1">{crResult.statutory_category}</div>
                    <div className="text-xs text-indigo-700 mt-2">Term: {crResult.term_of_protection}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200">
                    <div className="text-[11px] font-bold text-teal-900 uppercase">First Owner of Copyright</div>
                    <div className="text-xs font-extrabold text-teal-950 mt-1 leading-relaxed">{crResult.first_owner_of_copyright}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Section 52 Fair Dealing Scope</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{crResult.section_52_fair_dealing_scope}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Registration Process (Form XIV)</h4>
                  {crResult.registration_process.map((p: string, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: TRADITIONAL KNOWLEDGE (TK) ─── */}
        {activeTab === "tk" && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <Leaf className="text-emerald-600" size={22} />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Traditional Knowledge Digital Library (TKDL) &amp; Section 3(p)</h2>
                <p className="text-xs text-slate-500">Protection of codified AYUSH knowledge against biopiracy</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <h3 className="font-bold text-sm text-slate-900">Section 3(p) Non-Patentability Bar</h3>
                <p className="leading-relaxed">
                  Under Section 3(p) of the Patents Act, 1970, an invention which in effect is traditional knowledge or
                  which is an aggregation or duplication of known properties of traditionally known components is NOT patentable.
                </p>
                <p className="leading-relaxed font-semibold text-emerald-800">
                  To overcome Section 3(p), the applicant must demonstrate an unexpected, non-obvious synergistic therapeutic effect
                  supported by comparative pharmacological or clinical trial data.
                </p>
              </div>

              <div className="space-y-3 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <h3 className="font-bold text-sm text-slate-900">National Biodiversity Authority (NBA Form III)</h3>
                <p className="leading-relaxed">
                  Under Section 6 of the Biological Diversity Act, 2002, any commercial or research patent application based
                  on biological resources obtained from India requires mandatory prior approval from the NBA before grant.
                </p>
                <div className="pt-2">
                  <a
                    href="/tk-risk"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all"
                  >
                    Open TKDL Risk Engine <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
