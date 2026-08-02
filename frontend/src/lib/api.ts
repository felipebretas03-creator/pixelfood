export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  let targetUrl = url.replace('http://127.0.0.1:4000', backendBase).replace('http://localhost:4000', backendBase);
  
  if (targetUrl.startsWith(backendBase)) {
    let slug = process.env.NEXT_PUBLIC_RESTAURANT_SLUG;
    if (!slug && typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      if (parts.length > 1 && parts[1] && parts[1] !== 'api' && parts[1] !== '_next') {
        slug = parts[1];
      }
    }
    
    // Tenta pegar o token do usuario
    let token = '';
    if (typeof window !== 'undefined') {
      try {
        const userStorage = localStorage.getItem('pixelfood-user');
        if (userStorage) {
          const parsed = JSON.parse(userStorage);
          if (parsed.state && parsed.state.token) {
            token = parsed.state.token;
          }
        }
      } catch (err) {}
    }

    // Automaticamente troca localhost/127.0.0.1 pelo IP real do celular/dispositivo na rede local
    let finalUrl = targetUrl;
    if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
      if (targetUrl.includes('127.0.0.1')) finalUrl = targetUrl.replace('127.0.0.1', window.location.hostname);
      if (targetUrl.includes('localhost')) finalUrl = finalUrl.replace('localhost', window.location.hostname);
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(slug ? { 'x-restaurant-slug': slug } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    return fetch(finalUrl, { ...options, headers });
  }
  return fetch(url, options);
};
