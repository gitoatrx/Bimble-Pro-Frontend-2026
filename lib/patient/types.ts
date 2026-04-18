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
  careReason: string;
  careLocation: string;
  phone: string;
  dateOfBirth: string;
  phn: string;
  noPhn: boolean;
  emailIfNoPhn: string;
  fullName: string;
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
};

export const initialPatientOnboardingDraft: PatientOnboardingDraft = {
  careReason: "",
  careLocation: "",
  phone: "",
  dateOfBirth: "",
  phn: "",
  noPhn: false,
  emailIfNoPhn: "",
  fullName: "",
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
};
