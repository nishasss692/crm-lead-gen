export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('custom_backend_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '').replace(/\/api$/, '');
    }
  }
  let rawUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim();
  rawUrl = rawUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  return rawUrl;
}

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
).trim().replace(/\/+$/, '').replace(/\/api$/, '');
