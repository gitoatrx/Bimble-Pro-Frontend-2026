"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  FileClock,
  HeartPulse,
  LoaderCircle,
  LogOut,
  NotebookPen,
  Users,
} from "lucide-react";
import { CanadianTime } from "@/components/canadian-time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createPatientFamilyMember,
  deletePatientFamilyMember,
  fetchPatientAppointments,
  fetchPatientFamilyMembers,
  fetchPatientProfile,
  fetchPatientRequests,
  updatePatientProfile,
} from "@/lib/api/patient";
import { clearPatientLoginSession, readPatientLoginSession } from "@/lib/patient/session";
import type {
  PatientFamilyMember,
  PatientLoginSession,
  PatientPortalAppointmentsPayload,
  PatientPortalRequest,
  PatientProfile,
} from "@/lib/patient/types";

type ProfileDraft = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
};

const emptyProfileDraft: ProfileDraft = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  province: "",
  postal_code: "",
};

const emptyFamilyForm = {
  first_name: "",
  last_name: "",
  relationship_label: "",
  date_of_birth: "",
  phone: "",
  email: "",
  phn: "",
  notes: "",
};

type PortalNavItem = {
  id: "profile" | "appointments" | "history" | "requests" | "family";
  label: string;
  description: string;
  icon: React.ReactNode;
};

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-border/70 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          {icon}
        </div>
        <div>
          <h2 className="text-[17px] font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SmallPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3 text-slate-500">
        <span className="text-xs font-medium uppercase tracking-[0.16em]">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
    </div>
  );
}

export function PatientPortalDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<PatientLoginSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeSection, setActiveSection] = useState<PortalNavItem["id"]>("profile");

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<PatientPortalAppointmentsPayload | null>(null);
  const [requests, setRequests] = useState<PatientPortalRequest[]>([]);
  const [familyMembers, setFamilyMembers] = useState<PatientFamilyMember[]>([]);

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [profileMessage, setProfileMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [familyForm, setFamilyForm] = useState(emptyFamilyForm);
  const [familyMessage, setFamilyMessage] = useState("");
  const [isSavingFamily, setIsSavingFamily] = useState(false);

  const navigation: PortalNavItem[] = [
    {
      id: "profile",
      label: "Profile",
      description: "Edit contact and address details",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "appointments",
      label: "Appointments",
      description: "View active and upcoming visits",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      id: "history",
      label: "History",
      description: "Review past visits",
      icon: <FileClock className="h-4 w-4" />,
    },
    {
      id: "requests",
      label: "Requests",
      description: "Track prescriptions and labs",
      icon: <NotebookPen className="h-4 w-4" />,
    },
    {
      id: "family",
      label: "Family",
      description: "Manage family profiles",
      icon: <Users className="h-4 w-4" />,
    },
  ];

  useEffect(() => {
    const storedSession = readPatientLoginSession();
    if (!storedSession) {
      router.replace("/patient-portal");
      return;
    }

    setSession(storedSession);
    setIsBootstrapping(false);
  }, [router]);

  useEffect(() => {
    if (!session) return;
    const accessToken = session.accessToken;
    let cancelled = false;

    async function loadPortalData() {
      setLoadError("");
      try {
        const [nextProfile, nextAppointments, nextRequests, nextFamilyMembers] =
          await Promise.all([
            fetchPatientProfile(accessToken),
            fetchPatientAppointments(accessToken),
            fetchPatientRequests(accessToken),
            fetchPatientFamilyMembers(accessToken),
          ]);

        if (cancelled) return;

        setProfile(nextProfile);
        setAppointments(nextAppointments);
        setRequests(nextRequests);
        setFamilyMembers(nextFamilyMembers);
        setProfileDraft({
          first_name: nextProfile.first_name ?? "",
          last_name: nextProfile.last_name ?? "",
          phone: nextProfile.phone ?? "",
          email: nextProfile.email ?? "",
          address_line_1: nextProfile.address_line_1 ?? "",
          address_line_2: nextProfile.address_line_2 ?? "",
          city: nextProfile.city ?? "",
          province: nextProfile.province ?? "",
          postal_code: nextProfile.postal_code ?? "",
        });
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load the patient portal right now.",
        );
      }
    }

    void loadPortalData();

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function refreshPortalData() {
    if (!session) return;
    const accessToken = session.accessToken;

    const [nextAppointments, nextRequests, nextFamilyMembers] = await Promise.all([
      fetchPatientAppointments(accessToken),
      fetchPatientRequests(accessToken),
      fetchPatientFamilyMembers(accessToken),
    ]);

    setAppointments(nextAppointments);
    setRequests(nextRequests);
    setFamilyMembers(nextFamilyMembers);
  }

  async function handleSaveProfile() {
    if (!session) return;
    setIsSavingProfile(true);
    setProfileMessage("");

    try {
      const updated = await updatePatientProfile(session.accessToken, profileDraft);
      setProfile(updated);
      setProfileDraft({
        first_name: updated.first_name ?? "",
        last_name: updated.last_name ?? "",
        phone: updated.phone ?? "",
        email: updated.email ?? "",
        address_line_1: updated.address_line_1 ?? "",
        address_line_2: updated.address_line_2 ?? "",
        city: updated.city ?? "",
        province: updated.province ?? "",
        postal_code: updated.postal_code ?? "",
      });
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not save the profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleAddFamilyMember() {
    if (!session) return;
    setIsSavingFamily(true);
    setFamilyMessage("");

    try {
      await createPatientFamilyMember(session.accessToken, {
        first_name: familyForm.first_name,
        last_name: familyForm.last_name,
        relationship_label: familyForm.relationship_label,
        date_of_birth: familyForm.date_of_birth || undefined,
        phone: familyForm.phone || undefined,
        email: familyForm.email || undefined,
        phn: familyForm.phn || undefined,
        notes: familyForm.notes || undefined,
      });
      setFamilyForm(emptyFamilyForm);
      setFamilyMessage("Family member added successfully.");
      await refreshPortalData();
    } catch (error) {
      setFamilyMessage(error instanceof Error ? error.message : "Could not add the family member.");
    } finally {
      setIsSavingFamily(false);
    }
  }

  async function handleDeleteFamilyMember(familyMemberId: number) {
    if (!session) return;
    setFamilyMessage("");

    try {
      await deletePatientFamilyMember(session.accessToken, familyMemberId);
      setFamilyMessage("Family member removed.");
      await refreshPortalData();
    } catch (error) {
      setFamilyMessage(
        error instanceof Error ? error.message : "Could not remove the family member.",
      );
    }
  }

  function handleSignOut() {
    clearPatientLoginSession();
    router.replace("/patient-portal");
  }

  if (isBootstrapping || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
        Loading your patient workspace...
      </div>
    );
  }

  const activeAppointments = appointments?.current ?? [];
  const pastAppointments = appointments?.past ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)] xl:gap-8">
      <aside className="xl:sticky xl:top-8 xl:self-start">
        <div className="rounded-[24px] border border-sky-200/70 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                Patient portal
              </div>
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-950">
                {profile?.first_name || "Patient"} {profile?.last_name || "Portal"}
              </h1>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Profile summary
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {profile?.province || "BC"} · {profile?.phone || "No phone"}
            </p>
          </div>

          <nav className="mt-4 space-y-2">
            {navigation.map((item) => {
              const isActive = item.id === activeSection;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                    isActive ? "bg-sky-50 ring-1 ring-sky-200" : "hover:bg-slate-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      isActive ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                    <div className="truncate text-xs text-slate-500">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          <Button variant="outline" className="mt-4 h-10 w-full rounded-2xl" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="space-y-6">
        {loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        {activeSection === "profile" ? (
          <SectionCard
            title="Profile details"
            subtitle="Keep your contact information up to date."
            icon={<Users className="h-5 w-5" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-700">
                First name
                <Input
                  value={profileDraft.first_name}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, first_name: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Last name
                <Input
                  value={profileDraft.last_name}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, last_name: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Phone
                <Input
                  value={profileDraft.phone}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Email
                <Input
                  type="email"
                  value={profileDraft.email}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-700">
                  Address line 1
                  <Input
                    value={profileDraft.address_line_1}
                    onChange={(event) =>
                      setProfileDraft((current) => ({
                        ...current,
                        address_line_1: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-700">
                  Address line 2
                  <Input
                    value={profileDraft.address_line_2}
                    onChange={(event) =>
                      setProfileDraft((current) => ({
                        ...current,
                        address_line_2: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm text-slate-700">
                City
                <Input
                  value={profileDraft.city}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Province
                <Input
                  value={profileDraft.province}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, province: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Postal code
                <Input
                  value={profileDraft.postal_code}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, postal_code: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Status
                <Input value={profile?.status ?? ""} disabled />
              </label>
            </div>

            {profileMessage ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {profileMessage}
              </div>
            ) : null}

            <div className="mt-4">
              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "appointments" ? (
          <SectionCard
            title="Appointments"
            subtitle="View your active visits and what's coming next."
            icon={<CalendarDays className="h-5 w-5" />}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <SmallPill
                label="Active"
                value={activeAppointments.length}
                icon={<CalendarDays className="h-4 w-4" />}
              />
              <SmallPill
                label="Past"
                value={pastAppointments.length}
                icon={<FileClock className="h-4 w-4" />}
              />
            </div>

            <div className="mt-4 space-y-3">
              {activeAppointments.length ? (
                activeAppointments.map((appointment) => (
                  <div key={appointment.appointment_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      {appointment.service_name || "General appointment"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {appointment.clinic_name || "Clinic pending"} ·{" "}
                      <CanadianTime value={appointment.queued_at} fallback="Not available" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  No active appointments right now.
                </div>
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "history" ? (
          <SectionCard
            title="History"
            subtitle="Review completed or cancelled appointments."
            icon={<FileClock className="h-5 w-5" />}
          >
            <div className="space-y-3">
              {pastAppointments.length ? (
                pastAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.appointment_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {appointment.service_name || "General appointment"}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {appointment.clinic_name || "Clinic pending"} · {appointment.status}
                        </div>
                      </div>
                      <div className="text-sm text-slate-500">
                        <CanadianTime
                          value={appointment.completed_at || appointment.cancelled_at || appointment.queued_at}
                          fallback="Not available"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Past appointments will appear here once a visit is completed or cancelled.
                </div>
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "requests" ? (
          <SectionCard
            title="Requests"
            subtitle="Track prescriptions, lab requests, and reschedules."
            icon={<NotebookPen className="h-5 w-5" />}
          >
            <div className="space-y-3">
              {requests.length ? (
                requests.slice(0, 5).map((request) => (
                  <div key={request.request_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{request.request_type}</div>
                        <div className="mt-1 text-sm text-slate-600">Status: {request.status}</div>
                      </div>
                      <div className="text-sm text-slate-500">
                        <CanadianTime value={request.created_at} fallback="Not available" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Your portal requests will appear here.
                </div>
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "family" ? (
          <SectionCard
            title="Family members"
            subtitle="Add family members so their details stay with your patient profile."
            icon={<Users className="h-5 w-5" />}
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-3">
                {familyMembers.length ? (
                  familyMembers.slice(0, 5).map((member) => (
                    <div key={member.family_member_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">{member.relationship_label}</div>
                        </div>
                        <Button variant="ghost" onClick={() => void handleDeleteFamilyMember(member.family_member_id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                    No family members added yet.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Add a family member</h3>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2 text-sm text-slate-700">
                    First name
                    <Input
                      value={familyForm.first_name}
                      onChange={(event) =>
                        setFamilyForm((current) => ({ ...current, first_name: event.target.value }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    Last name
                    <Input
                      value={familyForm.last_name}
                      onChange={(event) =>
                        setFamilyForm((current) => ({ ...current, last_name: event.target.value }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    Relationship
                    <Input
                      value={familyForm.relationship_label}
                      onChange={(event) =>
                        setFamilyForm((current) => ({
                          ...current,
                          relationship_label: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    Phone
                    <Input
                      value={familyForm.phone}
                      onChange={(event) =>
                        setFamilyForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    Notes
                    <Textarea
                      value={familyForm.notes}
                      onChange={(event) =>
                        setFamilyForm((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Optional notes"
                    />
                  </label>
                </div>

                {familyMessage ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    {familyMessage}
                  </div>
                ) : null}

                <div className="mt-4">
                  <Button onClick={handleAddFamilyMember} disabled={isSavingFamily}>
                    {isSavingFamily ? "Saving..." : "Add family member"}
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>
        ) : null}
      </main>
    </div>
  );
}
