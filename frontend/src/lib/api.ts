function normalizeUrl(url: string): string {
  let cleaned = url.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  if (!cleaned) return '';
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    if (cleaned.startsWith('localhost') || cleaned.startsWith('127.0.0.1')) {
      cleaned = `http://${cleaned}`;
    } else {
      cleaned = `https://${cleaned}`;
    }
  }
  return cleaned;
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('custom_backend_url');
    if (custom && custom.trim()) {
      return normalizeUrl(custom);
    }

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const rawUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();

    // If on a different device (phone, tablet, remote network) and the configured URL points to localhost:
    // Do NOT let the phone try to connect to port 8000 on itself!
    if (!isLocalhost && (rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1') || !rawUrl)) {
      // Use relative path so Next.js server reverse-proxies directly to the FastAPI backend
      return '';
    }

    if (rawUrl) {
      return normalizeUrl(rawUrl);
    }

    if (isLocalhost) {
      return 'http://localhost:8000';
    }

    return '';
  }

  const rawUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  return rawUrl ? normalizeUrl(rawUrl) : 'http://127.0.0.1:8000';
}

export const API_BASE_URL = normalizeUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;
  return fetch(url, options);
}

export async function safeJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return { detail: `Failed to parse server response (HTTP ${res.status})` };
    }
  }
  const text = await res.text();
  if (text.includes('<!DOCTYPE') || text.includes('<html')) {
    return { 
      detail: `Backend connection error (HTTP ${res.status}). Please check your Railway backend URL.` 
    };
  }
  return { detail: text || `Server responded with status ${res.status}` };
}
