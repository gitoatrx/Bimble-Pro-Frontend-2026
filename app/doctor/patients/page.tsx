"use client";

import React, { useState } from "react";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";

type Patient = {
  id: number;
  name: string;
  dob: string;
  lastSeen: string;
  totalVisits: number;
  status: "active" | "inactive";
};

const MOCK_PATIENTS: Patient[] = [
  { id: 1, name: "Sarah Chen",    dob: "Apr 5, 1988",  lastSeen: "Apr 14, 2026", totalVisits: 4,  status: "active"   },
  { id: 2, name: "Marcus Brown",  dob: "Jul 12, 1975", lastSeen: "Apr 10, 2026", totalVisits: 2,  status: "active"   },
  { id: 3, name: "Rita Nguyen",   dob: "Jan 30, 1992", lastSeen: "Mar 28, 2026", totalVisits: 6,  status: "active"   },
  { id: 4, name: "John Moore",    dob: "Sep 8, 1960",  lastSeen: "Feb 14, 2026", totalVisits: 1,  status: "inactive" },
  { id: 5, name: "Aisha Patel",   dob: "Mar 17, 2000", lastSeen: "Apr 9, 2026",  totalVisits: 3,  status: "active"   },
];

export default function DoctorPatientsPage() {
  const [query, setQuery] = useState("");

  const filtered = MOCK_PATIENTS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Records</p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">Patients</h1>
        <p className="mt-1 text-sm text-muted-foreground">{MOCK_PATIENTS.length} patients seen</p>
      </div>

      <div className="relative mb-6 max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patients…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 hover:bg-accent/30 transition-colors">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {p.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">Born {p.dob} · {p.totalVisits} visit{p.totalVisits > 1 ? "s" : ""}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-muted-foreground">Last seen</p>
              <p className="text-xs font-medium text-foreground">{p.lastSeen}</p>
            </div>
            {p.status === "inactive" && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Inactive
              </span>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No patients match your search.</p>
        )}
      </div>
    </div>
  );
}
