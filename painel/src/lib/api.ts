export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  let targetUrl = url;
  
  if (targetUrl.startsWith('/api')) {
    targetUrl = `${backendBase}${targetUrl}`;
  } else if (targetUrl.includes('http://localhost:4000') || targetUrl.includes('http://127.0.0.1:4000')) {
    targetUrl = targetUrl.replace('http://localhost:4000', backendBase).replace('http://127.0.0.1:4000', backendBase);
  }

  let tenantId = '';
  let token = '';
  try {
    const authStorage = localStorage.getItem('painel-auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      tenantId = parsed.state?.tenant?.id || '';
      token = parsed.state?.token || '';
    }
  } catch (e) {}

  let finalUrl = targetUrl;
  if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL && targetUrl.includes('localhost')) {
    finalUrl = targetUrl.replace('localhost', window.location.hostname);
  }

  const isFormData = options.body instanceof FormData;
  
  const headers: any = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const fetchOptions: RequestInit = {
    cache: 'no-store',
    ...options,
    headers
  };

  try {
    const res = await fetch(finalUrl, fetchOptions);
    if (!res.ok && options.method !== 'GET') {
      const errorText = await res.text();
      console.error(`API Error on ${options.method} ${finalUrl}: ${res.status} - ${errorText}`);
      if (typeof window !== 'undefined') {
        alert(`API Error: ${res.status} - ${errorText}`);
      }
      throw new Error(`API Error: ${res.status} - ${errorText}`);
    }
    return res;
  } catch (error: any) {
    if (options.method !== 'GET') {
      console.error(`Network Error on ${options.method} ${finalUrl}:`, error);
      if (typeof window !== 'undefined' && !error.message.includes('API Error')) {
        alert(`Network Error: ${error.message}. Is the backend running at ${finalUrl}?`);
      }
    }
    throw error;
  }
};
