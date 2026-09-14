import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assessTKRisk } from "@/lib/api";
import { useProfile } from "@/lib/useProfile";

const LEVEL_STYLE = {
  HIGH: { ring: "ring-[#9B3B34]/40", bg: "bg-[#9B3B34]/10", text: "text-[#7A2E28]", label: "High Sensitivity" },
  MEDIUM: { ring: "ring-[#B8862B]/40", bg: "bg-[#B8862B]/10", text: "text-[#7A551A]", label: "Medium Sensitivity" },
  LOW: { ring: "ring-[#2F6B4F]/40", bg: "bg-[#2F6B4F]/10", text: "text-[#1F4D37]", label: "Low Sensitivity" },
};

const inputClass =
  "bg-[#F3EEE0]/60 border border-[#D9D0B8]/60 rounded-lg px-3 py-2 text-sm text-[#221F17] focus:outline-none focus:border-[#2C5282]/60 transition-colors w-full";

export default function TKRiskPage() {
  const navigate = useNavigate();
  const { profileId } = useProfile();
  const [ingredients, setIngredients] = useState("");
  const [process, setProcess] = useState("");
  const [claims, setClaims] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!ingredients.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await assessTKRisk({
        profile_id: profileId,
        ingredients,
        extraction_process: process,
        therapeutic_claims: claims,
      });
      setResult(r);
    } catch (e) {
      console.error(e);
      alert("Assessment failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const style = result ? LEVEL_STYLE[result.sensitivity_level] : null;

  const askAboutAlternatives = () => {
    const query =
      `My formulation (ingredients: ${ingredients}${process ? `; process: ${process}` : ""}) was flagged as ` +
      `${result.sensitivity_level} traditional-knowledge sensitivity. What alternative IP protection routes ` +
      `should I consider instead of a patent — e.g. trade secret, geographical indication, TKDL defensive ` +
      `disclosure, or a process/synergy patent on the novel elements only?`;
    navigate("/", { state: { autoQuery: query } });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B1712] flex items-center gap-2">🌿 Traditional Knowledge Risk Indicator</h1>
        <p className="text-sm text-[#4B4636] mt-1">
          Fast triage on whether your AYUSH formulation reads as public-domain traditional knowledge
          (unpatentable under Section 3(p)) or a genuinely novel, patentable formulation/process.
        </p>
        <details className="mt-3 text-xs text-[#6E6754] group">
          <summary className="cursor-pointer text-[#4B4636] hover:text-[#17315C] select-none">
            Why this matters — the biopiracy problem, in brief
          </summary>
          <p className="mt-2 leading-relaxed max-w-2xl">
            India has lost patents on turmeric, neem, and basmati rice abroad precisely because
            well-documented traditional knowledge was passed off as novel invention. Section 3(p) of the
            Patents Act exists to block that — but it also means genuine innovators building on traditional
            ingredients need to know, <em>before</em> they file, whether their formulation is protectable at
            all, and if so, under what pathway. The TKDL (Traditional Knowledge Digital Library) is the tool
            examiners use to catch this at the prior-art stage; this indicator gives you the same signal
            early, so you can route your protection strategy correctly the first time.
          </p>
        </details>
      </div>

      <div className="bg-[#F3EEE0]/40 border border-[#E9E2CD] rounded-xl p-6 flex flex-col gap-4 mb-6">
        <label className="text-sm text-[#4B4636]">
          Ingredients (comma-separated)
          <textarea className={inputClass + " mt-1.5"} rows={2} value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g. Ashwagandha, Curcumin, Piperine extract" />
        </label>
        <label className="text-sm text-[#4B4636]">
          Extraction / manufacturing process (optional but improves accuracy)
          <textarea className={inputClass + " mt-1.5"} rows={2} value={process}
            onChange={(e) => setProcess(e.target.value)}
            placeholder="e.g. Novel supercritical CO2 extraction with liposomal encapsulation for improved bioavailability" />
        </label>
        <label className="text-sm text-[#4B4636]">
          Therapeutic claims
          <textarea className={inputClass + " mt-1.5"} rows={2} value={claims}
            onChange={(e) => setClaims(e.target.value)}
            placeholder="e.g. Supports stress relief and immunity" />
        </label>
        <button
          onClick={run}
          disabled={loading || !ingredients.trim()}
          className="bg-[#17315C] hover:bg-[#2C5282] disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors self-start"
        >
          {loading ? "Assessing…" : "Assess Sensitivity"}
        </button>
      </div>

      {loading && !result && (
        <div className="rounded-xl p-6 ring-1 ring-[#D9D0B8]/50 bg-[#F3EEE0]/40 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 skeleton" />
            <div className="h-3 w-16 skeleton" />
          </div>
          <div className="h-3 w-1/3 skeleton" />
          <div className="h-3 w-full skeleton" />
          <div className="h-3 w-4/5 skeleton" />
        </div>
      )}

      {result && style && (
        <div className={`rounded-xl p-6 ring-1 ${style.ring} ${style.bg} flex flex-col gap-4`}>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold ${style.text}`}>{style.label}</span>
            <span className="text-xs text-[#4B4636]">Score: {result.sensitivity_score}</span>
          </div>
          <div>
            <div className="text-xs uppercase text-[#6E6754] mb-1">Recommended Pathway</div>
            <div className="text-sm font-medium text-[#221F17]">{result.recommended_pathway}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-[#6E6754] mb-1">Why</div>
            <p className="text-sm text-[#2E2B22] leading-relaxed">{result.recommendation}</p>
          </div>
          {result.flagged_ingredients.length > 0 && (
            <div>
              <div className="text-xs uppercase text-[#6E6754] mb-1.5">Flagged as known traditional ingredients</div>
              <div className="flex flex-wrap gap-1.5">
                {result.flagged_ingredients.map((ing) => (
                  <span key={ing} className="text-xs bg-[#E9E2CD]/70 border border-[#D9D0B8] rounded-full px-2.5 py-1 text-[#2E2B22] capitalize">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(result.sensitivity_level === "HIGH" || result.sensitivity_level === "MEDIUM") && (
            <button
              onClick={askAboutAlternatives}
              className="self-start bg-[#17315C] hover:bg-[#2C5282] text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors flex items-center gap-2"
            >
              💬 Ask Sahayak about alternative protection routes
            </button>
          )}
          <p className="text-xs text-[#6E6754] border-t border-[#D9D0B8]/50 pt-3">
            This is a rule-based triage signal, not a substitute for a formal TKDL prior-art search
            or legal opinion.
          </p>
        </div>
      )}
    </div>
  );
}
