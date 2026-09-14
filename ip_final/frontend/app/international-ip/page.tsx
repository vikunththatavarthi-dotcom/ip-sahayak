"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n";
import {
  Globe2,
  ShieldAlert,
  Clock,
  ExternalLink,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  Sparkles,
} from "lucide-react";

interface JurisdictionComparison {
  jurisdiction: string;
  authority: string;
  statutory_basis: string;
  filing_route: string;
  priority_deadline: string;
  estimated_official_fee: string;
  key_requirements: string[];
  search_databases: string[];
}

interface SourceRef {
  id: string;
  title: string;
  authority?: string;
  url?: string;
  relevance_score?: number;
  snippet?: string;
}

interface InternationalAdvisorResult {
  recommended_strategy: string;
  pct_applicable: boolean;
  paris_convention_deadline: string;
  national_phase_deadline: string;
  section_39_ffl_required: boolean;
  section_39_status: string;
  section_39_guidance: string;
  required_filings: string[];
  jurisdiction_comparisons: JurisdictionComparison[];
  actionable_next_steps: string[];
  sources: SourceRef[];
  disclaimer: string;
}

export default function InternationalIPPage() {
  const { t } = useLanguage();
  const [inventionTitle, setInventionTitle] = useState("");
  const [description, setDescription] = useState("");
  const [residentInIndia, setResidentInIndia] = useState(true);
  const [firstFilingInIndia, setFirstFilingInIndia] = useState(true);
  const [applicantType, setApplicantType] = useState("Startup");
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([
    "WIPO PCT",
    "USPTO",
    "EPO",
  ]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InternationalAdvisorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleJurisdiction = (jur: string) => {
    if (selectedJurisdictions.includes(jur)) {
      if (selectedJurisdictions.length > 1) {
        setSelectedJurisdictions(selectedJurisdictions.filter((j) => j !== jur));
      }
    } else {
      setSelectedJurisdictions([...selectedJurisdictions, jur]);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventionTitle.trim() || !description.trim()) {
      setError("Please provide both an invention title and description.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/api/features/international-filing-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invention_title: inventionTitle,
          description: description,
          applicant_resident_in_india: residentInIndia,
          first_filing_in_india: firstFilingInIndia,
          target_jurisdictions: selectedJurisdictions,
          applicant_type: applicantType,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to evaluate international filing strategy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="h-full overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto space-y-8 font-sans">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#0a1a12] via-[#0f2c1d] to-[#12422b] rounded-2xl p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
              <Globe2 size={13} /> Global IP Coverage
            </span>
            <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider border border-violet-500/30">
              WIPO • USPTO • EPO
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">
            {t("global_ip_title", "International IP & Foreign Filing Advisor (WIPO/USPTO/EPO)")}
          </h1>
          <p className="text-slate-300 text-sm max-w-3xl mt-2 leading-relaxed">
            {t("global_ip_desc", "Evaluate cross-border patent protection under WIPO PCT, Paris Convention, USPTO, and EPO with Section 39 FFL compliance.")}
          </p>
        </div>

        {/* Input Form & Parameters */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80">
          <form onSubmit={handleEvaluate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Invention / Product Title *
                </label>
                <input
                  type="text"
                  value={inventionTitle}
                  onChange={(e) => setInventionTitle(e.target.value)}
                  placeholder="e.g. Synergistic Herbal Nano-Formulation for Topical Inflammation"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Applicant Entity Type
                </label>
                <select
                  value={applicantType}
                  onChange={(e) => setApplicantType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="Startup">DPIIT-Recognized Startup (80% IPO / US Small Entity Fee Discount)</option>
                  <option value="Individual">Individual Inventor / Natural Person</option>
                  <option value="Small Entity">MSME / Small Entity</option>
                  <option value="Large Entity">Large Corporate Entity</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Technical Description &amp; Claims Scope *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe your technical novelty, formulation ingredients, synergistic mechanism, and planned foreign commercialization markets..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
                required
              ></textarea>
            </div>

            {/* Statutory Compliance Radios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-800">
                  1. Is the Applicant / Inventor an Indian Resident?
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={residentInIndia}
                      onChange={() => setResidentInIndia(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    Yes (Section 39 FFL Rules Apply)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={!residentInIndia}
                      onChange={() => setResidentInIndia(false)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    No (Foreign Entity)
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-800">
                  2. Was First Patent Application Filed in India (IPO)?
                </span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={firstFilingInIndia}
                      onChange={() => setFirstFilingInIndia(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    Yes (Priority in India, 6-Wk Wait)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={!firstFilingInIndia}
                      onChange={() => setFirstFilingInIndia(false)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    No (Direct Foreign First Filing)
                  </label>
                </div>
              </div>
            </div>

            {/* Target Jurisdictions Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Target International Jurisdictions
              </label>
              <div className="flex flex-wrap gap-2">
                {["WIPO PCT", "USPTO", "EPO", "UKIPO", "JPO (Japan)"].map((jur) => {
                  const active = selectedJurisdictions.includes(jur);
                  return (
                    <button
                      key={jur}
                      type="button"
                      onClick={() => toggleJurisdiction(jur)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        active
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                          : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {active ? "✓ " : "+ "}
                      {jur}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>Evaluating Cross-Border Strategy...</>
              ) : (
                <>
                  <Sparkles size={16} /> Analyze International Strategy &amp; Section 39 FFL
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-8 animate-fadeIn">
            {/* Section 39 Compliance Box */}
            <div
              className={`p-6 rounded-2xl border shadow-sm ${
                result.section_39_ffl_required
                  ? "bg-amber-50/80 border-amber-300 text-amber-950"
                  : "bg-emerald-50/80 border-emerald-300 text-emerald-950"
              }`}
            >
              <div className="flex items-start gap-4">
                {result.section_39_ffl_required ? (
                  <div className="p-3 bg-amber-200 rounded-xl text-amber-900 flex-shrink-0">
                    <ShieldAlert size={24} />
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-200 rounded-xl text-emerald-900 flex-shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-base">
                    Section 39 Foreign Filing License (FFL) Status:{" "}
                    {result.section_39_ffl_required ? "MANDATORY PERMISSION REQUIRED" : "COMPLIANT / WAITING CLEARED"}
                  </h3>
                  <p className="text-xs leading-relaxed">{result.section_39_guidance}</p>
                </div>
              </div>
            </div>

            {/* Strategic Timeline & Route Card */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Layers className="text-emerald-600" size={22} />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Recommended International Prosecution Strategy</h2>
                  <p className="text-xs text-slate-500">Optimized for cost deferral and global prior-art examination</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 leading-relaxed">
                {result.recommended_strategy}
              </div>

              {/* Deadlines Timeline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider mb-1">
                    <Clock size={14} /> Paris Convention Priority Window
                  </div>
                  <div className="text-xl font-extrabold text-indigo-950">{result.paris_convention_deadline}</div>
                  <p className="text-[11px] text-indigo-700 mt-1">
                    File direct foreign applications or PCT international application within 12 months.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200">
                  <div className="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase tracking-wider mb-1">
                    <Globe2 size={14} /> PCT National Phase Entry Window
                  </div>
                  <div className="text-xl font-extrabold text-teal-950">{result.national_phase_deadline}</div>
                  <p className="text-[11px] text-teal-700 mt-1">
                    Enter national phase in USPTO, EPO, JPO, etc., deferring foreign attorney and translation fees.
                  </p>
                </div>
              </div>

              {/* Required Filings Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mandatory Official Filings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.required_filings.map((filing, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                      <span>{filing}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Jurisdiction Comparison Matrix */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Building2 className="text-emerald-600" size={22} />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Foreign Jurisdiction Matrix (WIPO • USPTO • EPO)</h2>
                  <p className="text-xs text-slate-500">Statutory examination criteria, official fees, and search databases</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {result.jurisdiction_comparisons.map((jur, i) => (
                  <div key={i} className="flex flex-col justify-between rounded-xl border border-slate-200 p-5 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                    <div className="space-y-4">
                      <div className="border-b border-slate-200 pb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {jur.authority}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900 mt-2">{jur.jurisdiction}</h3>
                        <p className="text-[11px] text-slate-500">{jur.statutory_basis}</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="text-slate-600">
                          <span className="font-semibold text-slate-800">Filing Route:</span> {jur.filing_route}
                        </div>
                        <div className="text-slate-600">
                          <span className="font-semibold text-slate-800">Estimated Fee:</span>{" "}
                          <span className="font-bold text-emerald-700">{jur.estimated_official_fee}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-800 block uppercase tracking-wider">
                          Key Legal Standards:
                        </span>
                        <ul className="space-y-1">
                          {jur.key_requirements.map((req, idx) => (
                            <li key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">Databases:</span> {jur.search_databases.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Next Steps */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ArrowRight className="text-emerald-600" size={16} /> Recommended Action Steps
              </h3>
              <div className="space-y-2">
                {result.actionable_next_steps.map((step, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium flex items-start gap-2">
                    <span className="font-bold text-emerald-700 flex-shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Citations */}
            {result.sources.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <BookOpen size={14} className="text-emerald-600" /> Cited Official Authorities &amp; Treaties
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.sources.map((src) => (
                    <div key={src.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>{src.title}</span>
                        {src.url && (
                          <a href={src.url} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-1">
                            Link <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">Authority: {src.authority || "Official Bureau"}</div>
                      {src.snippet && <p className="text-[11px] text-slate-600 line-clamp-2 italic">{src.snippet}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center text-slate-500 text-xs">
              ⚖️ <b>Statutory Notice:</b> {result.disclaimer}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
