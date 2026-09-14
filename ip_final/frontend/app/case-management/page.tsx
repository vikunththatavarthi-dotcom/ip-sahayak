"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n";
import { getCases, getCaseSummary, saveCases, CaseRecord, CaseStatus, CasePriority } from "@/lib/cases";
import { ArrowRight, Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, Filter, FolderKanban, Plus, ShieldCheck, Sparkles } from "lucide-react";

const statusStyles: Record<CaseStatus, string> = {
  Draft: "bg-slate-100 text-slate-700",
  "In progress": "bg-emerald-100 text-emerald-800",
  "Awaiting filing": "bg-amber-100 text-amber-800",
  "On hold": "bg-rose-100 text-rose-800",
  Completed: "bg-sky-100 text-sky-800",
};

const priorityStyles: Record<CasePriority, string> = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

export default function CaseManagementPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [cases, setCases] = useState<CaseRecord[]>(() => getCases());
  const [statusFilter, setStatusFilter] = useState<"All" | CaseStatus>("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | CasePriority>("All");

  const summary = useMemo(() => getCaseSummary(cases), [cases]);

  const updateCaseStatus = (caseId: string, nextStatus: CaseStatus) => {
    setCases((prev) => {
      const updated = prev.map((caseItem) => {
        if (caseItem.id !== caseId) return caseItem;

        return {
          ...caseItem,
          status: nextStatus,
          progress: nextStatus === "Completed" ? 100 : caseItem.progress,
          lastUpdated: new Date().toISOString().slice(0, 10),
        };
      });
      saveCases(updated);
      return updated;
    });
  };

  const toggleTask = (caseId: string, taskId: string) => {
    setCases((prev) => {
      const updated = prev.map((caseItem) => {
        if (caseItem.id !== caseId) return caseItem;

        const tasks = caseItem.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task,
        );

        const completedCount = tasks.filter((task) => task.completed).length;
        const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

        return {
          ...caseItem,
          tasks,
          progress,
          status: progress === 100 ? "Completed" : caseItem.status,
          lastUpdated: new Date().toISOString().slice(0, 10),
        };
      });
      saveCases(updated);
      return updated;
    });
  };

  const filteredCases = cases.filter((item) => {
    const statusMatch = statusFilter === "All" || item.status === statusFilter;
    const priorityMatch = priorityFilter === "All" || item.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  return (
    <AppShell>
      <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">{t("nav_case_mgmt", "Case Management")}</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">{t("case_board_title", "Portfolio Overview")}</h1>
          </div>

          <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-colors">
            <Plus size={15} />
            New case
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            icon={<FolderKanban className="text-emerald-700" size={18} />}
            label="Open cases"
            value={String(summary.openCount)}
            detail="Currently tracked"
          />
          <StatCard
            icon={<ShieldCheck className="text-amber-700" size={18} />}
            label="High priority"
            value={String(summary.highPriority)}
            detail="Needs attention"
          />
          <StatCard
            icon={<CalendarDays className="text-sky-700" size={18} />}
            label="Due soon"
            value={String(summary.dueSoon)}
            detail="Within 2 weeks"
          />
          <StatCard
            icon={<Bell className="text-violet-700" size={18} />}
            label="Reminders"
            value={String(summary.reminderCount)}
            detail="Open action items"
          />
          <StatCard
            icon={<CheckCircle2 className="text-indigo-700" size={18} />}
            label="Completed"
            value={String(cases.filter((item) => item.status === "Completed").length)}
            detail="Closed matters"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
            <div className="flex items-center gap-2 text-slate-900">
              <Filter size={16} className="text-slate-500" />
              <h2 className="text-sm font-bold">Filter active matters</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "All" | CaseStatus)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="All">All statuses</option>
                <option value="Draft">Draft</option>
                <option value="In progress">In progress</option>
                <option value="Awaiting filing">Awaiting filing</option>
                <option value="On hold">On hold</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as "All" | CasePriority)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="All">All priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredCases.map((item) => {
              const openTasks = item.tasks.filter((task) => !task.completed);

              return (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-300 hover:bg-white transition-all">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${statusStyles[item.status]}`}>
                          {item.status}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${priorityStyles[item.priority]}`}>
                          {item.priority} priority
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        <span><span className="font-semibold text-slate-700">Client:</span> {item.client}</span>
                        <span><span className="font-semibold text-slate-700">Type:</span> {item.ipType}</span>
                        <span><span className="font-semibold text-slate-700">Owner:</span> {item.owner}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="min-w-[120px]">
                        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/case-management/${item.id}`)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-bold text-white hover:bg-slate-700 transition-colors"
                      >
                        Open
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock3 size={13} className="text-slate-500" />
                      <span>Next milestone: {item.nextMilestone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={13} className="text-slate-500" />
                      <span>Due {item.dueDate}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1.5fr_0.8fr] gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        <span>Task reminders</span>
                        <span>{openTasks.length} open</span>
                      </div>

                      <div className="space-y-2">
                        {item.tasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => toggleTask(item.id, task.id)}
                            className={`w-full rounded-lg border px-2.5 py-2 text-left transition-colors ${
                              task.completed
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                readOnly
                                checked={task.completed}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-semibold leading-tight">{task.title}</span>
                                  <span className="text-[10px] text-slate-500">{task.dueDate}</span>
                                </div>
                                <p className="mt-1 text-[10px] text-slate-500">{task.reminder}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        Update status
                      </label>
                      <select
                        value={item.status}
                        onChange={(e) => updateCaseStatus(item.id, e.target.value as CaseStatus)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
                      >
                        <option value="Draft">Draft</option>
                        <option value="In progress">In progress</option>
                        <option value="Awaiting filing">Awaiting filing</option>
                        <option value="On hold">On hold</option>
                        <option value="Completed">Completed</option>
                      </select>

                      <div className="mt-3 rounded-lg bg-slate-50 p-2 text-[10px] text-slate-600">
                        <span className="font-semibold text-slate-700">Last update:</span> {item.lastUpdated}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredCases.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No cases match the selected filters.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Recommended next actions</h2>
            </div>

            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3 border border-emerald-100">
                <CheckCircle2 size={16} className="text-emerald-700 mt-0.5" />
                Complete the class-search review for the AYUSH trademark matter before filing deadlines.
              </li>
              <li className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 border border-amber-100">
                <CheckCircle2 size={16} className="text-amber-700 mt-0.5" />
                Prepare the invention disclosure and claim chart for the patent pre-screen before the next counsel review.
              </li>
              <li className="flex items-start gap-3 rounded-xl bg-sky-50 p-3 border border-sky-100">
                <CheckCircle2 size={16} className="text-sky-700 mt-0.5" />
                Confirm ownership metadata for the packaging copyright matter to avoid any delayed filing steps.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BriefcaseBusiness size={16} className="text-violet-600" />
              <h2 className="text-sm font-bold text-slate-900">Portfolio snapshot</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex justify-between items-center rounded-xl bg-slate-50 px-3 py-2">
                <span>Active matters</span>
                <span className="font-bold text-slate-900">{summary.openCount}</span>
              </div>
              <div className="flex justify-between items-center rounded-xl bg-slate-50 px-3 py-2">
                <span>High-priority</span>
                <span className="font-bold text-slate-900">{summary.highPriority}</span>
              </div>
              <div className="flex justify-between items-center rounded-xl bg-slate-50 px-3 py-2">
                <span>Due within 14 days</span>
                <span className="font-bold text-slate-900">{summary.dueSoon}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">{icon}</div>
        <span className="text-[10px] text-slate-400">Live</span>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}
