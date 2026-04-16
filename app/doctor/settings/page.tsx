"use client";

import React, { useState } from "react";
import { Check, Eye, EyeOff, KeyRound, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { readDoctorLoginSession } from "@/lib/doctor/session";

function SaveButton({ onSave, label = "Save changes" }: { onSave: () => Promise<void>; label?: string }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handle() {
    setSaving(true);
    await onSave();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Button onClick={handle} disabled={saving} size="sm" className="gap-2">
      {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : saving ? "Saving…" : label}
    </Button>
  );
}

export default function DoctorSettingsPage() {
  const session = readDoctorLoginSession();
  const [profile, setProfile] = useState({ firstName: "Dr.", lastName: "Smith", email: session?.clinicSlug ? `doctor@${session.clinicSlug}.ca` : "" });
  const [credentials, setCredentials] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Account</p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">Settings</h1>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 py-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Profile</p>
              <p className="text-xs text-muted-foreground">Your personal details</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="flex gap-3 max-w-sm">
              <Input placeholder="First name" value={profile.firstName} onChange={(e) => setProfile((f) => ({ ...f, firstName: e.target.value }))} />
              <Input placeholder="Last name" value={profile.lastName} onChange={(e) => setProfile((f) => ({ ...f, lastName: e.target.value }))} />
            </div>
            <Input type="email" className="max-w-sm" placeholder="Email address" value={profile.email} onChange={(e) => setProfile((f) => ({ ...f, email: e.target.value }))} />
            <SaveButton onSave={async () => { await new Promise((r) => setTimeout(r, 500)); }} />
          </div>
        </div>

        {/* Password */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 py-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <KeyRound className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">Change your login password</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="relative max-w-sm">
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Current password"
                value={credentials.currentPassword}
                onChange={(e) => setCredentials((f) => ({ ...f, currentPassword: e.target.value }))}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input type="password" className="max-w-sm" placeholder="New password (min 8 characters)" value={credentials.newPassword} onChange={(e) => setCredentials((f) => ({ ...f, newPassword: e.target.value }))} />
            <Input type="password" className="max-w-sm" placeholder="Confirm new password" value={credentials.confirmPassword} onChange={(e) => setCredentials((f) => ({ ...f, confirmPassword: e.target.value }))} />
            <SaveButton onSave={async () => { await new Promise((r) => setTimeout(r, 600)); }} label="Update password" />
          </div>
        </div>

        {/* Theme */}
        <div className="rounded-2xl border border-border bg-card px-6 py-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Appearance</p>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
