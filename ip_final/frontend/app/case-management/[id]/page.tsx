"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { CaseRecord, CaseStatus, getCaseById, saveCases } from "@/lib/cases";
import { ArrowLeft, Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, FileText, ShieldCheck, Sparkles } from "lucide-react";

const statusStyles: Record<CaseStatus, string> = {
  Draft: "bg-slate-100 text-slate-700",
  "In progress": "bg-emerald-100 text-emerald-800",
  "Awaiting filing": "bg-amber-100 text-amber-800",
  "On hold": "bg-rose-100 text-rose-800",
  Completed: "bg-sky-100 text-sky-800",
};

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [caseItem, setCaseItem] = useState<CaseRecord | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    const item = getCaseById(params.id);
    setCaseItem(item);
  }, [params?.id]);

  const summary = useMemo(() => {
    if (!caseItem) return null;
    const openTasks = caseItem.tasks.filter((task) => !task.completed).length;
    return {
      openTasks,
      completedTasks: caseItem.tasks.length - openTasks,
    };
  }, [caseItem]);

  if (!caseItem) {
    return (
      <AppShell>
        <div className="h-full flex items-center justify-center p-8 text-slate-500">Loading matter details...</div>
      </AppShell>
    );
  }

  const updateCaseStatus = (nextStatus: CaseStatus) => {
    const updated = {
      ...caseItem,
      status: nextStatus,
      progress: nextStatus === "Completed" ? 100 : caseItem.progress,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };

    const allCases = JSON.parse(localStorage.getItem("ipsakti_cases") || "[]");
    const nextCases = allCases.map((item: CaseRecord) => (item.id === caseItem.id ? updated : item));
    localStorage.setItem("ipsakti_cases", JSON.stringify(nextCases));
    setCaseItem(updated);
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = caseItem.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    );

    const completedCount = updatedTasks.filter((task) => task.completed).length;
    const progress = updatedTasks.length ? Math.round((completedCount / updatedTasks.length) * 100) : 0;

    const updated: CaseRecord = {
      ...caseItem,
      tasks: updatedTasks,
      progress,
      status: progress === 100 ? "Completed" : caseItem.status,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };

    const allCases = JSON.parse(localStorage.getItem("ipsakti_cases") || "[]");
    const nextCases = allCases.map((item: CaseRecord) => (item.id === caseItem.id ? updated : item));
    localStorage.setItem("ipsakti_cases", JSON.stringify(nextCases));
    setCaseItem(updated);
  };

  return (
    <AppShell>
      <div className="h-full overflow-y-auto p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/case-management")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
          >
            <ArrowLeft size={14} />
            Back to cases
          </button>

          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[caseItem.status]}`}>
            {caseItem.status}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">Matter detail</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900">{caseItem.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                <span><span className="font-semibold text-slate-700">Client:</span> {caseItem.client}</span>
                <span><span className="font-semibold text-slate-700">Type:</span> {caseItem.ipType}</span>
                <span><span className="font-semibold text-slate-700">Owner:</span> {caseItem.owner}</span>
              </div>
            </div>

            <div className="min-w-[180px]">
              <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <span>Progress</span>
                <span>{caseItem.progress}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${caseItem.progress}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <InfoCard icon={<BriefcaseBusiness className="text-emerald-700" size={18} />} label="Priority" value={caseItem.priority} />
          <InfoCard icon={<CalendarDays className="text-sky-700" size={18} />} label="Due date" value={caseItem.dueDate} />
          <InfoCard icon={<Bell className="text-violet-700" size={18} />} label="Open reminders" value={String(summary?.openTasks ?? 0)} />
          <InfoCard icon={<CheckCircle2 className="text-indigo-700" size={18} />} label="Completed tasks" value={String(summary?.completedTasks ?? 0)} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock3 size={16} className="text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">Timeline &amp; history</h2>
            </div>

            <div className="relative space-y-4 before:absolute before:left-[9px] before:top-1 before:bottom-1 before:w-px before:bg-slate-200">
              {caseItem.timeline.map((entry) => (
                <div key={entry.id} className="relative pl-8">
                  <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-800">{entry.title}</span>
                      <span className="text-[10px] text-slate-500">{entry.timestamp}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">{entry.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">Status update</h2>
              </div>
              <select
                value={caseItem.status}
                onChange={(e) => updateCaseStatus(e.target.value as CaseStatus)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="Draft">Draft</option>
                <option value="In progress">In progress</option>
                <option value="Awaiting filing">Awaiting filing</option>
                <option value="On hold">On hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-sky-600" />
                <h2 className="text-sm font-bold text-slate-900">Next milestone</h2>
              </div>
              <p className="rounded-xl bg-sky-50 border border-sky-100 px-3 py-2 text-xs text-sky-800">{caseItem.nextMilestone}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Last updated</h2>
              </div>
              <p className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-800">{caseItem.lastUpdated}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Matter tasks</h2>
          </div>

          <div className="space-y-2">
            {caseItem.tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                  task.completed
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    readOnly
                    checked={task.completed}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{task.title}</span>
                      <span className="text-[10px] text-slate-500">{task.dueDate}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">{task.reminder}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}
