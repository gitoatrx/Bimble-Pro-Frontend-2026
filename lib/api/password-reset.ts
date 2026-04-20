import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/request";
import type {
  ForgotPasswordRequestOtpRequest,
  ForgotPasswordRequestOtpResponse,
  ForgotPasswordVerifyOtpRequest,
  ForgotPasswordVerifyOtpResponse,
  ForgotPasswordResetRequest,
  ForgotPasswordResetResponse,
} from "@/lib/auth/password-reset";

export async function requestForgotPasswordOtp(
  payload: ForgotPasswordRequestOtpRequest,
): Promise<ForgotPasswordRequestOtpResponse> {
  return apiRequest<ForgotPasswordRequestOtpResponse, ForgotPasswordRequestOtpRequest>({
    endpoint: API_ENDPOINTS.authForgotPasswordRequestOtp,
    method: "POST",
    body: payload,
  });
}

export async function verifyForgotPasswordOtp(
  payload: ForgotPasswordVerifyOtpRequest,
): Promise<ForgotPasswordVerifyOtpResponse> {
  return apiRequest<ForgotPasswordVerifyOtpResponse, ForgotPasswordVerifyOtpRequest>({
    endpoint: API_ENDPOINTS.authForgotPasswordVerifyOtp,
    method: "POST",
    body: payload,
  });
}

export async function resetForgotPassword(
  payload: ForgotPasswordResetRequest,
): Promise<ForgotPasswordResetResponse> {
  return apiRequest<ForgotPasswordResetResponse, ForgotPasswordResetRequest>({
    endpoint: API_ENDPOINTS.authForgotPasswordReset,
    method: "POST",
    body: payload,
  });
}
