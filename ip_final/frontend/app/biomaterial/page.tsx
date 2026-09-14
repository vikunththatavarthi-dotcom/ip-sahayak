"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n";
import { UploadCloud, CheckCircle, AlertTriangle, ArrowRight, BookOpen, Shield } from "lucide-react";

export default function BioMaterialPage() {
  const { t } = useLanguage();
  const [usesBio, setUsesBio] = useState(true);
  const [resourceName, setResourceName] = useState("Curcuma longa (Turmeric) & Withania somnifera (Ashwagandha)");
  const [sourceLocation, setSourceLocation] = useState("Harvested from Western Ghats, Kerala & Madhya Pradesh");
  const [geoOrigin, setGeoOrigin] = useState("India");
  const [associatedTk, setAssociatedTk] = useState(true);
  const [fromIndia, setFromIndia] = useState(true);
  const [traditionalUse, setTraditionalUse] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/features/biomaterial-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biological_resource_used: usesBio,
          resource_name: resourceName,
          source_location: sourceLocation,
          geographical_origin: geoOrigin,
          associated_tk: associatedTk ? "YES" : "NO",
          obtained_from_india: fromIndia,
          traditional_use_based: traditionalUse,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="h-full overflow-y-auto p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-600/40 rounded-xl border border-emerald-500/30">
              <UploadCloud size={22} className="text-emerald-300" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">{t("biomaterial_title", "Biological Material Compliance Checker")}</h1>
              <p className="text-xs text-slate-300">
                {t("biomaterial_desc", "Determine National Biodiversity Authority (NBA) approval requirements under Section 6 of the Biological Diversity Act 2002.")}
              </p>
            </div>
          </div>
        </div>

        {/* Input Questions Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
            Biological Material Questionnaire
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Does your invention use a biological resource?
              </label>
              <select
                value={usesBio ? "yes" : "no"}
                onChange={(e) => setUsesBio(e.target.value === "yes")}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-bold"
              >
                <option value="yes">YES — Uses botanical, plant, fungal, or microbial resource</option>
                <option value="no">NO — Synthetic or chemical only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Biological Resource Name / Species
              </label>
              <input
                type="text"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Where was the resource obtained?
              </label>
              <input
                type="text"
                value={sourceLocation}
                onChange={(e) => setSourceLocation(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Geographical Origin
              </label>
              <input
                type="text"
                value={geoOrigin}
                onChange={(e) => setGeoOrigin(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={fromIndia}
                onChange={(e) => setFromIndia(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Obtained from India</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={associatedTk}
                onChange={(e) => setAssociatedTk(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Associated Traditional Knowledge Involved</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={traditionalUse}
                onChange={(e) => setTraditionalUse(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Based on Traditional Medicinal Use</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCheck}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50"
            >
              {loading ? "Checking NBA Compliance..." : "Check Biological Compliance"}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
              BIOLOGICAL MATERIAL REVIEW
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Biological Material Detected</span>
                <p className="text-base font-extrabold text-emerald-700 mt-1">{result.biological_material_detected ? "YES" : "NO"}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Resource Source</span>
                <p className="text-xs font-bold text-slate-800 mt-1 truncate">{result.source}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Geographical Origin</span>
                <p className="text-xs font-bold text-slate-800 mt-1">{result.geographical_origin}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xs text-slate-800 uppercase mb-2">Mandatory Approvals &amp; Form Filings</h3>
              <div className="space-y-2">
                {result.mandatory_approvals?.map((app: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium">
                    <CheckCircle size={15} className="text-emerald-700 flex-shrink-0" />
                    <span>{app}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xs text-slate-800 uppercase mb-2">Potential Compliance Areas</h3>
              <ul className="space-y-1 text-xs text-slate-700">
                {result.compliance_areas?.map((area: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span>•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
