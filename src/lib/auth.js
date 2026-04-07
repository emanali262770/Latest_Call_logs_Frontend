const AUTH_KEY = 'cms_auth';
const TOKEN_KEY = 'cms_token';
const LEGACY_TOKEN_KEYS = ['auth_token', 'token', 'access_token'];
const PERMISSIONS_KEY = 'cms_permissions';
const USER_KEY = 'cms_user';
const UNPROTECTED_PATHS = new Set(['dashboard', 'settings', 'access-denied', 'login', 'stock']);

function resolveAuthPayload(authData) {
  if (authData?.token || authData?.user || authData?.permissions) {
    return authData;
  }

  if (authData?.data) {
    return authData.data;
  }

  return {};
}

export function getStoredAuthState() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function setStoredAuthState(value) {
  localStorage.setItem(AUTH_KEY, value ? 'true' : 'false');
}

export function clearStoredAuthState() {
  localStorage.removeItem(AUTH_KEY);
}

export function clearAuthSession() {
  clearAuthToken();
  clearStoredPermissions();
  clearStoredUser();
  clearStoredAuthState();
}

export function redirectToLoginOnSessionExpiry() {
  clearAuthSession();

  if (typeof window === 'undefined') return;

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (currentPath === '/login') return;

  window.location.replace('/login');
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

function normalizeStoredUser(authData) {
  const resolvedAuthData = resolveAuthPayload(authData);
  const user = resolvedAuthData?.user;

  if (!user || typeof user !== 'object') return null;

  const fullName =
    user.employee_name ||
    user.full_name ||
    user.fullName ||
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
    user.name ||
    user.UserName ||
    user.username ||
    '';
  const role =
    user.role_name ||
    user.roleName ||
    user.role ||
    user.user_type ||
    user.userType ||
    user.designation ||
    user.group_name ||
    user.groupName ||
    (Array.isArray(user.groups) && user.groups.length ? user.groups[0]?.group_name || user.groups[0]?.name || '' : '');

  return {
    id: user.id ?? null,
    fullName: String(fullName || '').trim(),
    role: String(role || '').trim(),
    username: String(user.UserName || user.username || '').trim(),
    employeeId: user.employee_id ?? null,
  };
}

function normalizePermissionEntry(permission) {
  if (!permission) return '';

  if (typeof permission === 'string') {
    return permission.trim().toUpperCase();
  }

  const keyName =
    permission.key_name ||
    permission.keyName ||
    permission.permission_key ||
    permission.permissionKey ||
    permission.name ||
    permission.code ||
    '';

  return String(keyName).trim().toUpperCase();
}

function collectPermissions(source) {
  if (!source) return [];

  if (Array.isArray(source)) {
    return source.map(normalizePermissionEntry).filter(Boolean);
  }

  return [];
}

function normalizePermissionKey(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function normalizePathSegments(path) {
  return String(path || '')
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function singularizeToken(token) {
  const normalizedToken = normalizePermissionKey(token);

  if (normalizedToken.endsWith('IES')) {
    return `${normalizedToken.slice(0, -3)}Y`;
  }

  if (normalizedToken.endsWith('S') && !normalizedToken.endsWith('SS')) {
    return normalizedToken.slice(0, -1);
  }

  return normalizedToken;
}

function buildTokenVariants(token) {
  const normalizedToken = normalizePermissionKey(token);
  const singularToken = singularizeToken(normalizedToken);

  return new Set([normalizedToken, singularToken]);
}

function tokensMatch(leftToken, rightToken) {
  const leftVariants = buildTokenVariants(leftToken);
  const rightVariants = buildTokenVariants(rightToken);

  return Array.from(leftVariants).some((variant) => rightVariants.has(variant));
}

function permissionMatches(requestedPermission, storedPermission) {
  const normalizedRequested = String(requestedPermission || '').trim().toUpperCase();
  const normalizedStored = String(storedPermission || '').trim().toUpperCase();

  if (normalizedRequested === normalizedStored) return true;

  const requestedSegments = String(requestedPermission || '')
    .trim()
    .toUpperCase()
    .split('.')
    .map((segment) => normalizePermissionKey(segment))
    .filter(Boolean);
  const storedSegments = String(storedPermission || '')
    .trim()
    .toUpperCase()
    .split('.')
    .map((segment) => normalizePermissionKey(segment))
    .filter(Boolean);

  if (requestedSegments.length === 2 && storedSegments.length === 3) {
    const [requestedResource, requestedAction] = requestedSegments;
    const [storedModule, storedSubModule, storedAction] = storedSegments;

    return (
      tokensMatch(requestedAction, storedAction) &&
      (tokensMatch(requestedResource, storedSubModule) || tokensMatch(requestedResource, storedModule))
    );
  }

  if (requestedSegments.length === storedSegments.length) {
    return requestedSegments.every((segment, index) => tokensMatch(segment, storedSegments[index]));
  }

  return false;
}

export function extractPermissionsFromAuthData(authData) {
  const resolvedAuthData = resolveAuthPayload(authData);

  const groupPermissions = Array.isArray(resolvedAuthData?.user?.groups)
    ? resolvedAuthData.user.groups.flatMap((group) => collectPermissions(group?.permissions))
    : [];
  const candidates = [
    resolvedAuthData?.permissions,
    resolvedAuthData?.permission_keys,
    resolvedAuthData?.permissionKeys,
    resolvedAuthData?.user?.permissions,
    groupPermissions,
    resolvedAuthData?.user?.permission_keys,
    resolvedAuthData?.user?.permissionKeys,
  ];

  const permissionSet = new Set(candidates.flatMap(collectPermissions));
  return Array.from(permissionSet);
}

export function extractTokenFromAuthData(authData) {
  const resolvedAuthData = resolveAuthPayload(authData);
  return String(
    resolvedAuthData?.token ||
      resolvedAuthData?.access_token ||
      resolvedAuthData?.accessToken ||
      '',
  ).trim();
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    const user = JSON.parse(raw);
    return user && typeof user === 'object' ? user : null;
  } catch {
    return null;
  }
}

export function setStoredUser(authData) {
  const user = normalizeStoredUser(authData);

  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}

export function getReadPermissionForPath(path) {
  const segments = normalizePathSegments(path);
  if (!segments.length) return null;

  const [firstSegment, secondSegment, thirdSegment] = segments;

  if (UNPROTECTED_PATHS.has(firstSegment)) {
    return null;
  }

  if (firstSegment === 'setup' && secondSegment) {
    if (secondSegment === 'company') {
      return null;
    }

    if (secondSegment === 'items' && thirdSegment) {
      return `INVENTORY.${normalizePermissionKey(thirdSegment)}.READ`;
    }

    return `EMPLOYEE.${normalizePermissionKey(secondSegment)}.READ`;
  }

  if (firstSegment === 'employees') {
    return `EMPLOYEE.${normalizePermissionKey(firstSegment)}.READ`;
  }

  if (['users', 'groups', 'permissions'].includes(firstSegment)) {
    return `ACCESS.${normalizePermissionKey(firstSegment)}.READ`;
  }

  return `${normalizePermissionKey(firstSegment)}.READ`;
}

export function getReadPermissionsForPath(path) {
  const permission = getReadPermissionForPath(path);
  return permission ? [permission] : [];
}

export function getStoredPermissions() {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (!raw) return [];

    const permissions = JSON.parse(raw);
    return Array.isArray(permissions)
      ? permissions.map((permission) => String(permission).trim().toUpperCase()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export function setStoredPermissions(permissions) {
  const normalized = Array.isArray(permissions)
    ? Array.from(new Set(permissions.map((permission) => String(permission).trim().toUpperCase()).filter(Boolean)))
    : [];

  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(normalized));
}

export function clearStoredPermissions() {
  localStorage.removeItem(PERMISSIONS_KEY);
}

export function hasPermission(permissionName) {
  try {
    const permissions = getStoredPermissions();
    if (!permissions.length) return true;

    return permissions.some((permission) => permissionMatches(permissionName, permission));
  } catch {
    return true;
  }
}

export function hasAnyPermission(permissionNames = []) {
  if (!Array.isArray(permissionNames) || !permissionNames.length) return true;

  const permissions = getStoredPermissions();
  if (!permissions.length) return true;

  return permissionNames.some((permissionName) => hasPermission(permissionName));
}
