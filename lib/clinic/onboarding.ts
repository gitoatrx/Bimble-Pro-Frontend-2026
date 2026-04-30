import type {
  ClinicOnboardingFormData,
  ClinicRegisterRequest,
  FieldErrors,
  OnboardingStepKey,
} from "@/lib/clinic/types";
import {
  isValidCanadianProvinceCode,
  normalizeProvinceCodeInput,
} from "@/lib/form-validation";

export const onboardingStepOrder: OnboardingStepKey[] = [
  "clinic",
  "location",
  "operations",
  "credentials",
];

export const provinceOptions = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NT",
  "NS",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
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

export function capitalizeWordsInput(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/(^|[\s([{/"'’-])(\p{L})/gu, (match, prefix: string, letter: string) => {
      return `${prefix}${letter.toUpperCase()}`;
    });
}

export function normalizeClinicTextInput(value: string) {
  return capitalizeWordsInput(value.replace(/[^\p{L}\p{N}\s&.,'’()/-]/gu, ""));
}

export function normalizeCityNameInput(value: string) {
  return capitalizeWordsInput(value.replace(/[^\p{L}\s.'’-]/gu, ""));
}

export function normalizeServicesInput(value: string) {
  return capitalizeWordsInput(value.replace(/[^\p{L}\p{N}\s&.,'’()/-]/gu, ""));
}

export function normalizeClinicOnboardingFormData(
  formData: ClinicOnboardingFormData,
): ClinicOnboardingFormData {
  return {
    ...formData,
    clinicLegalName: normalizeClinicTextInput(formData.clinicLegalName).trim(),
    clinicDisplayName: normalizeClinicTextInput(formData.clinicDisplayName).trim(),
    address: capitalizeWordsInput(formData.address).trim(),
    city: normalizeCityNameInput(formData.city).trim(),
    province: normalizeProvinceCodeInput(formData.province),
    postalCode: formatPostalCode(formData.postalCode),
    email: formData.email.trim().toLowerCase(),
    phoneNumber: formatPhoneNumber(formData.phoneNumber),
    servicesProvided: normalizeServicesInput(formData.servicesProvided).trim(),
    pin: formData.pin.replace(/\D/g, "").slice(0, 4),
  };
}

function hasCapitalizedFirstLetter(value: string) {
  const firstLetter = value.trim().match(/\p{L}/u)?.[0];
  return !firstLetter || firstLetter === firstLetter.toUpperCase();
}

function hasMinimumLetters(value: string, minimum: number) {
  const letters = value.match(/\p{L}/gu) ?? [];
  return letters.length >= minimum;
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
  const normalizedFormData = normalizeClinicOnboardingFormData(formData);

  return {
    clinic_name: normalizedFormData.clinicDisplayName,
    clinic_legal_name: normalizedFormData.clinicLegalName,
    clinic_display_name: normalizedFormData.clinicDisplayName,
    email: normalizedFormData.email,
    phone: normalizedFormData.phoneNumber.replace(/\D/g, ""),
    address: normalizedFormData.address || undefined,
    city: normalizedFormData.city || undefined,
    province: normalizedFormData.province || undefined,
    postal_code: normalizedFormData.postalCode.toUpperCase() || undefined,
    clinic_type: normalizedFormData.clinicType
      ? mapClinicTypeToApiValue(normalizedFormData.clinicType)
      : undefined,
    established_year: normalizedFormData.establishedYear
      ? Number(normalizedFormData.establishedYear)
      : undefined,
    plan_code: planCode,
    password: normalizedFormData.password,
    pin: normalizedFormData.pin,
  };
}

export function validateClinicOnboardingStep(
  step: OnboardingStepKey,
  formData: ClinicOnboardingFormData,
) {
  const errors: FieldErrors<ClinicOnboardingFormData> = {};
  const currentYear = new Date().getFullYear();
  const clinicLegalName = formData.clinicLegalName.trim();
  const clinicDisplayName = formData.clinicDisplayName.trim();
  const city = formData.city.trim();
  const servicesProvided = formData.servicesProvided.trim();

  if (step === "clinic") {
    if (!clinicLegalName) {
      errors.clinicLegalName = "Clinic legal name is required.";
    } else if (clinicLegalName.length < 3 || !hasMinimumLetters(clinicLegalName, 2)) {
      errors.clinicLegalName = "Clinic legal name must be at least 3 characters.";
    } else if (!/^[\p{L}\p{N}][\p{L}\p{N}\s&.,'’()/-]*$/u.test(clinicLegalName)) {
      errors.clinicLegalName = "Use letters, numbers, spaces, and standard business punctuation only.";
    } else if (!hasCapitalizedFirstLetter(clinicLegalName)) {
      errors.clinicLegalName = "Clinic legal name must start with a capital letter.";
    }

    if (!clinicDisplayName) {
      errors.clinicDisplayName = "Clinic display name is required.";
    } else if (clinicDisplayName.length < 3 || !hasMinimumLetters(clinicDisplayName, 2)) {
      errors.clinicDisplayName = "Clinic display name must be at least 3 characters.";
    } else if (!/^[\p{L}\p{N}][\p{L}\p{N}\s&.,'’()/-]*$/u.test(clinicDisplayName)) {
      errors.clinicDisplayName = "Use letters, numbers, spaces, and standard business punctuation only.";
    } else if (!hasCapitalizedFirstLetter(clinicDisplayName)) {
      errors.clinicDisplayName = "Clinic display name must start with a capital letter.";
    }

    if (!formData.establishedYear.trim()) {
      errors.establishedYear = "Established year is required.";
    } else if (!/^\d{4}$/.test(formData.establishedYear)) {
      errors.establishedYear = "Established year must be 4 digits.";
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
    } else if (formData.address.trim().length < 5) {
      errors.address = "Address must be at least 5 characters.";
    }

    if (!city) {
      errors.city = "City is required.";
    } else if (city.length < 2) {
      errors.city = "City must be at least 2 characters.";
    } else if (!/^[\p{L}][\p{L}\s.'’-]*$/u.test(city)) {
      errors.city = "Use letters only for city.";
    } else if (!hasCapitalizedFirstLetter(city)) {
      errors.city = "City must start with a capital letter.";
    }

    if (!formData.province.trim()) {
      errors.province = "Province is required.";
    } else if (!isValidCanadianProvinceCode(formData.province)) {
      errors.province = "Select a valid Canadian province.";
    }

    if (!formData.postalCode.trim()) {
      errors.postalCode = "Postal code is required.";
    } else if (!validatePostalCode(formData.postalCode)) {
      errors.postalCode = "Enter a valid Canadian postal code.";
    }
  }

  if (step === "operations") {
    const email = formData.email.trim();
    if (!email) {
      errors.email = "Email is required.";
    } else if (!validateEmail(email)) {
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
    } else if (servicesProvided.length < 5 || !hasMinimumLetters(servicesProvided, 4)) {
      errors.servicesProvided = "Services provided must be at least 5 characters.";
    } else if (!/^[\p{L}\p{N}][\p{L}\p{N}\s&.,'’()/-]*$/u.test(servicesProvided)) {
      errors.servicesProvided = "Use letters, numbers, spaces, and standard punctuation only.";
    } else if (!hasCapitalizedFirstLetter(servicesProvided)) {
      errors.servicesProvided = "Services provided must start with a capital letter.";
    }
  }

  if (step === "credentials") {
    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = "Password must include at least one uppercase letter.";
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = "Password must include at least one lowercase letter.";
    } else if (!/\d/.test(formData.password)) {
      errors.password = "Password must include at least one number.";
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      errors.password = "Password must include at least one special character.";
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
