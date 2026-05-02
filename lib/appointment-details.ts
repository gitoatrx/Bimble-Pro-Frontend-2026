export type PatientDetailSource = {
  status?: string | null;
  time?: string | null;
  patientAge?: number | null;
  patientGender?: string | null;
  patientSex?: string | null;
  gender?: string | null;
  patientDateOfBirth?: string | null;
  visitType?: string | null;
  phoneNumber?: string | null;
  patientPhoneNumber?: string | null;
  email?: string | null;
  patientEmail?: string | null;
  phn?: string | null;
  healthNumber?: string | null;
  medicalRecordNumber?: string | null;
};

export type PatientDetailFormatOptions = {
  labelIdentifiers?: boolean;
};

const ACCEPTED_STATUSES = new Set(["ASSIGNED", "IN_PROGRESS", "COMPLETED", "SEEN_TODAY"]);

export function shouldShowPatientDetails(status?: string | null) {
  if (typeof status !== "string") return false;
  return ACCEPTED_STATUSES.has(status.toUpperCase());
}

export function formatPatientDetails(source: PatientDetailSource, options: PatientDetailFormatOptions = {}) {
  const details: string[] = [];
  const labelIdentifiers = options.labelIdentifiers ?? false;
  const time = typeof source.time === "string" && source.time.trim() ? source.time.trim() : "";
  if (time) {
    details.push(time);
  }

  const age = typeof source.patientAge === "number" && Number.isFinite(source.patientAge) ? source.patientAge : null;
  if (age !== null) {
    details.push(String(age));
  }

  const gender = source.patientGender ?? source.patientSex ?? source.gender;
  if (typeof gender === "string" && gender.trim()) {
    details.push(gender.trim());
  }

  const visitType = source.visitType;
  if (typeof visitType === "string" && visitType.trim()) {
    details.push(visitType.trim().replaceAll("_", " "));
  }

  const phone = source.patientPhoneNumber ?? source.phoneNumber;
  if (typeof phone === "string" && phone.trim()) {
    details.push(labelIdentifiers ? `Phone ${phone.trim()}` : phone.trim());
  }

  const phn = source.phn ?? source.healthNumber ?? source.medicalRecordNumber;
  const email = source.patientEmail ?? source.email;
  if (typeof phn === "string" && phn.trim()) {
    details.push(labelIdentifiers ? `PHN ${phn.trim()}` : phn.trim());
  } else if (typeof email === "string" && email.trim()) {
    details.push(labelIdentifiers ? `Email ${email.trim()}` : email.trim());
  }

  if (details.length === 0) {
    const dob = source.patientDateOfBirth;
    if (typeof dob === "string" && dob.trim()) {
      details.push(dob.trim());
    }
  }

  return details;
}
