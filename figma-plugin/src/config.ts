/**
 * Backend API base URL. Must be the SAME backend as Stripe webhook URL,
 * otherwise credits granted by webhooks won't show in the plugin.
 * Default: mascoty-production (change to your Railway service URL if different).
 */
export const API_BASE_URL =
  typeof process !== 'undefined' && process.env?.VITE_API_URL
    ? process.env.VITE_API_URL
    : 'https://mascoty-production.up.railway.app/api/v1';

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
