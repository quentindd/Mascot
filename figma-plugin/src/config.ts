/**
 * Backend API base URL (Railway or local).
 * Change this if your deployment URL is different from mascoty-production.
 */
export const API_BASE_URL =
  typeof process !== 'undefined' && process.env?.VITE_API_URL
    ? process.env.VITE_API_URL
    : 'https://mascoty-production.up.railway.app/api/v1';

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
