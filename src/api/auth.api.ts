import { client } from "./client";

export interface SignInRequest {
  phone: string;
  password?: string;
}



export interface AuthFlow {
  id: string;
  is_pending?: boolean;
  meta?: {
    session_token?: string;
  };
}

export interface AuthMeta {
  access_token?: string;
  refresh_token?: string;
  session_token?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  phone?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  status: number;
  data: {
    flows?: AuthFlow[];
    user?: AuthUser;
  };
  meta: AuthMeta;
}

export const signinApi = (payload: SignInRequest): Promise<AuthResponse> =>
  client.post("_allauth/app/v1/auth/login", payload).then((r) => r.data);

/** Resend OTP to phone */
export const resendPhoneOtpApi = (
  payload: OtpVerifyRequest,
): Promise<AuthResponse> =>
  otpClient
    .post("_allauth/app/v1/auth/phone/verify/resend", payload)
    .then((r) => r.data);

/** Register a new user */
export const signupApi = (payload: SignUpRequest): Promise<AuthResponse> =>
  client.post("_allauth/app/v1/auth/signup", payload).then((r) => r.data);




