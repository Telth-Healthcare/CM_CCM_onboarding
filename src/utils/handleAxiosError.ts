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

    // 5️⃣ Field-level errors (object with arrays or strings)
    if (typeof data === "object") {
      const firstKey = Object.keys(data)[0];
      const firstValue = data[firstKey];

      // Handle array of error messages
      if (Array.isArray(firstValue) && firstValue.length > 0) {
        const errorMsg = firstValue[0];
        return typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg);
      }

      // Handle string error messages
      if (typeof firstValue === "string") {
        return firstValue;
      }

      // Handle nested object errors (e.g., field validation with nested structure)
      if (typeof firstValue === "object" && firstValue !== null) {
        const nestedKey = Object.keys(firstValue)[0];
        const nestedValue = firstValue[nestedKey];
        if (Array.isArray(nestedValue) && nestedValue.length > 0) {
          return nestedValue[0];
        }
      }
    }

    return error.message;
  }

  return fallback;
};