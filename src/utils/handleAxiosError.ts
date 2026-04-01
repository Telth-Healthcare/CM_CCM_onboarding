import axios from "axios";
import { toast } from "react-toastify";

type ApiErrorData = Record<string, unknown>;

const extractFieldError = (data: ApiErrorData): string | null => {
  const firstKey = Object.keys(data)[0];
  if (!firstKey) return null;

  const value = data[firstKey];

  if (Array.isArray(value) && value.length > 0) {
    return typeof value[0] === "string" ? value[0] : null;
  }

  if (typeof value === "string") return value;

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const nested = value as ApiErrorData;
    for (const key of ["non_field_errors", "email", "phone", "region", "status", "course"]) {
      const nested_val = nested[key];
      if (Array.isArray(nested_val) && nested_val.length > 0) {
        return typeof nested_val[0] === "string" ? nested_val[0] : null;
      }
    }
  }

  return null;
};

export const handleAxiosError = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data as ApiErrorData | undefined;

  if (!data || typeof data !== "object") return error.message;

  for (const key of ["message", "error", "detail"] as const) {
    if (typeof data?.[key] === "string") {
      return data[key] as string;
    }
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0] as ApiErrorData;
    return typeof first?.message === "string" ? first.message : fallback;
  }

  const fieldError = extractFieldError(data);
  if (fieldError) return fieldError;

  return error.message ?? fallback;
};

// ✅ Use this everywhere instead of toast.error(handleAxiosError(...))
export const toastAxiosError = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
  toastId?: string,
) => {
  const message = handleAxiosError(error, fallback);
  toast.error(message, {
    toastId: toastId ?? message, // prevents duplicate toasts with same message
  });
};