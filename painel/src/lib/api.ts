export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  let targetUrl = url.replace('http://localhost:4000', backendBase).replace('http://127.0.0.1:4000', backendBase);
  
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

  // Automaticamente troca 'localhost' pelo IP real do celular/dispositivo na rede local (apenas dev)
  let finalUrl = targetUrl;
  if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL && targetUrl.includes('localhost')) {
    finalUrl = targetUrl.replace('localhost', window.location.hostname);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  return fetch(finalUrl, { ...options, headers });
};
