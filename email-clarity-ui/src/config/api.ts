// API base URL - use environment variable or fallback to localhost
// In Docker, this will use relative path (nginx proxies /api to backend)
// In development, use the backend URL directly
export const API_BASE = import.meta.env.VITE_API_BASE || 
  (import.meta.env.DEV ? "http://localhost:3001" : "");

export const API_BASE_URL = `${API_BASE}/api`;

