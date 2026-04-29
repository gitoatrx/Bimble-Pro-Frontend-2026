import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { PatientPortalDashboard } from "@/components/patient/patient-portal-dashboard";

export default function PatientPortalProfilePage() {
  return (
    <ClinicFlowShell
      backHref="/patient-portal?mode=login"
      backLabel="Back to patient login"
      contentClassName="max-w-6xl"
    >
      <PatientPortalDashboard />
    </ClinicFlowShell>
  );
}
