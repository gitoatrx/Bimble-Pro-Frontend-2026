"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, ClipboardList, Loader2, Stethoscope, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { readClinicLoginSession } from "@/lib/clinic/session";
import {
  fetchClinicRequests,
  uploadClinicRequestAttachment,
  updateClinicRequestStatus,
  type ClinicPortalRequest,
} from "@/lib/api/clinic-dashboard";
import { useRealtimeRefresh } from "@/lib/realtime";

function requestLabel(requestType: string) {
  if (requestType === "PRESCRIPTION") return "Prescription";
  if (requestType === "LAB_REPORT") return "Lab report";
  if (requestType === "RESCHEDULE") return "Reschedule";
  return requestType;
}

function requestSupportsDocumentUpload(requestType: string) {
  return requestType === "PRESCRIPTION" || requestType === "LAB_REPORT";
}

function requestIsOpen(status?: string | null) {
  return ["SUBMITTED", "IN_REVIEW"].includes((status || "").trim().toUpperCase());
}

function removeDraft(drafts: Record<number, string>, requestId: number) {
  const nextDrafts = { ...drafts };
  delete nextDrafts[requestId];
  return nextDrafts;
}

function formatSlot(date?: string | null, time?: string | null) {
  if (!date && !time) return "Not available";
  return [date || "Date pending", time || "Time pending"].join(" · ");
}

export default function ClinicRequestsPage() {
  const [requests, setRequests] = useState<ClinicPortalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingKey, setPendingKey] = useState("");
  const [responseDrafts, setResponseDrafts] = useState<Record<number, string>>({});

  const loadRequests = useCallback(async () => {
    const session = readClinicLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetchClinicRequests(session.accessToken);
      const openRequests = (response.requests ?? []).filter((request) => requestIsOpen(request.status));
      setRequests(openRequests);
      setResponseDrafts(
        Object.fromEntries(
          openRequests.map((request) => [request.request_id, request.clinic_response ?? ""]),
        ),
      );
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load clinic requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!cancelled) await loadRequests();
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadRequests]);

  useRealtimeRefresh(loadRequests, {
    paths: ["/requests", "/patient-portal", "/appointments"],
  });

  async function handleUpdateRequest(
    requestId: number,
    status: "IN_REVIEW" | "FULFILLED" | "REJECTED",
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
      setRequests((current) => {
        if (!requestIsOpen(response.request.status)) {
          return current.filter((request) => request.request_id !== requestId);
        }
        return current.map((request) => (request.request_id === requestId ? response.request : request));
      });
      if (!requestIsOpen(response.request.status)) {
        setResponseDrafts((current) => removeDraft(current, requestId));
      }
      setSuccessMessage(
        status === "FULFILLED"
          ? "Request accepted and the patient can now see your update."
          : status === "REJECTED"
            ? "Request rejected and the patient can now see your update."
            : "Request marked in review.",
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to update the request.");
    } finally {
      setPendingKey((current) => (current === actionKey ? "" : current));
    }
  }

  async function handleUploadAttachment(requestId: number, file: File | null) {
    const session = readClinicLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      return;
    }

    if (!file) {
      return;
    }

    const actionKey = `${requestId}:UPLOAD`;
    setPendingKey(actionKey);
    setError("");
    setSuccessMessage("");

    try {
      const response = await uploadClinicRequestAttachment(session.accessToken, requestId, file);
      setRequests((current) => {
        if (!requestIsOpen(response.request.status)) {
          return current.filter((request) => request.request_id !== requestId);
        }
        return current.map((request) => (request.request_id === requestId ? response.request : request));
      });
      if (!requestIsOpen(response.request.status)) {
        setResponseDrafts((current) => removeDraft(current, requestId));
      }
      setSuccessMessage("Document uploaded and the request has been accepted.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to upload the document.");
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
          {requests.map((request) => {
            const canUploadDocument = requestSupportsDocumentUpload(request.request_type);
            const isReschedule = request.request_type === "RESCHEDULE";
            return (
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
                  {isReschedule ? (
                    <div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-slate-700 sm:grid-cols-3">
                      <div className="flex gap-2">
                        <CalendarClock className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Current appointment
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {formatSlot(
                              request.current_appointment_date || request.appointment_date,
                              request.current_appointment_time || request.appointment_time,
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <CalendarClock className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Requested appointment
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {formatSlot(request.requested_appointment_date, request.requested_appointment_time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Stethoscope className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Current doctor
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {request.assigned_doctor_name || "Not assigned"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
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
                      request.request_type === "RESCHEDULE"
                        ? "Add a note about the reschedule update you are sending."
                        : request.request_type === "LAB_REPORT"
                        ? "Add a note about the lab report you are sending."
                        : "Add a note about the prescription you are sending."
                    }
                  />
                </label>

                {canUploadDocument ? (
                  <label className="grid gap-2 text-sm text-slate-700">
                    Upload requested document
                    <input
                      type="file"
                      disabled={pendingKey === `${request.request_id}:UPLOAD`}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-sky-700"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        void handleUploadAttachment(request.request_id, file);
                        event.currentTarget.value = "";
                      }}
                    />
                    {pendingKey === `${request.request_id}:UPLOAD` ? (
                      <span className="inline-flex items-center text-xs text-muted-foreground">
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Uploading document...
                      </span>
                    ) : null}
                  </label>
                ) : null}

                {request.attachment_name ? (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
                    Uploaded document:{" "}
                    {request.attachment_download_url ? (
                      <a
                        href={request.attachment_download_url}
                        className="font-medium underline underline-offset-2"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {request.attachment_name}
                      </a>
                    ) : (
                      request.attachment_name
                    )}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                    disabled={pendingKey === `${request.request_id}:REJECTED`}
                    onClick={() => void handleUpdateRequest(request.request_id, "REJECTED")}
                  >
                    {pendingKey === `${request.request_id}:REJECTED` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Reject request
                  </Button>
                  {isReschedule ? (
                    <Button
                      disabled={pendingKey === `${request.request_id}:FULFILLED`}
                      onClick={() => void handleUpdateRequest(request.request_id, "FULFILLED")}
                    >
                      {pendingKey === `${request.request_id}:FULFILLED` ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Accept reschedule
                    </Button>
                  ) : null}
                </div>

                {request.clinic_response ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Latest clinic response: {request.clinic_response}
                  </div>
                ) : null}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
