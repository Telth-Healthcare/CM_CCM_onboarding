// config/auth.ts

// ================= TYPES =================

export interface User {
  id?: string | number;
  name?: string;
  role?: {
    name?: string;
  } | string;
  [key: string]: any;
}

export interface TokenPayload {
  access: string;
  refresh: string;
  user: User;
}

interface TokenResponse {
  access: string | null;
  refresh: string | null;
  sessionId: string | null;
}

// ================= CONSTANTS =================

export const TOKEN_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  isAuthenticated: "authenticate",
  sessionId: "sessionId",
  role: "user_role",
} as const;

// ================= HEADERS =================

export const header = {
  headers: {
    Accept: "application/json",
    "X-Client-ID": "app",
    "ngrok-skip-browser-warning": "true",
  },
};

export const headerJson = () => {
  const token = localStorage.getItem(TOKEN_KEYS.access);

  return {
    headers: {
      Accept: "application/json",
      "X-Client-ID": "app",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
  };
};

// ================= TOKEN FUNCTIONS =================

export const setToken = ({ access, refresh, user }: TokenPayload): void => {
  localStorage.setItem(TOKEN_KEYS.access, access);
  localStorage.setItem(TOKEN_KEYS.refresh, refresh);
  localStorage.setItem(
    TOKEN_KEYS.isAuthenticated,
    JSON.stringify(user)
  );
  localStorage.setItem(
    TOKEN_KEYS.role,
    typeof user?.role === "string"
      ? user.role
      : user?.role?.name || ""
  );
};

export const getToken = (): TokenResponse => {
  return {
    access: localStorage.getItem(TOKEN_KEYS.access),
    refresh: localStorage.getItem(TOKEN_KEYS.refresh),
    sessionId: localStorage.getItem(TOKEN_KEYS.sessionId),
  };
};

export const getUser = (): User | null => {
  const userString = localStorage.getItem(TOKEN_KEYS.isAuthenticated);
  return userString ? JSON.parse(userString) as User : null;
};

export const getUserRole = (): string | null => {
  return localStorage.getItem(TOKEN_KEYS.role);
};

// ================= URL STORAGE =================

export const setUrl = (url: string): void => {
  localStorage.setItem("url", url);
};

export const getUrl = (): string => {
  return localStorage.getItem("url") || "";
};