export type ForgotPasswordAccountType = "clinic" | "doctor";

export type ForgotPasswordRequestOtpRequest = {
  email: string;
  account_type: ForgotPasswordAccountType;
};

export type ForgotPasswordRequestOtpResponse = {
  account_type: ForgotPasswordAccountType;
  reset_token: string;
  masked_email: string;
  message: string;
};

export type ForgotPasswordVerifyOtpRequest = {
  reset_token: string;
  otp_code: string;
};

export type ForgotPasswordVerifyOtpResponse = {
  verified: boolean;
  account_type: ForgotPasswordAccountType;
  reset_token: string;
  message: string;
};

export type ForgotPasswordResetRequest = {
  reset_token: string;
  new_password: string;
  confirm_password: string;
};

export type ForgotPasswordResetResponse = {
  success: boolean;
  account_type: ForgotPasswordAccountType;
  identifier: string;
  clinic_slug: string | null;
  username: string | null;
  doctor_id: number | null;
  email: string | null;
  message: string;
};
