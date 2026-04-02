import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { AuthType } from "../config/constants";
import { baseUrl } from "../config/env";

const defaultHeaders = {
  Accept: "application/json",
  "X-Client-ID": "app",
  "ngrok-skip-browser-warning": "true",
};

let _navigate: ((path: string) => void) | null = null;

export const setNavigate = (navigate: (path: string) => void) => {
  _navigate = navigate;
};

const handleRedirect = (path: string) => {
  if (_navigate) {
    _navigate(path);
  } else {
    window.location.href = path; 
  }
};

function createAuthClient(authType: AuthType) {
  const instance = axios.create({
    baseURL: baseUrl,
    headers: defaultHeaders,
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem(`${authType}_access_token`);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const data = error.response?.data as any;
      const status = error.response?.status;

      if (status === 401 && data?.detail === "Invalid token.") {
        localStorage.clear();
        sessionStorage.clear();
        const redirectPath =
          authType === "ccm" ? "/ccm-auth/signin" : "/admin/signin";
        handleRedirect(redirectPath);
        return Promise.reject(error);
      }

      if (data?.meta?.is_authenticated === false) {
        localStorage.clear();
        sessionStorage.clear();
        handleRedirect("/admin/signin");
        return Promise.reject(error);
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

export const client = createAuthClient("admin");
export const ccmClient = createAuthClient("ccm");

export const otpClient = axios.create({
  baseURL: baseUrl,
  headers: defaultHeaders,
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
  headers: defaultHeaders,
});

logoutClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const sessionId = localStorage.getItem("sessionId");
    if (sessionId) config.headers["X-Session-Token"] = sessionId;
    return config;
  },
  (error) => Promise.reject(error),
);