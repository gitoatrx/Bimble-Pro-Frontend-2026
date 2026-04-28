"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  PenLine,
  RefreshCcw,
} from "lucide-react";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { DoctorHlth2820Editor } from "@/components/doctor/doctor-hlth2820-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCanadaPacificDateKey } from "@/lib/time-zone";
import {
  capitalizeLeadingLetter,
  digitsOnly,
  getLiveFutureDateError,
  getLiveDigitCountError,
  getLiveFiveDigitError,
  getLiveEmailError,
  getLiveTenDigitError,
  hasExactDigits,
  isFutureDate,
  normalizeCityInput,
  normalizeNameInput,
  normalizePostalCode,
  normalizeProvinceInput,
  validateEmail,
} from "@/lib/form-validation";
import {
  clearDoctorOnboardingStage,
  isDoctorOnboardingComplete,
  markDoctorOnboardingComplete,
  readDoctorLoginSession,
  readDoctorOnboardingStage,
  storeDoctorOnboardingStage,
} from "@/lib/doctor/session";
import {
  fetchDoctorHlth2870Onboarding,
  fetchDoctorHlth2950Onboarding,
  fetchDoctorHlth2991Onboarding,
  submitDoctorHlth2870Onboarding,
  submitDoctorHlth2832Onboarding,
  submitDoctorHlth2950Onboarding,
  submitDoctorHlth2991Onboarding,
  type DoctorHlth2870Request,
  type DoctorHlth2870Response,
  type DoctorHlth2870SavedValues,
  type DoctorHlth2832Request,
  type DoctorHlth2832Response,
  type DoctorHlth2950GetResponse,
  type DoctorHlth2950Request,
  type DoctorHlth2950Response,
  type DoctorHlth2950UiContent,
  type DoctorHlth2991GetResponse,
  type DoctorHlth2991Request,
  type DoctorHlth2991UiContent,
} from "@/lib/api/doctor-onboarding";

type OnboardingStage = "hlth_2870" | "hlth_2950" | "hlth_2832" | "hlth_2991" | "hlth_2820" | "complete";

type DoctorHlth2870FormState = Omit<DoctorHlth2870Request, "signature"> & {
  signature_label: string;
};

type DoctorHlth2950FormState = {
  attachment_action: "ADD" | "CANCEL" | "CHANGE";
  msp_practitioner_number: string;
  facility_or_practice_name: string;
  msp_facility_number: string;
  facility_physical_address: string;
  facility_physical_city: string;
  facility_physical_postal_code: string;
  contact_email: string;
  contact_phone_number: string;
  contact_fax_number: string;
  new_attachment_effective_date: string;
  new_attachment_cancellation_date: string;
  attachment_cancellation_date: string;
  change_attachment_effective_date: string;
  change_attachment_cancellation_date: string;
  confirm_declarations: boolean;
  signature_label: string;
};

type DoctorHlth2832FormState = Omit<DoctorHlth2832Request, "signature"> & {
  signature_label: string;
};

type DoctorHlth2991FormState = {
  surname: string;
  given_name: string;
  given_name_second: string;
  date_of_birth: string;
  gender: DoctorHlth2991Request["gender"] | "";
  citizenship: string;
  status_in_canada: string;
  home_mailing_address: string;
  home_city: string;
  home_postal_code: string;
  home_phone_number: string;
  home_fax_number: string;
  home_email_address: string;
  business_mailing_address: string;
  business_city: string;
  business_postal_code: string;
  business_phone_number: string;
  business_fax_number: string;
  business_email_address: string;
  medical_school: string;
  date_of_graduation: string;
  royal_college_specialty: string;
  royal_college_subspecialty: string;
  non_royal_college_specialty: string;
  non_royal_college_subspecialty: string;
  certification_date_1: string;
  certification_date_2: string;
  certification_date_3: string;
  certification_date_4: string;
  date_of_registration: string;
  college_id: string;
  registrations: string;
  license_type: DoctorHlth2991Request["license_type"] | "";
  license_effective_date: string;
  msp_effective_date: string;
  cancellation_date: string;
  confirm_declarations: boolean;
  signature_label: string;
};

type FieldErrorState<T extends string> = Partial<Record<T, string>>;

const initialStep1FormState: DoctorHlth2870FormState = {
  msp_billing_number: "",
  principal_practitioner_name: "",
  principal_practitioner_number: "",
  effective_date: "",
  cancel_date: "",
  signature_label: "",
};

const initialStep2FormState: DoctorHlth2950FormState = {
  attachment_action: "ADD",
  msp_practitioner_number: "",
  facility_or_practice_name: "",
  msp_facility_number: "",
  facility_physical_address: "",
  facility_physical_city: "",
  facility_physical_postal_code: "",
  contact_email: "",
  contact_phone_number: "",
  contact_fax_number: "",
  new_attachment_effective_date: "",
  new_attachment_cancellation_date: "",
  attachment_cancellation_date: "",
  change_attachment_effective_date: "",
  change_attachment_cancellation_date: "",
  confirm_declarations: false,
  signature_label: "",
};

const initialStep3FormState: DoctorHlth2832FormState = {
  msp_billing_number: "",
  payment_number: "",
  payee_name: "",
  institution_number: "",
  branch_number: "",
  account_number: "",
  institution_bank_name: "",
  branch_name: "",
  street_address: "",
  city: "",
  province: "",
  postal_code: "",
  telephone: "",
  telephone2: "",
  signature_label: "",
};

const initialStep4FormState: DoctorHlth2991FormState = {
  surname: "",
  given_name: "",
  given_name_second: "",
  date_of_birth: "",
  gender: "",
  citizenship: "",
  status_in_canada: "",
  home_mailing_address: "",
  home_city: "",
  home_postal_code: "",
  home_phone_number: "",
  home_fax_number: "",
  home_email_address: "",
  business_mailing_address: "",
  business_city: "",
  business_postal_code: "",
  business_phone_number: "",
  business_fax_number: "",
  business_email_address: "",
  medical_school: "",
  date_of_graduation: "",
  royal_college_specialty: "",
  royal_college_subspecialty: "",
  non_royal_college_specialty: "",
  non_royal_college_subspecialty: "",
  certification_date_1: "",
  certification_date_2: "",
  certification_date_3: "",
  certification_date_4: "",
  date_of_registration: "",
  college_id: "",
  registrations: "",
  license_type: "",
  license_effective_date: "",
  msp_effective_date: "",
  cancellation_date: "",
  confirm_declarations: false,
  signature_label: "",
};

function isoDateLabel(value: string) {
  if (!value) return "";
  return formatCanadaPacificDateKey(value, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function splitDisplayName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { givenName: "", givenNameSecond: "", surname: "" };
  }
  if (parts.length === 1) {
    return { givenName: parts[0], givenNameSecond: "", surname: "" };
  }
  return {
    givenName: parts[0],
    givenNameSecond: parts.slice(1, -1).join(" "),
    surname: parts[parts.length - 1],
  };
}

function ActionCard({
  checked,
  label,
  description,
  onClick,
}: {
  checked: boolean;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all",
        checked
          ? "border-primary bg-primary/5 text-foreground shadow-[0_0_0_1px_rgba(37,99,235,0.08)]"
          : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-accent/20",
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white",
        )}
      >
        {checked ? <span className="h-2 w-2 rounded-[2px] bg-white" /> : null}
      </span>
      <span className="space-y-1">
        <span className="block text-sm font-semibold">{label}</span>
        {description ? <span className="block text-xs text-muted-foreground">{description}</span> : null}
      </span>
    </button>
  );
}

function FormLabel({
  children,
  htmlFor,
}: {
  children: string;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}
    </label>
  );
}

const defaultStep2UiContent: DoctorHlth2950UiContent = {
  part_c: {
    title: "Declaration",
    summary: "Read the practitioner declarations below, confirm agreement, then sign before submitting the form.",
    consent_label: "I have read and agree to the practitioner declarations above.",
    consent_required: true,
    declarations: [
      {
        id: "ELIGIBLE_PHYSICIAN_STATUS",
        summary_text:
          "You confirm you are an eligible physician for the facility in this form, and any Business Cost Premium claims depend on your attachment to this facility or another eligible facility.",
        full_text:
          "I am an Eligible Physician regarding the facility that has been issued the MSP Facility Number named in this document, and I understand that my claims for the Business Cost Premium on Eligible Fees will be based on my attachment to the MSP Facility Number named in this document, or to another eligible facility.",
      },
      {
        id: "ATTACHMENT_REQUIRED_FOR_BCP",
        summary_text:
          "This attachment stays valid until Business Cost Premium claims on eligible fees are submitted in the approved format using a valid practitioner number and MSP facility number.",
        full_text:
          "This attachment will result in the Business Cost Premium being applied to all Eligible Fees on claims submitted, in the format approved by the Medical Services Commission of British Columbia bearing my Practitioner Number and a valid MSP Facility Number.",
      },
      {
        id: "LEGAL_DOCUMENT_TRUTHFULNESS",
        summary_text:
          "This is a legal document, and the information you provide must be true to the best of your knowledge.",
        full_text:
          "I understand that this is a legal document and I represent that the information that I have provided on this document is true to the best of my knowledge.",
      },
      {
        id: "AUDIT_AND_RECOVERY",
        summary_text:
          "Claims related to Business Cost Premium may be audited, money can be recovered for improper claims, and false or misleading claims can be offences under the Medicare Protection Act and the Criminal Code.",
        full_text:
          "I understand that claims in relation to the Business Cost Premium are subject to audit, and if found to be contrary to the Medicare Protection Act (the “Act”), are subject to financial recovery. I further understand that submitting false or misleading claims information is an offence under the Act and may be an offence under the Criminal Code of Canada.",
      },
      {
        id: "ADMINISTRATOR_INFORMATION_SHARING",
        summary_text:
          "You authorize MSP to share attachment-related information, including your mailing address, with the facility administrator so the attachment can be confirmed.",
        full_text:
          "I authorize the sharing of this information with the Administrator for the facility named in this document, including the delivery of this information to the facility mailing address for the purposes of confirmation of my attachment to the MSP Facility Number; and",
      },
      {
        id: "CANCELLATION_IF_NO_LONGER_ELIGIBLE",
        summary_text:
          "If you are no longer an eligible physician for this facility, you must submit a cancellation of your attachment to Health Insurance BC.",
        full_text:
          "If, at any point, I am no longer an Eligible Physician with regard to the facility named in this document, I will submit a form for cancellation of my attachment to this MSP Facility Number to Health Insurance BC.",
      },
    ],
  },
};

const defaultStep4UiContent: DoctorHlth2991UiContent = {
  part_4: {
    title: "Declaration",
    summary: "Read the MSP declaration below, confirm agreement, then sign before submitting the enrolment form.",
    consent_label: "I have read and agree to the MSP enrolment declaration above.",
    consent_required: true,
    declarations: [
      {
        id: "MSP_TRUST_AND_AUDIT",
        summary_text:
          "You understand MSP operates on trust, but your claims can still be audited and money can be recovered if claims are made contrary to the Medicare Protection Act.",
        full_text:
          "I understand that MSP is a public system based on trust, but also that my claims are subject to audit and financial recovery for claims contrary to the Medicare Protection Act (the “Act”).",
      },
      {
        id: "NO_FALSE_OR_MISLEADING_CLAIMS",
        summary_text:
          "You agree not to submit false or misleading claims information and acknowledge that doing so can be an offence under the Act and may also be an offence under the Criminal Code of Canada.",
        full_text:
          "I undertake to not submit false or misleading claims information, and acknowledge that doing so is an offence under the Act and may be an offence under the Criminal Code of Canada.",
      },
      {
        id: "MEET_ACT_REQUIREMENTS",
        summary_text:
          "You agree to meet the requirements of the Act and its related payment schedule when making claims for payment.",
        full_text:
          "Further, I agree that I will meet the requirements of the Act and related Payment Schedule regarding claims for payment.",
      },
      {
        id: "ADEQUATE_RECORDS_BEFORE_CLAIM",
        summary_text:
          "Before submitting a claim, you must have the required supporting record: an adequate medical record if you are a medical practitioner, or an adequate clinical record if you are a health care practitioner.",
        full_text:
          "I understand that prior to submitting a claim I must create: (a) an adequate medical record, if I am a medical practitioner; or (b) an adequate clinical record, if I am a health care practitioner.",
      },
    ],
  },
};

function validateStep1(
  formState: DoctorHlth2870FormState,
  signatureDataUrl: string,
) {
  const errors: FieldErrorState<keyof DoctorHlth2870FormState | "signature"> = {};

  if (!formState.msp_billing_number.trim()) {
    errors.msp_billing_number = "msp_billing_number is required.";
  }
  if (!formState.principal_practitioner_name.trim()) {
    errors.principal_practitioner_name = "principal_practitioner_name is required.";
  }
  if (!formState.principal_practitioner_number.trim()) {
    errors.principal_practitioner_number = "principal_practitioner_number is required.";
  }
  if (!formState.effective_date.trim()) {
    errors.effective_date = "effective_date is required.";
  } else if (isFutureDate(formState.effective_date)) {
    errors.effective_date = "effective_date cannot be in the future.";
  }
  if (!formState.cancel_date.trim()) {
    errors.cancel_date = "cancel_date is required.";
  } else if (formState.effective_date && formState.cancel_date < formState.effective_date) {
    errors.cancel_date = "cancel_date cannot be earlier than effective_date.";
  }
  if (!formState.signature_label.trim()) {
    errors.signature_label = "signature.signature_label is required.";
  }
  if (!signatureDataUrl.trim()) {
    errors.signature = "signature.signature_data_url is required.";
  }

  return errors;
}

function validateStep2(
  formState: DoctorHlth2950FormState,
  signatureDataUrl: string,
) {
  const errors: FieldErrorState<keyof DoctorHlth2950FormState | "signature"> = {};

  if (!formState.attachment_action.trim()) {
    errors.attachment_action = "attachment_action is required.";
  }
  if (!formState.msp_practitioner_number.trim()) {
    errors.msp_practitioner_number = "msp_practitioner_number is required.";
  } else if (!hasExactDigits(formState.msp_practitioner_number, 5)) {
    errors.msp_practitioner_number = "Enter a valid 5-digit number for msp_practitioner_number.";
  }
  if (!formState.facility_or_practice_name.trim()) {
    errors.facility_or_practice_name = "facility_or_practice_name is required.";
  }
  if (!formState.msp_facility_number.trim()) {
    errors.msp_facility_number = "msp_facility_number is required.";
  } else if (!hasExactDigits(formState.msp_facility_number, 5)) {
    errors.msp_facility_number = "Enter a valid 5-digit number for msp_facility_number.";
  }
  if (!formState.facility_physical_address.trim()) {
    errors.facility_physical_address = "facility_physical_address is required.";
  }
  if (!formState.facility_physical_city.trim()) {
    errors.facility_physical_city = "facility_physical_city is required.";
  }
  if (!formState.facility_physical_postal_code.trim()) {
    errors.facility_physical_postal_code = "facility_physical_postal_code is required.";
  }
  if (!formState.contact_email.trim()) {
    errors.contact_email = "contact_email is required.";
  } else if (!validateEmail(formState.contact_email)) {
    errors.contact_email = "Enter a valid email address for contact_email.";
  }
  if (!formState.contact_phone_number.trim()) {
    errors.contact_phone_number = "contact_phone_number is required.";
  } else if (!hasExactDigits(formState.contact_phone_number, 10)) {
    errors.contact_phone_number = "Enter a valid 10-digit phone number.";
  }
  if (!formState.contact_fax_number.trim()) {
    errors.contact_fax_number = "contact_fax_number is required.";
  } else if (!hasExactDigits(formState.contact_fax_number, 10)) {
    errors.contact_fax_number = "Enter a valid 10-digit fax number.";
  }
  if (formState.attachment_action === "ADD") {
    if (!formState.new_attachment_effective_date.trim()) {
      errors.new_attachment_effective_date = "new_attachment_effective_date is required.";
    } else if (isFutureDate(formState.new_attachment_effective_date)) {
      errors.new_attachment_effective_date = "new_attachment_effective_date cannot be in the future.";
    }
    if (!formState.new_attachment_cancellation_date.trim()) {
      errors.new_attachment_cancellation_date = "new_attachment_cancellation_date is required.";
    } else if (
      formState.new_attachment_effective_date &&
      formState.new_attachment_cancellation_date < formState.new_attachment_effective_date
    ) {
      errors.new_attachment_cancellation_date =
        "new_attachment_cancellation_date cannot be earlier than new_attachment_effective_date.";
    }
  }
  if (formState.attachment_action === "CANCEL") {
    if (!formState.attachment_cancellation_date.trim()) {
      errors.attachment_cancellation_date = "attachment_cancellation_date is required.";
    }
  }
  if (formState.attachment_action === "CHANGE") {
    if (!formState.change_attachment_effective_date.trim()) {
      errors.change_attachment_effective_date = "change_attachment_effective_date is required.";
    } else if (isFutureDate(formState.change_attachment_effective_date)) {
      errors.change_attachment_effective_date = "change_attachment_effective_date cannot be in the future.";
    }
    if (!formState.change_attachment_cancellation_date.trim()) {
      errors.change_attachment_cancellation_date = "change_attachment_cancellation_date is required.";
    } else if (
      formState.change_attachment_effective_date &&
      formState.change_attachment_cancellation_date < formState.change_attachment_effective_date
    ) {
      errors.change_attachment_cancellation_date =
        "change_attachment_cancellation_date cannot be earlier than change_attachment_effective_date.";
    }
  }
  if (!formState.confirm_declarations) {
    errors.confirm_declarations = "confirm_declarations must be checked.";
  }
  if (!formState.signature_label.trim()) {
    errors.signature_label = "signature.signature_label is required.";
  }
  if (!signatureDataUrl.trim()) {
    errors.signature = "signature.signature_data_url is required.";
  }

  return errors;
}

function validateStep3(
  formState: DoctorHlth2832FormState,
  signatureDataUrl: string,
) {
  const errors: FieldErrorState<keyof DoctorHlth2832FormState | "signature"> = {};

  if (!formState.msp_billing_number.trim()) {
    errors.msp_billing_number = "msp_billing_number is required.";
  } else if (!hasExactDigits(formState.msp_billing_number, 10)) {
    errors.msp_billing_number = "Enter a valid 10-digit number for msp_billing_number.";
  }
  if (!formState.payment_number.trim()) {
    errors.payment_number = "payment_number is required.";
  } else if (!hasExactDigits(formState.payment_number, 5)) {
    errors.payment_number = "Enter a valid 5-digit number for payment_number.";
  }
  if (!formState.payee_name.trim()) {
    errors.payee_name = "payee_name is required.";
  }
  if (!formState.institution_number.trim()) {
    errors.institution_number = "institution_number is required.";
  } else if (!hasExactDigits(formState.institution_number, 3)) {
    errors.institution_number = "Enter a valid 3-digit number for institution_number.";
  }
  if (!formState.branch_number.trim()) {
    errors.branch_number = "branch_number is required.";
  } else if (!hasExactDigits(formState.branch_number, 5)) {
    errors.branch_number = "Enter a valid 5-digit number for branch_number.";
  }
  if (!formState.account_number.trim()) {
    errors.account_number = "account_number is required.";
  }
  if (!formState.institution_bank_name.trim()) {
    errors.institution_bank_name = "institution_bank_name is required.";
  }
  if (!formState.branch_name.trim()) {
    errors.branch_name = "branch_name is required.";
  }
  if (!formState.street_address.trim()) {
    errors.street_address = "street_address is required.";
  }
  if (!formState.city.trim()) {
    errors.city = "city is required.";
  }
  if (!formState.province.trim()) {
    errors.province = "province is required.";
  }
  if (!formState.postal_code.trim()) {
    errors.postal_code = "postal_code is required.";
  }
  if (!formState.telephone.trim()) {
    errors.telephone = "telephone is required.";
  } else if (!hasExactDigits(formState.telephone, 10)) {
    errors.telephone = "Enter a valid 10-digit phone number.";
  }
  if (!formState.telephone2.trim()) {
    errors.telephone2 = "telephone2 is required.";
  } else if (!hasExactDigits(formState.telephone2, 10)) {
    errors.telephone2 = "Enter a valid 10-digit phone number.";
  }
  if (!formState.signature_label.trim()) {
    errors.signature_label = "signature.signature_label is required.";
  }
  if (!signatureDataUrl.trim()) {
    errors.signature = "signature.signature_data_url is required.";
  }

  return errors;
}

function validateStep4(
  formState: DoctorHlth2991FormState,
  signatureDataUrl: string,
) {
  const errors: FieldErrorState<keyof DoctorHlth2991FormState | "signature"> = {};
  const citizenshipValue = (formState.citizenship ?? "").trim();
  const licenseEffectiveDateValue = (formState.license_effective_date ?? "").trim();
  const cancellationDateValue = (formState.cancellation_date ?? "").trim();
  const mspEffectiveDateValue = (formState.msp_effective_date ?? "").trim();

  if (!formState.surname.trim()) errors.surname = "surname is required.";
  if (!formState.given_name.trim()) errors.given_name = "given_name is required.";
  if (!formState.date_of_birth.trim()) errors.date_of_birth = "date_of_birth is required.";
  else if (isFutureDate(formState.date_of_birth)) {
    errors.date_of_birth = "date_of_birth cannot be in the future.";
  }
  if (!formState.gender) errors.gender = "gender is required.";
  if (!citizenshipValue) errors.citizenship = "citizenship is required.";
  if (citizenshipValue && citizenshipValue.toLowerCase() !== "canadian" && !formState.status_in_canada.trim()) {
    errors.status_in_canada = "status_in_canada is required for non-Canadian citizenship.";
  }
  if (!formState.home_mailing_address.trim()) errors.home_mailing_address = "home_mailing_address is required.";
  if (!formState.home_city.trim()) errors.home_city = "home_city is required.";
  if (!formState.home_postal_code.trim()) errors.home_postal_code = "home_postal_code is required.";
  if (!formState.home_phone_number.trim()) errors.home_phone_number = "home_phone_number is required.";
  else if (!hasExactDigits(formState.home_phone_number, 10)) {
    errors.home_phone_number = "Enter a valid 10-digit phone number.";
  }
  if (!formState.home_fax_number.trim()) errors.home_fax_number = "home_fax_number is required.";
  else if (!hasExactDigits(formState.home_fax_number, 10)) {
    errors.home_fax_number = "Enter a valid 10-digit fax number.";
  }
  if (!formState.home_email_address.trim()) errors.home_email_address = "home_email_address is required.";
  else if (!validateEmail(formState.home_email_address)) {
    errors.home_email_address = "Enter a valid email address for home_email_address.";
  }
  if (!formState.business_mailing_address.trim()) errors.business_mailing_address = "business_mailing_address is required.";
  if (!formState.business_city.trim()) errors.business_city = "business_city is required.";
  if (!formState.business_postal_code.trim()) errors.business_postal_code = "business_postal_code is required.";
  if (!formState.business_phone_number.trim()) errors.business_phone_number = "business_phone_number is required.";
  else if (!hasExactDigits(formState.business_phone_number, 10)) {
    errors.business_phone_number = "Enter a valid 10-digit phone number.";
  }
  if (!formState.business_fax_number.trim()) errors.business_fax_number = "business_fax_number is required.";
  else if (!hasExactDigits(formState.business_fax_number, 10)) {
    errors.business_fax_number = "Enter a valid 10-digit fax number.";
  }
  if (!formState.business_email_address.trim()) errors.business_email_address = "business_email_address is required.";
  else if (!validateEmail(formState.business_email_address)) {
    errors.business_email_address = "Enter a valid email address for business_email_address.";
  }
  if (!formState.medical_school.trim()) errors.medical_school = "medical_school is required.";
  if (!formState.date_of_graduation.trim()) errors.date_of_graduation = "date_of_graduation is required.";
  else if (isFutureDate(formState.date_of_graduation)) {
    errors.date_of_graduation = "date_of_graduation cannot be in the future.";
  }
  if (!formState.royal_college_specialty.trim()) errors.royal_college_specialty = "royal_college_specialty is required.";
  if (!formState.royal_college_subspecialty.trim()) errors.royal_college_subspecialty = "royal_college_subspecialty is required.";
  if (!formState.non_royal_college_specialty.trim()) errors.non_royal_college_specialty = "non_royal_college_specialty is required.";
  if (!formState.non_royal_college_subspecialty.trim()) errors.non_royal_college_subspecialty = "non_royal_college_subspecialty is required.";
  if (!formState.certification_date_1.trim()) errors.certification_date_1 = "certification_date_1 is required.";
  else if (isFutureDate(formState.certification_date_1)) {
    errors.certification_date_1 = "certification_date_1 cannot be in the future.";
  }
  if (formState.certification_date_2.trim() && isFutureDate(formState.certification_date_2)) {
    errors.certification_date_2 = "certification_date_2 cannot be in the future.";
  }
  if (formState.certification_date_3.trim() && isFutureDate(formState.certification_date_3)) {
    errors.certification_date_3 = "certification_date_3 cannot be in the future.";
  }
  if (formState.certification_date_4.trim() && isFutureDate(formState.certification_date_4)) {
    errors.certification_date_4 = "certification_date_4 cannot be in the future.";
  }
  if (!formState.date_of_registration.trim()) errors.date_of_registration = "date_of_registration is required.";
  else if (isFutureDate(formState.date_of_registration)) {
    errors.date_of_registration = "date_of_registration cannot be in the future.";
  }
  if (!formState.college_id.trim()) errors.college_id = "college_id is required.";
  if (!formState.registrations.trim()) errors.registrations = "registrations is required.";
  if (!formState.license_type) errors.license_type = "license_type is required.";
  if (formState.license_type === "FULL" && !licenseEffectiveDateValue) {
    errors.license_effective_date = "license_effective_date is required for FULL licenses.";
  } else if (licenseEffectiveDateValue && isFutureDate(licenseEffectiveDateValue)) {
    errors.license_effective_date = "license_effective_date cannot be in the future.";
  }
  if (!cancellationDateValue) {
    errors.cancellation_date = "cancellation_date is required.";
  } else if (mspEffectiveDateValue && cancellationDateValue < mspEffectiveDateValue) {
    errors.cancellation_date = "cancellation_date cannot be earlier than msp_effective_date.";
  }
  if (!mspEffectiveDateValue) errors.msp_effective_date = "msp_effective_date is required.";
  else if (isFutureDate(mspEffectiveDateValue)) {
    errors.msp_effective_date = "msp_effective_date cannot be in the future.";
  }
  if (!formState.confirm_declarations) {
    errors.confirm_declarations = "confirm_declarations must be checked.";
  }
  if (!formState.signature_label.trim()) errors.signature_label = "signature.signature_label is required.";
  if (!signatureDataUrl.trim()) errors.signature = "signature.signature_data_url is required.";

  return errors;
}

function SignaturePad({
  value,
  onChange,
  onExportPromiseChange,
  showHelperText = true,
}: {
  value: string;
  onChange: (value: string) => void;
  onExportPromiseChange?: (promise: Promise<void> | null) => void;
  showHelperText?: boolean;
}) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const strokesRef = useRef<{ x: number; y: number }[][]>([]);
  const exportPromiseRef = useRef<Promise<void> | null>(null);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [hasInk, setHasInk] = useState(Boolean(value));
  const [surfaceSize, setSurfaceSize] = useState({ width: 0, height: 180 });

  useEffect(() => {
    const target = surfaceRef.current;
    if (!target) return;

    function measure() {
      const rect = target!.getBoundingClientRect();
      setSurfaceSize({
        width: Math.max(1, Math.floor(rect.width)),
        height: 180,
      });
    }

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(target);

    return () => resizeObserver.disconnect();
  }, []);

  function pointFromEvent(event: PointerEvent<HTMLDivElement>) {
    const surface = surfaceRef.current;
    if (!surface) return null;

    const rect = surface.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
    };
  }

  function buildSvg(nextStrokes: { x: number; y: number }[][]) {
    const width = Math.max(1, surfaceSize.width || 1);
    const height = Math.max(1, surfaceSize.height || 180);
    const strokeMarkup = nextStrokes
      .map((stroke) => {
        if (stroke.length === 0) return "";
        if (stroke.length === 1) {
          const point = stroke[0];
          return `<circle cx="${point.x}" cy="${point.y}" r="1.5" fill="#0f172a" />`;
        }
        const points = stroke.map((point) => `${point.x},${point.y}`).join(" ");
        return `<polyline points="${points}" fill="none" stroke="#0f172a" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />`;
      })
      .join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="geometricPrecision">${strokeMarkup}</svg>`;
  }

  function capture(nextStrokes: { x: number; y: number }[][]) {
    const svg = buildSvg(nextStrokes);
    const promise = new Promise<void>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, surfaceSize.width || 1);
        canvas.height = Math.max(1, surfaceSize.height || 180);
        const context = canvas.getContext("2d");
        if (context) {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          onChange(canvas.toDataURL("image/png"));
        }
        resolve();
      };
      image.onerror = () => resolve();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });

    exportPromiseRef.current = promise;
    onExportPromiseChange?.(promise);
    void promise.then(() => {
      if (exportPromiseRef.current === promise) {
        exportPromiseRef.current = null;
        onExportPromiseChange?.(null);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div
        ref={surfaceRef}
        className="overflow-hidden rounded-3xl border border-border bg-white"
      >
        <div
          className="relative block h-[180px] w-full cursor-crosshair"
          style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
          onPointerDown={(event) => {
            event.preventDefault();
            const point = pointFromEvent(event);
            if (!point) return;

            event.currentTarget.setPointerCapture(event.pointerId);
            drawingRef.current = true;
            currentStrokeRef.current = [point];
            const nextStrokes = [...strokesRef.current, [point]];
            strokesRef.current = nextStrokes;
            setStrokes(nextStrokes);
            setHasInk(true);
          }}
          onPointerMove={(event) => {
            event.preventDefault();
            if (!drawingRef.current) return;
            const point = pointFromEvent(event);
            if (!point) return;
            currentStrokeRef.current = [...currentStrokeRef.current, point];
            const nextStrokes = [...strokesRef.current];
            if (nextStrokes.length > 0) {
              nextStrokes[nextStrokes.length - 1] = [...currentStrokeRef.current];
              strokesRef.current = nextStrokes;
              setStrokes(nextStrokes);
            }
          }}
          onPointerUp={() => {
            drawingRef.current = false;
            currentStrokeRef.current = [];
            if (strokesRef.current.length > 0) {
              capture(strokesRef.current);
            }
          }}
          onPointerCancel={() => {
            drawingRef.current = false;
            currentStrokeRef.current = [];
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${Math.max(1, surfaceSize.width)} ${surfaceSize.height}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            {strokes.map((stroke, index) =>
              stroke.length > 1 ? (
                <polyline
                  key={`${index}-${stroke.length}`}
                  points={stroke.map((point) => `${point.x},${point.y}`).join(" ")}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : stroke.length === 1 ? (
                <circle
                  key={`${index}-${stroke[0].x}-${stroke[0].y}`}
                  cx={stroke[0].x}
                  cy={stroke[0].y}
                  r="1.5"
                  fill="#0f172a"
                />
              ) : null,
            )}
          </svg>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        {showHelperText ? (
          <p className="text-xs text-muted-foreground">
            Sign inside the box.
          </p>
        ) : (
          <span />
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setStrokes([]);
            strokesRef.current = [];
            exportPromiseRef.current = null;
            onExportPromiseChange?.(null);
            onChange("");
            setHasInk(false);
            currentStrokeRef.current = [];
          }}
        >
          <RefreshCcw className="h-4 w-4" />
          Clear
        </Button>
      </div>
      {showHelperText ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex h-2.5 w-2.5 rounded-full",
              hasInk ? "bg-emerald-500" : "bg-slate-300",
            )}
          />
          {hasInk ? "Signature captured" : "Signature not captured yet"}
        </div>
      ) : null}
    </div>
  );
}

export function DoctorOnboardingWizard() {
  const router = useRouter();
  const [stage, setStage] = useState<OnboardingStage>("hlth_2870");
  const [step1Form, setStep1Form] = useState<DoctorHlth2870FormState>(initialStep1FormState);
  const [step1SignatureDataUrl, setStep1SignatureDataUrl] = useState("");
  const [step1Errors, setStep1Errors] = useState<FieldErrorState<keyof DoctorHlth2870FormState | "signature">>({});
  const [step1Submitting, setStep1Submitting] = useState(false);
  const [step1SubmitError, setStep1SubmitError] = useState("");
  const [, setStep1Response] = useState<DoctorHlth2870Response | null>(null);
  const step1SignatureExportPromiseRef = useRef<Promise<void> | null>(null);

  const [step2Form, setStep2Form] = useState<DoctorHlth2950FormState>(initialStep2FormState);
  const [step2SignatureDataUrl, setStep2SignatureDataUrl] = useState("");
  const [step2Errors, setStep2Errors] = useState<FieldErrorState<keyof DoctorHlth2950FormState | "signature">>({});
  const [step2Submitting, setStep2Submitting] = useState(false);
  const [step2SubmitError, setStep2SubmitError] = useState("");
  const [, setStep2Response] = useState<DoctorHlth2950Response | null>(null);
  const [step2UiContent, setStep2UiContent] = useState<DoctorHlth2950UiContent>(defaultStep2UiContent);
  const step2SignatureExportPromiseRef = useRef<Promise<void> | null>(null);

  const [step3Form, setStep3Form] = useState<DoctorHlth2832FormState>(initialStep3FormState);
  const [step3SignatureDataUrl, setStep3SignatureDataUrl] = useState("");
  const [step3Errors, setStep3Errors] = useState<FieldErrorState<keyof DoctorHlth2832FormState | "signature">>({});
  const [step3Submitting, setStep3Submitting] = useState(false);
  const [step3SubmitError, setStep3SubmitError] = useState("");
  const [, setStep3Response] = useState<DoctorHlth2832Response | null>(null);
  const step3SignatureExportPromiseRef = useRef<Promise<void> | null>(null);

  const [step4Form, setStep4Form] = useState<DoctorHlth2991FormState>(initialStep4FormState);
  const [step4SignatureDataUrl, setStep4SignatureDataUrl] = useState("");
  const [step4Errors, setStep4Errors] = useState<FieldErrorState<keyof DoctorHlth2991FormState | "signature">>({});
  const [step4Submitting, setStep4Submitting] = useState(false);
  const [step4SubmitError, setStep4SubmitError] = useState("");
  const [step4UiContent, setStep4UiContent] = useState<DoctorHlth2991UiContent>(defaultStep4UiContent);
  const step4SignatureExportPromiseRef = useRef<Promise<void> | null>(null);

  const session = useMemo(() => readDoctorLoginSession(), []);
  const accessToken = session?.accessToken ?? "";
  const doctorId = session?.doctorId ?? null;

  useEffect(() => {
    if (!doctorId) return;
    if (isDoctorOnboardingComplete(doctorId)) {
      setStage("complete");
      router.replace("/doctor/dashboard");
      return;
    }

    const storedStage = readDoctorOnboardingStage(doctorId);
    if (storedStage) {
      setStage(storedStage);
    }
  }, [doctorId, router]);

  useEffect(() => {
    if (stage === "complete") {
      router.replace("/doctor/dashboard");
    }
  }, [router, stage]);

  useEffect(() => {
    if (stage !== "hlth_2870" || !accessToken) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response: DoctorHlth2870Response = await fetchDoctorHlth2870Onboarding(accessToken);
        const savedValues: DoctorHlth2870SavedValues | undefined = response.saved_values;
        if (!cancelled && savedValues) {
          setStep1Form((current) => ({
            ...current,
            msp_billing_number: savedValues.msp_billing_number ?? current.msp_billing_number,
            principal_practitioner_name:
              savedValues.principal_practitioner_name ?? current.principal_practitioner_name,
            principal_practitioner_number:
              savedValues.principal_practitioner_number ?? current.principal_practitioner_number,
            effective_date: savedValues.effective_date ?? current.effective_date,
            cancel_date: savedValues.cancel_date ?? current.cancel_date,
            signature_label: savedValues.signature.signature_label ?? current.signature_label,
          }));
          if (savedValues.signature.signature_data_url) {
            setStep1SignatureDataUrl(savedValues.signature.signature_data_url);
          }
        }
      } catch {
        // Keep the local defaults when no prior or clinic-drafted values exist.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, stage]);

  useEffect(() => {
    if (stage !== "hlth_2991" || !accessToken) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response: DoctorHlth2991GetResponse = await fetchDoctorHlth2991Onboarding(accessToken);
        if (!cancelled && response.ui_content) {
          setStep4UiContent(response.ui_content);
        }
      } catch {
        if (!cancelled) {
          setStep4UiContent(defaultStep4UiContent);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, stage]);

  useEffect(() => {
    if (stage !== "hlth_2950" || !accessToken) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response: DoctorHlth2950GetResponse = await fetchDoctorHlth2950Onboarding(accessToken);
        if (!cancelled) {
          if (response.ui_content) {
            setStep2UiContent(response.ui_content);
          }
          if (response.saved_values) {
            setStep2Form((current) => ({
              ...current,
              attachment_action: response.saved_values.attachment_action ?? current.attachment_action,
              msp_practitioner_number:
                response.saved_values.msp_practitioner_number ?? current.msp_practitioner_number,
              facility_or_practice_name:
                response.saved_values.facility_or_practice_name ?? current.facility_or_practice_name,
              msp_facility_number:
                response.saved_values.msp_facility_number ?? current.msp_facility_number,
              facility_physical_address:
                response.saved_values.facility_physical_address ?? current.facility_physical_address,
              facility_physical_city:
                response.saved_values.facility_physical_city ?? current.facility_physical_city,
              facility_physical_postal_code:
                response.saved_values.facility_physical_postal_code ?? current.facility_physical_postal_code,
              contact_email: response.saved_values.contact_email ?? current.contact_email,
              contact_phone_number:
                response.saved_values.contact_phone_number ?? current.contact_phone_number,
              contact_fax_number:
                response.saved_values.contact_fax_number ?? current.contact_fax_number,
              new_attachment_effective_date:
                response.saved_values.new_attachment_effective_date ?? current.new_attachment_effective_date,
              new_attachment_cancellation_date:
                response.saved_values.new_attachment_cancellation_date ?? current.new_attachment_cancellation_date,
              attachment_cancellation_date:
                response.saved_values.attachment_cancellation_date ?? current.attachment_cancellation_date,
              change_attachment_effective_date:
                response.saved_values.change_attachment_effective_date ?? current.change_attachment_effective_date,
              change_attachment_cancellation_date:
                response.saved_values.change_attachment_cancellation_date ?? current.change_attachment_cancellation_date,
              confirm_declarations:
                response.saved_values.confirm_declarations ?? current.confirm_declarations,
              signature_label:
                response.saved_values.signature.signature_label ?? current.signature_label,
            }));
            if (response.saved_values.signature.signature_data_url) {
              setStep2SignatureDataUrl(response.saved_values.signature.signature_data_url);
            }
          }
        }
      } catch {
        if (!cancelled) {
          setStep2UiContent(defaultStep2UiContent);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, stage]);

  function setStep1Field<K extends keyof DoctorHlth2870FormState>(
    field: K,
    value: DoctorHlth2870FormState[K],
  ) {
    setStep1Form((current) => ({ ...current, [field]: value }));
    setStep1Errors((current) => {
      const next = { ...current, [field]: "" } as typeof current;
      if (typeof value === "string" && field === "effective_date") {
        if (isFutureDate(value)) {
          next.effective_date = "effective_date cannot be in the future.";
        } else if (step1Form.cancel_date && step1Form.cancel_date < value) {
          next.cancel_date = "cancel_date cannot be earlier than effective_date.";
        } else {
          next.cancel_date = "";
        }
      }
      if (typeof value === "string" && field === "cancel_date") {
        if (step1Form.effective_date && value < step1Form.effective_date) {
          next.cancel_date = "cancel_date cannot be earlier than effective_date.";
        } else {
          next.cancel_date = "";
        }
      }
      return next;
    });
    setStep1SubmitError("");
  }

  function normalizeStep2Value<K extends keyof DoctorHlth2950FormState>(field: K, value: DoctorHlth2950FormState[K]) {
    if (typeof value !== "string") return value;
    switch (field) {
      case "msp_practitioner_number":
      case "msp_facility_number":
      case "contact_phone_number":
      case "contact_fax_number":
        return digitsOnly(value).slice(0, field.startsWith("contact_") ? 10 : 5) as DoctorHlth2950FormState[K];
      case "facility_or_practice_name":
        return capitalizeLeadingLetter(value) as DoctorHlth2950FormState[K];
      case "facility_physical_address":
        return capitalizeLeadingLetter(value) as DoctorHlth2950FormState[K];
      case "facility_physical_city":
        return normalizeCityInput(value) as DoctorHlth2950FormState[K];
      case "facility_physical_postal_code":
        return normalizePostalCode(value) as DoctorHlth2950FormState[K];
      case "contact_email":
        return value.trim() as DoctorHlth2950FormState[K];
      case "signature_label":
        return capitalizeLeadingLetter(value) as DoctorHlth2950FormState[K];
      default:
        return value;
    }
  }

  function setStep2Field<K extends keyof DoctorHlth2950FormState>(
    field: K,
    value: DoctorHlth2950FormState[K],
  ) {
    const normalizedValue = normalizeStep2Value(field, value);
    setStep2Form((current) => ({ ...current, [field]: normalizedValue }));
    setStep2Errors((current) => {
      const next = { ...current, [field]: "" } as typeof current;
      if (field === "msp_practitioner_number" && typeof normalizedValue === "string") {
        next.msp_practitioner_number = getLiveFiveDigitError(normalizedValue, "msp practitioner number");
      }
      if (field === "msp_facility_number" && typeof normalizedValue === "string") {
        next.msp_facility_number = getLiveFiveDigitError(normalizedValue, "msp facility number");
      }
      if (field === "contact_phone_number" && typeof normalizedValue === "string") {
        next.contact_phone_number = getLiveTenDigitError(normalizedValue, "contact phone number");
      }
      if (field === "contact_fax_number" && typeof normalizedValue === "string") {
        next.contact_fax_number = getLiveTenDigitError(normalizedValue, "contact fax number", "fax number");
      }
      if (field === "contact_email" && typeof normalizedValue === "string") {
        next.contact_email = getLiveEmailError(normalizedValue, "contact email");
      }
      if (field === "new_attachment_cancellation_date" && typeof normalizedValue === "string") {
        if (step2Form.new_attachment_effective_date && normalizedValue < step2Form.new_attachment_effective_date) {
          next.new_attachment_cancellation_date =
            "new_attachment_cancellation_date cannot be earlier than new_attachment_effective_date.";
        } else {
          next.new_attachment_cancellation_date = "";
        }
      }
      if (field === "new_attachment_effective_date" && typeof normalizedValue === "string") {
        if (isFutureDate(normalizedValue)) {
          next.new_attachment_effective_date = "new_attachment_effective_date cannot be in the future.";
        }
        if (
          step2Form.new_attachment_cancellation_date &&
          step2Form.new_attachment_cancellation_date < normalizedValue
        ) {
          next.new_attachment_cancellation_date =
            "new_attachment_cancellation_date cannot be earlier than new_attachment_effective_date.";
        }
      }
      if (field === "attachment_cancellation_date" && typeof normalizedValue === "string") {
        next.attachment_cancellation_date = "";
      }
      if (field === "change_attachment_effective_date" && typeof normalizedValue === "string") {
        if (isFutureDate(normalizedValue)) {
          next.change_attachment_effective_date =
            "change_attachment_effective_date cannot be in the future.";
        }
        if (
          step2Form.change_attachment_cancellation_date &&
          step2Form.change_attachment_cancellation_date < normalizedValue
        ) {
          next.change_attachment_cancellation_date =
            "change_attachment_cancellation_date cannot be earlier than change_attachment_effective_date.";
        }
      }
      if (field === "change_attachment_cancellation_date" && typeof normalizedValue === "string") {
        if (
          step2Form.change_attachment_effective_date &&
          normalizedValue < step2Form.change_attachment_effective_date
        ) {
          next.change_attachment_cancellation_date =
            "change_attachment_cancellation_date cannot be earlier than change_attachment_effective_date.";
        } else {
          next.change_attachment_cancellation_date = "";
        }
      }
      return next;
    });
    setStep2SubmitError("");
  }

  function setStep2AttachmentAction(action: DoctorHlth2950FormState["attachment_action"]) {
    setStep2Form((current) => ({ ...current, attachment_action: action }));
    setStep2Errors({});
    setStep2SubmitError("");
  }

  useEffect(() => {
    setStep2Errors((current) => {
      const next = { ...current };

      const practitionerValue = step2Form.msp_practitioner_number.trim();
      next.msp_practitioner_number = practitionerValue
        ? getLiveFiveDigitError(step2Form.msp_practitioner_number, "msp practitioner number")
        : "";

      const facilityValue = step2Form.msp_facility_number.trim();
      next.msp_facility_number = facilityValue
        ? getLiveFiveDigitError(step2Form.msp_facility_number, "msp facility number")
        : "";

      return next;
    });
  }, [step2Form.msp_practitioner_number, step2Form.msp_facility_number]);

  useEffect(() => {
    setStep3Errors((current) => {
      const next = { ...current };

      const billingValue = step3Form.msp_billing_number.trim();
      next.msp_billing_number = billingValue
        ? getLiveDigitCountError(step3Form.msp_billing_number, "MSP billing number", 10)
        : "";

      const paymentValue = step3Form.payment_number.trim();
      next.payment_number = paymentValue
        ? getLiveDigitCountError(step3Form.payment_number, "payment number", 5)
        : "";

      const institutionValue = step3Form.institution_number.trim();
      next.institution_number = institutionValue
        ? getLiveDigitCountError(step3Form.institution_number, "institution number", 3)
        : "";

      const branchValue = step3Form.branch_number.trim();
      next.branch_number = branchValue
        ? getLiveDigitCountError(step3Form.branch_number, "branch number", 5)
        : "";

      return next;
    });
  }, [
    step3Form.branch_number,
    step3Form.institution_number,
    step3Form.msp_billing_number,
    step3Form.payment_number,
  ]);

  function setStep3Field<K extends keyof DoctorHlth2832FormState>(
    field: K,
    value: DoctorHlth2832FormState[K],
  ) {
    const normalizedValue =
      typeof value === "string"
        ? field === "msp_billing_number"
          ? digitsOnly(value).slice(0, 10)
          : field === "payment_number"
            ? digitsOnly(value).slice(0, 5)
            : field === "institution_number"
              ? digitsOnly(value).slice(0, 3)
              : field === "branch_number"
                ? digitsOnly(value).slice(0, 5)
                : field === "postal_code"
                  ? normalizePostalCode(value)
                  : field === "city"
                    ? normalizeCityInput(value)
                    : field === "province"
                      ? normalizeProvinceInput(value)
                      : field === "telephone" || field === "telephone2"
                        ? digitsOnly(value).slice(0, 10)
                        : field === "payee_name" || field === "institution_bank_name" || field === "branch_name" || field === "street_address" || field === "signature_label"
                          ? capitalizeLeadingLetter(value)
                          : value.trim()
        : value;
    setStep3Form((current) => ({ ...current, [field]: normalizedValue }));
    setStep3Errors((current) => {
      const next = { ...current, [field]: "" } as typeof current;
      if (field === "msp_billing_number" && typeof normalizedValue === "string") {
        next.msp_billing_number = getLiveDigitCountError(normalizedValue, "MSP billing number", 10);
      }
      if (field === "payment_number" && typeof normalizedValue === "string") {
        next.payment_number = getLiveDigitCountError(normalizedValue, "payment number", 5);
      }
      if (field === "institution_number" && typeof normalizedValue === "string") {
        next.institution_number = getLiveDigitCountError(normalizedValue, "institution number", 3);
      }
      if (field === "branch_number" && typeof normalizedValue === "string") {
        next.branch_number = getLiveDigitCountError(normalizedValue, "branch number", 5);
      }
      if (field === "telephone" && typeof normalizedValue === "string") {
        next.telephone = getLiveTenDigitError(normalizedValue, "telephone number");
      }
      if (field === "telephone2" && typeof normalizedValue === "string") {
        next.telephone2 = getLiveTenDigitError(normalizedValue, "telephone number");
      }
      return next;
    });
    setStep3SubmitError("");
  }

  function setStep4Field<K extends keyof DoctorHlth2991FormState>(
    field: K,
    value: DoctorHlth2991FormState[K],
  ) {
    const normalizedValue =
      typeof value === "string"
        ? field === "surname" ||
          field === "given_name" ||
          field === "given_name_second" ||
          field === "citizenship" ||
          field === "status_in_canada" ||
          field === "home_mailing_address" ||
          field === "home_city" ||
          field === "business_mailing_address" ||
          field === "business_city" ||
          field === "medical_school" ||
          field === "royal_college_specialty" ||
          field === "royal_college_subspecialty" ||
          field === "non_royal_college_specialty" ||
          field === "non_royal_college_subspecialty" ||
          field === "registrations" ||
          field === "signature_label"
          ? field === "home_city" || field === "business_city"
            ? normalizeCityInput(value)
            : field === "surname" || field === "given_name" || field === "given_name_second"
              ? normalizeNameInput(value)
              : capitalizeLeadingLetter(value)
          : field === "home_email_address" || field === "business_email_address"
            ? value.trim()
            : field === "home_postal_code" || field === "business_postal_code"
              ? normalizePostalCode(value)
              : field === "home_phone_number" ||
                  field === "home_fax_number" ||
                  field === "business_phone_number" ||
                  field === "business_fax_number"
                ? digitsOnly(value).slice(0, 10)
                : field === "date_of_birth" ||
                    field === "date_of_graduation" ||
                    field === "date_of_registration" ||
                    field === "certification_date_1" ||
                    field === "certification_date_2" ||
                    field === "certification_date_3" ||
                    field === "certification_date_4" ||
                    field === "license_effective_date" ||
                    field === "msp_effective_date" ||
                    field === "cancellation_date"
                  ? value.trim()
                  : value
        : value;
    setStep4Form((current) => ({ ...current, [field]: normalizedValue }));
    setStep4Errors((current) => {
      const next = { ...current, [field]: "" } as typeof current;
      if (field === "date_of_birth" && typeof normalizedValue === "string") {
        next.date_of_birth = getLiveFutureDateError(normalizedValue, "Date of birth");
      }
      if (field === "date_of_graduation" && typeof normalizedValue === "string") {
        next.date_of_graduation = getLiveFutureDateError(normalizedValue, "Date of graduation");
      }
      if (field === "date_of_registration" && typeof normalizedValue === "string") {
        next.date_of_registration = getLiveFutureDateError(normalizedValue, "Date of registration");
      }
      if (field === "certification_date_1" && typeof normalizedValue === "string") {
        next.certification_date_1 = getLiveFutureDateError(normalizedValue, "Certification date 1");
      }
      if (field === "certification_date_2" && typeof normalizedValue === "string") {
        next.certification_date_2 = getLiveFutureDateError(normalizedValue, "Certification date 2");
      }
      if (field === "certification_date_3" && typeof normalizedValue === "string") {
        next.certification_date_3 = getLiveFutureDateError(normalizedValue, "Certification date 3");
      }
      if (field === "certification_date_4" && typeof normalizedValue === "string") {
        next.certification_date_4 = getLiveFutureDateError(normalizedValue, "Certification date 4");
      }
      if (field === "msp_effective_date" && typeof normalizedValue === "string") {
        if (isFutureDate(normalizedValue)) {
          next.msp_effective_date = "msp_effective_date cannot be in the future.";
        }
        if (step4Form.cancellation_date && step4Form.cancellation_date < normalizedValue) {
          next.cancellation_date = "cancellation_date cannot be earlier than msp_effective_date.";
        }
      }
      if (field === "cancellation_date" && typeof normalizedValue === "string") {
        if (step4Form.msp_effective_date && normalizedValue < step4Form.msp_effective_date) {
          next.cancellation_date = "cancellation_date cannot be earlier than msp_effective_date.";
        } else {
          next.cancellation_date = "";
        }
      }
      if (field === "home_phone_number" && typeof normalizedValue === "string") {
        next.home_phone_number = getLiveTenDigitError(normalizedValue, "home phone number");
      }
      if (field === "home_fax_number" && typeof normalizedValue === "string") {
        next.home_fax_number = getLiveTenDigitError(normalizedValue, "home fax number", "fax number");
      }
      if (field === "business_phone_number" && typeof normalizedValue === "string") {
        next.business_phone_number = getLiveTenDigitError(normalizedValue, "business phone number");
      }
      if (field === "business_fax_number" && typeof normalizedValue === "string") {
        next.business_fax_number = getLiveTenDigitError(normalizedValue, "business fax number", "fax number");
      }
      if (field === "home_email_address" && typeof normalizedValue === "string") {
        next.home_email_address = getLiveEmailError(normalizedValue, "home email address");
      }
      if (field === "business_email_address" && typeof normalizedValue === "string") {
        next.business_email_address = getLiveEmailError(normalizedValue, "business email address");
      }
      return next;
    });
    setStep4SubmitError("");
  }

  function setStep4Citizenship(value: string) {
    setStep4Form((current) => ({
      ...current,
      citizenship: value,
      status_in_canada: value.trim().toLowerCase() === "canadian" ? "" : current.status_in_canada,
    }));
    setStep4Errors((current) => ({ ...current, citizenship: "", status_in_canada: "" }));
    setStep4SubmitError("");
  }

  function setStep4LicenseType(
    licenseType: DoctorHlth2991FormState["license_type"],
  ) {
    setStep4Form((current) => ({
      ...current,
      license_type: licenseType,
      license_effective_date: licenseType === "FULL" ? current.license_effective_date : "",
    }));
    setStep4Errors({});
    setStep4SubmitError("");
  }

  function completeOnboarding() {
    setStage("complete");
    if (doctorId) {
      clearDoctorOnboardingStage(doctorId);
      markDoctorOnboardingComplete(doctorId);
    }
  }

  async function handleSubmitStep1() {
    if (step1SignatureExportPromiseRef.current) {
      await step1SignatureExportPromiseRef.current;
    }

    const nextErrors = validateStep1(step1Form, step1SignatureDataUrl);
    setStep1Errors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!accessToken) {
      setStep1SubmitError("Your session is missing an access token. Please sign in again.");
      return;
    }

    setStep1Submitting(true);
    setStep1SubmitError("");

    try {
      const payload: DoctorHlth2870Request = {
        msp_billing_number: step1Form.msp_billing_number.trim(),
        principal_practitioner_name: step1Form.principal_practitioner_name.trim(),
        principal_practitioner_number: step1Form.principal_practitioner_number.trim(),
        effective_date: step1Form.effective_date,
        cancel_date: step1Form.cancel_date,
        signature: {
          signature_data_url: step1SignatureDataUrl,
          signature_label: step1Form.signature_label.trim(),
        },
      };

      const response = await submitDoctorHlth2870Onboarding(accessToken, payload);

      if (response.missing_fields.length > 0) {
        throw new Error(
          `The backend still reports missing fields: ${response.missing_fields.join(", ")}.`,
        );
      }

      setStep1Response(response);
    setStep2Form((current) => ({
      ...current,
      msp_practitioner_number: step1Form.msp_billing_number.trim(),
      facility_or_practice_name: step1Form.principal_practitioner_name.trim(),
    }));
    setStep2SignatureDataUrl(step1SignatureDataUrl);
    setStep3Form((current) => ({
        ...current,
        msp_billing_number: step1Form.msp_billing_number.trim(),
        payment_number: step1Form.msp_billing_number.trim(),
        signature_label: step1Form.signature_label.trim(),
      }));
      setStep3SignatureDataUrl(step1SignatureDataUrl);
      setStage("hlth_2950");
      if (doctorId) {
        storeDoctorOnboardingStage(doctorId, "hlth_2950");
      }
    } catch (error) {
      setStep1SubmitError(error instanceof Error ? error.message : "Could not save the onboarding form.");
    } finally {
      setStep1Submitting(false);
    }
  }

  async function handleSubmitStep2() {
    if (step2SignatureExportPromiseRef.current) {
      await step2SignatureExportPromiseRef.current;
    }

    const nextErrors = validateStep2(step2Form, step2SignatureDataUrl);
    setStep2Errors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!accessToken) {
      setStep2SubmitError("Your session is missing an access token. Please sign in again.");
      return;
    }

    setStep2Submitting(true);
    setStep2SubmitError("");

    try {
      const payload: DoctorHlth2950Request = {
        attachment_action: step2Form.attachment_action,
        msp_practitioner_number: step2Form.msp_practitioner_number.trim(),
        facility_or_practice_name: step2Form.facility_or_practice_name.trim(),
        msp_facility_number: step2Form.msp_facility_number.trim(),
        facility_physical_address: step2Form.facility_physical_address.trim(),
        facility_physical_city: step2Form.facility_physical_city.trim(),
        facility_physical_postal_code: normalizePostalCode(step2Form.facility_physical_postal_code),
        contact_email: step2Form.contact_email.trim(),
        contact_phone_number: digitsOnly(step2Form.contact_phone_number),
        contact_fax_number: digitsOnly(step2Form.contact_fax_number),
        new_attachment_effective_date:
          step2Form.attachment_action === "ADD" ? step2Form.new_attachment_effective_date : "",
        new_attachment_cancellation_date:
          step2Form.attachment_action === "ADD"
            ? step2Form.new_attachment_cancellation_date
            : "",
        ...(step2Form.attachment_action === "CANCEL"
          ? {
              attachment_cancellation_date: step2Form.attachment_cancellation_date.trim(),
            }
          : {}),
        ...(step2Form.attachment_action === "CHANGE"
          ? {
              change_attachment_effective_date: step2Form.change_attachment_effective_date.trim(),
              change_attachment_cancellation_date:
                step2Form.change_attachment_cancellation_date.trim(),
            }
          : {}),
        confirm_declarations: step2Form.confirm_declarations,
        signature: {
          signature_data_url: step2SignatureDataUrl,
          signature_label: step2Form.signature_label.trim(),
        },
      };

      const response = await submitDoctorHlth2950Onboarding(accessToken, payload);

      if (response.missing_fields.length > 0) {
        throw new Error(
          `The backend still reports missing fields: ${response.missing_fields.join(", ")}.`,
        );
      }

      setStep2Response(response);
      setStage("hlth_2832");
      if (doctorId) {
        storeDoctorOnboardingStage(doctorId, "hlth_2832");
      }
    } catch (error) {
      setStep2SubmitError(error instanceof Error ? error.message : "Could not save the onboarding form.");
    } finally {
      setStep2Submitting(false);
    }
  }

  async function handleSubmitStep3() {
    if (step3SignatureExportPromiseRef.current) {
      await step3SignatureExportPromiseRef.current;
    }

    const nextErrors = validateStep3(step3Form, step3SignatureDataUrl);
    setStep3Errors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!accessToken) {
      setStep3SubmitError("Your session is missing an access token. Please sign in again.");
      return;
    }

    setStep3Submitting(true);
    setStep3SubmitError("");

    try {
      const payload: DoctorHlth2832Request = {
        msp_billing_number: step3Form.msp_billing_number.trim(),
        payment_number: step3Form.payment_number.trim(),
        payee_name: step3Form.payee_name.trim(),
        institution_number: step3Form.institution_number.trim(),
        branch_number: step3Form.branch_number.trim(),
        account_number: step3Form.account_number.trim(),
        institution_bank_name: step3Form.institution_bank_name.trim(),
        branch_name: step3Form.branch_name.trim(),
        street_address: step3Form.street_address.trim(),
        city: step3Form.city.trim(),
        province: step3Form.province.trim(),
        postal_code: normalizePostalCode(step3Form.postal_code),
        telephone: digitsOnly(step3Form.telephone),
        telephone2: digitsOnly(step3Form.telephone2),
        signature: {
          signature_data_url: step3SignatureDataUrl,
          signature_label: step3Form.signature_label.trim(),
        },
      };

      const response = await submitDoctorHlth2832Onboarding(accessToken, payload);

      if (response.missing_fields.length > 0) {
        throw new Error(
          `The backend still reports missing fields: ${response.missing_fields.join(", ")}.`,
        );
      }

      setStep3Response(response);
      setStep4Form((current) => ({
        ...current,
        given_name: splitDisplayName(step3Form.payee_name.trim()).givenName,
        given_name_second: splitDisplayName(step3Form.payee_name.trim()).givenNameSecond,
        surname: splitDisplayName(step3Form.payee_name.trim()).surname,
        business_mailing_address: step2Form.facility_physical_address.trim(),
        business_city: step2Form.facility_physical_city.trim(),
        business_postal_code: step2Form.facility_physical_postal_code.trim(),
        business_phone_number: step2Form.contact_phone_number.trim(),
        business_fax_number: step2Form.contact_fax_number.trim(),
        business_email_address: step2Form.contact_email.trim(),
        college_id: step3Form.payment_number.trim(),
        signature_label: step3Form.payee_name.trim(),
      }));
      setStep4SignatureDataUrl(step3SignatureDataUrl);
      setStage("hlth_2991");
      if (doctorId) {
        storeDoctorOnboardingStage(doctorId, "hlth_2991");
      }
    } catch (error) {
      setStep3SubmitError(error instanceof Error ? error.message : "Could not save the onboarding form.");
    } finally {
      setStep3Submitting(false);
    }
  }

  async function handleSubmitStep4() {
    if (step4SignatureExportPromiseRef.current) {
      await step4SignatureExportPromiseRef.current;
    }

    const nextErrors = validateStep4(step4Form, step4SignatureDataUrl);
    setStep4Errors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!accessToken) {
      setStep4SubmitError("Your session is missing an access token. Please sign in again.");
      return;
    }

    setStep4Submitting(true);
    setStep4SubmitError("");

    try {
      const payload: DoctorHlth2991Request & { "Cancellation Date": string } = {
        surname: step4Form.surname.trim(),
        given_name: step4Form.given_name.trim(),
        given_name_second: step4Form.given_name_second.trim(),
        date_of_birth: step4Form.date_of_birth,
        gender: step4Form.gender as DoctorHlth2991Request["gender"],
        citizenship: step4CitizenshipValue,
        status_in_canada:
          step4RequiresStatusInCanada
            ? step4Form.status_in_canada.trim()
            : null,
        home_mailing_address: step4Form.home_mailing_address.trim(),
        home_city: step4Form.home_city.trim(),
        home_postal_code: normalizePostalCode(step4Form.home_postal_code),
        home_phone_number: digitsOnly(step4Form.home_phone_number),
        home_fax_number: digitsOnly(step4Form.home_fax_number),
        home_email_address: step4Form.home_email_address.trim(),
        business_mailing_address: step4Form.business_mailing_address.trim(),
        business_city: step4Form.business_city.trim(),
        business_postal_code: normalizePostalCode(step4Form.business_postal_code),
        business_phone_number: digitsOnly(step4Form.business_phone_number),
        business_fax_number: digitsOnly(step4Form.business_fax_number),
        business_email_address: step4Form.business_email_address.trim(),
        medical_school: step4Form.medical_school.trim(),
        date_of_graduation: step4Form.date_of_graduation,
        royal_college_specialty: step4Form.royal_college_specialty.trim(),
        royal_college_subspecialty: step4Form.royal_college_subspecialty.trim(),
        non_royal_college_specialty: step4Form.non_royal_college_specialty.trim(),
        non_royal_college_subspecialty: step4Form.non_royal_college_subspecialty.trim(),
        certification_date_1: step4Form.certification_date_1,
        certification_date_2: step4Form.certification_date_2.trim() || null,
        certification_date_3: step4Form.certification_date_3.trim() || null,
        certification_date_4: step4Form.certification_date_4.trim() || null,
        date_of_registration: step4Form.date_of_registration,
        college_id: step4Form.college_id.trim(),
        registrations: step4Form.registrations.trim(),
        license_type: step4Form.license_type as DoctorHlth2991Request["license_type"],
        license_effective_date:
          step4Form.license_type === "FULL" ? step4Form.license_effective_date.trim() || null : null,
        msp_effective_date: step4Form.msp_effective_date,
        cancellation_date: step4Form.cancellation_date.trim(),
        "Cancellation Date": step4Form.cancellation_date.trim(),
        confirm_declarations: step4Form.confirm_declarations,
        signature: {
          signature_data_url: step4SignatureDataUrl,
          signature_label: step4Form.signature_label.trim(),
        },
      };

      const response = await submitDoctorHlth2991Onboarding(accessToken, payload);

      if (response.missing_fields.length > 0) {
        throw new Error(
          `The backend still reports missing fields: ${response.missing_fields.join(", ")}.`,
        );
      }

      setStage("hlth_2820");
      if (doctorId) {
        storeDoctorOnboardingStage(doctorId, "hlth_2820");
      }
    } catch (error) {
      setStep4SubmitError(error instanceof Error ? error.message : "Could not save the onboarding form.");
    } finally {
      setStep4Submitting(false);
    }
  }

  const step4CitizenshipValue = (step4Form.citizenship ?? "").trim();
  const step4RequiresStatusInCanada =
    step4CitizenshipValue.length > 0 && step4CitizenshipValue.toLowerCase() !== "canadian";

  if (stage === "complete") {
    return (
      <DoctorPageShell eyebrow="Onboarding complete" title="Redirecting to dashboard">
        <DoctorSection
          title="Submission received"
          description="All onboarding steps are complete. Taking you to the doctor dashboard now."
        >
          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-emerald-900">
                    Onboarding complete
                  </p>
                  <p className="text-sm text-emerald-800">
                    Redirecting to the dashboard...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DoctorSection>
      </DoctorPageShell>
    );
  }

  const onboardingStepNumber =
    stage === "hlth_2870"
      ? 1
      : stage === "hlth_2950"
        ? 2
        : stage === "hlth_2832"
          ? 3
          : stage === "hlth_2991"
            ? 4
            : 5;
  const onboardingStepLabel =
    stage === "hlth_2870"
      ? "HLTH 2870"
      : stage === "hlth_2950"
        ? "HLTH 2950"
        : stage === "hlth_2832"
          ? "HLTH 2832"
          : stage === "hlth_2991"
            ? "HLTH 2991"
            : "HLTH 2820";
  const onboardingProgressWidth =
    stage === "hlth_2870"
      ? "20%"
      : stage === "hlth_2950"
        ? "40%"
        : stage === "hlth_2832"
          ? "60%"
          : stage === "hlth_2991"
            ? "80%"
            : "100%";

  return (
    <DoctorPageShell>
      <DoctorSection>
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground">
              Doctor onboarding
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
            <span>
              Step
              {" "}
              {onboardingStepNumber}
              {" "}
              of 5
            </span>
            <span>
              {onboardingStepLabel}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: onboardingProgressWidth }}
            />
          </div>
        </div>

        {stage === "hlth_2870" ? (
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmitStep1();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <FormLabel htmlFor="msp_billing_number">MSP billing number</FormLabel>
                <Input
                  id="msp_billing_number"
                  value={step1Form.msp_billing_number}
                  onChange={(event) => setStep1Field("msp_billing_number", event.target.value)}
                  placeholder="1234567"
                  autoFocus
                />
                {step1Errors.msp_billing_number ? (
                  <p className="text-xs text-destructive">{step1Errors.msp_billing_number}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <FormLabel htmlFor="principal_practitioner_name">Principal practitioner name</FormLabel>
                <Input
                  id="principal_practitioner_name"
                  value={step1Form.principal_practitioner_name}
                  onChange={(event) => setStep1Field("principal_practitioner_name", event.target.value)}
                  placeholder="Mardock Clinic"
                />
                {step1Errors.principal_practitioner_name ? (
                  <p className="text-xs text-destructive">{step1Errors.principal_practitioner_name}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <FormLabel htmlFor="principal_practitioner_number">Principal practitioner number</FormLabel>
                <Input
                  id="principal_practitioner_number"
                  value={step1Form.principal_practitioner_number}
                  onChange={(event) =>
                    setStep1Field("principal_practitioner_number", event.target.value)
                  }
                  placeholder="PAY123"
                />
                {step1Errors.principal_practitioner_number ? (
                  <p className="text-xs text-destructive">{step1Errors.principal_practitioner_number}</p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2 md:col-span-2">
                <div className="grid gap-2">
                  <FormLabel htmlFor="effective_date">Effective date</FormLabel>
                  <Input
                    id="effective_date"
                    type="date"
                    value={step1Form.effective_date}
                    onChange={(event) => setStep1Field("effective_date", event.target.value)}
                  />
                  {step1Errors.effective_date ? (
                    <p className="text-xs text-destructive">{step1Errors.effective_date}</p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <FormLabel htmlFor="cancel_date">Cancel date</FormLabel>
                  <Input
                    id="cancel_date"
                    type="date"
                    value={step1Form.cancel_date}
                    onChange={(event) => setStep1Field("cancel_date", event.target.value)}
                  />
                  <div className="flex items-center justify-between gap-3">
                    {step1Errors.cancel_date ? (
                      <p className="text-xs text-destructive">{step1Errors.cancel_date}</p>
                    ) : null}
                    {step1Form.effective_date ? (
                      <p className="text-xs text-muted-foreground">
                        Effective: {isoDateLabel(step1Form.effective_date)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 md:col-span-2">
                <FormLabel htmlFor="signature_label">Signature label</FormLabel>
                <Input
                  id="signature_label"
                  value={step1Form.signature_label}
                  onChange={(event) => setStep1Field("signature_label", event.target.value)}
                  placeholder="Dr Mat Mardock"
                />
                {step1Errors.signature_label ? (
                  <p className="text-xs text-destructive">{step1Errors.signature_label}</p>
                ) : null}
              </div>

              <div className="grid gap-2 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">Signature</span>
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <PenLine className="h-3.5 w-3.5" />
                    Draw your signature
                  </div>
                </div>
                <SignaturePad
                  showHelperText={false}
                  value={step1SignatureDataUrl}
                  onChange={setStep1SignatureDataUrl}
                  onExportPromiseChange={(promise) => {
                    step1SignatureExportPromiseRef.current = promise;
                  }}
                />
                {step1Errors.signature ? (
                  <p className="text-xs text-destructive">{step1Errors.signature}</p>
                ) : null}
              </div>
            </div>

            {step1SubmitError ? (
              <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {step1SubmitError}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="h-12 flex-1" disabled={step1Submitting}>
                {step1Submitting ? "Submitting..." : "Continue to step 2"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        ) : stage === "hlth_2950" ? (
          <div className="space-y-6">
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmitStep2();
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
                  <div className="grid gap-2">
                    <FormLabel htmlFor="msp_practitioner_number">MSP practitioner number</FormLabel>
                    <Input
                      id="msp_practitioner_number"
                      value={step2Form.msp_practitioner_number}
                      onChange={(event) =>
                        setStep2Field("msp_practitioner_number", digitsOnly(event.target.value))
                      }
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="12345"
                    />
                    {step2Errors.msp_practitioner_number ? (
                      <p className="text-xs text-destructive">{step2Errors.msp_practitioner_number}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <FormLabel htmlFor="facility_or_practice_name">Facility or practice name</FormLabel>
                    <Input
                      id="facility_or_practice_name"
                      value={step2Form.facility_or_practice_name}
                      onChange={(event) =>
                        setStep2Field("facility_or_practice_name", event.target.value)
                      }
                      placeholder="Mardock Clinic"
                    />
                    {step2Errors.facility_or_practice_name ? (
                      <p className="text-xs text-destructive">{step2Errors.facility_or_practice_name}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
                  <div className="grid gap-2">
                    <FormLabel htmlFor="msp_facility_number">MSP facility number</FormLabel>
                    <Input
                      id="msp_facility_number"
                      value={step2Form.msp_facility_number}
                      onChange={(event) =>
                        setStep2Field("msp_facility_number", digitsOnly(event.target.value))
                      }
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="12345"
                    />
                    {step2Errors.msp_facility_number ? (
                      <p className="text-xs text-destructive">{step2Errors.msp_facility_number}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <FormLabel htmlFor="facility_physical_address">Facility physical address</FormLabel>
                    <Input
                      id="facility_physical_address"
                      value={step2Form.facility_physical_address}
                      onChange={(event) =>
                        setStep2Field("facility_physical_address", event.target.value)
                      }
                      placeholder="456 Clinic Ave"
                    />
                    {step2Errors.facility_physical_address ? (
                      <p className="text-xs text-destructive">{step2Errors.facility_physical_address}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
                  <div className="grid gap-2">
                    <FormLabel htmlFor="facility_physical_city">City</FormLabel>
                    <Input
                      id="facility_physical_city"
                      value={step2Form.facility_physical_city}
                      onChange={(event) =>
                        setStep2Field("facility_physical_city", event.target.value)
                      }
                      placeholder="Burnaby"
                    />
                    {step2Errors.facility_physical_city ? (
                      <p className="text-xs text-destructive">{step2Errors.facility_physical_city}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <FormLabel htmlFor="facility_physical_postal_code">Postal code</FormLabel>
                    <Input
                      id="facility_physical_postal_code"
                      value={step2Form.facility_physical_postal_code}
                      onChange={(event) =>
                        setStep2Field(
                          "facility_physical_postal_code",
                          normalizePostalCode(event.target.value),
                        )
                      }
                      placeholder="V5H0A1"
                    />
                    {step2Errors.facility_physical_postal_code ? (
                      <p className="text-xs text-destructive">
                        {step2Errors.facility_physical_postal_code}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <FormLabel htmlFor="contact_email">Contact email</FormLabel>
                  <Input
                    id="contact_email"
                    type="email"
                    value={step2Form.contact_email}
                    onChange={(event) => setStep2Field("contact_email", event.target.value)}
                    placeholder="admin@mardock.com"
                  />
                  {step2Errors.contact_email ? (
                    <p className="text-xs text-destructive">{step2Errors.contact_email}</p>
                  ) : null}
                </div>

                <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
                  <div className="grid gap-2">
                    <FormLabel htmlFor="contact_phone_number">Contact phone number</FormLabel>
                    <Input
                      id="contact_phone_number"
                      type="tel"
                      value={step2Form.contact_phone_number}
                      onChange={(event) =>
                        setStep2Field("contact_phone_number", digitsOnly(event.target.value))
                      }
                      placeholder="6043334444"
                    />
                    {step2Errors.contact_phone_number ? (
                      <p className="text-xs text-destructive">{step2Errors.contact_phone_number}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <FormLabel htmlFor="contact_fax_number">Contact fax number</FormLabel>
                    <Input
                      id="contact_fax_number"
                      type="tel"
                      value={step2Form.contact_fax_number}
                      onChange={(event) =>
                        setStep2Field("contact_fax_number", digitsOnly(event.target.value))
                      }
                      placeholder="6043334445"
                    />
                    {step2Errors.contact_fax_number ? (
                    <p className="text-xs text-destructive">{step2Errors.contact_fax_number}</p>
                  ) : null}
                  </div>
                </div>

                <div className="grid gap-3 md:col-span-2">
                  <p className="text-sm font-medium text-foreground">Attachment action</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <ActionCard
                      checked={step2Form.attachment_action === "ADD"}
                      label="Add the attachment"
                      onClick={() => setStep2AttachmentAction("ADD")}
                    />
                    <ActionCard
                      checked={step2Form.attachment_action === "CANCEL"}
                      label="Cancel existing attachment"
                      onClick={() => setStep2AttachmentAction("CANCEL")}
                    />
                    <ActionCard
                      checked={step2Form.attachment_action === "CHANGE"}
                      label="Change existing attachment"
                      onClick={() => setStep2AttachmentAction("CHANGE")}
                    />
                  </div>
                  {step2Errors.attachment_action ? (
                    <p className="text-xs text-destructive">{step2Errors.attachment_action}</p>
                  ) : null}
                </div>

                {step2Form.attachment_action === "ADD" ? (
                  <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
                    <div className="grid gap-2">
                      <FormLabel htmlFor="new_attachment_effective_date">New attachment effective date</FormLabel>
                      <Input
                        id="new_attachment_effective_date"
                        type="date"
                        value={step2Form.new_attachment_effective_date}
                        onChange={(event) =>
                          setStep2Field("new_attachment_effective_date", event.target.value)
                        }
                      />
                      {step2Errors.new_attachment_effective_date ? (
                        <p className="text-xs text-destructive">
                          {step2Errors.new_attachment_effective_date}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <FormLabel htmlFor="new_attachment_cancellation_date">New attachment cancellation date</FormLabel>
                      <Input
                        id="new_attachment_cancellation_date"
                        type="date"
                        value={step2Form.new_attachment_cancellation_date}
                        onChange={(event) =>
                          setStep2Field("new_attachment_cancellation_date", event.target.value)
                        }
                      />
                      {step2Errors.new_attachment_cancellation_date ? (
                        <p className="text-xs text-destructive">
                          {step2Errors.new_attachment_cancellation_date}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {step2Form.attachment_action === "CANCEL" ? (
                  <div className="grid gap-2 md:col-span-2">
                    <FormLabel htmlFor="attachment_cancellation_date">Attachment cancellation date</FormLabel>
                    <Input
                      id="attachment_cancellation_date"
                      type="date"
                      value={step2Form.attachment_cancellation_date ?? ""}
                      onChange={(event) =>
                        setStep2Field("attachment_cancellation_date", event.target.value)
                      }
                    />
                    {step2Errors.attachment_cancellation_date ? (
                      <p className="text-xs text-destructive">
                        {step2Errors.attachment_cancellation_date}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {step2Form.attachment_action === "CHANGE" ? (
                  <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
                    <div className="grid gap-2">
                      <FormLabel htmlFor="change_attachment_effective_date">Change attachment effective date</FormLabel>
                      <Input
                        id="change_attachment_effective_date"
                        type="date"
                        value={step2Form.change_attachment_effective_date ?? ""}
                        onChange={(event) =>
                          setStep2Field("change_attachment_effective_date", event.target.value)
                        }
                      />
                      {step2Errors.change_attachment_effective_date ? (
                        <p className="text-xs text-destructive">
                          {step2Errors.change_attachment_effective_date}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <FormLabel htmlFor="change_attachment_cancellation_date">Change attachment cancellation date</FormLabel>
                      <Input
                        id="change_attachment_cancellation_date"
                        type="date"
                        value={step2Form.change_attachment_cancellation_date ?? ""}
                        onChange={(event) =>
                          setStep2Field(
                            "change_attachment_cancellation_date",
                            event.target.value,
                          )
                        }
                      />
                      {step2Errors.change_attachment_cancellation_date ? (
                        <p className="text-xs text-destructive">
                          {step2Errors.change_attachment_cancellation_date}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-3xl border border-border p-4 md:col-span-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Declaration
                    </p>
                    <p className="text-sm text-muted-foreground">{step2UiContent.part_c.summary}</p>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {step2UiContent.part_c.declarations.map((declaration, index) => (
                      <div
                        key={declaration.id}
                        className="rounded-2xl border border-border bg-white px-4 py-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-muted-foreground">
                            {index + 1}
                          </span>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {declaration.summary_text}
                            </p>
                            <p className="text-xs leading-5 text-muted-foreground">
                              {declaration.full_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <label className="flex items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={step2Form.confirm_declarations}
                        onChange={(event) =>
                          setStep2Field("confirm_declarations", event.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{step2UiContent.part_c.consent_label}</span>
                    </label>
                    {step2Errors.confirm_declarations ? (
                      <p className="text-xs text-destructive">{step2Errors.confirm_declarations}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <FormLabel htmlFor="step2_signature_label">Signature label</FormLabel>
                  <Input
                    id="step2_signature_label"
                    value={step2Form.signature_label}
                    onChange={(event) => setStep2Field("signature_label", event.target.value)}
                    placeholder="Dr Mat Mardock"
                  />
                  {step2Errors.signature_label ? (
                    <p className="text-xs text-destructive">{step2Errors.signature_label}</p>
                  ) : null}
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">Signature</span>
                  </div>
                  <SignaturePad
                    showHelperText={false}
                    value={step2SignatureDataUrl}
                    onChange={setStep2SignatureDataUrl}
                    onExportPromiseChange={(promise) => {
                      step2SignatureExportPromiseRef.current = promise;
                    }}
                  />
                  {step2Errors.signature ? (
                    <p className="text-xs text-destructive">{step2Errors.signature}</p>
                  ) : null}
                </div>

              </div>

              {step2SubmitError ? (
                <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {step2SubmitError}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 sm:min-w-32"
                  onClick={() => setStage("hlth_2870")}
                  disabled={step2Submitting}
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Back
                </Button>

                <Button type="submit" className="h-12 flex-1" disabled={step2Submitting}>
                  {step2Submitting ? "Submitting..." : "Submit"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        ) : stage === "hlth_2832" ? (
          <div className="space-y-6">
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmitStep3();
              }}
            >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <FormLabel htmlFor="step3_msp_billing_number">MSP billing number</FormLabel>
                    <Input
                      id="step3_msp_billing_number"
                      value={step3Form.msp_billing_number}
                      onChange={(event) =>
                        setStep3Field("msp_billing_number", digitsOnly(event.target.value))
                      }
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="1234567890"
                    />
                    {step3Errors.msp_billing_number ? (
                      <p className="text-xs text-destructive">{step3Errors.msp_billing_number}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <FormLabel htmlFor="payment_number">Payment number</FormLabel>
                    <Input
                      id="payment_number"
                      value={step3Form.payment_number}
                      onChange={(event) => setStep3Field("payment_number", digitsOnly(event.target.value))}
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="12345"
                    />
                    {step3Errors.payment_number ? (
                      <p className="text-xs text-destructive">{step3Errors.payment_number}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <FormLabel htmlFor="payee_name">Payee name</FormLabel>
                    <Input
                      id="payee_name"
                      value={step3Form.payee_name}
                      onChange={(event) => setStep3Field("payee_name", event.target.value)}
                      placeholder="Mat Mardock"
                    />
                    {step3Errors.payee_name ? (
                      <p className="text-xs text-destructive">{step3Errors.payee_name}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <FormLabel htmlFor="institution_number">Institution number</FormLabel>
                    <Input
                      id="institution_number"
                      value={step3Form.institution_number}
                      onChange={(event) =>
                        setStep3Field("institution_number", digitsOnly(event.target.value))
                      }
                      inputMode="numeric"
                      maxLength={3}
                      placeholder="001"
                    />
                    {step3Errors.institution_number ? (
                      <p className="text-xs text-destructive">{step3Errors.institution_number}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <FormLabel htmlFor="branch_number">Branch number</FormLabel>
                    <Input
                      id="branch_number"
                      value={step3Form.branch_number}
                      onChange={(event) => setStep3Field("branch_number", digitsOnly(event.target.value))}
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="12345"
                    />
                    {step3Errors.branch_number ? (
                      <p className="text-xs text-destructive">{step3Errors.branch_number}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <FormLabel htmlFor="account_number">Account number</FormLabel>
                    <Input
                      id="account_number"
                      value={step3Form.account_number}
                      onChange={(event) => setStep3Field("account_number", event.target.value)}
                      placeholder="000999888"
                    />
                    {step3Errors.account_number ? (
                      <p className="text-xs text-destructive">{step3Errors.account_number}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <FormLabel htmlFor="institution_bank_name">Institution bank name</FormLabel>
                    <Input
                      id="institution_bank_name"
                      value={step3Form.institution_bank_name}
                      onChange={(event) => setStep3Field("institution_bank_name", event.target.value)}
                      placeholder="Royal Bank"
                    />
                    {step3Errors.institution_bank_name ? (
                      <p className="text-xs text-destructive">{step3Errors.institution_bank_name}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <FormLabel htmlFor="branch_name">Branch name</FormLabel>
                    <Input
                      id="branch_name"
                      value={step3Form.branch_name}
                      onChange={(event) => setStep3Field("branch_name", event.target.value)}
                      placeholder="Metrotown"
                    />
                    {step3Errors.branch_name ? (
                      <p className="text-xs text-destructive">{step3Errors.branch_name}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
                    <div className="grid gap-2">
                      <FormLabel htmlFor="street_address">Street address</FormLabel>
                      <Input
                        id="street_address"
                        value={step3Form.street_address}
                        onChange={(event) => setStep3Field("street_address", event.target.value)}
                        placeholder="123 Home Street"
                      />
                      {step3Errors.street_address ? (
                        <p className="text-xs text-destructive">{step3Errors.street_address}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <FormLabel htmlFor="city">City</FormLabel>
                      <Input
                        id="city"
                        value={step3Form.city}
                        onChange={(event) => setStep3Field("city", event.target.value)}
                        placeholder="Burnaby"
                      />
                      {step3Errors.city ? (
                        <p className="text-xs text-destructive">{step3Errors.city}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
                    <div className="grid gap-2">
                      <FormLabel htmlFor="province">Province</FormLabel>
                      <Input
                        id="province"
                        value={step3Form.province}
                        onChange={(event) => setStep3Field("province", event.target.value)}
                        placeholder="BC"
                      />
                      {step3Errors.province ? (
                        <p className="text-xs text-destructive">{step3Errors.province}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <FormLabel htmlFor="postal_code">Postal code</FormLabel>
                      <Input
                        id="postal_code"
                        value={step3Form.postal_code}
                        onChange={(event) =>
                          setStep3Field("postal_code", normalizePostalCode(event.target.value))
                        }
                        placeholder="V5H0A1"
                      />
                      {step3Errors.postal_code ? (
                        <p className="text-xs text-destructive">{step3Errors.postal_code}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
                    <div className="grid gap-2">
                      <FormLabel htmlFor="telephone">Telephone</FormLabel>
                      <Input
                        id="telephone"
                        type="tel"
                        value={step3Form.telephone}
                        onChange={(event) => setStep3Field("telephone", digitsOnly(event.target.value))}
                        placeholder="6041112222"
                      />
                      {step3Errors.telephone ? (
                        <p className="text-xs text-destructive">{step3Errors.telephone}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <FormLabel htmlFor="telephone2">Telephone 2</FormLabel>
                      <Input
                        id="telephone2"
                        type="tel"
                        value={step3Form.telephone2}
                        onChange={(event) => setStep3Field("telephone2", digitsOnly(event.target.value))}
                        placeholder="6041113333"
                      />
                      {step3Errors.telephone2 ? (
                        <p className="text-xs text-destructive">{step3Errors.telephone2}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <FormLabel htmlFor="step3_signature_label">Signature label</FormLabel>
                    <Input
                      id="step3_signature_label"
                      value={step3Form.signature_label}
                      onChange={(event) => setStep3Field("signature_label", event.target.value)}
                      placeholder="Dr Mat Mardock"
                    />
                    {step3Errors.signature_label ? (
                      <p className="text-xs text-destructive">{step3Errors.signature_label}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">Signature</span>
                    </div>
                    <SignaturePad
                      showHelperText={false}
                      value={step3SignatureDataUrl}
                      onChange={setStep3SignatureDataUrl}
                      onExportPromiseChange={(promise) => {
                        step3SignatureExportPromiseRef.current = promise;
                      }}
                    />
                    {step3Errors.signature ? (
                      <p className="text-xs text-destructive">{step3Errors.signature}</p>
                    ) : null}
                  </div>
                </div>

              {step3SubmitError ? (
                <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {step3SubmitError}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 sm:min-w-32"
                  onClick={() => setStage("hlth_2950")}
                  disabled={step3Submitting}
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Back
                </Button>

                <Button type="submit" className="h-12 flex-1" disabled={step3Submitting}>
                  {step3Submitting ? "Submitting..." : "Submit"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        ) : stage === "hlth_2991" ? (
          <div className="space-y-6">
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmitStep4();
              }}
            >
              <div className="grid gap-4">
                <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label htmlFor="step4_surname" className="text-sm font-medium text-foreground">
                      Surname
                    </label>
                    <Input
                      id="step4_surname"
                      value={step4Form.surname}
                      onChange={(event) => setStep4Field("surname", event.target.value)}
                      placeholder="Clinton"
                    />
                    {step4Errors.surname ? <p className="text-xs text-destructive">{step4Errors.surname}</p> : null}
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="step4_given_name" className="text-sm font-medium text-foreground">
                      Given name
                    </label>
                    <Input
                      id="step4_given_name"
                      value={step4Form.given_name}
                      onChange={(event) => setStep4Field("given_name", event.target.value)}
                      placeholder="Helly"
                    />
                    {step4Errors.given_name ? <p className="text-xs text-destructive">{step4Errors.given_name}</p> : null}
                  </div>

                </div>

                <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label htmlFor="step4_given_name_second" className="text-sm font-medium text-foreground">
                      Second given name
                    </label>
                    <Input
                      id="step4_given_name_second"
                      value={step4Form.given_name_second}
                      onChange={(event) => setStep4Field("given_name_second", event.target.value)}
                      placeholder="Marie"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="step4_citizenship" className="text-sm font-medium text-foreground">
                      Citizenship
                    </label>
                    <Input
                      id="step4_citizenship"
                      value={step4Form.citizenship}
                      onChange={(event) => setStep4Citizenship(event.target.value)}
                      placeholder="Canadian"
                    />
                    {step4Errors.citizenship ? <p className="text-xs text-destructive">{step4Errors.citizenship}</p> : null}
                  </div>
                </div>

                <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label htmlFor="step4_date_of_birth" className="text-sm font-medium text-foreground">
                      Date of birth
                    </label>
                    <Input
                      id="step4_date_of_birth"
                      type="date"
                      value={step4Form.date_of_birth}
                      onChange={(event) => setStep4Field("date_of_birth", event.target.value)}
                    />
                    {step4Errors.date_of_birth ? (
                      <p className="text-xs text-destructive">{step4Errors.date_of_birth}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="step4_gender" className="text-sm font-medium text-foreground">
                      Gender
                    </label>
                    <select
                      id="step4_gender"
                      value={step4Form.gender}
                      onChange={(event) => setStep4Field("gender", event.target.value as DoctorHlth2991FormState["gender"])}
                      className="flex h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <option value="">Select gender</option>
                      <option value="FEMALE">FEMALE</option>
                      <option value="MALE">MALE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                    {step4Errors.gender ? <p className="text-xs text-destructive">{step4Errors.gender}</p> : null}
                  </div>

                </div>

                {step4RequiresStatusInCanada ? (
                  <div className="grid gap-2 md:col-span-2 md:max-w-md">
                    <label htmlFor="step4_status_in_canada" className="text-sm font-medium text-foreground">
                      Status in Canada
                    </label>
                    <Input
                      id="step4_status_in_canada"
                      value={step4Form.status_in_canada}
                      onChange={(event) => setStep4Field("status_in_canada", event.target.value)}
                      placeholder="Permanent Resident"
                    />
                    {step4Errors.status_in_canada ? (
                      <p className="text-xs text-destructive">{step4Errors.status_in_canada}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-3xl border border-border p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Home</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label htmlFor="step4_home_mailing_address" className="text-sm font-medium text-foreground">
                        Home mailing address
                      </label>
                      <Input
                        id="step4_home_mailing_address"
                        value={step4Form.home_mailing_address}
                        onChange={(event) => setStep4Field("home_mailing_address", event.target.value)}
                        placeholder="12 Home Street"
                      />
                      {step4Errors.home_mailing_address ? (
                        <p className="text-xs text-destructive">{step4Errors.home_mailing_address}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_home_city" className="text-sm font-medium text-foreground">
                        Home city
                      </label>
                      <Input
                        id="step4_home_city"
                        value={step4Form.home_city}
                        onChange={(event) => setStep4Field("home_city", event.target.value)}
                        placeholder="Burnaby"
                      />
                      {step4Errors.home_city ? <p className="text-xs text-destructive">{step4Errors.home_city}</p> : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_home_postal_code" className="text-sm font-medium text-foreground">
                        Home postal code
                      </label>
                      <Input
                        id="step4_home_postal_code"
                        value={step4Form.home_postal_code}
                        onChange={(event) => setStep4Field("home_postal_code", normalizePostalCode(event.target.value))}
                        placeholder="V5H0A1"
                      />
                      {step4Errors.home_postal_code ? (
                        <p className="text-xs text-destructive">{step4Errors.home_postal_code}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_home_phone_number" className="text-sm font-medium text-foreground">
                        Home phone number
                      </label>
                      <Input
                        id="step4_home_phone_number"
                        type="tel"
                        value={step4Form.home_phone_number}
                        onChange={(event) => setStep4Field("home_phone_number", digitsOnly(event.target.value))}
                        placeholder="6041112222"
                      />
                      {step4Errors.home_phone_number ? (
                        <p className="text-xs text-destructive">{step4Errors.home_phone_number}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_home_fax_number" className="text-sm font-medium text-foreground">
                        Home fax number
                      </label>
                      <Input
                        id="step4_home_fax_number"
                        type="tel"
                        value={step4Form.home_fax_number}
                        onChange={(event) => setStep4Field("home_fax_number", digitsOnly(event.target.value))}
                        placeholder="6041112223"
                      />
                      {step4Errors.home_fax_number ? (
                        <p className="text-xs text-destructive">{step4Errors.home_fax_number}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_home_email_address" className="text-sm font-medium text-foreground">
                        Home email address
                      </label>
                      <Input
                        id="step4_home_email_address"
                        type="email"
                        value={step4Form.home_email_address}
                        onChange={(event) => setStep4Field("home_email_address", event.target.value)}
                        placeholder="helly.home@gmail.com"
                      />
                      {step4Errors.home_email_address ? (
                        <p className="text-xs text-destructive">{step4Errors.home_email_address}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Business</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label htmlFor="step4_business_mailing_address" className="text-sm font-medium text-foreground">
                        Business mailing address
                      </label>
                      <Input
                        id="step4_business_mailing_address"
                        value={step4Form.business_mailing_address}
                        onChange={(event) => setStep4Field("business_mailing_address", event.target.value)}
                        placeholder="456 Clinic Ave"
                      />
                      {step4Errors.business_mailing_address ? (
                        <p className="text-xs text-destructive">{step4Errors.business_mailing_address}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_business_city" className="text-sm font-medium text-foreground">
                        Business city
                      </label>
                      <Input
                        id="step4_business_city"
                        value={step4Form.business_city}
                        onChange={(event) => setStep4Field("business_city", event.target.value)}
                        placeholder="Burnaby"
                      />
                      {step4Errors.business_city ? <p className="text-xs text-destructive">{step4Errors.business_city}</p> : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_business_postal_code" className="text-sm font-medium text-foreground">
                        Business postal code
                      </label>
                      <Input
                        id="step4_business_postal_code"
                        value={step4Form.business_postal_code}
                        onChange={(event) => setStep4Field("business_postal_code", normalizePostalCode(event.target.value))}
                        placeholder="V5H0A1"
                      />
                      {step4Errors.business_postal_code ? (
                        <p className="text-xs text-destructive">{step4Errors.business_postal_code}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_business_phone_number" className="text-sm font-medium text-foreground">
                        Business phone number
                      </label>
                      <Input
                        id="step4_business_phone_number"
                        type="tel"
                        value={step4Form.business_phone_number}
                        onChange={(event) => setStep4Field("business_phone_number", digitsOnly(event.target.value))}
                        placeholder="6043334444"
                      />
                      {step4Errors.business_phone_number ? (
                        <p className="text-xs text-destructive">{step4Errors.business_phone_number}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_business_fax_number" className="text-sm font-medium text-foreground">
                        Business fax number
                      </label>
                      <Input
                        id="step4_business_fax_number"
                        type="tel"
                        value={step4Form.business_fax_number}
                        onChange={(event) => setStep4Field("business_fax_number", digitsOnly(event.target.value))}
                        placeholder="6043334445"
                      />
                      {step4Errors.business_fax_number ? (
                        <p className="text-xs text-destructive">{step4Errors.business_fax_number}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_business_email_address" className="text-sm font-medium text-foreground">
                        Business email address
                      </label>
                      <Input
                        id="step4_business_email_address"
                        type="email"
                        value={step4Form.business_email_address}
                        onChange={(event) => setStep4Field("business_email_address", event.target.value)}
                        placeholder="helly.work@gmail.com"
                      />
                      {step4Errors.business_email_address ? (
                        <p className="text-xs text-destructive">{step4Errors.business_email_address}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Education</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2 md:col-span-2">
                      <label htmlFor="step4_medical_school" className="text-sm font-medium text-foreground">
                        Medical school
                      </label>
                      <Input
                        id="step4_medical_school"
                        value={step4Form.medical_school}
                        onChange={(event) => setStep4Field("medical_school", event.target.value)}
                        placeholder="UBC Faculty of Medicine"
                      />
                      {step4Errors.medical_school ? (
                        <p className="text-xs text-destructive">{step4Errors.medical_school}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_date_of_graduation" className="text-sm font-medium text-foreground">
                        Date of graduation
                      </label>
                      <Input
                        id="step4_date_of_graduation"
                        type="date"
                        value={step4Form.date_of_graduation}
                        onChange={(event) => setStep4Field("date_of_graduation", event.target.value)}
                      />
                      {step4Errors.date_of_graduation ? (
                        <p className="text-xs text-destructive">{step4Errors.date_of_graduation}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_date_of_registration" className="text-sm font-medium text-foreground">
                        Date of registration
                      </label>
                      <Input
                        id="step4_date_of_registration"
                        type="date"
                        value={step4Form.date_of_registration}
                        onChange={(event) => setStep4Field("date_of_registration", event.target.value)}
                      />
                      {step4Errors.date_of_registration ? (
                        <p className="text-xs text-destructive">{step4Errors.date_of_registration}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_royal_college_specialty" className="text-sm font-medium text-foreground">
                        Royal College specialty
                      </label>
                      <Input
                        id="step4_royal_college_specialty"
                        value={step4Form.royal_college_specialty}
                        onChange={(event) => setStep4Field("royal_college_specialty", event.target.value)}
                        placeholder="Family Medicine"
                      />
                      {step4Errors.royal_college_specialty ? (
                        <p className="text-xs text-destructive">{step4Errors.royal_college_specialty}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_royal_college_subspecialty" className="text-sm font-medium text-foreground">
                        Royal College subspecialty
                      </label>
                      <Input
                        id="step4_royal_college_subspecialty"
                        value={step4Form.royal_college_subspecialty}
                        onChange={(event) => setStep4Field("royal_college_subspecialty", event.target.value)}
                        placeholder="N/A"
                      />
                      {step4Errors.royal_college_subspecialty ? (
                        <p className="text-xs text-destructive">{step4Errors.royal_college_subspecialty}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_non_royal_college_specialty" className="text-sm font-medium text-foreground">
                        Non Royal College specialty
                      </label>
                      <Input
                        id="step4_non_royal_college_specialty"
                        value={step4Form.non_royal_college_specialty}
                        onChange={(event) => setStep4Field("non_royal_college_specialty", event.target.value)}
                        placeholder="N/A"
                      />
                      {step4Errors.non_royal_college_specialty ? (
                        <p className="text-xs text-destructive">{step4Errors.non_royal_college_specialty}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_non_royal_college_subspecialty" className="text-sm font-medium text-foreground">
                        Non Royal College subspecialty
                      </label>
                      <Input
                        id="step4_non_royal_college_subspecialty"
                        value={step4Form.non_royal_college_subspecialty}
                        onChange={(event) => setStep4Field("non_royal_college_subspecialty", event.target.value)}
                        placeholder="N/A"
                      />
                      {step4Errors.non_royal_college_subspecialty ? (
                        <p className="text-xs text-destructive">{step4Errors.non_royal_college_subspecialty}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Registration</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label htmlFor="step4_certification_date_1" className="text-sm font-medium text-foreground">
                        Certification date 1
                      </label>
                      <Input
                        id="step4_certification_date_1"
                        type="date"
                        value={step4Form.certification_date_1}
                        onChange={(event) => setStep4Field("certification_date_1", event.target.value)}
                      />
                      {step4Errors.certification_date_1 ? (
                        <p className="text-xs text-destructive">{step4Errors.certification_date_1}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <div className="grid gap-2">
                        <label htmlFor="step4_certification_date_2" className="text-sm font-medium text-foreground">
                          Certification date 2
                        </label>
                        <Input
                          id="step4_certification_date_2"
                          type="date"
                          value={step4Form.certification_date_2}
                          onChange={(event) => setStep4Field("certification_date_2", event.target.value)}
                        />
                      </div>
                      {step4Errors.certification_date_2 ? (
                        <p className="text-xs text-destructive">{step4Errors.certification_date_2}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_certification_date_3" className="text-sm font-medium text-foreground">
                        Certification date 3
                      </label>
                      <Input
                        id="step4_certification_date_3"
                        type="date"
                        value={step4Form.certification_date_3}
                        onChange={(event) => setStep4Field("certification_date_3", event.target.value)}
                      />
                      {step4Errors.certification_date_3 ? (
                        <p className="text-xs text-destructive">{step4Errors.certification_date_3}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_certification_date_4" className="text-sm font-medium text-foreground">
                        Certification date 4
                      </label>
                      <Input
                        id="step4_certification_date_4"
                        type="date"
                        value={step4Form.certification_date_4}
                        onChange={(event) => setStep4Field("certification_date_4", event.target.value)}
                      />
                      {step4Errors.certification_date_4 ? (
                        <p className="text-xs text-destructive">{step4Errors.certification_date_4}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_college_id" className="text-sm font-medium text-foreground">
                        College ID
                      </label>
                      <Input
                        id="step4_college_id"
                        value={step4Form.college_id}
                        onChange={(event) => setStep4Field("college_id", event.target.value)}
                        placeholder="CPSBC12345"
                      />
                      {step4Errors.college_id ? (
                        <p className="text-xs text-destructive">{step4Errors.college_id}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_registrations" className="text-sm font-medium text-foreground">
                        Registrations
                      </label>
                      <Input
                        id="step4_registrations"
                        value={step4Form.registrations}
                        onChange={(event) => setStep4Field("registrations", event.target.value)}
                        placeholder="Active CPSBC registration"
                      />
                      {step4Errors.registrations ? (
                        <p className="text-xs text-destructive">{step4Errors.registrations}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">License</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2 md:col-span-2">
                      <label htmlFor="step4_license_type" className="text-sm font-medium text-foreground">
                        License type
                      </label>
                      <select
                        id="step4_license_type"
                        value={step4Form.license_type}
                        onChange={(event) =>
                          setStep4LicenseType(event.target.value as DoctorHlth2991FormState["license_type"])
                        }
                        className="flex h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      >
                        <option value="">Select license type</option>
                        <option value="FULL">FULL</option>
                        <option value="TEMPORARY">TEMPORARY</option>
                        <option value="EDUCATION">EDUCATION</option>
                      </select>
                      {step4Errors.license_type ? (
                        <p className="text-xs text-destructive">{step4Errors.license_type}</p>
                      ) : null}
                    </div>

                    {step4Form.license_type === "FULL" ? (
                      <div className="grid gap-2 md:col-span-2">
                        <label htmlFor="step4_license_effective_date" className="text-sm font-medium text-foreground">
                          License effective date
                        </label>
                        <Input
                          id="step4_license_effective_date"
                          type="date"
                          value={step4Form.license_effective_date}
                          onChange={(event) => setStep4Field("license_effective_date", event.target.value)}
                        />
                        {step4Errors.license_effective_date ? (
                          <p className="text-xs text-destructive">{step4Errors.license_effective_date}</p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="grid gap-2">
                      <label htmlFor="step4_cancellation_date" className="text-sm font-medium text-foreground">
                        Cancellation date
                      </label>
                      <Input
                        id="step4_cancellation_date"
                        type="date"
                        value={step4Form.cancellation_date}
                        onChange={(event) => setStep4Field("cancellation_date", event.target.value)}
                      />
                      {step4Errors.cancellation_date ? (
                        <p className="text-xs text-destructive">{step4Errors.cancellation_date}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label htmlFor="step4_msp_effective_date" className="text-sm font-medium text-foreground">
                        MSP effective date
                      </label>
                      <Input
                        id="step4_msp_effective_date"
                        type="date"
                        value={step4Form.msp_effective_date}
                        onChange={(event) => setStep4Field("msp_effective_date", event.target.value)}
                      />
                      {step4Errors.msp_effective_date ? (
                        <p className="text-xs text-destructive">{step4Errors.msp_effective_date}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border p-4 md:col-span-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Declaration
                    </p>
                    <p className="text-sm text-muted-foreground">{step4UiContent.part_4.summary}</p>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {step4UiContent.part_4.declarations.map((declaration, index) => (
                      <div
                        key={declaration.id}
                        className="rounded-2xl border border-border bg-white px-4 py-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-muted-foreground">
                            {index + 1}
                          </span>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {declaration.summary_text}
                            </p>
                            <p className="text-xs leading-5 text-muted-foreground">
                              {declaration.full_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <label className="flex items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={step4Form.confirm_declarations}
                        onChange={(event) => setStep4Field("confirm_declarations", event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-medium text-foreground">
                          Confirm declarations
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {step4UiContent.part_4.consent_label}
                        </span>
                      </span>
                    </label>
                    {step4Errors.confirm_declarations ? (
                      <p className="text-xs text-destructive">{step4Errors.confirm_declarations}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <label htmlFor="step4_signature_label" className="text-sm font-medium text-foreground">
                    Signature label
                  </label>
                  <Input
                    id="step4_signature_label"
                    value={step4Form.signature_label}
                    onChange={(event) => setStep4Field("signature_label", event.target.value)}
                    placeholder="Helly Clinton"
                  />
                  {step4Errors.signature_label ? (
                    <p className="text-xs text-destructive">{step4Errors.signature_label}</p>
                  ) : null}
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-foreground">
                      Signature
                    </label>
                  </div>
                  <SignaturePad
                    showHelperText={false}
                    value={step4SignatureDataUrl}
                    onChange={setStep4SignatureDataUrl}
                    onExportPromiseChange={(promise) => {
                      step4SignatureExportPromiseRef.current = promise;
                    }}
                  />
                  {step4Errors.signature ? (
                    <p className="text-xs text-destructive">{step4Errors.signature}</p>
                  ) : null}
                </div>

              </div>

              {step4SubmitError ? (
                <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {step4SubmitError}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 sm:min-w-32"
                  onClick={() => setStage("hlth_2832")}
                  disabled={step4Submitting}
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Back
                </Button>

                <Button type="submit" className="h-12 flex-1" disabled={step4Submitting}>
                  {step4Submitting ? "Submitting..." : "Submit"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        ) : stage === "hlth_2820" ? (
          <div className="space-y-6">
            <DoctorHlth2820Editor onSaved={completeOnboarding} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-12 sm:min-w-32"
                onClick={() => setStage("hlth_2991")}
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back
              </Button>
            </div>
          </div>
        ) : null}
      </DoctorSection>
    </DoctorPageShell>
  );
}
