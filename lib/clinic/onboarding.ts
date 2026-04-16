import type {
  ClinicOnboardingFormData,
  ClinicRegisterRequest,
  FieldErrors,
  OnboardingStepKey,
} from "@/lib/clinic/types";

export const onboardingStepOrder: OnboardingStepKey[] = [
  "clinic",
  "location",
  "operations",
  "credentials",
];

export const provinceOptions = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
];

export const clinicTypeOptions = [
  "Family Practice",
  "Walk-In Clinic",
  "Specialty Clinic",
  "Urgent Care",
  "Multi-Specialty Clinic",
  "Community Health Centre",
  "Virtual Care Clinic",
];

const clinicTypeApiValueMap: Record<string, string> = {
  "Family Practice": "family_practice",
  "Walk-In Clinic": "walk_in_clinic",
  "Specialty Clinic": "specialty_clinic",
  "Urgent Care": "urgent_care",
  "Multi-Specialty Clinic": "multispeciality",
  "Community Health Centre": "community_health_centre",
  "Virtual Care Clinic": "virtual_care_clinic",
};

export const initialClinicOnboardingFormData: ClinicOnboardingFormData = {
  clinicLegalName: "",
  clinicDisplayName: "",
  establishedYear: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  email: "",
  phoneNumber: "",
  clinicType: "",
  servicesProvided: "",
  password: "",
  confirmPassword: "",
  pin: "",
};

export function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validatePostalCode(value: string) {
  return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(value.trim().toUpperCase());
}

export function formatPostalCode(value: string) {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);

  if (cleaned.length <= 3) {
    return cleaned;
  }

  return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
}

export function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function mapClinicTypeToApiValue(value: string) {
  return clinicTypeApiValueMap[value] ?? value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function parseServicesProvided(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildClinicRegisterPayload(
  formData: ClinicOnboardingFormData,
  planCode: string,
): ClinicRegisterRequest {
  return {
    clinic_name: formData.clinicDisplayName.trim(),
    clinic_legal_name: formData.clinicLegalName.trim(),
    clinic_display_name: formData.clinicDisplayName.trim(),
    email: formData.email.trim(),
    phone: formData.phoneNumber.replace(/\D/g, ""),
    address: formData.address.trim() || undefined,
    city: formData.city.trim() || undefined,
    province: formData.province.trim() || undefined,
    postal_code: formData.postalCode.trim().toUpperCase() || undefined,
    clinic_type: formData.clinicType ? mapClinicTypeToApiValue(formData.clinicType) : undefined,
    established_year: formData.establishedYear ? Number(formData.establishedYear) : undefined,
    plan_code: planCode,
    password: formData.password,
    pin: formData.pin,
  };
}

export function validateClinicOnboardingStep(
  step: OnboardingStepKey,
  formData: ClinicOnboardingFormData,
) {
  const errors: FieldErrors<ClinicOnboardingFormData> = {};
  const currentYear = new Date().getFullYear();

  if (step === "clinic") {
    if (!formData.clinicLegalName.trim()) {
      errors.clinicLegalName = "Clinic legal name is required.";
    }

    if (!formData.clinicDisplayName.trim()) {
      errors.clinicDisplayName = "Clinic display name is required.";
    }

    if (!formData.establishedYear.trim()) {
      errors.establishedYear = "Established year is required.";
    } else {
      const year = Number(formData.establishedYear);
      if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
        errors.establishedYear = `Enter a valid year between 1900 and ${currentYear}.`;
      }
    }
  }

  if (step === "location") {
    if (!formData.address.trim()) {
      errors.address = "Address is required.";
    }

    if (!formData.city.trim()) {
      errors.city = "City is required.";
    }

    if (!formData.province.trim()) {
      errors.province = "Province is required.";
    }

    if (!formData.postalCode.trim()) {
      errors.postalCode = "Postal code is required.";
    } else if (!validatePostalCode(formData.postalCode)) {
      errors.postalCode = "Enter a valid Canadian postal code.";
    }
  }

  if (step === "operations") {
    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required.";
    } else if (formData.phoneNumber.replace(/\D/g, "").length !== 10) {
      errors.phoneNumber = "Enter a valid 10-digit phone number.";
    }

    if (!formData.clinicType.trim()) {
      errors.clinicType = "Type of clinic is required.";
    }

    if (!formData.servicesProvided.trim()) {
      errors.servicesProvided = "Services provided is required.";
    }
  }

  if (step === "credentials") {
    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.pin) {
      errors.pin = "PIN is required.";
    } else if (!/^\d{4}$/.test(formData.pin)) {
      errors.pin = "PIN must be exactly 4 digits.";
    }
  }

  return errors;
}
