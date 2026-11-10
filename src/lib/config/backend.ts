/**
 * Authoritative Backend URL resolver.
 * Prevents Mixed Content (HTTPS -> HTTP) and unreachable localhost calls
 * when running in production on Cloudflare Pages or custom domains.
 */
export function getBackendUrl(): string {
  // 1. Client-side browser execution
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // In production (not on localhost/127.0.0.1), always use the live secure backend
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://rigscouter-ai-database.onrender.com';
    }
  }

  // 2. Server-side / Edge Worker execution in production
  if (process.env.NODE_ENV === 'production') {
    const envUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return 'https://rigscouter-ai-database.onrender.com';
  }

  // 3. Local dev fallback
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'https://rigscouter-ai-database.onrender.com'
  );
}

