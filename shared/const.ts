export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
export const CART_ADDED_MESSAGE = 'زیادکرا';
export const AUTHORIZED_ADMIN_EMAILS = [
  "mhamadhiwa2009x@gmail.com",
  "ajsnu32@gmail.com",
  "kanko2862@gmail.com",
] as const;

export function isAuthorizedAdminEmail(email: string | null | undefined): boolean {
  const normalizedEmail = email?.trim().toLowerCase();
  return normalizedEmail
    ? AUTHORIZED_ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail)
    : false;
}
