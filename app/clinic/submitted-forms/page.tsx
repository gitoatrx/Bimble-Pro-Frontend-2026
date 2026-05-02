"use client";

import React, { useEffect, useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import {
  fetchClinicDoctorFormPackets,
  type ClinicDoctorFormPacketRecord,
} from "@/lib/api/clinic-dashboard";
import { readClinicLoginSession } from "@/lib/clinic/session";

type SubmittedFormPacket = {
  doctorId: number;
  packetId: number;
  doctorName: string;
  email: string;
  status: string;
  submittedAt: string | null;
  missingFields: string[];
  forms: Array<{
    formCode: string;
    downloadUrl: string;
  }>;
};

function normalizePacket(record: ClinicDoctorFormPacketRecord): SubmittedFormPacket {
  const selectedForms = Array.isArray(record.selected_forms) ? record.selected_forms : [];
  const forms = Array.isArray(record.forms) && record.forms.length > 0
    ? record.forms.map((form) => ({
        formCode: form.form_code,
        downloadUrl: form.download_url,
      }))
    : selectedForms.map((formCode) => ({
        formCode,
        downloadUrl: `${record.download_base_url}/${formCode}/download`,
      }));

  return {
    doctorId: Number(record.doctor_id ?? 0),
    packetId: Number(record.packet_id),
    doctorName: record.doctor_name || "Unknown doctor",
    email: record.email || "",
    status: record.status || "SUBMITTED",
    submittedAt: record.submitted_at || record.generated_at || null,
    missingFields: Array.isArray(record.missing_fields) ? record.missing_fields : [],
    forms,
  };
}

function formatSubmittedAt(value: string | null) {
  if (!value) return "Submitted recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Submitted recently";
  return `Submitted ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function formatFormCode(value: string) {
  return value.replace(/^HLTH_/, "HLTH ").replace(/_/g, " ");
}

function getDoctorGroupKey(packet: SubmittedFormPacket) {
  if (packet.doctorId) return `doctor:${packet.doctorId}`;
  return `doctor:${packet.doctorName}:${packet.email}`;
}

export default function SubmittedFormsPage() {
  const session = readClinicLoginSession();
  const accessToken = session?.accessToken ?? "";
  const hasSession = Boolean(accessToken);
  const [packets, setPackets] = useState<SubmittedFormPacket[]>([]);
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState(
    hasSession ? "" : "You are not logged in. Please sign in again.",
  );

  const groupedPackets = React.useMemo(() => {
    const groups = new Map<
      string,
      {
        doctorId: number;
        doctorName: string;
        email: string;
        packets: SubmittedFormPacket[];
      }
    >();

    for (const packet of packets) {
      const key = getDoctorGroupKey(packet);
      const current = groups.get(key);
      if (current) {
        current.packets.push(packet);
      } else {
        groups.set(key, {
          doctorId: packet.doctorId,
          doctorName: packet.doctorName,
          email: packet.email,
          packets: [packet],
        });
      }
    }

    return Array.from(groups.values()).map((group) => ({
      ...group,
      packets: [...group.packets].sort((a, b) => {
        const left = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const right = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return right - left;
      }),
    }));
  }, [packets]);

  useEffect(() => {
    if (!hasSession) return;

    let active = true;

    fetchClinicDoctorFormPackets(accessToken)
      .then((response) => {
        if (!active) return;
        setPackets(response.items.map(normalizePacket));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load submitted forms.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, hasSession]);

  async function handleDownload(packet: SubmittedFormPacket, form: SubmittedFormPacket["forms"][number]) {
    if (!accessToken || !form.downloadUrl) return;

    try {
      const response = await fetch(form.downloadUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        throw new Error("Could not download the submitted form.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${packet.doctorName || "doctor"}-${form.formCode}.pdf`.replace(/\s+/g, "-");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download the submitted form.");
    }
  }

  async function handleView(form: SubmittedFormPacket["forms"][number]) {
    if (!accessToken || !form.downloadUrl) return;

    const viewer = window.open("", "_blank");
    if (!viewer) {
      setError("Could not open the submitted form. Please allow popups and try again.");
      return;
    }
    viewer.document.title = formatFormCode(form.formCode);

    try {
      const response = await fetch(form.downloadUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        throw new Error("Could not view the submitted form.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      viewer.location.href = url;
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      viewer.close();
      setError(err instanceof Error ? err.message : "Could not view the submitted form.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Clinic records
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Submitted Forms
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Doctor-submitted forms are listed here. MOA forms can be added to this same area later.
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          Loading submitted forms...
        </div>
      ) : groupedPackets.length > 0 ? (
        <div className="space-y-2">
          {groupedPackets.map((group) => (
            <div key={getDoctorGroupKey(group.packets[0])} className="rounded-2xl border border-border bg-card px-5 py-4">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {group.doctorName}
                    </p>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-blue-700">
                      Doctor
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                      {group.packets.length} form{group.packets.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {group.email || "No email"} · {group.packets.length} packet{group.packets.length === 1 ? "" : "s"}
                  </p>

                  <div className="mt-4 space-y-2">
                    {group.packets.map((packet) => (
                      <div
                        key={packet.packetId}
                        className="rounded-xl border border-border/70 bg-background px-4 py-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                                {packet.status}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {formatSubmittedAt(packet.submittedAt)}
                              </p>
                            </div>
                            {packet.missingFields.length > 0 ? (
                              <p className="mt-2 text-xs text-amber-700">
                                Needs review: {packet.missingFields.join(", ")}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {packet.forms.map((form) => (
                              <React.Fragment key={`${packet.packetId}-${form.formCode}`}>
                                <button
                                  type="button"
                                  onClick={() => void handleView(form)}
                                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View {formatFormCode(form.formCode)}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDownload(packet, form)}
                                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </button>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No submitted forms yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Doctor-submitted setup forms will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
