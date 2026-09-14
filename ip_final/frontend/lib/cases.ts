/**
 * lib/cases.ts
 * Demo case-tracking data for the personalized dashboard and case management board.
 */

export type CaseStatus = "Draft" | "In progress" | "Awaiting filing" | "On hold" | "Completed";
export type CasePriority = "High" | "Medium" | "Low";

export interface CaseTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  reminder: string;
}

export interface CaseActivity {
  id: string;
  type: "status" | "task" | "milestone" | "note";
  title: string;
  timestamp: string;
  description: string;
}

export interface CaseRecord {
  id: string;
  title: string;
  client: string;
  ipType: string;
  status: CaseStatus;
  priority: CasePriority;
  owner: string;
  nextMilestone: string;
  lastUpdated: string;
  dueDate: string;
  progress: number;
  tasks: CaseTask[];
  timeline: CaseActivity[];
}

const KEY = "ipsakti_cases";

export const defaultCases: CaseRecord[] = [
  {
    id: "case-101",
    title: "Trademark filing – AYUSH herbal brand",
    client: "Aarav Wellness Pvt. Ltd.",
    ipType: "Trademark",
    status: "In progress",
    priority: "High",
    owner: "Legal Ops",
    nextMilestone: "Class search and filing readiness review",
    lastUpdated: "2026-08-26",
    dueDate: "2026-08-31",
    progress: 68,
    tasks: [
      { id: "t-101-1", title: "Validate class selection", dueDate: "2026-08-29", completed: false, reminder: "Class review reminder" },
      { id: "t-101-2", title: "Prepare filing draft", dueDate: "2026-08-30", completed: true, reminder: "Draft ready" },
      { id: "t-101-3", title: "Submit attorney review", dueDate: "2026-08-31", completed: false, reminder: "Final approval due" },
    ],
    timeline: [
      { id: "a-101-1", type: "milestone", title: "Client intake confirmed", timestamp: "2026-08-20", description: "Brand brief and filing scope reviewed with client." },
      { id: "a-101-2", type: "status", title: "Status moved to In progress", timestamp: "2026-08-23", description: "Initial trademark assessment completed and files were assigned to the legal ops queue." },
      { id: "a-101-3", type: "task", title: "Class search reminder", timestamp: "2026-08-27", description: "Reminder created for class verification before filing package submission." },
    ],
  },
  {
    id: "case-102",
    title: "Patent pre-screen – formulation process",
    client: "Nirva Bio Labs",
    ipType: "Patent",
    status: "Awaiting filing",
    priority: "High",
    owner: "IP Engineer",
    nextMilestone: "Prepare invention disclosure and claim mapping",
    lastUpdated: "2026-08-24",
    dueDate: "2026-09-02",
    progress: 82,
    tasks: [
      { id: "t-102-1", title: "Map claims to section 3 conditions", dueDate: "2026-08-30", completed: false, reminder: "Claim map due soon" },
      { id: "t-102-2", title: "Finalize sworn declaration", dueDate: "2026-09-01", completed: true, reminder: "Declaration approved" },
    ],
    timeline: [
      { id: "a-102-1", type: "milestone", title: "Patent disclosure received", timestamp: "2026-08-18", description: "Technical disclosure and lab notes were uploaded for review." },
      { id: "a-102-2", type: "status", title: "Status moved to Awaiting filing", timestamp: "2026-08-22", description: "Risk check completed and counsel review is pending signature." },
      { id: "a-102-3", type: "task", title: "Claim chart revision", timestamp: "2026-08-26", description: "Draft claim chart prepared and waiting for final counsel check." },
    ],
  },
  {
    id: "case-103",
    title: "Copyright check – product manual and packaging",
    client: "Sattva Herbs",
    ipType: "Copyright",
    status: "Draft",
    priority: "Medium",
    owner: "Compliance Analyst",
    nextMilestone: "Finalize authorship and ownership proof",
    lastUpdated: "2026-08-18",
    dueDate: "2026-09-05",
    progress: 42,
    tasks: [
      { id: "t-103-1", title: "Collect authorship records", dueDate: "2026-08-29", completed: false, reminder: "Author list pending" },
      { id: "t-103-2", title: "Confirm packaging artwork ownership", dueDate: "2026-09-04", completed: false, reminder: "Artwork ownership check" },
    ],
    timeline: [
      { id: "a-103-1", type: "note", title: "Document collection started", timestamp: "2026-08-15", description: "Manuals and product packaging files were shared for review." },
      { id: "a-103-2", type: "status", title: "Status moved to Draft", timestamp: "2026-08-19", description: "Basic data capture is complete while the ownership records are still being organized." },
    ],
  },
  {
    id: "case-104",
    title: "TK review – traditional formulation dataset",
    client: "Vriksha Collective",
    ipType: "Traditional Knowledge",
    status: "On hold",
    priority: "Medium",
    owner: "Research Counsel",
    nextMilestone: "Await prior-art verification from TKDL team",
    lastUpdated: "2026-08-15",
    dueDate: "2026-09-10",
    progress: 29,
    tasks: [
      { id: "t-104-1", title: "Request TKDL evidence review", dueDate: "2026-08-31", completed: false, reminder: "TKDL follow-up reminder" },
      { id: "t-104-2", title: "Confirm prior art dataset audit", dueDate: "2026-09-06", completed: false, reminder: "Dataset audit reminder" },
    ],
    timeline: [
      { id: "a-104-1", type: "note", title: "Traditional knowledge review initiated", timestamp: "2026-08-12", description: "Dataset and prior-art references were collected for the initial review." },
      { id: "a-104-2", type: "status", title: "Status moved to On hold", timestamp: "2026-08-17", description: "Waiting for external TKDL verification feedback to continue the assessment." },
    ],
  },
];

export function getCases(): CaseRecord[] {
  if (typeof window === "undefined") return defaultCases;

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(defaultCases));
      return defaultCases;
    }

    const parsed = JSON.parse(raw) as CaseRecord[];
    return parsed.length ? parsed : defaultCases;
  } catch {
    return defaultCases;
  }
}

export function saveCases(cases: CaseRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(cases));
}

export function addCase(caseItem: CaseRecord): void {
  const existing = getCases();
  saveCases([caseItem, ...existing]);
}

export function getCaseById(caseId: string): CaseRecord | null {
  return getCases().find((caseItem) => caseItem.id === caseId) ?? null;
}

export function getCaseSummary(cases: CaseRecord[]) {
  const openCount = cases.filter((item) => item.status !== "Completed").length;
  const highPriority = cases.filter((item) => item.priority === "High").length;
  const dueSoon = cases.filter((item) => {
    const diff = new Date(item.dueDate).getTime() - Date.now();
    return diff > 0 && diff < 1000 * 60 * 60 * 24 * 14;
  }).length;

  const reminderCount = cases.reduce((sum, item) => {
    const activeTasks = item.tasks.filter((task) => !task.completed);
    return sum + activeTasks.length;
  }, 0);

  return { openCount, highPriority, dueSoon, reminderCount };
}

export function getDueReminderCount(cases: CaseRecord[]) {
  return cases.reduce((sum, item) => {
    const dueTaskCount = item.tasks.filter((task) => !task.completed && new Date(task.dueDate).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 7).length;
    return sum + dueTaskCount;
  }, 0);
}
