"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Loader2, TestTube2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { readClinicLoginSession } from "@/lib/clinic/session";
import {
  fetchClinicRequests,
  updateClinicRequestStatus,
  type ClinicPortalRequest,
} from "@/lib/api/clinic-dashboard";

function requestLabel(requestType: string) {
  if (requestType === "PRESCRIPTION") return "Prescription";
  if (requestType === "LAB_REPORT") return "Lab report";
  if (requestType === "RESCHEDULE") return "Reschedule";
  return requestType;
}

export default function ClinicRequestsPage() {
  const [requests, setRequests] = useState<ClinicPortalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingKey, setPendingKey] = useState("");
  const [responseDrafts, setResponseDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const session = readClinicLoginSession();
      if (!session?.accessToken) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetchClinicRequests(session.accessToken);
        if (!cancelled) {
          setRequests(response.requests ?? []);
          setResponseDrafts(
            Object.fromEntries(
              (response.requests ?? []).map((request) => [request.request_id, request.clinic_response ?? ""]),
            ),
          );
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load clinic requests.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpdateRequest(
    requestId: number,
    status: "IN_REVIEW" | "FULFILLED",
  ) {
    const session = readClinicLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      return;
    }

    const actionKey = `${requestId}:${status}`;
    setPendingKey(actionKey);
    setError("");
    setSuccessMessage("");

    try {
      const response = await updateClinicRequestStatus(session.accessToken, requestId, {
        status,
        clinicResponse: responseDrafts[requestId]?.trim() || undefined,
      });
      setRequests((current) =>
        current.map((request) => (request.request_id === requestId ? response.request : request)),
      );
      setSuccessMessage(
        status === "FULFILLED"
          ? "Request marked fulfilled and the patient can now see your update."
          : "Request marked in review.",
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update the request.");
    } finally {
      setPendingKey((current) => (current === actionKey ? "" : current));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Clinic requests
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Patient requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Prescription and lab report requests from patients treated by your clinic appear here.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Loading requests...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <ClipboardList className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No patient requests yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Requests for prescriptions and lab reports will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}
          {requests.map((request) => (
            <div key={request.request_id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-foreground">{request.patient_name}</div>
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                      {requestLabel(request.request_type)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                      {request.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {request.chief_complaint || request.service_name || "Patient follow-up request"}
                  </div>
                  {(request.appointment_date || request.appointment_time) ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {request.appointment_date || "Date pending"}
                      {request.appointment_time ? ` · ${request.appointment_time}` : ""}
                    </div>
                  ) : null}
                  {request.patient_message ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      Patient note: {request.patient_message}
                    </div>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  {request.created_at ? new Date(request.created_at).toLocaleString() : "Date unavailable"}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-2 text-sm text-slate-700">
                  Clinic response
                  <Textarea
                    value={responseDrafts[request.request_id] ?? ""}
                    onChange={(event) =>
                      setResponseDrafts((current) => ({
                        ...current,
                        [request.request_id]: event.target.value,
                      }))
                    }
                    placeholder={
                      request.request_type === "LAB_REPORT"
                        ? "Add a note about the lab report you are sending."
                        : "Add a note about the prescription you are sending."
                    }
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={pendingKey === `${request.request_id}:IN_REVIEW`}
                    onClick={() => void handleUpdateRequest(request.request_id, "IN_REVIEW")}
                  >
                    {pendingKey === `${request.request_id}:IN_REVIEW` ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube2 className="mr-2 h-4 w-4" />
                    )}
                    Mark in review
                  </Button>
                  <Button
                    disabled={pendingKey === `${request.request_id}:FULFILLED`}
                    onClick={() => void handleUpdateRequest(request.request_id, "FULFILLED")}
                  >
                    {pendingKey === `${request.request_id}:FULFILLED` ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Mark fulfilled
                  </Button>
                </div>

                {request.clinic_response ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Latest clinic response: {request.clinic_response}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
