import axios from "axios";

export const handleAxiosError = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (!data) return error.message;

    // 1️⃣ Simple message field
    if (typeof data.message === "string") {
      return data.message;
    }

    // 2️⃣ error field
    if (typeof data.error === "string") {
      return data.error;
    }

    // 3️⃣ detail field (Django / DRF)
    if (typeof data.detail === "string") {
      return data.detail;
    }

    // 4️⃣ errors array
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors[0].message || fallback;
    }

    // 5️⃣ Field-level errors (object with arrays)
    if (typeof data === "object") {
      const firstKey = Object.keys(data)[0];
      const firstValue = data[firstKey];

      if (Array.isArray(firstValue) && firstValue.length > 0) {
        return firstValue[0];
      }

      if (typeof firstValue === "string") {
        return firstValue;
      }
    }

    return error.message;
  }

  return fallback;
};