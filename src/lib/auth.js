const AUTH_KEY = 'cms_auth';
const TOKEN_KEY = 'cms_token';
const LEGACY_TOKEN_KEYS = ['auth_token', 'token', 'access_token'];
const PERMISSIONS_KEY = 'cms_permissions';

export function getStoredAuthState() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function setStoredAuthState(value) {
  localStorage.setItem(AUTH_KEY, value ? 'true' : 'false');
}

export function clearStoredAuthState() {
  localStorage.removeItem(AUTH_KEY);
}

export function getAuthToken() {
  const directToken = localStorage.getItem(TOKEN_KEY);
  if (directToken) return directToken;

  for (const key of LEGACY_TOKEN_KEYS) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }

  return '';
}

export function setAuthToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function hasPermission(permissionName) {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (!raw) return true;

    const permissions = JSON.parse(raw);
    if (!Array.isArray(permissions)) return true;

    return permissions.includes(permissionName);
  } catch {
    return true;
  }
}
