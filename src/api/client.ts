import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { baseUrl } from "../config/env";
import { handleAxiosError } from "../utils/handleAxiosError";
import { toast } from "react-toastify";

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
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const errorMessage = handleAxiosError(error, "error response 401");
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
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
    if (sessionToken) config.headers["X-Session-Token"] = sessionToken;
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
    if (sessionId) config.headers["X-Session-Token"] = sessionId;
    return config;
  },
  (error) => Promise.reject(error),
);