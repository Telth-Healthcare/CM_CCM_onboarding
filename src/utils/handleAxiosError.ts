import axios from "axios";

type ApiErrorData = Record<string, unknown>;

const extractFieldError = (data: ApiErrorData): string | null => {
  const firstKey = Object.keys(data)[0];
  if (!firstKey) return null;

  const value = data[firstKey];

  // { field: ["error msg"] }
  if (Array.isArray(value) && value.length > 0) {
    return typeof value[0] === "string" ? value[0] : null;
  }

  // { field: "error msg" }
  if (typeof value === "string") return value;

  // Nested object: { field: { email: [...], phone: [...], non_field_errors: [...] } }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const nested = value as ApiErrorData;

    for (const key of ["non_field_errors", "email", "phone"]) {
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

  // No response body — use axios message
  if (!data || typeof data !== "object") return error.message;

  // 1. Simple string fields
  for (const key of ["message", "error", "detail"] as const) {
    if (typeof data[key] === "string") return data[key] as string;
  }

  // 2. Errors array: [{ message: "..." }]
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0] as ApiErrorData;
    return typeof first?.message === "string" ? first.message : fallback;
  }

  // 3. Field-level errors
  const fieldError = extractFieldError(data);
  if (fieldError) return fieldError;

  return error.message ?? fallback;
};