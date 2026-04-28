import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { PatientPortalDashboard } from "@/components/patient/patient-portal-dashboard";

export default function PatientPortalProfilePage() {
  return (
    <ClinicFlowShell
      backHref="/patient-portal"
      backLabel="Back to patient login"
      workspaceLabel="Find care"
      contentClassName="max-w-7xl"
    >
      <PatientPortalDashboard />
    </ClinicFlowShell>
  );
}
