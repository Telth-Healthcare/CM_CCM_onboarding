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
  user?: User;
}

interface TokenResponse {
  access: string | null;
  refresh: string | null;
}

// ================= CONSTANTS =================

export const TOKEN_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  isAuthenticated: "authenticate",
  sessionId: "sessionId",
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
export type AuthType = "admin" | "ccm";
const getTokenKeys = (type: AuthType) => ({
  access: "access_token",
  refresh: "refresh_token",
  user: `${type}_user`,
  role: `${type}_role`,
});

export const setToken = (
  type: AuthType,
  { access, refresh, user }: TokenPayload
): void => {
  const keys = getTokenKeys(type);

  localStorage.setItem(keys.access, access);
  localStorage.setItem(keys.refresh, refresh);
  localStorage.setItem(keys.user, JSON.stringify(user));

  // Handle role properly
const role = Array.isArray(user?.user?.roles)
  ? user?.user.roles[0]
  : user?.user?.roles;

if (role) {
  localStorage.setItem(keys.role, role); 
}
};

export const getToken = (type: AuthType): TokenResponse => {
  const keys = getTokenKeys(type);

  return {
    access: localStorage.getItem(keys.access),
    refresh: localStorage.getItem(keys.refresh),
  };
};

export const getUser = (): User | null => {
  const userString = localStorage.getItem(TOKEN_KEYS.isAuthenticated);
  return userString ? JSON.parse(userString) as User : null;
};

export const getUserRole = (type: AuthType): string | null => {
  const keys = getTokenKeys(type);
  return localStorage.getItem(keys.role);
};
// ================= URL STORAGE =================

export const setUrl = (url: string): void => {
  localStorage.setItem("url", url);
};

export const getUrl = (): string => {
  return localStorage.getItem("url") || "";
};
