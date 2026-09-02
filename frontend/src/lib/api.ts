let rawUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim();
// Strip trailing slash
rawUrl = rawUrl.replace(/\/+$/, '');
// Strip trailing /api if user appended it in env variable
rawUrl = rawUrl.replace(/\/api$/, '');

export const API_BASE_URL = rawUrl;
