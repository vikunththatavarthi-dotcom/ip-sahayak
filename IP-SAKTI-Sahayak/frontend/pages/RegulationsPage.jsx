import React, { useEffect, useState } from "react";
import { getAllRegulations, getRegulationImpact } from "@/lib/api";
import { useProfile } from "@/lib/useProfile";
import { EmptyState, SkeletonRows } from "@/components/Skeleton";

const IMPACT_STYLE = {
  HIGH: "border-[#9B3B34]/30 bg-[#9B3B34]/10 text-[#7A2E28]",
  MEDIUM: "border-[#B8862B]/30 bg-[#B8862B]/10 text-[#7A551A]",
  LOW: "border-[#8B8368]/30 bg-[#D9D0B8]/10 text-[#2E2B22]",
};

export default function RegulationsPage() {
  const { profile, profileId } = useProfile();
  const [impacts, setImpacts] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [impactRes, allRes] = await Promise.all([
          getRegulationImpact(profileId),
          getAllRegulations(),
        ]);
        setImpacts(impactRes.impacts || []);
        setAllNotifications(allRes.notifications || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [profileId]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B1712] flex items-center gap-2">📢 Regulation Change Impact Engine</h1>
        <p className="text-sm text-[#4B4636] mt-1">
          Recent IP India / AYUSH notifications, matched against your Digital Twin profile.
        </p>
        {!profile && (
          <p className="text-xs text-[#8A5F1E]/80 mt-2">
            No profile found — showing all notifications. Fill in your{" "}
            <a href="/twin" className="underline">Digital Twin</a> for personalized impact briefs.
          </p>
        )}
      </div>

      {loading && <SkeletonRows rows={3} className="mb-8" />}

      {!loading && profile && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-[#2E2B22] uppercase tracking-wide mb-3">
            Personalized Impact Briefs ({impacts.length})
          </h2>
          {impacts.length === 0 && (
            <EmptyState
              icon="📢"
              title="Nothing matches your profile right now"
              description="You're all caught up — no current IP India or AYUSH notifications appear to affect your registered profile."
            />
          )}
          <div className="flex flex-col gap-3">
            {impacts.map((brief) => (
              <div key={brief.notification.id} className={`border rounded-xl p-5 ${IMPACT_STYLE[brief.impact_level]}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide">{brief.impact_level} IMPACT</span>
                  <span className="text-xs text-[#6E6754]">{brief.notification.date}</span>
                </div>
                <div className="text-sm font-semibold text-[#1C1912] mb-1">{brief.notification.title}</div>
                <div className="text-xs text-[#4B4636] mb-2">{brief.notification.authority}</div>
                <p className="text-sm text-[#2E2B22] mb-3">{brief.notification.summary}</p>
                <div className="text-xs uppercase text-[#6E6754] mb-1">Why this applies to you</div>
                <p className="text-sm text-[#2E2B22] mb-3">{brief.why_it_applies}</p>
                <div className="text-xs uppercase text-[#6E6754] mb-1">Required Actions</div>
                <ul className="text-sm text-[#2E2B22] space-y-1">
                  {brief.required_actions.map((a, i) => (
                    <li key={i} className="flex gap-2"><span>•</span><span>{a}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div>
          <h2 className="text-sm font-semibold text-[#2E2B22] uppercase tracking-wide mb-3">All Notifications</h2>
          <div className="flex flex-col gap-2">
            {allNotifications.map((n) => (
              <div key={n.id} className="border border-[#E9E2CD] rounded-lg p-4 bg-[#F3EEE0]/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#221F17]">{n.title}</span>
                  <span className="text-xs text-[#6E6754]">{n.date}</span>
                </div>
                <div className="text-xs text-[#6E6754] mb-1.5">{n.authority}</div>
                <p className="text-xs text-[#4B4636]">{n.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
