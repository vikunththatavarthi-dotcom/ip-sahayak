"use client";

import { useState, useEffect } from "react";
import { Briefcase, ChevronDown } from "lucide-react";

interface DomainOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

interface DomainSelectorProps {
  value?: string;
  onChange: (domainId: string) => void;
}

export default function DomainSelector({ value = "general_ip", onChange }: DomainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"}/config`)
      .then((res) => res.json())
      .then((data) => {
        setDomains(data.domains);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        // Fallback domains
        setDomains([
          { id: "general_ip", name: "General IP", description: "All IP types", icon: "⚖️" },
          { id: "patent", name: "Patents", description: "Patent filing and protection", icon: "🔬" },
          { id: "ayurveda", name: "Ayurveda & TK", description: "Ayurvedic knowledge & IP", icon: "🌿" },
        ]);
      });
  }, []);

  const selectedDomain = domains.find((d) => d.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white hover:bg-slate-700 transition-colors text-sm"
      >
        <Briefcase size={16} />
        <span>{selectedDomain?.name || "General IP"}</span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 min-w-[280px]">
          {loading ? (
            <div className="p-3 text-slate-400 text-sm">Loading...</div>
          ) : (
            <div className="py-1 max-h-[400px] overflow-y-auto">
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => {
                    onChange(domain.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 transition-colors border-l-2 ${
                    value === domain.id
                      ? "bg-emerald-600/30 text-emerald-300 border-emerald-500"
                      : "text-slate-300 hover:bg-slate-700 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {domain.icon && <span className="text-lg">{domain.icon}</span>}
                    <div className="font-medium">{domain.name}</div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 ml-6">{domain.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
