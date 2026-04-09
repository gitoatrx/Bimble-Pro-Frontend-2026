export type OnboardingStepKey = "clinic" | "location" | "operations";

export type ClinicOnboardingFormData = {
  clinicLegalName: string;
  clinicDisplayName: string;
  establishedYear: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  email: string;
  phoneNumber: string;
  clinicType: string;
  servicesProvided: string;
};

export type ClinicCredentials = {
  clinicName: string;
  username: string;
  password: string;
  pin: string;
  internalClinicCode?: string;
};

export type ClinicAddressSelection = {
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

export type ClinicRegisterRequest = {
  clinic_legal_name: string;
  clinic_display_name: string;
  established_year: number;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  email: string;
  phone_number: string;
  clinic_type: string;
  services_provided: string[];
};

export type ClinicRegisterResponse = {
  clinic_name: string;
  username: string;
  password: string;
  pin: string;
  internal_clinic_code: string;
  message: string;
};

export type ClinicLoginRequest = {
  clinic_name: string;
  username: string;
  password: string;
  pin: string;
};

export type ClinicLoginResponse = {
  clinicName: string;
  username: string;
  appUrl: string;
  bootstrapUrl: string;
  message: string;
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type SetFormField<T> = <K extends keyof T>(field: K, value: T[K]) => void;
