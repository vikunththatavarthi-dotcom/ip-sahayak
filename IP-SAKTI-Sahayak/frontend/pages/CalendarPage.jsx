import React, { useEffect, useState } from "react";
import { createCalendarEvent, deleteCalendarEvent, getCalendar, updateEventStatus } from "@/lib/api";
import { useProfile } from "@/lib/useProfile";
import { EmptyState, SkeletonRows } from "@/components/Skeleton";

const STATUS_STYLE = {
  upcoming: "border-[#2C5282]/30 bg-[#2C5282]/10 text-[#17315C]",
  overdue: "border-[#9B3B34]/30 bg-[#9B3B34]/10 text-[#7A2E28]",
  done: "border-[#2F6B4F]/30 bg-[#2F6B4F]/10 text-[#1F4D37] opacity-60",
};

const inputClass =
  "bg-[#F3EEE0]/60 border border-[#D9D0B8]/60 rounded-lg px-3 py-2 text-sm text-[#221F17] focus:outline-none focus:border-[#2C5282]/60 transition-colors";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
}

export default function CalendarPage() {
  const { profile, profileId } = useProfile();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", event_type: "deadline", due_date: "", notes: "" });

  const load = async () => {
    if (!profileId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await getCalendar(profileId);
      setEvents(res.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addEvent = async () => {
    if (!form.title.trim() || !profileId) return;
    try {
      await createCalendarEvent({ profile_id: profileId, ...form });
      setForm({ title: "", event_type: "deadline", due_date: "", notes: "" });
      load();
    } catch (e) {
      alert("Failed to add event");
    }
  };

  const markDone = async (id) => { await updateEventStatus(id, "done"); load(); };
  const remove = async (id) => { await deleteCalendarEvent(id); load(); };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B1712] flex items-center gap-2">🗓️ Compliance Calendar</h1>
        <p className="text-sm text-[#4B4636] mt-1">
          Track filing deadlines, objection response cut-offs, renewals, and audit dates.
        </p>
      </div>

      {!profileId && (
        <EmptyState
          icon="🪪"
          title="No profile yet"
          description="Calendar events are linked to your Digital Twin profile. Create one first, and any deadlines you add — manually or extracted from an uploaded document — will show up here."
          action={
            <a href="/twin" className="text-sm bg-[#17315C] hover:bg-[#2C5282] text-white rounded-lg px-4 py-2 transition-colors inline-block">
              Create Digital Twin profile
            </a>
          }
        />
      )}

      {profileId && (
        <>
          <div className="bg-[#F3EEE0]/40 border border-[#E9E2CD] rounded-xl p-5 mb-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-[#2E2B22] uppercase tracking-wide">Add Event</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={inputClass} placeholder="Title (e.g. Trademark objection reply due)"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <select className={inputClass} value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
                <option value="deadline">Deadline</option>
                <option value="renewal">Renewal</option>
                <option value="audit">Audit</option>
                <option value="hearing">Hearing</option>
                <option value="manual">Other</option>
              </select>
              <input className={inputClass} type="date"
                value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              <input className={inputClass} placeholder="Notes (optional)"
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <button onClick={addEvent} className="self-start bg-[#17315C] hover:bg-[#2C5282] text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
              Add to Calendar
            </button>
          </div>

          {loading && <SkeletonRows rows={3} className="mb-2" />}
          {!loading && events.length === 0 && (
            <EmptyState
              icon="🗓️"
              title="No events yet"
              description="Add one above, or upload a trademark/patent notice in Chat — if it has a deadline, you'll get a one-click option to add it here."
            />
          )}
          <div className="flex flex-col gap-2">
            {events.map((e) => {
              const dLeft = daysUntil(e.due_date);
              return (
                <div key={e.id} className={`border rounded-lg p-4 flex items-center justify-between gap-4 ${STATUS_STYLE[e.status] || STATUS_STYLE.upcoming}`}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{e.title}</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      {e.event_type} {e.due_date ? `· ${e.due_date}` : ""}
                      {dLeft !== null && e.status !== "done" && (
                        <> · {dLeft >= 0 ? `${dLeft} day(s) left` : `${Math.abs(dLeft)} day(s) overdue`}</>
                      )}
                    </div>
                    {e.notes && <div className="text-xs opacity-60 mt-1">{e.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {e.status !== "done" && (
                      <button onClick={() => markDone(e.id)} className="text-xs px-2 py-1 rounded bg-[#E9E2CD]/60 hover:bg-[#D9D0B8]/60">
                        Mark done
                      </button>
                    )}
                    <button onClick={() => remove(e.id)} className="text-xs px-2 py-1 rounded bg-[#E9E2CD]/60 hover:bg-[#6E2620]/40">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
