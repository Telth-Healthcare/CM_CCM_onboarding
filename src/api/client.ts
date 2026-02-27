import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { baseUrl } from "../config/env";


export const client = axios.create({
  baseURL: baseUrl,
  headers: {
    Accept: "application/json",
    "X-Client-ID": "app",
    "ngrok-skip-browser-warning": "true",
  },
});


client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);


client.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const flows = (error.response.data as any)?.data?.flows as
        | { id: string }[]
        | undefined;

      // Only clear tokens when there are NO pending flows.
      // If flows exist it means the server wants OTP/MFA — not a real logout.
      const hasPendingFlow = flows && flows.length > 0;
      if (!hasPendingFlow) {
        // clearToken();
        window.location.href = "/control-center/signin";
      }
    }
    return Promise.reject(error);
  },
);

export const otpClient = axios.create({
  baseURL: baseUrl,
  headers: {
    Accept: "application/json",
    "X-Client-ID": "app",
    "ngrok-skip-browser-warning": "true",
  },
});

otpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const sessionToken = sessionStorage.getItem("otp_session");
    if (sessionToken) {
      config.headers["X-Session-Token"] = sessionToken;
    }
    return config;
  },
  (error) => Promise.reject(error),
);


export const logoutClient = axios.create({
  baseURL: baseUrl,
  headers: {
    Accept: "application/json",
    "X-Client-ID": "app",
    "ngrok-skip-browser-warning": "true",
  },
});

logoutClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers["X-Session-Token"] = sessionId;
    }
    return config;
  },
  (error) => Promise.reject(error),
);