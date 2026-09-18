// For a physical device or a simulator, this must point to a machine reachable
// from the device — set EXPO_PUBLIC_API_URL in mobile/.env (see README).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
