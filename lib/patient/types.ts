export type PatientVisitType = "virtual" | "walk_in";

export type PatientFulfillment = "pickup" | "delivery";

export type PatientPharmacyChoice = "bimble" | "preferred";

export type PatientOnboardingStep =
  | "phone"
  | "otp"
  | "health"
  | "demographics"
  | "visit_type"
  | "slot"
  | "fulfillment"
  | "pharmacy"
  | "complete";

export type PatientOnboardingDraft = {
  serviceId: number | null;
  serviceName: string;
  careReason: string;
  careLocation: string;
  phone: string;
  dateOfBirth: string;
  phn: string;
  noPhn: boolean;
  emailIfNoPhn: string;
  firstName: string;
  lastName: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  gender: string;
  visitType: PatientVisitType | "";
  appointmentDate: string;
  appointmentTime: string;
  fulfillment: PatientFulfillment | "";
  pharmacyChoice: PatientPharmacyChoice | "";
  preferredPharmacyName: string;
  preferredPharmacyAddress: string;
  preferredPharmacyCity: string;
  preferredPharmacyPostalCode: string;
  preferredPharmacyPhone: string;
};

export type PatientIntakeSummary = {
  visit_type: PatientVisitType;
  appointment_date: string;
  appointment_time: string;
  fulfillment: PatientFulfillment;
  pharmacy_choice: PatientPharmacyChoice | null;
  location: string | null;
};

export type PatientIntakeCompletion = {
  appointmentId: number;
  status: string;
  patientId: number;
  serviceName: string | null;
  summary: PatientIntakeSummary;
};

export const initialPatientOnboardingDraft: PatientOnboardingDraft = {
  serviceId: null,
  serviceName: "",
  careReason: "",
  careLocation: "",
  phone: "",
  dateOfBirth: "",
  phn: "",
  noPhn: false,
  emailIfNoPhn: "",
  firstName: "",
  lastName: "",
  addressLine: "",
  city: "",
  province: "",
  postalCode: "",
  gender: "",
  visitType: "",
  appointmentDate: "",
  appointmentTime: "",
  fulfillment: "",
  pharmacyChoice: "",
  preferredPharmacyName: "",
  preferredPharmacyAddress: "",
  preferredPharmacyCity: "",
  preferredPharmacyPostalCode: "",
  preferredPharmacyPhone: "",
};
