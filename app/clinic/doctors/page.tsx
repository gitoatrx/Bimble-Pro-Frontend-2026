"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  Eye,
  Mail,
  MoreVertical,
  Plus,
  RotateCcw,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { doctorStatusLabel } from "@/lib/doctor/types";
import { readClinicLoginSession } from "@/lib/clinic/session";
import { SignaturePad } from "@/components/doctor/doctor-form-shared";
import { formatCanadaPacificDateKey, formatCanadaPacificDateTime } from "@/lib/time-zone";
import {
  deleteClinicDoctorInvite,
  fetchClinicDoctor,
  fetchClinicDoctorInvitePrefill,
  fetchClinicDoctors,
  fetchClinicDoctorInvites,
  inviteClinicDoctor,
  updateClinicDoctorStatus,
  resendClinicDoctorInvite,
} from "@/lib/api/clinic-dashboard";

type DoctorStatus = "ACTIVE" | "ON_LEAVE" | "INACTIVE";

type Doctor = {
  id: number;
  name: string;
  email: string;
  specialty: string;
  status: DoctorStatus;
  membership: string;
};

type DoctorDetailsRecord = Record<string, unknown> & {
  doctor?: Record<string, unknown>;
  platform_account?: Record<string, unknown>;
  membership?: Record<string, unknown>;
  summary?: Record<string, unknown>;
  setup_profile?: Record<string, unknown>;
};

type PendingInvite = {
  inviteId: number;
  email: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  sentAt: string;
};

const STATUS_COLORS: Record<DoctorStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ON_LEAVE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  INACTIVE: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

function normalizeDoctorStatus(value: unknown): DoctorStatus {
  const raw = typeof value === "string" ? value.toUpperCase() : "";
  if (raw === "ON_LEAVE" || raw === "INACTIVE") return raw;
  return "ACTIVE";
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function firstBoolean(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const raw = value.trim().toLowerCase();
      if (raw === "true") return true;
      if (raw === "false") return false;
    }
  }

  return null;
}

function formatDateTime(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "—";
  }

  return formatCanadaPacificDateTime(value);
}

function formatDateOnly(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "—";
  }

  return formatCanadaPacificDateKey(value, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toDoctor(record: Record<string, unknown>): Doctor {
  const id = Number(record.id ?? record.doctor_id ?? record.user_id ?? Date.now());

  return {
    id,
    name:
      (typeof record.name === "string" && record.name) ||
      (typeof record.doctor_name === "string" && record.doctor_name) ||
      (typeof record.full_name === "string" && record.full_name) ||
      "Unknown doctor",
    email:
      (typeof record.email === "string" && record.email) ||
      (typeof record.doctor_email === "string" && record.doctor_email) ||
      "",
    specialty:
      (typeof record.specialty === "string" && record.specialty) ||
      (typeof record.field === "string" && record.field) ||
      "General Practice",
    status: normalizeDoctorStatus(record.status ?? record.doctor_status),
    membership:
      (typeof record.membership === "string" && record.membership) ||
      (typeof record.clinic_membership === "string" && record.clinic_membership) ||
      "Member",
  };
}

function normalizeDoctorDetails(record: Record<string, unknown>): DoctorDetailsRecord {
  return record as DoctorDetailsRecord;
}

function toInvite(record: Record<string, unknown>): PendingInvite {
  const rawStatus =
    typeof record.status === "string"
      ? record.status.toUpperCase()
      : "PENDING";

  return {
    inviteId: Number(record.invite_id ?? record.id ?? Date.now()),
    email:
      (typeof record.email === "string" && record.email) ||
      (typeof record.doctor_email === "string" && record.doctor_email) ||
      "unknown@example.com",
    status:
      rawStatus === "ACCEPTED" || rawStatus === "EXPIRED" || rawStatus === "REVOKED"
        ? rawStatus
        : "PENDING",
    sentAt:
      (typeof record.sent_at === "string" && record.sent_at) ||
      (typeof record.created_at === "string" && record.created_at) ||
      "",
  };
}

function InviteForm({ onInvite }: { onInvite: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [showClinicPaidDraft, setShowClinicPaidDraft] = useState(false);
  const [showFacilityAttachmentDraft, setShowFacilityAttachmentDraft] = useState(false);
  const [clinicPaidDraft, setClinicPaidDraft] = useState({
    locum_name: "",
    locum_practitioner_number: "",
    msp_billing_number: "",
    principal_practitioner_name: "",
    principal_practitioner_number: "",
    principal_practitioner_payment_number: "",
    effective_date: "",
    cancel_date: "",
    date_signed: "",
    pay_signature_data_url: "",
    pay_signature_label: "",
  });
  const [facilityDraft, setFacilityDraft] = useState({
    attachment_action: "ADD",
    msp_practitioner_number: "",
    facility_or_practice_name: "",
    msp_facility_number: "",
    facility_physical_address: "",
    facility_physical_city: "",
    facility_physical_postal_code: "",
    contact_email: "",
    contact_phone_number: "",
    contact_fax_number: "",
    new_attachment_effective_date: "",
    new_attachment_cancellation_date: "",
    attachment_cancellation_date: "",
    change_attachment_effective_date: "",
    change_attachment_cancellation_date: "",
    confirm_declarations: false,
  });
  const [sending, setSending] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillLoadedFor, setPrefillLoadedFor] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handlePrefillLookup(nextEmail?: string) {
    const trimmed = (nextEmail ?? email).trim().toLowerCase();
    if (!trimmed.includes("@")) return;

    const session = readClinicLoginSession();
    if (!session?.accessToken) return;
    if (prefillLoadedFor === trimmed) return;

    setPrefillLoading(true);
    setError("");
    try {
      const prefill = await fetchClinicDoctorInvitePrefill(session.accessToken, trimmed);
      if (prefill.form_drafts?.HLTH_2870) {
        setClinicPaidDraft((current) => ({
          ...current,
          ...prefill.form_drafts.HLTH_2870,
          pay_signature_label:
            prefill.form_drafts.HLTH_2870.pay_signature_label ||
            current.pay_signature_label,
          pay_signature_data_url:
            prefill.form_drafts.HLTH_2870.pay_signature_data_url ||
            current.pay_signature_data_url,
        }));
      }
      if (prefill.form_drafts?.HLTH_2950) {
        setFacilityDraft((current) => ({
          ...current,
          ...prefill.form_drafts.HLTH_2950,
          attachment_action:
            prefill.form_drafts.HLTH_2950.attachment_action || current.attachment_action,
          confirm_declarations:
            typeof prefill.form_drafts.HLTH_2950.confirm_declarations === "boolean"
              ? prefill.form_drafts.HLTH_2950.confirm_declarations
              : current.confirm_declarations,
        }));
      }
      if (prefill.existing_doctor) {
        setShowClinicPaidDraft(true);
        setShowFacilityAttachmentDraft(true);
      }
      setPrefillLoadedFor(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prefill doctor draft.");
    } finally {
      setPrefillLoading(false);
    }
  }

  function buildFormDrafts() {
    const drafts: Record<string, Record<string, unknown>> = {};

    if (
      showClinicPaidDraft &&
      Object.entries(clinicPaidDraft).some(([key, value]) => {
        if (key === "pay_signature_data_url" || key === "pay_signature_label") {
          return String(value).trim() !== "";
        }
        return String(value).trim() !== "";
      })
    ) {
      drafts.HLTH_2870 = Object.fromEntries(
        Object.entries(clinicPaidDraft).filter(([, value]) => String(value).trim() !== ""),
      );
    }

    if (showFacilityAttachmentDraft) {
      const filtered = Object.fromEntries(
        Object.entries(facilityDraft).filter(([key, value]) => {
          if (typeof value === "boolean") {
            return value;
          }
          if (key === "attachment_action") {
            return true;
          }
          return String(value).trim() !== "";
        }),
      );
      if (Object.keys(filtered).length > 1 || Boolean(filtered.confirm_declarations)) {
        drafts.HLTH_2950 = filtered;
      }
    }

    return Object.keys(drafts).length > 0 ? drafts : undefined;
  }

  async function handleInvite() {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    const session = readClinicLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in. Please refresh and try again.");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      await inviteClinicDoctor(session.accessToken, {
        email: trimmed,
        form_drafts: buildFormDrafts(),
      });
      onInvite(trimmed);
      setEmail("");
      setShowClinicPaidDraft(false);
      setShowFacilityAttachmentDraft(false);
      setClinicPaidDraft({
        locum_name: "",
        locum_practitioner_number: "",
        msp_billing_number: "",
        principal_practitioner_name: "",
        principal_practitioner_number: "",
        principal_practitioner_payment_number: "",
        effective_date: "",
        cancel_date: "",
        date_signed: "",
        pay_signature_data_url: "",
        pay_signature_label: "",
      });
      setFacilityDraft({
        attachment_action: "ADD",
        msp_practitioner_number: "",
        facility_or_practice_name: "",
        msp_facility_number: "",
        facility_physical_address: "",
        facility_physical_city: "",
        facility_physical_postal_code: "",
        contact_email: "",
        contact_phone_number: "",
        contact_fax_number: "",
        new_attachment_effective_date: "",
        new_attachment_cancellation_date: "",
        attachment_cancellation_date: "",
        change_attachment_effective_date: "",
        change_attachment_cancellation_date: "",
        confirm_declarations: false,
      });
      setPrefillLoadedFor("");
      setSuccess(`Invite sent to ${trimmed}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Plus className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Invite a doctor</p>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Enter their email address. They&apos;ll receive an invite if they do not already have a Bimble account.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="doctor@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setPrefillLoadedFor("");
            setError("");
          }}
          onBlur={() => void handlePrefillLookup()}
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          className={cn("max-w-xs", error && "!border-destructive")}
        />
        <Button onClick={handleInvite} disabled={sending || !email.trim()} size="sm">
          {sending ? "Sending…" : "Send invite"}
        </Button>
      </div>
      {prefillLoading ? (
        <p className="mt-2 text-xs text-muted-foreground">Checking for existing doctor details…</p>
      ) : null}

      <div className="mt-4 space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Optional doctor form prefills</p>
          <p className="text-xs text-muted-foreground">
            Clinic can prefill these drafts before sending the invite, or skip them entirely.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white p-3">
          <button
            type="button"
            onClick={() => setShowClinicPaidDraft((current) => !current)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">HLTH 2870</p>
              <p className="text-xs text-muted-foreground">Clinic-paid assignment draft</p>
            </div>
            {showClinicPaidDraft ? <X className="h-4 w-4 text-muted-foreground" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showClinicPaidDraft ? (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Locum name"
                  value={clinicPaidDraft.locum_name}
                  onChange={(e) => setClinicPaidDraft((current) => ({ ...current, locum_name: e.target.value }))}
                />
                <Input
                  placeholder="Locum practitioner number"
                  value={clinicPaidDraft.locum_practitioner_number}
                  onChange={(e) => setClinicPaidDraft((current) => ({ ...current, locum_practitioner_number: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="MSP billing number"
                value={clinicPaidDraft.msp_billing_number}
                onChange={(e) => setClinicPaidDraft((current) => ({ ...current, msp_billing_number: e.target.value }))}
              />
              <Input
                placeholder="Principal practitioner name"
                value={clinicPaidDraft.principal_practitioner_name}
                onChange={(e) => setClinicPaidDraft((current) => ({ ...current, principal_practitioner_name: e.target.value }))}
              />
              <Input
                placeholder="Principal practitioner number"
                value={clinicPaidDraft.principal_practitioner_number}
                onChange={(e) => setClinicPaidDraft((current) => ({ ...current, principal_practitioner_number: e.target.value }))}
              />
              <Input
                placeholder="Principal practitioner payment number"
                value={clinicPaidDraft.principal_practitioner_payment_number}
                onChange={(e) => setClinicPaidDraft((current) => ({ ...current, principal_practitioner_payment_number: e.target.value }))}
              />
              <Input
                type="date"
                placeholder="Effective date"
                value={clinicPaidDraft.effective_date}
                onChange={(e) => setClinicPaidDraft((current) => ({ ...current, effective_date: e.target.value }))}
              />
              <Input
                type="date"
                placeholder="Cancel date"
                value={clinicPaidDraft.cancel_date}
                onChange={(e) => setClinicPaidDraft((current) => ({ ...current, cancel_date: e.target.value }))}
              />
              <Input
                type="date"
                placeholder="Date signed"
                value={clinicPaidDraft.date_signed}
                onChange={(e) => setClinicPaidDraft((current) => ({ ...current, date_signed: e.target.value }))}
              />
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Clinic signatory name"
                  value={clinicPaidDraft.pay_signature_label}
                  onChange={(e) => setClinicPaidDraft((current) => ({ ...current, pay_signature_label: e.target.value }))}
                />
                <SignaturePad
                  value={clinicPaidDraft.pay_signature_data_url}
                  onChange={(value) =>
                    setClinicPaidDraft((current) => ({
                      ...current,
                      pay_signature_data_url: value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Clinic completes the form and signs as pay/signatory here. The doctor will later add only locum and witness signatures on their side.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-white p-3">
          <button
            type="button"
            onClick={() => setShowFacilityAttachmentDraft((current) => !current)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">HLTH 2950</p>
              <p className="text-xs text-muted-foreground">Facility attachment draft</p>
            </div>
            {showFacilityAttachmentDraft ? <X className="h-4 w-4 text-muted-foreground" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showFacilityAttachmentDraft ? (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={facilityDraft.attachment_action}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, attachment_action: e.target.value }))}
                  className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ADD">Add attachment</option>
                  <option value="CANCEL">Cancel attachment</option>
                  <option value="CHANGE">Change attachment</option>
                </select>
                <Input
                  placeholder="MSP practitioner number"
                  value={facilityDraft.msp_practitioner_number}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, msp_practitioner_number: e.target.value }))}
                />
                <Input
                  placeholder="Facility or practice name"
                  value={facilityDraft.facility_or_practice_name}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, facility_or_practice_name: e.target.value }))}
                />
                <Input
                  placeholder="MSP facility number"
                  value={facilityDraft.msp_facility_number}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, msp_facility_number: e.target.value }))}
                />
                <Input
                  placeholder="Physical address"
                  value={facilityDraft.facility_physical_address}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, facility_physical_address: e.target.value }))}
                />
                <Input
                  placeholder="Physical city"
                  value={facilityDraft.facility_physical_city}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, facility_physical_city: e.target.value }))}
                />
                <Input
                  placeholder="Physical postal code"
                  value={facilityDraft.facility_physical_postal_code}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, facility_physical_postal_code: e.target.value }))}
                />
                <Input
                  placeholder="Contact email"
                  value={facilityDraft.contact_email}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, contact_email: e.target.value }))}
                />
                <Input
                  placeholder="Contact phone number"
                  value={facilityDraft.contact_phone_number}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, contact_phone_number: e.target.value }))}
                />
                <Input
                  placeholder="Contact fax number"
                  value={facilityDraft.contact_fax_number}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, contact_fax_number: e.target.value }))}
                />
              </div>

              {facilityDraft.attachment_action === "ADD" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    type="date"
                    placeholder="New attachment effective date"
                    value={facilityDraft.new_attachment_effective_date}
                    onChange={(e) => setFacilityDraft((current) => ({ ...current, new_attachment_effective_date: e.target.value }))}
                  />
                  <Input
                    type="date"
                    placeholder="New attachment cancellation date"
                    value={facilityDraft.new_attachment_cancellation_date}
                    onChange={(e) => setFacilityDraft((current) => ({ ...current, new_attachment_cancellation_date: e.target.value }))}
                  />
                </div>
              ) : null}

              {facilityDraft.attachment_action === "CANCEL" ? (
                <Input
                  type="date"
                  placeholder="Attachment cancellation date"
                  value={facilityDraft.attachment_cancellation_date}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, attachment_cancellation_date: e.target.value }))}
                />
              ) : null}

              {facilityDraft.attachment_action === "CHANGE" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    type="date"
                    placeholder="Change attachment effective date"
                    value={facilityDraft.change_attachment_effective_date}
                    onChange={(e) => setFacilityDraft((current) => ({ ...current, change_attachment_effective_date: e.target.value }))}
                  />
                  <Input
                    type="date"
                    placeholder="Change attachment cancellation date"
                    value={facilityDraft.change_attachment_cancellation_date}
                    onChange={(e) => setFacilityDraft((current) => ({ ...current, change_attachment_cancellation_date: e.target.value }))}
                  />
                </div>
              ) : null}

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={facilityDraft.confirm_declarations}
                  onChange={(e) => setFacilityDraft((current) => ({ ...current, confirm_declarations: e.target.checked }))}
                />
                Confirm facility attachment declarations
              </label>
            </div>
          ) : null}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-600">{success}</p>}
    </div>
  );
}

function InviteRow({
  invite,
  onDelete,
  onResend,
  showActions = true,
}: {
  invite: PendingInvite;
  onDelete: (inviteId: number) => void;
  onResend: (inviteId: number) => void;
  showActions?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-5 py-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Mail className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{invite.email}</p>
        <p className="text-xs text-muted-foreground">
          {invite.sentAt ? `Invited ${invite.sentAt}` : "Pending invite"}
        </p>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <Clock className="h-3 w-3" />
        {invite.status === "ACCEPTED" ? "Accepted" : "Awaiting"}
      </span>
      {showActions && (
        <>
          <button
            onClick={() => onResend(invite.inviteId)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Resend invite"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(invite.inviteId)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
            title="Cancel invite"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

function DoctorRow({
  doctor,
  onProfile,
  onDeactivate,
}: {
  doctor: Doctor;
  onProfile: (doctor: Doctor) => void;
  onDeactivate: (id: number) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/25 hover:bg-accent/25">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {doctor.name.split(" ").pop()?.charAt(0) ?? "D"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{doctor.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {doctor.specialty} {doctor.email ? `· ${doctor.email}` : ""}
        </p>
      </div>

      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          STATUS_COLORS[doctor.status],
        )}
      >
        {doctorStatusLabel(doctor.status)}
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-xl border border-border bg-card p-1 shadow-xl">
            <button
              type="button"
              onClick={() => {
                onProfile(doctor);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent"
            >
              <Eye className="h-3.5 w-3.5" />
              Profile
            </button>
            {doctor.status !== "INACTIVE" && (
              <button
                type="button"
                onClick={() => {
                  onDeactivate(doctor.id);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <UserMinus className="h-3.5 w-3.5" />
                Deactivate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorProfileModal({
  summary,
  doctor,
  loading,
  onClose,
}: {
  summary: Doctor | null;
  doctor: DoctorDetailsRecord | null;
  loading: boolean;
  onClose: () => void;
}) {
  const doctorInfo = doctor?.doctor ?? null;
  const membership = doctor?.membership ?? null;
  const platformAccount = doctor?.platform_account ?? null;
  const detailsSummary = doctor?.summary ?? null;
  const setupProfile = (doctor?.setup_profile as Record<string, unknown> | undefined) ?? null;
  const identity = (setupProfile?.identity as Record<string, unknown> | undefined) ?? null;
  const businessContact = (setupProfile?.business_contact as Record<string, unknown> | undefined) ?? null;
  const payment = (setupProfile?.payment as Record<string, unknown> | undefined) ?? null;
  const education = (setupProfile?.education as Record<string, unknown> | undefined) ?? null;
  const meta = (setupProfile?.meta as Record<string, unknown> | undefined) ?? null;
  const teleplan = (setupProfile?.teleplan as Record<string, unknown> | undefined) ?? null;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!summary && !doctor && !loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close doctor profile"
        className="absolute inset-0 cursor-pointer bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="bg-white px-6 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">
                Doctor profile
              </p>
              <h2 className="mt-0.5 truncate text-base font-semibold tracking-tight text-slate-900">
                {firstString(
                  summary?.name,
                  doctorInfo?.name,
                  doctorInfo?.first_name,
                  platformAccount?.first_name,
                  "Doctor profile",
                ) || "Doctor profile"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

        </div>

        <div className="max-h-[72vh] overflow-y-auto bg-white px-6 py-4">
          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
              Loading doctor profile...
            </div>
          ) : doctor || summary ? (
            <div className="space-y-6">
              <section>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SimpleField label="Name" value={firstString(summary?.name, doctorInfo?.name, "—")} />
                  <SimpleField label="Specialty" value={firstString(summary?.specialty, doctorInfo?.specialty, "—")} />
                  <SimpleField
                    label="Status"
                    value={doctorStatusLabel(
                      normalizeDoctorStatus(summary?.status ?? doctorInfo?.status),
                    )}
                  />
                  <SimpleField
                    label="Accepts pool"
                    value={firstBoolean(doctorInfo?.accepts_pool) === true || summary?.status === "ACTIVE" ? "Yes" : "No"}
                  />
                  <SimpleField label="Email" value={firstString(summary?.email, doctorInfo?.email, "—")} />
                  <SimpleField label="Clinic" value={firstString(membership?.clinic_name, "—")} />
                </div>
              </section>

              {doctor && (
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Membership
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SimpleField label="Clinic name" value={firstString(membership?.clinic_name, "—")} />
                    <SimpleField label="Clinic slug" value={firstString(membership?.clinic_slug, "—")} />
                    <SimpleField
                      label="Membership status"
                      value={firstString(membership?.membership_status, membership?.status, "—")}
                    />
                    <SimpleField label="Joined" value={formatDateTime(membership?.joined_at)} />
                  </div>
                </section>
              )}

              {platformAccount && (
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Platform account
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SimpleField label="Username" value={firstString(platformAccount?.username, "—")} />
                    <SimpleField label="Email" value={firstString(platformAccount?.email, "—")} />
                    <SimpleField label="Record status" value={firstString(platformAccount?.record_status, "—")} />
                    <SimpleField label="Created" value={formatDateTime(platformAccount?.created_at)} />
                  </div>
                </section>
              )}

              {detailsSummary && (
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Summary
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SimpleField
                      label="Availability"
                      value={String(firstNumber(detailsSummary?.availability_count) ?? 0)}
                    />
                    <SimpleField
                      label="Service mappings"
                      value={String(firstNumber(detailsSummary?.active_service_mapping_count) ?? 0)}
                    />
                    <SimpleField
                      label="Setup completed"
                      value={firstBoolean(detailsSummary?.setup_completed) === true ? "Yes" : "No"}
                    />
                    <SimpleField
                      label="Signature"
                      value={firstBoolean(detailsSummary?.has_signature) === true ? "Captured" : "Missing"}
                    />
                  </div>
                </section>
              )}

              {(identity || businessContact || payment || education || meta || teleplan) && (
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Setup profile
                  </h3>
                  <div className="space-y-5">
                    {identity && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Identity
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <SimpleField
                            label="Name"
                            value={
                              [
                                firstString(identity.first_name),
                                firstString(identity.middle_name),
                                firstString(identity.last_name),
                              ]
                                .filter((part) => part && part !== "—")
                                .join(" ") || "—"
                            }
                          />
                          <SimpleField label="Date of birth" value={formatDateOnly(identity.date_of_birth)} />
                          <SimpleField label="Gender" value={firstString(identity.gender, "—")} />
                          <SimpleField label="License type" value={firstString(identity.license_type, "—")} />
                          <SimpleField label="License effective" value={formatDateOnly(identity.license_effective_date)} />
                          <SimpleField label="MSP billing" value={firstString(identity.msp_billing_number, "—")} />
                        </div>
                      </div>
                    )}

                    {businessContact && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Business contact
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <SimpleField label="Phone" value={firstString(businessContact.phone_number, "—")} />
                          <SimpleField label="Email" value={firstString(businessContact.email, "—")} />
                          <SimpleField label="City" value={firstString(businessContact.city, "—")} />
                          <SimpleField label="Province" value={firstString(businessContact.province, "—")} />
                          <SimpleField label="Postal code" value={firstString(businessContact.postal_code, "—")} />
                          <SimpleField label="Mailing address" value={firstString(businessContact.mailing_address, "—")} />
                        </div>
                      </div>
                    )}

                    {payment && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Payment
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <SimpleField label="Payee" value={firstString(payment.payee_name, "—")} />
                          <SimpleField label="Payment number" value={firstString(payment.payment_number, "—")} />
                          <SimpleField label="Bank" value={firstString(payment.bank_name, "—")} />
                          <SimpleField label="Branch" value={firstString(payment.bank_branch_name, "—")} />
                          <SimpleField label="Direction" value={firstString(payment.payment_direction, "—")} />
                          <SimpleField label="Principal practitioner" value={firstString(payment.principal_practitioner_name, "—")} />
                        </div>
                      </div>
                    )}

                    {education && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Education
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <SimpleField label="Medical school" value={firstString(education.medical_school, "—")} />
                          <SimpleField label="Graduation" value={formatDateOnly(education.date_of_graduation)} />
                          <SimpleField label="Royal specialty" value={firstString(education.royal_college_specialty, "—")} />
                          <SimpleField label="Royal subspecialty" value={firstString(education.royal_college_subspecialty, "—")} />
                          <SimpleField label="Non-royal specialty" value={firstString(education.non_royal_college_specialty, "—")} />
                          <SimpleField
                            label="Certifications"
                            value={
                              Array.isArray(education.certification_dates)
                                ? education.certification_dates.filter((value: unknown) => typeof value === "string").join(", ")
                                : "—"
                            }
                          />
                        </div>
                      </div>
                    )}

                    {meta && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Meta
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <SimpleField label="Facility attachment" value={firstBoolean(meta.facility_attachment_required) === true ? "Yes" : "No"} />
                          <SimpleField label="MSP enrolment" value={firstBoolean(meta.msp_enrolment_required) === true ? "Yes" : "No"} />
                          <SimpleField label="Payment choice" value={firstString(meta.payment_choice, "—")} />
                          <SimpleField label="Updated from" value={firstString(meta.updated_from, "—")} />
                        </div>
                      </div>
                    )}

                    {teleplan && Object.keys(teleplan).length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Teleplan
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {Object.entries(teleplan).map(([key, value]) => (
                            <SimpleField
                              key={key}
                              label={key.replaceAll("_", " ")}
                              value={typeof value === "string" ? value : JSON.stringify(value)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SimpleField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

export default function DoctorsPage() {
  const session = readClinicLoginSession();
  const accessToken = session?.accessToken ?? "";
  const hasSession = Boolean(session?.accessToken);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [profileDoctorId, setProfileDoctorId] = useState<number | null>(null);
  const [profileSummary, setProfileSummary] = useState<Doctor | null>(null);
  const [profileDoctor, setProfileDoctor] = useState<DoctorDetailsRecord | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const seatLimit = 5;
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState(
    hasSession ? "" : "You are not logged in. Please sign in again.",
  );

  useEffect(() => {
    if (!hasSession) {
      return;
    }

    let active = true;

    Promise.all([
      fetchClinicDoctors(accessToken),
      fetchClinicDoctorInvites(accessToken),
    ])
      .then(([doctorRecords, inviteRecords]) => {
        if (!active) return;

        const doctorList = (doctorRecords as Record<string, unknown>[]).map(toDoctor);
        const inviteList = (inviteRecords as Record<string, unknown>[]).map(toInvite);

        setDoctors(doctorList);
        setInvites(inviteList);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load doctors.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, hasSession]);

  const activeCount = doctors.filter((d) => d.status === "ACTIVE").length;
  const seatsUsed = doctors.filter((d) => d.status !== "INACTIVE").length;
  const pendingInvites = invites.filter((invite) => invite.status === "PENDING");
  const acceptedInvites = invites.filter((invite) => invite.status === "ACCEPTED");
  const inactiveDoctors = doctors.filter((d) => d.status === "INACTIVE");

  function handleInvite(email: string) {
    setInvites((current) => {
      const exists = current.find((item) => item.email === email);
      if (exists) {
        return current.map((item) => (item.email === email ? { ...item, status: "PENDING" } : item));
      }
      return [
        ...current,
        { inviteId: Date.now(), email, status: "PENDING", sentAt: new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) },
      ];
    });
  }

  async function handleOpenProfile(doctor: Doctor) {
    const session = readClinicLoginSession();
    if (!session?.accessToken) return;

    setProfileDoctorId(doctor.id);
    setProfileSummary(doctor);
    setProfileDoctor(null);
    setProfileLoading(true);

    try {
      const record = await fetchClinicDoctor(session.accessToken, doctor.id);
      setProfileDoctor(normalizeDoctorDetails(record as Record<string, unknown>));
    } catch {
      setProfileDoctor(null);
    } finally {
      setProfileLoading(false);
    }
  }

  function handleCloseProfile() {
    setProfileDoctorId(null);
    setProfileSummary(null);
    setProfileDoctor(null);
    setProfileLoading(false);
  }

  async function handleDeactivate(id: number) {
    const session = readClinicLoginSession();
    if (!session?.accessToken) return;

    try {
      await updateClinicDoctorStatus(session.accessToken, id, "INACTIVE");
      setDoctors((current) =>
        current.map((doctor) => (doctor.id === id ? { ...doctor, status: "INACTIVE" } : doctor)),
      );
      if (profileDoctorId === id) {
        setProfileDoctor((current) =>
          current
            ? {
                ...current,
                doctor: {
                  ...(current.doctor ?? {}),
                  status: "INACTIVE",
                },
              }
            : current,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deactivate the doctor.");
    }
  }

  async function handleDeleteInvite(inviteId: number) {
    const session = readClinicLoginSession();
    if (!session?.accessToken) return;

    try {
      await deleteClinicDoctorInvite(session.accessToken, inviteId);
      setInvites((current) => current.filter((invite) => invite.inviteId !== inviteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel the invite.");
    }
  }

  async function handleResendInvite(inviteId: number) {
    const session = readClinicLoginSession();
    if (!session?.accessToken) return;

    try {
      await resendClinicDoctorInvite(session.accessToken, inviteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the invite.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Team
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
            Doctors
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading doctors..." : `${activeCount} active · ${seatsUsed} of ${seatLimit} seats used`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="mb-6 rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Seats used</span>
              <span className="font-semibold text-foreground">
                {seatsUsed} / {seatLimit}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  seatsUsed >= seatLimit ? "bg-rose-500" : "bg-primary",
                )}
                style={{ width: `${Math.min((seatsUsed / seatLimit) * 100, 100)}%` }}
              />
            </div>
            {seatsUsed >= seatLimit && (
              <p className="mt-2 text-xs text-rose-600">
                You&apos;ve used all your seats. Upgrade your plan to add more doctors.
              </p>
            )}
          </div>

          {!loading && doctors.filter((d) => d.status !== "INACTIVE").length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Active team
              </h2>
              <div className="space-y-2">
                {doctors
                  .filter((d) => d.status !== "INACTIVE")
                  .map((doctor) => (
                    <DoctorRow
                      key={doctor.id}
                      doctor={doctor}
                      onProfile={handleOpenProfile}
                      onDeactivate={handleDeactivate}
                    />
                  ))}
              </div>
            </section>
          )}

          {pendingInvites.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Pending invites
              </h2>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <InviteRow
                    key={invite.inviteId}
                    invite={invite}
                    onDelete={handleDeleteInvite}
                    onResend={handleResendInvite}
                  />
                ))}
              </div>
            </section>
          )}

          {acceptedInvites.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Accepted invites
              </h2>
              <div className="space-y-2">
                {acceptedInvites.map((invite) => (
                  <InviteRow
                    key={invite.inviteId}
                    invite={invite}
                    onDelete={handleDeleteInvite}
                    onResend={handleResendInvite}
                    showActions={false}
                  />
                ))}
              </div>
            </section>
          )}

          <InviteForm onInvite={handleInvite} />

          {inactiveDoctors.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Deactivated
              </h2>
              <div className="space-y-2 opacity-50">
                {inactiveDoctors.map((doctor) => (
                  <DoctorRow
                    key={doctor.id}
                    doctor={doctor}
                    onProfile={handleOpenProfile}
                    onDeactivate={handleDeactivate}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {profileDoctorId !== null && (
        <DoctorProfileModal
          summary={profileSummary}
          doctor={profileDoctor}
          loading={profileLoading}
          onClose={handleCloseProfile}
        />
      )}
    </div>
  );
}
