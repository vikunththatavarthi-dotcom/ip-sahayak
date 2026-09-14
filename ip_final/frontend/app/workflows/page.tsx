"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { getUser } from "@/lib/auth";
import { getAllSessions } from "@/lib/history";
import { useLanguage } from "@/lib/i18n";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Landmark,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";

type WorkflowStep = {
  title: string;
  description: string;
  outcome: string;
};

type TemplateItem = {
  id: string;
  name: string;
  type: string;
  summary: string;
  highlights: string[];
  recommended_for: string[];
  file_name: string;
};

const workflows = [
  {
    id: "patent",
    title: "Patent Filing Workflow",
    summary: "From invention disclosure to filing and first examination response.",
    steps: [
      {
        title: "Disclosure & novelty review",
        description: "Capture the inventive concept, prior-art search notes, and technical drawings.",
        outcome: "Establish a defensible patent story and identify missing evidence.",
      },
      {
        title: "Drafting & claim framing",
        description: "Prepare patent claims, abstract, specification, and assignment declarations.",
        outcome: "Create a filing-ready specification with legal and technical clarity.",
      },
      {
        title: "Form filing & proofing",
        description: "Submit Form 1, Form 2, and required declarations with the patent office.",
        outcome: "Reduce procedural defects before the application reaches the examiner.",
      },
      {
        title: "Response & prosecution",
        description: "Track office actions, claim amendments, and hearing or response deadlines.",
        outcome: "Respond systematically to objections and protect the filing timeline.",
      },
    ],
  },
  {
    id: "trademark",
    title: "Trademark Registration Workflow",
    summary: "From trademark search to final registration and renewals.",
    steps: [
      {
        title: "Brand clearance",
        description: "Check class coverage, existing similar marks, and use-based adoption status.",
        outcome: "Minimize rejection risk before filing and save prosecution cost.",
      },
      {
        title: "Form and specimen preparation",
        description: "Prepare the TM-A form, application details, and usage/specimen evidence.",
        outcome: "Ensure the application complies with the chosen class and evidence format.",
      },
      {
        title: "Publication & objection handling",
        description: "Monitor publication and respond promptly to opposition or examination objections.",
        outcome: "Keep the registration path moving and reduce approval delays.",
      },
      {
        title: "Registration & renewals",
        description: "Track registration certificate issuance and planned renewals after ten years.",
        outcome: "Maintain enforceable rights and avoid lapse in the brand portfolio.",
      },
    ],
  },
  {
    id: "copyright",
    title: "Copyright & Documentation Workflow",
    summary: "Capture authorship, protect creative works, and maintain proof for enforcement.",
    steps: [
      {
        title: "Asset inventory",
        description: "List code, manuals, labels, scripts, and product content requiring protection.",
        outcome: "Define the ownership boundary and identify what should be registered.",
      },
      {
        title: "Authorship evidence",
        description: "Collect original drafts, timestamps, and author declarations for the work.",
        outcome: "Build a clear chain of authorship and originality proof.",
      },
      {
        title: "Application & filing",
        description: "Prepare the application with the relevant work category and filing details.",
        outcome: "Improve the quality of the copyright record and reduce future disputes.",
      },
      {
        title: "Monitoring & enforcement",
        description: "Track unauthorised use, plagiarism, and notice-based enforcement action.",
        outcome: "Use the registration as a documented basis for enforcement decisions.",
      },
    ],
  },
];

export default function WorkflowsPage() {
  const { t } = useLanguage();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("patent");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [recommendedWorkflow, setRecommendedWorkflow] = useState<{ id: string; name: string; reason: string } | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const response = await fetch("http://localhost:8000/api/features/templates");
        const data = await response.json();
        setTemplates(data.templates ?? []);
      } catch (error) {
        console.error("Failed to load workflow templates", error);
      }
    }

    async function loadRecommendedWorkflow() {
      try {
        const user = getUser();
        const profileType = user?.role ?? "MSME";
        const response = await fetch(`http://localhost:8000/api/features/recommended-workflow/${encodeURIComponent(profileType)}`);
        const data = await response.json();
        setRecommendedWorkflow(data);
      } catch (error) {
        console.error("Failed to load recommended workflow", error);
      }
    }

    loadTemplates();
    loadRecommendedWorkflow();
  }, []);

  const activeWorkflow = useMemo(
    () => workflows.find((item) => item.id === selectedWorkflow) ?? workflows[0],
    [selectedWorkflow]
  );

  const buildSessionSummary = () => {
    const sessions = getAllSessions();
    const latestSession = sessions[0];

    if (!latestSession || latestSession.messages.length === 0) {
      return `The user is evaluating the ${activeWorkflow.title.toLowerCase()} and is preparing to move from discovery to action.`;
    }

    const recentMessages = latestSession.messages
      .slice(-8)
      .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
      .join(" \n");

    return `Latest session context for ${activeWorkflow.title}: ${recentMessages.slice(0, 1200)}`;
  };

  const handleGenerateReport = async () => {
    try {
      setReportLoading(true);
      const user = getUser();
      const workflowSteps = activeWorkflow.steps.map((step) => `${step.title}: ${step.outcome}`);

      const response = await fetch("http://localhost:8000/api/features/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_name: user?.name ?? "Applicant / Entity",
          invention_title: activeWorkflow.title,
          description: activeWorkflow.summary,
          ingredients: workflowSteps.join("; "),
          brand_name: user?.org ?? "Organization",
          product_service: activeWorkflow.title,
          workflow_name: activeWorkflow.title,
          workflow_steps: workflowSteps,
          session_summary: buildSessionSummary(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeWorkflow.title.replace(/\s+/g, "_")}_assessment_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate workflow report", error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownload = async (template: TemplateItem) => {
    try {
      const user = getUser();
      const response = await fetch("http://localhost:8000/api/features/templates/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: template.id,
          title: template.name,
          applicant_name: user?.name ?? "Applicant / Entity",
          company_name: user?.org ?? "Organization",
        }),
      });

      if (!response.ok) {
        throw new Error("Template export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = template.file_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export template PDF", error);
    }
  };

  return (
    <AppShell>
      <div className="h-full overflow-y-auto p-8 max-w-6xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-[#0c1911] via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">
              Operational Playbooks
            </span>
          </div>
          <h1 className="font-bold text-2xl text-white">{t("workflows_title", "Step-by-Step Workflows & Document Templates")}</h1>
          <p className="text-xs text-slate-300 mt-2 max-w-3xl">
            {t("workflows_desc", "Use these guided workflows and reusable templates to move from idea to filing, objection response, and compliance tracking with less ambiguity.")}
          </p>
        </div>

        {recommendedWorkflow && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-emerald-700" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-emerald-900">Recommended workflow</h2>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{recommendedWorkflow.name}</p>
                <p className="text-[11px] text-slate-600 mt-1">{recommendedWorkflow.reason}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkflow(recommendedWorkflow.id === "invention-disclosure" ? "patent" : recommendedWorkflow.id === "trademark-filing" ? "trademark" : "patent")}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 text-white px-3 py-2 text-xs font-bold hover:bg-emerald-600"
              >
                Open workflow
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.9fr] gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-emerald-700" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-800">Workflow library</h2>
            </div>

            <div className="space-y-3">
              {workflows.map((workflow) => (
                <button
                  key={workflow.id}
                  type="button"
                  onClick={() => setSelectedWorkflow(workflow.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    selectedWorkflow === workflow.id
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{workflow.title}</div>
                      <div className="text-[11px] text-slate-600 mt-1">{workflow.summary}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={16} className="text-emerald-700" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-800">Selected workflow</h2>
            </div>

            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl text-slate-900">{activeWorkflow.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{activeWorkflow.summary}</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 text-white px-3 py-2 text-[11px] font-bold hover:bg-emerald-600 disabled:opacity-60"
              >
                <Download size={14} />
                {reportLoading ? "Generating..." : "Generate report"}
              </button>
            </div>

            <div className="space-y-4">
              {activeWorkflow.steps.map((step: WorkflowStep, index: number) => (
                <div key={`${activeWorkflow.id}-${step.title}`} className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-bold text-sm text-slate-900">{step.title}</h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 size={12} />
                        Outcome
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.description}</p>
                    <p className="text-[11px] text-emerald-800 font-semibold mt-2">{step.outcome}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-emerald-700" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-800">Reusable document templates</h2>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ready to use</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.length > 0 ? templates.map((template) => (
              <div key={template.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col h-full">
                <div className="mb-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[10px] font-bold uppercase">
                    <Landmark size={12} />
                    {template.type}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-3">{template.name}</h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{template.summary}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {template.highlights.map((highlight) => (
                    <span key={highlight} className="text-[10px] px-2 py-1 rounded bg-white border border-slate-200 text-slate-700">
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="mt-auto">
                  <button
                    type="button"
                    onClick={() => handleDownload(template)}
                    className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
                  >
                    <Download size={14} />
                    Download PDF
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
                Loading template library...
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-900">Compliance guardrail</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every step is aligned to common Indian IP process checkpoints, evidence collection, and regulatory review needs.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TimerReset size={16} className="text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-900">Deadlines tracked</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Capture filing dates, deadlines, and procedural actions so the team can act before statutory windows close.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-900">Execution readiness</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Move from intake to filing handoff with standardised documents and role-based operational clarity.
            </p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ArrowRight size={16} className="text-emerald-700" />
            <span className="font-bold">Next recommended action:</span>
            <span>Open the workflow that matches your IP asset and download the associated template before filing.</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
