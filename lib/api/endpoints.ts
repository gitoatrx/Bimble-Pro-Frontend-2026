export const API_ENDPOINTS = {
  clinicSignup: "/api/v1/clinics/signup",
  clinicLogin: "/api/v1/clinic-auth/login",
  clinicVerifyOtp: "/api/v1/clinic-auth/verify-otp",
  clinicResendOtp: "/api/v1/clinic-auth/resend-otp",
  clinicPlans: "/api/v1/clinic-plans",
  clinicDoctorInvite: "/api/v1/clinics/doctors/invite",
} as const;
