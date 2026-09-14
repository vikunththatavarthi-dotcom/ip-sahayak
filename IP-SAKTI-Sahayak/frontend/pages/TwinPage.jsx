import React, { useEffect, useState } from "react";
import { getPassport } from "@/lib/api";
import { AYUSH_CATEGORIES, ENTITY_TYPES, STAGES, useProfile } from "@/lib/useProfile";
import { EmptyState, SkeletonCard } from "@/components/Skeleton";

const PRIORITY_COLOR = {
  HIGH: "border-[#9B3B34]/30 bg-[#9B3B34]/10 text-[#7A2E28]",
  MEDIUM: "border-[#B8862B]/30 bg-[#B8862B]/10 text-[#7A551A]",
  LOW: "border-[#8B8368]/30 bg-[#D9D0B8]/10 text-[#2E2B22]",
};

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-[#4B4636]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "bg-[#F3EEE0]/60 border border-[#D9D0B8]/60 rounded-lg px-3 py-2 text-sm text-[#221F17] focus:outline-none focus:border-[#2C5282]/60 transition-colors";

export default function TwinPage() {
  const { profile, saveProfile, loading } = useProfile();
  const [form, setForm] = useState({
    business_name: "", entity_type: "", state_location: "", ayush_category: "",
    stage: "", brand_name: "", product_claims: "", formulation_summary: "",
    active_ip_assets: [],
  });
  const [passport, setPassport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passportLoading, setPassportLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        business_name: profile.business_name || "",
        entity_type: profile.entity_type || "",
        state_location: profile.state_location || "",
        ayush_category: profile.ayush_category || "",
        stage: profile.stage || "",
        brand_name: profile.brand_name || "",
        product_claims: profile.product_claims || "",
        formulation_summary: profile.formulation_summary || "",
        active_ip_assets: profile.active_ip_assets || [],
      });
    }
  }, [profile]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const p = await saveProfile(form);
      setPassportLoading(true);
      const pp = await getPassport(p.id);
      setPassport(pp);
    } catch (e) {
      console.error(e);
      alert("Failed to save profile / generate passport. Is the backend running?");
    } finally {
      setSaving(false);
      setPassportLoading(false);
    }
  };

  const loadPassport = async () => {
    if (!profile) return;
    setPassportLoading(true);
    try {
      setPassport(await getPassport(profile.id));
    } finally {
      setPassportLoading(false);
    }
  };

  useEffect(() => {
    if (profile && !passport) loadPassport();
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B1712] flex items-center gap-2">🪪 Digital Twin & Compliance Passport</h1>
        <p className="text-sm text-[#4B4636] mt-1">
          Build a persistent profile of your business or formulation. We'll generate a tailored
          protection roadmap and AYUSH compliance checklist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile form */}
        <div className="bg-[#F3EEE0]/40 border border-[#E9E2CD] rounded-xl p-6 flex flex-col gap-4 h-fit">
          <h2 className="text-sm font-semibold text-[#2E2B22] uppercase tracking-wide">Business Profile</h2>
          <Field label="Business / Innovator Name">
            <input className={inputClass} value={form.business_name} onChange={update("business_name")} placeholder="e.g. Himalayan Herbal Labs" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Entity Type">
              <select className={inputClass} value={form.entity_type} onChange={update("entity_type")}>
                <option value="">Select…</option>
                {ENTITY_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="State / Location">
              <input className={inputClass} value={form.state_location} onChange={update("state_location")} placeholder="e.g. Kerala" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="AYUSH Category">
              <select className={inputClass} value={form.ayush_category} onChange={update("ayush_category")}>
                <option value="">Select…</option>
                {AYUSH_CATEGORIES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Stage">
              <select className={inputClass} value={form.stage} onChange={update("stage")}>
                <option value="">Select…</option>
                {STAGES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Brand Name">
            <input className={inputClass} value={form.brand_name} onChange={update("brand_name")} placeholder="e.g. AyurVeda Plus" />
          </Field>
          <Field label="Formulation Summary">
            <textarea className={inputClass} rows={3} value={form.formulation_summary} onChange={update("formulation_summary")}
              placeholder="e.g. Ashwagandha + Curcumin standardized extract with a novel liposomal delivery method" />
          </Field>
          <Field label="Product / Therapeutic Claims">
            <textarea className={inputClass} rows={2} value={form.product_claims} onChange={update("product_claims")}
              placeholder="e.g. Supports stress relief and joint mobility" />
          </Field>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2 bg-[#17315C] hover:bg-[#2C5282] disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            {saving ? "Saving…" : profile ? "Update Profile & Regenerate Passport" : "Create Profile & Generate Passport"}
          </button>
        </div>

        {/* Passport display */}
        <div className="flex flex-col gap-4">
          {!profile && (
            <EmptyState
              icon="🪪"
              title="No Compliance Passport yet"
              description="Fill in and save your profile on the left to generate a tailored IP protection roadmap and AYUSH compliance checklist."
            />
          )}
          {passportLoading && (
            <div className="flex flex-col gap-4">
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
              <SkeletonCard lines={4} />
            </div>
          )}
          {passport && !passportLoading && (
            <>
              <div className="bg-[#F3EEE0]/40 border border-[#E9E2CD] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#2E2B22] uppercase tracking-wide mb-3">Recommended IP Pathways</h3>
                <ul className="space-y-2 text-sm text-[#2E2B22]">
                  {passport.protection_pathways.map((p, i) => (
                    <li key={i} className="flex gap-2"><span className="text-[#1E3A5F]">•</span><span>{p}</span></li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#F3EEE0]/40 border border-[#E9E2CD] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#2E2B22] uppercase tracking-wide mb-3">AYUSH Obligations</h3>
                <ul className="space-y-2 text-sm text-[#2E2B22]">
                  {passport.ayush_obligations.map((p, i) => (
                    <li key={i} className="flex gap-2"><span className="text-[#245C40]">•</span><span>{p}</span></li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#F3EEE0]/40 border border-[#E9E2CD] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#2E2B22] uppercase tracking-wide mb-3">Priority Checklist</h3>
                <div className="flex flex-col gap-2">
                  {passport.checklist.map((item, i) => (
                    <div key={i} className={`border rounded-lg p-3 ${PRIORITY_COLOR[item.priority] || PRIORITY_COLOR.LOW}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wide">{item.priority}</span>
                        <span className="text-[10px] uppercase text-[#6E6754]">{item.category.replace("_", " ")}</span>
                      </div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs opacity-80 mt-1">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
