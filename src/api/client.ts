import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { handleAxiosError } from "../utils/handleAxiosError";
import { toast } from "react-toastify";
import { AuthType } from "../config/constants";

const baseUrl = import.meta.env.VITE_API_BASE_URL;


const defaultHeaders = {
  Accept: "application/json",
  "X-Client-ID": "app",
  "ngrok-skip-browser-warning": "true",
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
      if (error.response?.status === 401) {
        const message = handleAxiosError(error, "Session expired. Please sign in again.");
        toast.error(message);
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

export const client    = createAuthClient("admin"); 
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